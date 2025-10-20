import type { KissboxGPIOInstance } from './main.js'
import { writeOneChannel, writeAllChannels, readAllChannels } from './api.js'
import type { CompanionActionDefinitions, CompanionActionEvent } from '@companion-module/base'
import { CARD_INFO } from './config.js'

export function UpdateActions(self: KissboxGPIOInstance): void {
	const actions: CompanionActionDefinitions = {}

	// Generate output actions for each output card
	for (let slot = 0; slot < self.maxSlots; slot++) {
		const cardType = self.getCardType(slot)
		const cardInfo = CARD_INFO[cardType]

		if (cardType === 'empty') continue

		const channelCount = cardInfo.channels
		const isAnalog = cardInfo.isAnalog
		const isInput = cardInfo.isInput
		const slotLabel = `Slot ${slot + 1} (${cardInfo.name})`

		// Generate channel choices for this card
		const channelChoices = []
		for (let i = 0; i < channelCount; i++) {
			channelChoices.push({ id: i, label: `${isInput ? 'Input' : 'Output'} ${i + 1}` })
		}

		// OUTPUT CARD ACTIONS
		if (!isInput) {
			if (!isAnalog) {
				// Digital output - Set action
				actions[`set_output_slot${slot}`] = {
					name: `${slotLabel}: Set Output`,
					description: 'Set a digital output to ON or OFF',
					options: [
						{
							id: 'channel',
							type: 'dropdown',
							label: 'Output',
							default: 0,
							choices: channelChoices,
						},
						{
							id: 'value',
							type: 'dropdown',
							label: 'State',
							default: 1,
							choices: [
								{ id: 0, label: 'OFF' },
								{ id: 1, label: 'ON' },
							],
						},
					],
					callback: async (event: CompanionActionEvent) => {
						const opt = event.options as { channel: number; value: number }
						try {
							await writeOneChannel(self, slot, Number(opt.channel), Number(opt.value))
						} catch (error) {
							const errorMessage = error instanceof Error ? error.message : String(error)
							self.log('error', `Set output failed: ${errorMessage}`)
						}
					},
				}

				// Digital output - Toggle action
				actions[`toggle_output_slot${slot}`] = {
					name: `${slotLabel}: Toggle Output`,
					description: 'Toggle a digital output between ON and OFF',
					options: [
						{
							id: 'channel',
							type: 'dropdown',
							label: 'Output',
							default: 0,
							choices: channelChoices,
						},
					],
					callback: async (event: CompanionActionEvent) => {
						const opt = event.options as { channel: number }
						try {
							const channel = Number(opt.channel)
							const currentValue = self.channelState.get(slot)?.get(channel) ?? 0
							const newValue = currentValue > 0 ? 0 : 1
							await writeOneChannel(self, slot, channel, newValue)
						} catch (error) {
							const errorMessage = error instanceof Error ? error.message : String(error)
							self.log('error', `Toggle output failed: ${errorMessage}`)
						}
					},
				}

				// Digital output - Pulse action
				actions[`pulse_output_slot${slot}`] = {
					name: `${slotLabel}: Pulse Output`,
					description: 'Turn output ON for a duration, then turn it OFF',
					options: [
						{
							id: 'channel',
							type: 'dropdown',
							label: 'Output',
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
						const opt = event.options as { channel: number; duration: number }
						try {
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
							self.log('error', `Pulse output failed: ${errorMessage}`)
						}
					},
				}

				// All outputs OFF
				actions[`all_off_slot${slot}`] = {
					name: `${slotLabel}: All Outputs OFF`,
					description: 'Turn off all outputs',
					options: [],
					callback: async () => {
						try {
							const values = new Array(channelCount).fill(0)
							// Pad to 8 if needed
							while (values.length < 8) values.push(0)
							await writeAllChannels(self, slot, values)
						} catch (error) {
							const errorMessage = error instanceof Error ? error.message : String(error)
							self.log('error', `All OFF failed: ${errorMessage}`)
						}
					},
				}

				// All outputs ON
				actions[`all_on_slot${slot}`] = {
					name: `${slotLabel}: All Outputs ON`,
					description: 'Turn on all outputs',
					options: [],
					callback: async () => {
						try {
							const values = new Array(channelCount).fill(1)
							// Pad to 8 if needed
							while (values.length < 8) values.push(0)
							await writeAllChannels(self, slot, values)
						} catch (error) {
							const errorMessage = error instanceof Error ? error.message : String(error)
							self.log('error', `All ON failed: ${errorMessage}`)
						}
					},
				}
			} else {
				// Analog output - Set value
				actions[`set_analog_output_slot${slot}`] = {
					name: `${slotLabel}: Set Analog Output`,
					description: 'Set an analog output value (0-255)',
					options: [
						{
							id: 'channel',
							type: 'dropdown',
							label: 'Output',
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
						const opt = event.options as { channel: number; value: number }
						try {
							await writeOneChannel(self, slot, Number(opt.channel), Number(opt.value))
						} catch (error) {
							const errorMessage = error instanceof Error ? error.message : String(error)
							self.log('error', `Set analog output failed: ${errorMessage}`)
						}
					},
				}

				// Analog output - Set percentage
				actions[`set_percent_output_slot${slot}`] = {
					name: `${slotLabel}: Set Output Percentage`,
					description: 'Set an analog output using percentage (0-100%)',
					options: [
						{
							id: 'channel',
							type: 'dropdown',
							label: 'Output',
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
						const opt = event.options as { channel: number; percent: number }
						try {
							const value = Math.round((Number(opt.percent) / 100) * 255)
							await writeOneChannel(self, slot, Number(opt.channel), value)
						} catch (error) {
							const errorMessage = error instanceof Error ? error.message : String(error)
							self.log('error', `Set output percentage failed: ${errorMessage}`)
						}
					},
				}

				// All analog outputs OFF
				actions[`all_off_slot${slot}`] = {
					name: `${slotLabel}: All Outputs OFF`,
					description: 'Set all analog outputs to 0',
					options: [],
					callback: async () => {
						try {
							const values = new Array(channelCount).fill(0)
							// Pad to 8 if needed
							while (values.length < 8) values.push(0)
							await writeAllChannels(self, slot, values)
						} catch (error) {
							const errorMessage = error instanceof Error ? error.message : String(error)
							self.log('error', `All OFF failed: ${errorMessage}`)
						}
					},
				}

				// All analog outputs FULL
				actions[`all_full_slot${slot}`] = {
					name: `${slotLabel}: All Outputs FULL`,
					description: 'Set all analog outputs to maximum (255)',
					options: [],
					callback: async () => {
						try {
							const values = new Array(channelCount).fill(255)
							// Pad to 8 if needed
							while (values.length < 8) values.push(0)
							await writeAllChannels(self, slot, values)
						} catch (error) {
							const errorMessage = error instanceof Error ? error.message : String(error)
							self.log('error', `All FULL failed: ${errorMessage}`)
						}
					},
				}
			}
		}

		// OUTPUT CARDS get read actions (to verify output state)
		if (!isInput) {
			actions[`read_outputs_slot${slot}`] = {
				name: `${slotLabel}: Read Output Status`,
				description: 'Request current status of all outputs',
				options: [],
				callback: async () => {
					try {
						await readAllChannels(self, slot)
					} catch (error) {
						const errorMessage = error instanceof Error ? error.message : String(error)
						self.log('error', `Read outputs failed: ${errorMessage}`)
					}
				},
			}
		}
	}

	self.setActionDefinitions(actions)
}
