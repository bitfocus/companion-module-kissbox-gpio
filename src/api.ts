import type { KissboxGPIOInstance } from './main.js'
import { InstanceStatus } from '@companion-module/base'
import { createSocket } from 'node:dgram'
import { CheckVariables } from './variables.js'

// Protocol command bytes
const CMD_READ_ALL = 0xa0 // Read all channels from a slot
const CMD_READ_ONE = 0xa2 // Read one channel from a slot
const CMD_WRITE_ALL = 0xa4 // Write all channels to a slot
const CMD_WRITE_ONE = 0xa5 // Write one channel to a slot

// Protocol response bytes
const RESP_ALL_STATUS = 0xa1 // All channel status reply
const RESP_ONE_STATUS = 0xa3 // Single channel status reply

/**
 * Initialize network connection to KISSBOX device
 */
export async function InitConnection(self: KissboxGPIOInstance): Promise<void> {
	try {
		// Close any existing connections first
		await CloseConnection(self)

		self.log(
			'info',
			`Connecting to KISSBOX ${self.config.deviceType} at ${self.config.host}:${self.config.port} via UDP`,
		)

		// Keep status as "Connecting" until we get a response
		self.updateStatus(InstanceStatus.Connecting, 'Waiting for device response...')

		await initUDPConnection(self)

		// Set connection timeout - if no response within 8 seconds, mark as failure
		self.connectionTimeout = setTimeout(() => {
			if (self.lastResponseTime === 0) {
				self.log('error', 'No response from KISSBOX device after 8 seconds')
				self.isConnected = false
				self.updateStatus(InstanceStatus.ConnectionFailure, 'Device not responding')
			}
		}, 8000)

		// Start watchdog to monitor ongoing communication
		startConnectionWatchdog(self)

		// Start status polling (every 5 seconds)
		self.pollIntervalInstance = setInterval(() => {
			pollAllSlots(self).catch((error) => {
				const errorMessage = error instanceof Error ? error.message : String(error)
				self.log('error', `Polling error: ${errorMessage}`)
			})
		}, self.POLL_INTERVAL)

		// Do initial poll
		await pollAllSlots(self)

		self.log('info', 'UDP socket ready, waiting for device response...')
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error)
		self.log('error', `Failed to initialize connection: ${errorMessage}`)
		self.updateStatus(InstanceStatus.ConnectionFailure, errorMessage)
		throw error
	}
}

/**
 * Initialize UDP connection
 */
async function initUDPConnection(self: KissboxGPIOInstance): Promise<void> {
	return new Promise((resolve, reject) => {
		try {
			self.udpSocket = createSocket({ type: 'udp4', reuseAddr: true })

			self.udpSocket.on('error', (err) => {
				self.log('error', `UDP socket error: ${err.message}`)
				self.updateStatus(InstanceStatus.ConnectionFailure)
			})

			self.udpSocket.on('message', (msg, rinfo) => {
				// Always log incoming packets (before filtering) to debug connection issues

				if (self.config.verbose) {
					self.log(
						'debug',
						`UDP ← Received ${msg.length} bytes from ${rinfo.address}:${rinfo.port} Data: ${msg.toString('hex')}`,
					)
				}

				// Only accept packets from the configured KISSBOX device
				// This prevents accepting packets from wrong sources or loopback
				if (rinfo.address !== self.config.host) {
					self.log('warn', `Ignoring UDP packet from ${rinfo.address} (expected ${self.config.host})`)
					return
				}

				handleIncomingMessage(self, Buffer.from(msg))
			})

			// Bind to specified port or any available port on all interfaces
			// The KISSBOX will respond to the source port of our outgoing messages
			const bindPort = self.config.udpReceivePort || undefined
			self.udpSocket.bind(bindPort, '0.0.0.0', () => {
				if (self.udpSocket) {
					// Enable broadcast reception for automatic status updates
					try {
						self.udpSocket.setBroadcast(true)
						self.log('debug', 'UDP broadcast enabled')
					} catch (err) {
						self.log('warn', `Could not enable broadcast on UDP socket: ${err}`)
					}

					const address = self.udpSocket.address()
					if (address && typeof address === 'object' && 'port' in address) {
						self.log('info', `UDP socket listening on 0.0.0.0:${address.port} (will receive replies here)`)
					} else {
						self.log('info', 'UDP socket bound and ready')
					}
				}
				resolve()
			})
		} catch (error) {
			reject(error)
		}
	})
}

/**
 * Start watchdog to monitor ongoing communication
 */
