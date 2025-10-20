import type {
	CompanionButtonPresetDefinition,
	CompanionTextPresetDefinition,
	CompanionPresetDefinitions,
} from '@companion-module/base'
import { combineRgb } from '@companion-module/base'
import type { KissboxGPIOInstance } from './main.js'

export function UpdatePresets(self: KissboxGPIOInstance): void {
	const presets: (CompanionButtonPresetDefinition | CompanionTextPresetDefinition)[] = []

	// Create presets for each slot
	for (let slot = 0; slot < self.maxSlots; slot++) {
		// Individual channel toggle buttons
		for (let channel = 0; channel < 8; channel++) {
			presets.push({
				category: `Slot ${slot + 1} - Digital Channels`,
				name: `Toggle Channel ${channel + 1}`,
				type: 'button',
				style: {
					text: `S${slot + 1}:C${channel + 1}\\n$(kissbox-gpio:slot_${slot + 1}_ch_${channel + 1}_state)`,
					size: 'auto' as const,
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 0, 0),
				},
				steps: [
					{
						down: [
							{
								actionId: 'toggle_channel',
								options: {
									slot: slot,
									channel: channel,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'channel_is_on',
						options: {
							slot: slot,
							channel: channel,
						},
						style: {
							bgcolor: combineRgb(0, 200, 0),
							color: combineRgb(0, 0, 0),
						},
					},
					{
						feedbackId: 'channel_is_off',
						options: {
							slot: slot,
							channel: channel,
						},
						style: {
							bgcolor: combineRgb(100, 0, 0),
							color: combineRgb(200, 200, 200),
						},
					},
				],
			})

			// Analog channel control with value display
			presets.push({
				category: `Slot ${slot + 1} - Analog Channels`,
				name: `Channel ${channel + 1} Value`,
				type: 'button',
				style: {
					text: `S${slot + 1}:C${channel + 1}\\n$(kissbox-gpio:slot_${slot + 1}_ch_${channel + 1}_value)\\n$(kissbox-gpio:slot_${slot + 1}_ch_${channel + 1}_percent)`,
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
						feedbackId: 'channel_value_greater_than',
						options: {
							slot: slot,
							channel: channel,
							threshold: 200,
						},
						style: {
							bgcolor: combineRgb(200, 0, 0),
						},
					},
					{
						feedbackId: 'channel_value_in_range',
						options: {
							slot: slot,
							channel: channel,
							min: 100,
							max: 200,
						},
						style: {
							bgcolor: combineRgb(200, 200, 0),
						},
					},
					{
						feedbackId: 'channel_value_in_range',
						options: {
							slot: slot,
							channel: channel,
							min: 1,
							max: 100,
						},
						style: {
							bgcolor: combineRgb(0, 100, 200),
						},
					},
					{
						feedbackId: 'channel_is_off',
						options: {
							slot: slot,
							channel: channel,
						},
						style: {
							bgcolor: combineRgb(50, 50, 50),
						},
					},
				],
			})

			// Pulse button
			presets.push({
				category: `Slot ${slot + 1} - Pulse Actions`,
				name: `Pulse Channel ${channel + 1} (1s)`,
				type: 'button',
				style: {
					text: `PULSE\\nS${slot + 1}:C${channel + 1}`,
					size: '14',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(100, 50, 0),
				},
				steps: [
					{
						down: [
							{
								actionId: 'pulse_channel',
								options: {
									slot: slot,
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
						feedbackId: 'channel_is_on',
						options: {
							slot: slot,
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
			category: `Slot ${slot + 1} - Slot Controls`,
			name: 'All Channels OFF',
			type: 'button',
			style: {
				text: `SLOT ${slot + 1}\\nALL OFF`,
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(200, 0, 0),
			},
			steps: [
				{
					down: [
						{
							actionId: 'set_all_off',
							options: {
								slot: slot,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'all_channels_off_in_slot',
					options: {
						slot: slot,
					},
					style: {
						bgcolor: combineRgb(100, 100, 100),
					},
				},
			],
		})

		presets.push({
			category: `Slot ${slot + 1} - Slot Controls`,
			name: 'All Channels ON (Digital)',
			type: 'button',
			style: {
				text: `SLOT ${slot + 1}\\nALL ON`,
				size: 'auto',
				color: combineRgb(0, 0, 0),
				bgcolor: combineRgb(0, 200, 0),
			},
			steps: [
				{
					down: [
						{
							actionId: 'set_all_on',
							options: {
								slot: slot,
								type: 'digital',
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'all_channels_on_in_slot',
					options: {
						slot: slot,
					},
					style: {
						bgcolor: combineRgb(0, 255, 0),
					},
				},
			],
		})

		presets.push({
			category: `Slot ${slot + 1} - Slot Controls`,
			name: 'Slot Status',
			type: 'button',
			style: {
				text: `SLOT ${slot + 1}\\nActive: $(kissbox-gpio:slot_${slot + 1}_active_count)`,
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(50, 50, 100),
			},
			steps: [
				{
					down: [
						{
							actionId: 'read_all_channels',
							options: {
								slot: slot,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'any_channel_on_in_slot',
					options: {
						slot: slot,
					},
					style: {
						bgcolor: combineRgb(0, 100, 200),
					},
				},
				{
					feedbackId: 'all_channels_on_in_slot',
					options: {
						slot: slot,
					},
					style: {
						bgcolor: combineRgb(0, 200, 100),
					},
				},
			],
		})

		// Analog preset buttons at common levels
		const analogLevels = [
			{ percent: 25, value: 64, label: '25%' },
			{ percent: 50, value: 128, label: '50%' },
			{ percent: 75, value: 191, label: '75%' },
			{ percent: 100, value: 255, label: '100%' },
		]

		for (const level of analogLevels) {
			for (let channel = 0; channel < 8; channel++) {
				presets.push({
					category: `Slot ${slot + 1} - Analog Presets`,
					name: `Ch ${channel + 1} @ ${level.label}`,
					type: 'button',
					style: {
						text: `S${slot + 1}:C${channel + 1}\\n${level.label}`,
						size: '14',
						color: combineRgb(255, 255, 255),
						bgcolor: combineRgb(50, 50, 150),
					},
					steps: [
						{
							down: [
								{
									actionId: 'write_channel_analog',
									options: {
										slot: slot,
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
							feedbackId: 'channel_value_equals',
							options: {
								slot: slot,
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
	}

	// Global controls
	presets.push({
		category: 'Global Controls',
		name: 'Device Status',
		type: 'button',
		style: {
			text: 'KISSBOX\\n$(kissbox-gpio:device_type)\\n$(kissbox-gpio:device_host)\\nActive: $(kissbox-gpio:total_active_channels)',
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
