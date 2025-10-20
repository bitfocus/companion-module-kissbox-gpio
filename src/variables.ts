import type { KissboxGPIOInstance } from './main.js'
import type { CompanionVariableDefinition, CompanionVariableValues } from '@companion-module/base'
import { CARD_INFO } from './config.js'

export function UpdateVariableDefinitions(self: KissboxGPIOInstance): void {
	const variables: CompanionVariableDefinition[] = []

	// Generate variables for each configured card
	for (let slot = 0; slot < self.maxSlots; slot++) {
		const cardType = self.getCardType(slot)
		const cardInfo = CARD_INFO[cardType]

		if (cardType === 'empty') continue

		const channelCount = cardInfo.channels
		const isAnalog = cardInfo.isAnalog
		const isInput = cardInfo.isInput
		const slotLabel = `Slot ${slot + 1} (${cardInfo.name})`
		const portType = isInput ? 'Input' : 'Output'

		// Individual channel/port variables
		for (let channel = 0; channel < channelCount; channel++) {
			const portLabel = `${portType} ${channel + 1}`

			if (!isAnalog) {
				// Digital - State as boolean
				variables.push({
					name: `${slotLabel} - ${portLabel} State`,
					variableId: `slot${slot + 1}_ch${channel + 1}_state`,
				})

				// Digital - Numeric value (0/1)
				variables.push({
					name: `${slotLabel} - ${portLabel} Value`,
					variableId: `slot${slot + 1}_ch${channel + 1}_value`,
				})
			} else {
				// Analog - Numeric value (0-255)
				variables.push({
					name: `${slotLabel} - ${portLabel} Value`,
					variableId: `slot${slot + 1}_ch${channel + 1}_value`,
				})

				// Analog - Percentage (0-100%)
				variables.push({
					name: `${slotLabel} - ${portLabel} Percentage`,
					variableId: `slot${slot + 1}_ch${channel + 1}_percent`,
				})
			}
		}

		// Slot-level summary variables
		if (!isAnalog) {
			// Count of active ports
			variables.push({
				name: `${slotLabel} - Active ${portType} Count`,
				variableId: `slot${slot + 1}_active_count`,
			})

			// Binary representation
			variables.push({
				name: `${slotLabel} - Binary State`,
				variableId: `slot${slot + 1}_binary`,
			})

			// Hex representation
			variables.push({
				name: `${slotLabel} - Hex State`,
				variableId: `slot${slot + 1}_hex`,
			})
		}

		// Card type variable
		variables.push({
			name: `${slotLabel} - Card Type`,
			variableId: `slot${slot + 1}_card_type`,
		})
	}

	// Global variables
	variables.push({
		name: 'Device Type',
		variableId: 'device_type',
	})

	variables.push({
		name: 'Connection Status',
		variableId: 'connection_status',
	})

	variables.push({
		name: 'Device IP',
		variableId: 'device_ip',
	})

	variables.push({
		name: 'Device Port',
		variableId: 'device_port',
	})

	self.setVariableDefinitions(variables)
}

export function UpdateVariableValues(self: KissboxGPIOInstance): void {
	const values: CompanionVariableValues = {}

	// Update variables for each configured card
	for (let slot = 0; slot < self.maxSlots; slot++) {
		const cardType = self.getCardType(slot)
		const cardInfo = CARD_INFO[cardType]

		if (cardType === 'empty') {
			// Set empty card type variable
			values[`slot${slot}_card_type`] = 'Empty'
			continue
		}

		const channelCount = cardInfo.channels
		const isAnalog = cardInfo.isAnalog
		const channels = self.channelState.get(slot)

		// Individual channel/port variables
		for (let channel = 0; channel < channelCount; channel++) {
			const value = channels?.get(channel) ?? 0

			if (!isAnalog) {
				// Digital - State as boolean
				values[`slot${slot + 1}_ch${channel + 1}_state`] = value > 0

				// Digital - Numeric value
				values[`slot${slot + 1}_ch${channel + 1}_value`] = value
			} else {
				// Analog - Numeric value
				values[`slot${slot + 1}_ch${channel + 1}_value`] = value

				// Analog - Percentage
				const percent = Math.round((value / 255) * 100)
				values[`slot${slot + 1}_ch${channel + 1}_percent`] = `${percent}%`
			}
		}

		// Slot-level summary variables
		if (!isAnalog) {
			// Count active ports
			let activeCount = 0
			let binaryState = ''
			let numericValue = 0

			for (let channel = 0; channel < channelCount; channel++) {
				const value = channels?.get(channel) ?? 0
				if (value > 0) activeCount++

				// Build binary string (MSB first for readability)
				binaryState = (value > 0 ? '1' : '0') + binaryState

				// Build numeric value for hex conversion
				if (value > 0) {
					numericValue |= 1 << channel
				}
			}

			values[`slot${slot + 1}_active_count`] = activeCount
			values[`slot${slot + 1}_binary`] = binaryState.padStart(8, '0')
			values[`slot${slot + 1}_hex`] = `0x${numericValue.toString(16).toUpperCase().padStart(2, '0')}`
		}

		// Card type variable
		values[`slot${slot + 1}_card_type`] = cardInfo.name
	}

	// Global variables
	values.device_type = self.config.deviceType
	values.connection_status = self.isConnected ? 'Connected' : 'Disconnected'
	values.device_ip = self.config.host
	values.device_port = self.config.port

	self.setVariableValues(values)
}
