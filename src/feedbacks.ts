import type { KissboxGPIOInstance } from './main.js'
import {
	combineRgb,
	type CompanionFeedbackDefinitions,
	type CompanionFeedbackBooleanEvent,
} from '@companion-module/base'

export function UpdateFeedbacks(self: KissboxGPIOInstance): void {
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

	const feedbacks: CompanionFeedbackDefinitions = {
		channel_is_on: {
			name: 'Channel is ON',
			description: 'Change button style when a channel is ON (value > 0)',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(0, 255, 0),
				color: combineRgb(0, 0, 0),
			},
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
			callback: (event: CompanionFeedbackBooleanEvent): boolean => {
				const opt = event.options as { slot: number; channel: number }
				const slot = Number(opt.slot)
				const channel = Number(opt.channel)
				const value = self.channelState.get(slot)?.get(channel) ?? 0
				return value > 0
			},
		},

		channel_is_off: {
			name: 'Channel is OFF',
			description: 'Change button style when a channel is OFF (value = 0)',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(255, 0, 0),
				color: combineRgb(255, 255, 255),
			},
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
			callback: (event: CompanionFeedbackBooleanEvent): boolean => {
				const opt = event.options as { slot: number; channel: number }
				const slot = Number(opt.slot)
				const channel = Number(opt.channel)
				const value = self.channelState.get(slot)?.get(channel) ?? 0
				return value === 0
			},
		},

		channel_value_equals: {
			name: 'Channel Value Equals',
			description: 'Change button style when channel value equals a specific value',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(0, 200, 255),
				color: combineRgb(0, 0, 0),
			},
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
					label: 'Value',
					default: 128,
					min: 0,
					max: 255,
				},
			],
			callback: (event: CompanionFeedbackBooleanEvent): boolean => {
				const opt = event.options as { slot: number; channel: number; value: number }
				const slot = Number(opt.slot)
				const channel = Number(opt.channel)
				const expectedValue = Number(opt.value)
				const actualValue = self.channelState.get(slot)?.get(channel) ?? 0
				return actualValue === expectedValue
			},
		},

		channel_value_greater_than: {
			name: 'Channel Value Greater Than',
			description: 'Change button style when channel value is greater than a threshold',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(255, 200, 0),
				color: combineRgb(0, 0, 0),
			},
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
					id: 'threshold',
					type: 'number',
					label: 'Threshold',
					default: 128,
					min: 0,
					max: 255,
				},
			],
			callback: (event: CompanionFeedbackBooleanEvent): boolean => {
				const opt = event.options as { slot: number; channel: number; threshold: number }
				const slot = Number(opt.slot)
				const channel = Number(opt.channel)
				const threshold = Number(opt.threshold)
				const value = self.channelState.get(slot)?.get(channel) ?? 0
				return value > threshold
			},
		},

		channel_value_less_than: {
			name: 'Channel Value Less Than',
			description: 'Change button style when channel value is less than a threshold',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(100, 100, 255),
				color: combineRgb(255, 255, 255),
			},
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
					id: 'threshold',
					type: 'number',
					label: 'Threshold',
					default: 128,
					min: 0,
					max: 255,
				},
			],
			callback: (event: CompanionFeedbackBooleanEvent): boolean => {
				const opt = event.options as { slot: number; channel: number; threshold: number }
				const slot = Number(opt.slot)
				const channel = Number(opt.channel)
				const threshold = Number(opt.threshold)
				const value = self.channelState.get(slot)?.get(channel) ?? 0
				return value < threshold
			},
		},

		channel_value_in_range: {
			name: 'Channel Value In Range',
			description: 'Change button style when channel value is within a specific range',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(255, 0, 255),
				color: combineRgb(255, 255, 255),
			},
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
					id: 'min',
					type: 'number',
					label: 'Minimum Value',
					default: 64,
					min: 0,
					max: 255,
				},
				{
					id: 'max',
					type: 'number',
					label: 'Maximum Value',
					default: 192,
					min: 0,
					max: 255,
				},
			],
			callback: (event: CompanionFeedbackBooleanEvent): boolean => {
				const opt = event.options as { slot: number; channel: number; min: number; max: number }
				const slot = Number(opt.slot)
				const channel = Number(opt.channel)
				const min = Number(opt.min)
				const max = Number(opt.max)
				const value = self.channelState.get(slot)?.get(channel) ?? 0
				return value >= min && value <= max
			},
		},

		any_channel_on_in_slot: {
			name: 'Any Channel ON in Slot',
			description: 'Change button style when any channel in a slot is ON',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(0, 150, 255),
				color: combineRgb(255, 255, 255),
			},
			options: [
				{
					id: 'slot',
					type: 'dropdown',
					label: 'Slot',
					default: 0,
					choices: slotChoices,
				},
			],
			callback: (event: CompanionFeedbackBooleanEvent): boolean => {
				const opt = event.options as { slot: number }
				const slot = Number(opt.slot)
				const channels = self.channelState.get(slot)
				if (!channels) return false

				for (let i = 0; i < 8; i++) {
					if ((channels.get(i) ?? 0) > 0) {
						return true
					}
				}
				return false
			},
		},

		all_channels_on_in_slot: {
			name: 'All Channels ON in Slot',
			description: 'Change button style when all channels in a slot are ON',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(0, 255, 100),
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					id: 'slot',
					type: 'dropdown',
					label: 'Slot',
					default: 0,
					choices: slotChoices,
				},
			],
			callback: (event: CompanionFeedbackBooleanEvent): boolean => {
				const opt = event.options as { slot: number }
				const slot = Number(opt.slot)
				const channels = self.channelState.get(slot)
				if (!channels) return false

				for (let i = 0; i < 8; i++) {
					if ((channels.get(i) ?? 0) === 0) {
						return false
					}
				}
				return true
			},
		},

		all_channels_off_in_slot: {
			name: 'All Channels OFF in Slot',
			description: 'Change button style when all channels in a slot are OFF',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(64, 64, 64),
				color: combineRgb(200, 200, 200),
			},
			options: [
				{
					id: 'slot',
					type: 'dropdown',
					label: 'Slot',
					default: 0,
					choices: slotChoices,
				},
			],
			callback: (event: CompanionFeedbackBooleanEvent): boolean => {
				const opt = event.options as { slot: number }
				const slot = Number(opt.slot)
				const channels = self.channelState.get(slot)
				if (!channels) return true

				for (let i = 0; i < 8; i++) {
					if ((channels.get(i) ?? 0) > 0) {
						return false
					}
				}
				return true
			},
		},
	}

	self.setFeedbackDefinitions(feedbacks)
}
