import type { KissboxGPIOInstance } from './main.js'
import { writeOneChannel, writeAllChannels, readOneChannel, readAllChannels } from './api.js'
import type { CompanionActionDefinitions, CompanionActionEvent } from '@companion-module/base'

export function UpdateActions(self: KissboxGPIOInstance): void {
	// Generate slot choices based on device type
	const slotChoices = []
	for (let i = 0; i < self.maxSlots; i++) {
		slotChoices.push({ id: i, label: `Slot ${i + 1}` })
	}

	// Channel choices (0-7)
	const channelChoices = []
	for (let i = 0; i < 8; i++) {
		channelChoices.push({ id: i, label: `Channel ${i + 1}` })
	}

	const actions: CompanionActionDefinitions = {
		write_channel_digital: {
			name: 'Set Digital Channel',
			description: 'Set a digital output channel to ON or OFF',
			options: [
				{
					id: 'slot',
					type: 'dropdown',
					label: 'Slot',
					default: 0,
					choices: slotChoices,
				},
				{
					id: 'channel',
					type: 'dropdown',
					label: 'Channel',
					default: 0,
					choices: channelChoices,
				},
				{
					id: 'value',
					type: 'dropdown',
					label: 'Value',
					default: 1,
					choices: [
						{ id: 0, label: 'OFF' },
						{ id: 1, label: 'ON' },
					],
				},
			],
			callback: async (event: CompanionActionEvent) => {
				const opt = event.options as { slot: number; channel: number; value: number }
				try {
					await writeOneChannel(self, Number(opt.slot), Number(opt.channel), Number(opt.value))
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : String(error)
					self.log('error', `Write digital channel failed: ${errorMessage}`)
				}
			},
		},

		write_channel_analog: {
			name: 'Set Analog Channel',
			description: 'Set an analog output channel to a specific value (0-255)',
			options: [
				{
					id: 'slot',
					type: 'dropdown',
					label: 'Slot',
					default: 0,
					choices: slotChoices,
				},
				{
					id: 'channel',
					type: 'dropdown',
					label: 'Channel',
					default: 0,
					choices: channelChoices,
				},
				{
					id: 'value',
					type: 'number',
					label: 'Value (0-255)',
					default: 128,
					min: 0,
					max: 255,
				},
			],
			callback: async (event: CompanionActionEvent) => {
				const opt = event.options as { slot: number; channel: number; value: number }
				try {
					await writeOneChannel(self, Number(opt.slot), Number(opt.channel), Number(opt.value))
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : String(error)
					self.log('error', `Write analog channel failed: ${errorMessage}`)
				}
			},
		},

		write_channel_percent: {
			name: 'Set Channel Percentage',
			description: 'Set an analog output channel using percentage (0-100%)',
			options: [
				{
					id: 'slot',
					type: 'dropdown',
					label: 'Slot',
					default: 0,
					choices: slotChoices,
				},
				{
					id: 'channel',
					type: 'dropdown',
					label: 'Channel',
					default: 0,
					choices: channelChoices,
				},
				{
					id: 'percent',
					type: 'number',
					label: 'Percentage (0-100)',
					default: 50,
					min: 0,
					max: 100,
				},
			],
			callback: async (event: CompanionActionEvent) => {
				const opt = event.options as { slot: number; channel: number; percent: number }
				try {
					const value = Math.round((Number(opt.percent) / 100) * 255)
					await writeOneChannel(self, Number(opt.slot), Number(opt.channel), value)
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : String(error)
					self.log('error', `Write channel percentage failed: ${errorMessage}`)
				}
			},
		},

		toggle_channel: {
			name: 'Toggle Digital Channel',
			description: 'Toggle a digital channel between ON and OFF',
			options: [
				{
					id: 'slot',
					type: 'dropdown',
					label: 'Slot',
					default: 0,
					choices: slotChoices,
				},
				{
					id: 'channel',
					type: 'dropdown',
					label: 'Channel',
					default: 0,
					choices: channelChoices,
				},
			],
			callback: async (event: CompanionActionEvent) => {
				const opt = event.options as { slot: number; channel: number }
				try {
					const slot = Number(opt.slot)
					const channel = Number(opt.channel)
					const currentValue = self.channelState.get(slot)?.get(channel) ?? 0
					const newValue = currentValue > 0 ? 0 : 1
					await writeOneChannel(self, slot, channel, newValue)
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : String(error)
					self.log('error', `Toggle channel failed: ${errorMessage}`)
				}
			},
		},

		write_all_channels: {
			name: 'Set All Channels in Slot',
			description: 'Set all 8 channels in a slot to specific values',
			options: [
				{
					id: 'slot',
					type: 'dropdown',
					label: 'Slot',
					default: 0,
					choices: slotChoices,
				},
				{
					id: 'ch0',
					type: 'number',
					label: 'Channel 1 Value',
					default: 0,
					min: 0,
					max: 255,
				},
				{
					id: 'ch1',
					type: 'number',
					label: 'Channel 2 Value',
					default: 0,
					min: 0,
					max: 255,
				},
				{
					id: 'ch2',
					type: 'number',
					label: 'Channel 3 Value',
					default: 0,
					min: 0,
					max: 255,
				},
				{
					id: 'ch3',
					type: 'number',
					label: 'Channel 4 Value',
					default: 0,
					min: 0,
					max: 255,
				},
				{
					id: 'ch4',
					type: 'number',
					label: 'Channel 5 Value',
					default: 0,
					min: 0,
					max: 255,
				},
				{
					id: 'ch5',
					type: 'number',
					label: 'Channel 6 Value',
					default: 0,
					min: 0,
					max: 255,
				},
				{
					id: 'ch6',
					type: 'number',
					label: 'Channel 7 Value',
					default: 0,
					min: 0,
					max: 255,
				},
				{
					id: 'ch7',
					type: 'number',
					label: 'Channel 8 Value',
					default: 0,
					min: 0,
					max: 255,
				},
			],
			callback: async (event: CompanionActionEvent) => {
				const opt = event.options as {
					slot: number
					ch0: number
					ch1: number
					ch2: number
					ch3: number
					ch4: number
					ch5: number
					ch6: number
					ch7: number
				}
				try {
					const values = [
						Number(opt.ch0),
						Number(opt.ch1),
						Number(opt.ch2),
						Number(opt.ch3),
						Number(opt.ch4),
						Number(opt.ch5),
						Number(opt.ch6),
						Number(opt.ch7),
					]
					await writeAllChannels(self, Number(opt.slot), values)
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : String(error)
					self.log('error', `Write all channels failed: ${errorMessage}`)
				}
			},
		},

		set_all_off: {
			name: 'Set All Channels OFF',
			description: 'Turn off all channels in a slot',
			options: [
				{
					id: 'slot',
					type: 'dropdown',
					label: 'Slot',
					default: 0,
					choices: slotChoices,
				},
			],
			callback: async (event: CompanionActionEvent) => {
				const opt = event.options as { slot: number }
				try {
					await writeAllChannels(self, Number(opt.slot), [0, 0, 0, 0, 0, 0, 0, 0])
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : String(error)
					self.log('error', `Set all OFF failed: ${errorMessage}`)
				}
			},
		},

		set_all_on: {
			name: 'Set All Channels ON',
			description: 'Turn on all channels in a slot (digital) or set to full (analog)',
			options: [
				{
					id: 'slot',
					type: 'dropdown',
					label: 'Slot',
					default: 0,
					choices: slotChoices,
				},
				{
					id: 'type',
					type: 'dropdown',
					label: 'Card Type',
					default: 'digital',
					choices: [
						{ id: 'digital', label: 'Digital (value 1)' },
						{ id: 'analog', label: 'Analog (value 255)' },
					],
				},
			],
			callback: async (event: CompanionActionEvent) => {
				const opt = event.options as { slot: number; type: 'digital' | 'analog' }
				try {
					const value = opt.type === 'digital' ? 1 : 255
					await writeAllChannels(self, Number(opt.slot), [
						value,
						value,
						value,
						value,
						value,
						value,
						value,
						value,
					])
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : String(error)
					self.log('error', `Set all ON failed: ${errorMessage}`)
				}
			},
		},

		read_channel: {
			name: 'Read Single Channel',
			description: 'Request status update for a single channel',
			options: [
				{
					id: 'slot',
					type: 'dropdown',
					label: 'Slot',
					default: 0,
					choices: slotChoices,
				},
				{
					id: 'channel',
					type: 'dropdown',
					label: 'Channel',
					default: 0,
					choices: channelChoices,
				},
			],
			callback: async (event: CompanionActionEvent) => {
				const opt = event.options as { slot: number; channel: number }
				try {
					await readOneChannel(self, Number(opt.slot), Number(opt.channel))
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : String(error)
					self.log('error', `Read channel failed: ${errorMessage}`)
				}
			},
		},

		read_all_channels: {
			name: 'Read All Channels in Slot',
			description: 'Request status update for all channels in a slot',
			options: [
				{
					id: 'slot',
					type: 'dropdown',
					label: 'Slot',
					default: 0,
					choices: slotChoices,
				},
			],
			callback: async (event: CompanionActionEvent) => {
				const opt = event.options as { slot: number }
				try {
					await readAllChannels(self, Number(opt.slot))
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : String(error)
					self.log('error', `Read all channels failed: ${errorMessage}`)
				}
			},
		},

		pulse_channel: {
			name: 'Pulse Channel',
			description: 'Turn a channel ON for a specified duration, then turn it OFF',
			options: [
				{
					id: 'slot',
					type: 'dropdown',
					label: 'Slot',
					default: 0,
					choices: slotChoices,
				},
				{
					id: 'channel',
					type: 'dropdown',
					label: 'Channel',
					default: 0,
					choices: channelChoices,
				},
				{
					id: 'duration',
					type: 'number',
					label: 'Duration (milliseconds)',
					default: 1000,
					min: 100,
					max: 60000,
				},
			],
			callback: async (event: CompanionActionEvent) => {
				const opt = event.options as { slot: number; channel: number; duration: number }
				try {
					const slot = Number(opt.slot)
					const channel = Number(opt.channel)
					const duration = Number(opt.duration)

					// Turn ON
					await writeOneChannel(self, slot, channel, 1)

					// Schedule turn OFF
					setTimeout(async () => {
						try {
							await writeOneChannel(self, slot, channel, 0)
						} catch (error) {
							const errorMessage = error instanceof Error ? error.message : String(error)
							self.log('error', `Pulse OFF failed: ${errorMessage}`)
						}
					}, duration)
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : String(error)
					self.log('error', `Pulse channel failed: ${errorMessage}`)
				}
			},
		},
	}

	self.setActionDefinitions(actions)
}
