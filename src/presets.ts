import type {
	CompanionButtonPresetDefinition,
	CompanionTextPresetDefinition,
	CompanionPresetDefinitions,
} from '@companion-module/base'
import { combineRgb } from '@companion-module/base'
import type { KissboxGPIOInstance } from './main.js'
import { CARD_INFO } from './config.js'

export function UpdatePresets(self: KissboxGPIOInstance): void {
	const presets: (CompanionButtonPresetDefinition | CompanionTextPresetDefinition)[] = []

	// Create presets for each configured card
	for (let slot = 0; slot < self.maxSlots; slot++) {
		const cardType = self.getCardType(slot)
		const cardInfo = CARD_INFO[cardType]

		if (cardType === 'empty') continue

		const channelCount = cardInfo.channels
		const isAnalog = cardInfo.isAnalog
		const isInput = cardInfo.isInput
		const slotLabel = `Slot ${slot + 1} (${cardInfo.name})`
		const portType = isInput ? 'Input' : 'Output'

		// DIGITAL OUTPUT CARD PRESETS
		if (!isInput && !isAnalog) {
			// Individual output toggle buttons
			for (let channel = 0; channel < channelCount; channel++) {
				presets.push({
					category: `${slotLabel} - Outputs`,
					name: `Toggle Output ${channel + 1}`,
					type: 'button',
					style: {
						text: `${portType} ${channel + 1}\\n$(kissbox-gpio:slot${slot + 1}_ch${channel + 1}_state)`,
						size: 'auto',
						color: combineRgb(255, 255, 255),
						bgcolor: combineRgb(0, 0, 0),
					},
					steps: [
						{
							down: [
								{
									actionId: `toggle_output_slot${slot}`,
									options: {
										channel: channel,
									},
								},
							],
							up: [],
						},
					],
					feedbacks: [
						{
							feedbackId: `is_on_slot${slot}`,
							options: {
								channel: channel,
							},
							style: {
								bgcolor: combineRgb(0, 200, 0),
								color: combineRgb(0, 0, 0),
							},
						},
						{
							feedbackId: `is_off_slot${slot}`,
							options: {
								channel: channel,
							},
							style: {
								bgcolor: combineRgb(100, 0, 0),
								color: combineRgb(200, 200, 200),
							},
						},
					],
				})

				// Pulse button
				presets.push({
					category: `${slotLabel} - Pulse`,
					name: `Pulse Output ${channel + 1} (1s)`,
					type: 'button',
					style: {
						text: `PULSE\\n${portType} ${channel + 1}`,
						size: '14',
						color: combineRgb(255, 255, 255),
						bgcolor: combineRgb(100, 50, 0),
					},
					steps: [
						{
							down: [
								{
									actionId: `pulse_output_slot${slot}`,
									options: {
										channel: channel,
										duration: 1000,
									},
								},
							],
							up: [],
						},
					],
					feedbacks: [
						{
							feedbackId: `is_on_slot${slot}`,
							options: {
								channel: channel,
							},
							style: {
								bgcolor: combineRgb(255, 150, 0),
							},
						},
					],
				})
			}

			// Slot control buttons
			presets.push({
				category: `${slotLabel} - Controls`,
				name: 'All Outputs OFF',
				type: 'button',
				style: {
					text: `${slotLabel}\\nALL OFF`,
					size: 'auto',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(200, 0, 0),
				},
				steps: [
					{
						down: [
							{
								actionId: `all_off_slot${slot}`,
								options: {},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: `all_inactive_slot${slot}`,
						options: {},
						style: {
							bgcolor: combineRgb(100, 100, 100),
						},
					},
				],
			})

			presets.push({
				category: `${slotLabel} - Controls`,
				name: 'All Outputs ON',
				type: 'button',
				style: {
					text: `${slotLabel}\\nALL ON`,
					size: 'auto',
					color: combineRgb(0, 0, 0),
					bgcolor: combineRgb(0, 200, 0),
				},
				steps: [
					{
						down: [
							{
								actionId: `all_on_slot${slot}`,
								options: {},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: `all_active_slot${slot}`,
						options: {},
						style: {
							bgcolor: combineRgb(0, 255, 0),
						},
					},
				],
			})
		}

		// DIGITAL INPUT CARD PRESETS
		if (isInput && !isAnalog) {
			// Individual input status displays
			for (let channel = 0; channel < channelCount; channel++) {
				presets.push({
					category: `${slotLabel} - Status`,
					name: `Input ${channel + 1} Status`,
					type: 'button',
					style: {
						text: `${portType} ${channel + 1}\\n$(kissbox-gpio:slot${slot + 1}_ch${channel + 1}_state)`,
						size: 'auto',
						color: combineRgb(255, 255, 255),
						bgcolor: combineRgb(50, 50, 50),
					},
					steps: [
						{
							down: [],
							up: [],
						},
					],
					feedbacks: [
						{
							feedbackId: `is_on_slot${slot}`,
							options: {
								channel: channel,
							},
							style: {
								bgcolor: combineRgb(0, 200, 0),
								color: combineRgb(0, 0, 0),
							},
						},
						{
							feedbackId: `is_off_slot${slot}`,
							options: {
								channel: channel,
							},
							style: {
								bgcolor: combineRgb(100, 0, 0),
								color: combineRgb(200, 200, 200),
							},
						},
					],
				})
			}

			// Slot status display
			presets.push({
				category: `${slotLabel} - Status`,
				name: 'Slot Status',
				type: 'button',
				style: {
					text: `${slotLabel}\\nActive: $(kissbox-gpio:slot${slot + 1}_active_count)\\nBinary: $(kissbox-gpio:slot${slot + 1}_binary)`,
					size: 'auto',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(50, 50, 100),
				},
				steps: [
					{
						down: [],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: `any_active_slot${slot}`,
						options: {},
						style: {
							bgcolor: combineRgb(0, 100, 200),
						},
					},
					{
						feedbackId: `all_active_slot${slot}`,
						options: {},
						style: {
							bgcolor: combineRgb(0, 200, 100),
						},
					},
				],
			})
		}

		// ANALOG OUTPUT CARD PRESETS
		if (!isInput && isAnalog) {
			// Individual analog output control
			for (let channel = 0; channel < channelCount; channel++) {
				// Status display with value
				presets.push({
					category: `${slotLabel} - Values`,
					name: `Output ${channel + 1} Value`,
					type: 'button',
					style: {
						text: `${portType} ${channel + 1}\\n$(kissbox-gpio:slot${slot + 1}_ch${channel + 1}_value)\\n$(kissbox-gpio:slot${slot + 1}_ch${channel + 1}_percent)`,
						size: '14',
						color: combineRgb(255, 255, 255),
						bgcolor: combineRgb(0, 50, 100),
					},
					steps: [
						{
							down: [],
							up: [],
						},
					],
					feedbacks: [
						{
							feedbackId: `value_greater_slot${slot}`,
							options: {
								channel: channel,
								threshold: 200,
							},
							style: {
								bgcolor: combineRgb(200, 0, 0),
							},
						},
						{
							feedbackId: `value_in_range_slot${slot}`,
							options: {
								channel: channel,
								min: 100,
								max: 200,
							},
							style: {
								bgcolor: combineRgb(200, 200, 0),
							},
						},
						{
							feedbackId: `value_in_range_slot${slot}`,
							options: {
								channel: channel,
								min: 1,
								max: 100,
							},
							style: {
								bgcolor: combineRgb(0, 100, 200),
							},
						},
						{
							feedbackId: `value_equals_slot${slot}`,
							options: {
								channel: channel,
								value: 0,
							},
							style: {
								bgcolor: combineRgb(50, 50, 50),
							},
						},
					],
				})

				// Preset level buttons
				const analogLevels = [
					{ percent: 0, value: 0, label: 'OFF' },
					{ percent: 25, value: 64, label: '25%' },
					{ percent: 50, value: 128, label: '50%' },
					{ percent: 75, value: 191, label: '75%' },
					{ percent: 100, value: 255, label: '100%' },
				]

				for (const level of analogLevels) {
					presets.push({
						category: `${slotLabel} - Levels`,
						name: `Output ${channel + 1} @ ${level.label}`,
						type: 'button',
						style: {
							text: `${portType} ${channel + 1}\\n${level.label}`,
							size: '14',
							color: combineRgb(255, 255, 255),
							bgcolor: combineRgb(50, 50, 150),
						},
						steps: [
							{
								down: [
									{
										actionId: `set_analog_output_slot${slot}`,
										options: {
											channel: channel,
											value: level.value,
										},
									},
								],
								up: [],
							},
						],
						feedbacks: [
							{
								feedbackId: `value_equals_slot${slot}`,
								options: {
									channel: channel,
									value: level.value,
								},
								style: {
									bgcolor: combineRgb(0, 150, 255),
								},
							},
						],
					})
				}
			}

			// Slot control buttons
			presets.push({
				category: `${slotLabel} - Controls`,
				name: 'All Outputs OFF',
				type: 'button',
				style: {
					text: `${slotLabel}\\nALL OFF`,
					size: 'auto',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(200, 0, 0),
				},
				steps: [
					{
						down: [
							{
								actionId: `all_off_slot${slot}`,
								options: {},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: `all_inactive_slot${slot}`,
						options: {},
						style: {
							bgcolor: combineRgb(100, 100, 100),
						},
					},
				],
			})

			presets.push({
				category: `${slotLabel} - Controls`,
				name: 'All Outputs FULL',
				type: 'button',
				style: {
					text: `${slotLabel}\\nALL FULL`,
					size: 'auto',
					color: combineRgb(0, 0, 0),
					bgcolor: combineRgb(255, 200, 0),
				},
				steps: [
					{
						down: [
							{
								actionId: `all_full_slot${slot}`,
								options: {},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: `all_active_slot${slot}`,
						options: {},
						style: {
							bgcolor: combineRgb(255, 255, 0),
						},
					},
				],
			})
		}

		// ANALOG INPUT CARD PRESETS
		if (isInput && isAnalog) {
			// Individual analog input monitoring
			for (let channel = 0; channel < channelCount; channel++) {
				presets.push({
					category: `${slotLabel} - Values`,
					name: `Input ${channel + 1} Value`,
					type: 'button',
					style: {
						text: `${portType} ${channel + 1}\\n$(kissbox-gpio:slot${slot + 1}_ch${channel + 1}_value)\\n$(kissbox-gpio:slot${slot + 1}_ch${channel + 1}_percent)`,
						size: '14',
						color: combineRgb(255, 255, 255),
						bgcolor: combineRgb(50, 0, 100),
					},
					steps: [
						{
							down: [],
							up: [],
						},
					],
					feedbacks: [
						{
							feedbackId: `value_greater_slot${slot}`,
							options: {
								channel: channel,
								threshold: 200,
							},
							style: {
								bgcolor: combineRgb(200, 0, 0),
							},
						},
						{
							feedbackId: `value_in_range_slot${slot}`,
							options: {
								channel: channel,
								min: 100,
								max: 200,
							},
							style: {
								bgcolor: combineRgb(200, 200, 0),
							},
						},
						{
							feedbackId: `value_in_range_slot${slot}`,
							options: {
								channel: channel,
								min: 1,
								max: 100,
							},
							style: {
								bgcolor: combineRgb(0, 100, 200),
							},
						},
						{
							feedbackId: `value_equals_slot${slot}`,
							options: {
								channel: channel,
								value: 0,
							},
							style: {
								bgcolor: combineRgb(50, 50, 50),
							},
						},
					],
				})
			}

			// Slot status display
			presets.push({
				category: `${slotLabel} - Status`,
				name: 'Slot Status',
				type: 'button',
				style: {
					text: `${slotLabel}\\nStatus Display`,
					size: 'auto',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(50, 50, 100),
				},
				steps: [
					{
						down: [],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: `any_active_slot${slot}`,
						options: {},
						style: {
							bgcolor: combineRgb(0, 100, 200),
						},
					},
				],
			})
		}
	}

	// Global status preset
	presets.push({
		category: 'Global Controls',
		name: 'Device Status',
		type: 'button',
		style: {
			text: 'KISSBOX\\n$(kissbox-gpio:device_type)\\n$(kissbox-gpio:device_ip)\\n$(kissbox-gpio:connection_status)',
			size: '14',
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(0, 50, 100),
		},
		steps: [
			{
				down: [],
				up: [],
			},
		],
		feedbacks: [],
	})

	self.setPresetDefinitions(presets as unknown as CompanionPresetDefinitions)
}
