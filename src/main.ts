import { InstanceBase, runEntrypoint, InstanceStatus, type SomeCompanionConfigField } from '@companion-module/base'
import { GetConfigFields, type ModuleConfig, type CardType, CARD_INFO } from './config.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateActions } from './actions.js'
import { UpdateFeedbacks } from './feedbacks.js'
import { UpdateVariableDefinitions } from './variables.js'
import { UpdatePresets } from './presets.js'
import { InitConnection, CloseConnection } from './api.js'
import type { Socket as UDPSocket } from 'node:dgram'

// Channel state storage: slot -> channel -> value
export type ChannelState = Map<number, Map<number, number>>

export class KissboxGPIOInstance extends InstanceBase<ModuleConfig> {
	config: ModuleConfig = {
		host: '192.168.1.100',
		port: 10001,
		udpReceivePort: 0,
		deviceType: 'IO8CC',
		slot0: 'empty',
		slot1: 'empty',
		slot2: 'empty',
		slot3: 'empty',
		slot4: 'empty',
		slot5: 'empty',
		slot6: 'empty',
		slot7: 'empty',
		verbose: false,
	}

	// Fixed polling interval (5 seconds)
	readonly POLL_INTERVAL = 5000

	// Network connection
	udpSocket: UDPSocket | null = null

	// Status polling timer
	pollIntervalInstance: NodeJS.Timeout | null = null

	// Connection monitoring
	lastResponseTime = 0
	connectionTimeout: NodeJS.Timeout | null = null
	watchdogInterval: NodeJS.Timeout | null = null
	isConnected = false

	// Channel state storage
	channelState: ChannelState = new Map()

	// Track number of slots based on device type
	get maxSlots(): number {
		return this.config.deviceType === 'IO3CC' ? 3 : 8
	}

	// Get card type for a slot
	getCardType(slot: number): CardType {
		switch (slot) {
			case 0:
				return this.config.slot0
			case 1:
				return this.config.slot1
			case 2:
				return this.config.slot2
			case 3:
				return this.config.slot3 || 'empty'
			case 4:
				return this.config.slot4 || 'empty'
			case 5:
				return this.config.slot5 || 'empty'
			case 6:
				return this.config.slot6 || 'empty'
			case 7:
				return this.config.slot7 || 'empty'
			default:
				return 'empty'
		}
	}

	// Get channel count for a slot
	getChannelCount(slot: number): number {
		const cardType = this.getCardType(slot)
		return CARD_INFO[cardType].channels
	}

	// Check if slot has an input card
	isInputCard(slot: number): boolean {
		const cardType = this.getCardType(slot)
		return CARD_INFO[cardType].isInput
	}

	// Check if slot has an output card
	isOutputCard(slot: number): boolean {
		const cardType = this.getCardType(slot)
		return !CARD_INFO[cardType].isInput && cardType !== 'empty'
	}