function startConnectionWatchdog(self: KissboxGPIOInstance): void {
	// Check connection health every 2 seconds for fast failure detection
	self.watchdogInterval = setInterval(() => {
		const now = Date.now()
		const timeSinceLastResponse = now - self.lastResponseTime

		if (self.lastResponseTime === 0) {
			// Never received a response - still connecting
			// Connection timeout will handle this
			return
		}

		// If no response in 12 seconds (2+ missed polls), mark as disconnected
		// We poll every 5 seconds, so this allows for some network delay
		if (timeSinceLastResponse > 12000) {
			if (self.isConnected) {
				self.log('error', `No response from device for ${Math.round(timeSinceLastResponse / 1000)} seconds`)
				self.isConnected = false
				self.updateStatus(InstanceStatus.Disconnected, 'Device not responding')
			}
		} else if (timeSinceLastResponse > 8000) {
			// Warning if no response in 8 seconds (1+ missed poll)
			if (self.isConnected) {
				self.log('warn', `No response from device for ${Math.round(timeSinceLastResponse / 1000)} seconds`)
			}
		}
	}, 2000)
}

/**
 * Close network connections
 */
export async function CloseConnection(self: KissboxGPIOInstance): Promise<void> {
	if (self.pollIntervalInstance) {
		clearInterval(self.pollIntervalInstance)
		self.pollIntervalInstance = null
	}

	if (self.connectionTimeout) {
		clearTimeout(self.connectionTimeout)
		self.connectionTimeout = null
	}

	if (self.watchdogInterval) {
		clearInterval(self.watchdogInterval)
		self.watchdogInterval = null
	}

	if (self.udpSocket) {
		try {
			self.udpSocket.removeAllListeners()
			self.udpSocket.close()
			self.log('debug', 'UDP socket closed')
		} catch (err) {
			// Ignore errors on close
		}
		self.udpSocket = null
	}
}

/**
 * Send a command to the KISSBOX device
 */
async function sendCommand(self: KissboxGPIOInstance, buffer: Buffer): Promise<void> {
	if (self.config.verbose) {
		self.log('debug', `UDP → Sending ${buffer.length} bytes to ${self.config.host}:${self.config.port}`)
		self.log('debug', `UDP → Data: ${buffer.toString('hex')}`)
	}

	if (!self.udpSocket) {
		throw new Error('UDP socket not initialized')
	}

	const socket = self.udpSocket
	return new Promise((resolve, reject) => {
		socket.send(buffer, self.config.port, self.config.host, (err) => {
			if (err) {
				reject(err)
			} else {
				resolve()
			}
		})
	})
}

/**
 * Handle incoming message from KISSBOX device
 */
function handleIncomingMessage(self: KissboxGPIOInstance, data: Buffer): void {
	if (data.length < 1) {
		return // Invalid message
	}

	// Mark that we received a response
	const isFirstResponse = self.lastResponseTime === 0
	const wasDisconnected = !self.isConnected
	self.lastResponseTime = Date.now()

	// If this is the first response, clear connection timeout
	if (isFirstResponse) {
		if (self.connectionTimeout) {
			clearTimeout(self.connectionTimeout)
			self.connectionTimeout = null
		}
		self.isConnected = true
		self.updateStatus(InstanceStatus.Ok)
		self.log('info', 'Connected to KISSBOX device - receiving data')
	} else if (wasDisconnected) {
		// If we were disconnected and now receiving data, reconnect
		self.isConnected = true
		self.updateStatus(InstanceStatus.Ok)
		self.log('info', 'Reconnected to KISSBOX device')
	}

	const commandByte = data[0]

	try {
		if (commandByte === RESP_ALL_STATUS) {
			// All channel status: 0xA1 <slot> <cv1> <cv2> <cv3> <cv4> <cv5> <cv6> <cv7> <cv8>
			if (data.length >= 10) {
				const slot = data[1]
				if (slot < self.maxSlots) {
					const channels = self.channelState.get(slot)
					if (channels) {
						for (let i = 0; i < 8; i++) {
							const value = data[2 + i]
							channels.set(i, value)
						}
						if (self.config.verbose) {
							const values = Array.from(channels.values())
							self.log('debug', `Slot ${slot} all channels updated: ${values.join(',')}`)
						}
						updateUI(self)
					}
				}
			}
		} else if (commandByte === RESP_ONE_STATUS) {
			// Single channel status: 0xA3 <slot> <channel> <value>
			if (data.length >= 4) {
				const slot = data[1]
				const channel = data[2]
				const value = data[3]
				if (slot < self.maxSlots && channel < 8) {
					const channels = self.channelState.get(slot)
					if (channels) {
						channels.set(channel, value)
						if (self.config.verbose) {
							self.log('debug', `Slot ${slot} channel ${channel} updated: ${value}`)
						}
						updateUI(self)
					}
				}
			}
		} else {
			self.log('warn', `Unknown response command byte: 0x${commandByte.toString(16)}`)
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error)
		self.log('error', `Error handling message: ${errorMessage}`)
	}
}

/**
 * Update UI elements after state change
 */
function updateUI(self: KissboxGPIOInstance): void {
	self.checkFeedbacks()
	CheckVariables(self)
}

/**
 * Poll all slots for status
 */