	async init(config: ModuleConfig): Promise<void> {
		try {
			this.log('debug', 'Starting KISSBOX GPIO module initialization')

			// Ensure config has all required properties with defaults
			this.config = {
				host: config?.host || '192.168.1.100',
				port: config?.port || 10001,
				udpReceivePort: config?.udpReceivePort || 10002,
				deviceType: config?.deviceType || 'IO8CC',
				slot0: config?.slot0 || 'empty',
				slot1: config?.slot1 || 'empty',
				slot2: config?.slot2 || 'empty',
				slot3: config?.slot3 || 'empty',
				slot4: config?.slot4 || 'empty',
				slot5: config?.slot5 || 'empty',
				slot6: config?.slot6 || 'empty',
				slot7: config?.slot7 || 'empty',
				verbose: config?.verbose !== undefined ? config.verbose : false,
			}

			this.log('debug', `Initializing with config: ${JSON.stringify(this.config)}`)

			// Initialize channel state storage
			this.initializeChannelState()

			// Set status before attempting connection
			this.updateStatus(InstanceStatus.Connecting)

			// Update all definitions first
			this.updateActions()
			this.updateFeedbacks()
			this.updateVariableDefinitions()
			this.updatePresets()

			// Validate configuration
			if (!this.config.host) {
				this.log('error', 'Device IP address is required')
				this.updateStatus(InstanceStatus.BadConfig)
				return
			}

			// Initialize connection
			await this.initConnection()

			this.log('debug', 'KISSBOX GPIO module initialization completed')
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error)
			this.log('error', `Failed to initialize module: ${errorMessage}`)
			this.updateStatus(InstanceStatus.ConnectionFailure)
			throw error
		}
	}

	// Initialize channel state storage
	initializeChannelState(): void {
		this.channelState.clear()
		for (let slot = 0; slot < this.maxSlots; slot++) {
			const channels = new Map<number, number>()
			const channelCount = this.getChannelCount(slot)
			for (let channel = 0; channel < channelCount; channel++) {
				channels.set(channel, 0)
			}
			this.channelState.set(slot, channels)
		}
	}

	// When module gets deleted
	async destroy(): Promise<void> {
		this.log('debug', 'Destroying KISSBOX GPIO module')
		await CloseConnection(this)
		if (this.pollIntervalInstance) {
			clearInterval(this.pollIntervalInstance)
			this.pollIntervalInstance = null
		}
		if (this.connectionTimeout) {
			clearTimeout(this.connectionTimeout)
			this.connectionTimeout = null
		}
		if (this.watchdogInterval) {
			clearInterval(this.watchdogInterval)
			this.watchdogInterval = null
		}
		this.log('debug', 'Module destroyed')
	}

	async configUpdated(config: ModuleConfig): Promise<void> {
		try {
			this.log('debug', 'Config update requested')

			// Set status to connecting immediately when config changes
			this.updateStatus(InstanceStatus.Connecting)

			// Ensure config has all required properties with defaults
			this.config = {
				host: config?.host || '192.168.1.100',
				port: config?.port || 10001,
				udpReceivePort: config?.udpReceivePort || 10002,
				deviceType: config?.deviceType || 'IO8CC',
				slot0: config?.slot0 || 'empty',
				slot1: config?.slot1 || 'empty',
				slot2: config?.slot2 || 'empty',
				slot3: config?.slot3 || 'empty',
				slot4: config?.slot4 || 'empty',
				slot5: config?.slot5 || 'empty',
				slot6: config?.slot6 || 'empty',
				slot7: config?.slot7 || 'empty',
				verbose: config?.verbose !== undefined ? config.verbose : false,
			}

			this.log('debug', `Config updated: ${JSON.stringify(this.config)}`)

			// Close existing connections
			await CloseConnection(this)

			// Clear existing intervals and timers
			if (this.pollIntervalInstance) {
				clearInterval(this.pollIntervalInstance)
				this.pollIntervalInstance = null
			}
			if (this.connectionTimeout) {
				clearTimeout(this.connectionTimeout)
				this.connectionTimeout = null
			}
			if (this.watchdogInterval) {
				clearInterval(this.watchdogInterval)
				this.watchdogInterval = null
			}

			// Reset connection state
			this.lastResponseTime = 0
			this.isConnected = false

			// Reinitialize channel state if device type changed
			this.initializeChannelState()

			// Update definitions
			this.updateActions()
			this.updateFeedbacks()
			this.updateVariableDefinitions()
			this.updatePresets()

			// Validate configuration
			if (!this.config.host) {
				this.log('error', 'Device IP address is required')
				this.updateStatus(InstanceStatus.BadConfig)
				return
			}

			await this.initConnection()
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error)
			this.log('error', `Failed to update config: ${errorMessage}`)
			this.updateStatus(InstanceStatus.ConnectionFailure)
		}
	}

	// Return config fields for web config
	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	updateActions(): void {
		UpdateActions(this)
	}

	updateFeedbacks(): void {
		UpdateFeedbacks(this)
	}

	updateVariableDefinitions(): void {
		UpdateVariableDefinitions(this)
	}

	updatePresets(): void {
		UpdatePresets(this)
	}

	async initConnection(): Promise<void> {
		try {
			this.log('debug', 'Initializing connection to KISSBOX device')
			await InitConnection(this)
			this.log('debug', 'Connection initialized successfully')
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error)
			this.log('error', `Failed to initialize connection: ${errorMessage}`)
			this.updateStatus(InstanceStatus.ConnectionFailure)
			throw error
		}
	}
}

runEntrypoint(KissboxGPIOInstance, UpgradeScripts)