async function pollAllSlots(self: KissboxGPIOInstance): Promise<void> {
	let networkError = false

	for (let slot = 0; slot < self.maxSlots; slot++) {
		try {
			await readAllChannels(self, slot)
			// Small delay between requests
			await new Promise((resolve) => setTimeout(resolve, 50))
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error)

			// Detect critical network errors that indicate device is unreachable
			if (
				errorMessage.includes('EHOSTDOWN') ||
				errorMessage.includes('EHOSTUNREACH') ||
				errorMessage.includes('ENETUNREACH') ||
				errorMessage.includes('ENETDOWN')
			) {
				if (!networkError && self.isConnected) {
					self.log('error', `Network error: ${errorMessage}`)
					self.isConnected = false
					self.updateStatus(InstanceStatus.Disconnected, 'Network unreachable')
					networkError = true
				}
			} else {
				self.log('error', `Error polling slot ${slot}: ${errorMessage}`)
			}
		}
	}
}

/**
 * Write value to a single channel
 * Command: 0xA5 <slot> <channel> <value>
 */
export async function writeOneChannel(
	self: KissboxGPIOInstance,
	slot: number,
	channel: number,
	value: number,
): Promise<void> {
	if (slot >= self.maxSlots || slot < 0) {
		throw new Error(`Invalid slot ${slot}, must be 0-${self.maxSlots - 1}`)
	}
	if (channel < 0 || channel > 7) {
		throw new Error(`Invalid channel ${channel}, must be 0-7`)
	}
	if (value < 0 || value > 255) {
		throw new Error(`Invalid value ${value}, must be 0-255`)
	}

	const buffer = Buffer.from([CMD_WRITE_ONE, slot, channel, value])
	await sendCommand(self, buffer)

	// Update local state optimistically
	const channels = self.channelState.get(slot)
	if (channels) {
		channels.set(channel, value)
		updateUI(self)
	}

	if (self.config.verbose) {
		self.log('debug', `Write slot ${slot} channel ${channel} = ${value}`)
	}
}

/**
 * Write values to all channels in a slot
 * Command: 0xA4 <slot> <cv1> <cv2> <cv3> <cv4> <cv5> <cv6> <cv7> <cv8>
 */
export async function writeAllChannels(self: KissboxGPIOInstance, slot: number, values: number[]): Promise<void> {
	if (slot >= self.maxSlots || slot < 0) {
		throw new Error(`Invalid slot ${slot}, must be 0-${self.maxSlots - 1}`)
	}
	if (values.length !== 8) {
		throw new Error('Must provide exactly 8 channel values')
	}
	for (let i = 0; i < 8; i++) {
		if (values[i] < 0 || values[i] > 255) {
			throw new Error(`Invalid value ${values[i]} at index ${i}, must be 0-255`)
		}
	}

	const buffer = Buffer.from([CMD_WRITE_ALL, slot, ...values])
	await sendCommand(self, buffer)

	// Update local state optimistically
	const channels = self.channelState.get(slot)
	if (channels) {
		for (let i = 0; i < 8; i++) {
			channels.set(i, values[i])
		}
		updateUI(self)
	}

	if (self.config.verbose) {
		self.log('debug', `Write slot ${slot} all channels = [${values.join(',')}]`)
	}
}

/**
 * Read value from a single channel
 * Command: 0xA2 <slot> <channel>
 * Response: 0xA3 <slot> <channel> <value>
 */
export async function readOneChannel(self: KissboxGPIOInstance, slot: number, channel: number): Promise<void> {
	if (slot >= self.maxSlots || slot < 0) {
		throw new Error(`Invalid slot ${slot}, must be 0-${self.maxSlots - 1}`)
	}
	if (channel < 0 || channel > 7) {
		throw new Error(`Invalid channel ${channel}, must be 0-7`)
	}

	const buffer = Buffer.from([CMD_READ_ONE, slot, channel])
	await sendCommand(self, buffer)

	if (self.config.verbose) {
		self.log('debug', `Read slot ${slot} channel ${channel}`)
	}
}

/**
 * Read values from all channels in a slot
 * Command: 0xA0 <slot>
 * Response: 0xA1 <slot> <cv1> <cv2> <cv3> <cv4> <cv5> <cv6> <cv7> <cv8>
 */
export async function readAllChannels(self: KissboxGPIOInstance, slot: number): Promise<void> {
	if (slot >= self.maxSlots || slot < 0) {
		throw new Error(`Invalid slot ${slot}, must be 0-${self.maxSlots - 1}`)
	}

	const buffer = Buffer.from([CMD_READ_ALL, slot])
	await sendCommand(self, buffer)

	if (self.config.verbose) {
		self.log('debug', `Read slot ${slot} all channels`)
	}
}

/**
 * Get current channel value from local state
 */
export function getChannelValue(self: KissboxGPIOInstance, slot: number, channel: number): number {
	const channels = self.channelState.get(slot)
	if (channels) {
		return channels.get(channel) ?? 0
	}
	return 0
}

/**
 * Get all channel values for a slot from local state
 */
export function getAllChannelValues(self: KissboxGPIOInstance, slot: number): number[] {
	const channels = self.channelState.get(slot)
	if (channels) {
		const values: number[] = []
		for (let i = 0; i < 8; i++) {
			values.push(channels.get(i) ?? 0)
		}
		return values
	}
	return [0, 0, 0, 0, 0, 0, 0, 0]
}
