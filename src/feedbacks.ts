import type { KissboxGPIOInstance } from './main.js'
import {
	combineRgb,
	type CompanionFeedbackDefinitions,
	type CompanionFeedbackBooleanEvent,
} from '@companion-module/base'
import { CARD_INFO } from './config.js'

export function UpdateFeedbacks(self: KissboxGPIOInstance): void {
	const feedbacks: CompanionFeedbackDefinitions = {}

	// Generate feedbacks for each configured card
	for (let slot = 0; slot < self.maxSlots; slot++) {
		const cardType = self.getCardType(slot)
		const cardInfo = CARD_INFO[cardType]

		if (cardType === 'empty') continue

		const channelCount = cardInfo.channels
		const isAnalog = cardInfo.isAnalog
		const isInput = cardInfo.isInput
		const slotLabel = `Slot ${slot + 1} (${cardInfo.name})`
		const portType = isInput ? 'Input' : 'Output'

		// Generate channel choices for this card
		const channelChoices = []
		for (let i = 0; i < channelCount; i++) {
			channelChoices.push({ id: i, label: `${portType} ${i + 1}` })
		}

		// DIGITAL FEEDBACKS (for both digital inputs and outputs)
		if (!isAnalog) {
			// Is ON feedback
			feedbacks[`is_on_slot${slot}`] = {
				name: `${slotLabel}: ${portType} is ON`,
				description: `Change button style when ${portType.toLowerCase()} is ON`,
				type: 'boolean',
				defaultStyle: {
					bgcolor: combineRgb(0, 255, 0),
					color: combineRgb(0, 0, 0),
				},
				options: [
					{
						id: 'channel',
						type: 'dropdown',
						label: portType,
						default: 0,
						choices: channelChoices,
					},
				],
				callback: (event: CompanionFeedbackBooleanEvent): boolean => {
					const opt = event.options as { channel: number }
					const channel = Number(opt.channel)
					const value = self.channelState.get(slot)?.get(channel) ?? 0
					return value > 0
				},
			}

			// Is OFF feedback
			feedbacks[`is_off_slot${slot}`] = {
				name: `${slotLabel}: ${portType} is OFF`,
				description: `Change button style when ${portType.toLowerCase()} is OFF`,
				type: 'boolean',
				defaultStyle: {
					bgcolor: combineRgb(100, 0, 0),
					color: combineRgb(200, 200, 200),
				},
				options: [
					{
						id: 'channel',
						type: 'dropdown',
						label: portType,
						default: 0,
						choices: channelChoices,
					},
				],
				callback: (event: CompanionFeedbackBooleanEvent): boolean => {
					const opt = event.options as { channel: number }
					const channel = Number(opt.channel)
					const value = self.channelState.get(slot)?.get(channel) ?? 0
					return value === 0
				},
			}
		}

		// ANALOG FEEDBACKS (for both analog inputs and outputs)
		if (isAnalog) {
			// Value equals
			feedbacks[`value_equals_slot${slot}`] = {
				name: `${slotLabel}: ${portType} Value Equals`,
				description: `Change button style when ${portType.toLowerCase()} value equals a specific value`,
				type: 'boolean',
				defaultStyle: {
					bgcolor: combineRgb(0, 200, 255),
					color: combineRgb(0, 0, 0),
				},
				options: [
					{
						id: 'channel',
						type: 'dropdown',
						label: portType,
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
					const opt = event.options as { channel: number; value: number }
					const channel = Number(opt.channel)
					const expectedValue = Number(opt.value)
					const actualValue = self.channelState.get(slot)?.get(channel) ?? 0
					return actualValue === expectedValue
				},
			}

			// Value greater than
			feedbacks[`value_greater_slot${slot}`] = {
				name: `${slotLabel}: ${portType} Greater Than`,
				description: `Change button style when ${portType.toLowerCase()} value is greater than threshold`,
				type: 'boolean',
				defaultStyle: {
					bgcolor: combineRgb(255, 200, 0),
					color: combineRgb(0, 0, 0),
				},
				options: [
					{
						id: 'channel',
						type: 'dropdown',
						label: portType,
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
					const opt = event.options as { channel: number; threshold: number }
					const channel = Number(opt.channel)
					const threshold = Number(opt.threshold)
					const value = self.channelState.get(slot)?.get(channel) ?? 0
					return value > threshold
				},
			}

			// Value less than
			feedbacks[`value_less_slot${slot}`] = {
				name: `${slotLabel}: ${portType} Less Than`,
				description: `Change button style when ${portType.toLowerCase()} value is less than threshold`,
				type: 'boolean',
				defaultStyle: {
					bgcolor: combineRgb(100, 100, 255),
					color: combineRgb(255, 255, 255),
				},
				options: [
					{
						id: 'channel',
						type: 'dropdown',
						label: portType,
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
					const opt = event.options as { channel: number; threshold: number }
					const channel = Number(opt.channel)
					const threshold = Number(opt.threshold)
					const value = self.channelState.get(slot)?.get(channel) ?? 0
					return value < threshold
				},
			}

			// Value in range
			feedbacks[`value_in_range_slot${slot}`] = {
				name: `${slotLabel}: ${portType} In Range`,
				description: `Change button style when ${portType.toLowerCase()} value is within a range`,
				type: 'boolean',
				defaultStyle: {
					bgcolor: combineRgb(255, 0, 255),
					color: combineRgb(255, 255, 255),
				},
				options: [
					{
						id: 'channel',
						type: 'dropdown',
						label: portType,
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
					const opt = event.options as { channel: number; min: number; max: number }
					const channel = Number(opt.channel)
					const min = Number(opt.min)
					const max = Number(opt.max)
					const value = self.channelState.get(slot)?.get(channel) ?? 0
					return value >= min && value <= max
				},
			}
		}

		// SLOT-LEVEL FEEDBACKS (any type of card)
		// Any port active
		feedbacks[`any_active_slot${slot}`] = {
			name: `${slotLabel}: Any ${portType} Active`,
			description: `Change button style when any ${portType.toLowerCase()} is active`,
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(0, 150, 255),
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: (): boolean => {
				const channels = self.channelState.get(slot)
				if (!channels) return false

				for (let i = 0; i < channelCount; i++) {
					if ((channels.get(i) ?? 0) > 0) {
						return true
					}
				}
				return false
			},
		}

		// All ports active
		feedbacks[`all_active_slot${slot}`] = {
			name: `${slotLabel}: All ${portType}s Active`,
			description: `Change button style when all ${portType.toLowerCase()}s are active`,
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(0, 255, 100),
				color: combineRgb(0, 0, 0),
			},
			options: [],
			callback: (): boolean => {
				const channels = self.channelState.get(slot)
				if (!channels) return false

				for (let i = 0; i < channelCount; i++) {
					if ((channels.get(i) ?? 0) === 0) {
						return false
					}
				}
				return true
			},
		}

		// All ports inactive
		feedbacks[`all_inactive_slot${slot}`] = {
			name: `${slotLabel}: All ${portType}s Inactive`,
			description: `Change button style when all ${portType.toLowerCase()}s are inactive`,
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(64, 64, 64),
				color: combineRgb(200, 200, 200),
			},
			options: [],
			callback: (): boolean => {
				const channels = self.channelState.get(slot)
				if (!channels) return true

				for (let i = 0; i < channelCount; i++) {
					if ((channels.get(i) ?? 0) > 0) {
						return false
					}
				}
				return true
			},
		}
	}

	self.setFeedbackDefinitions(feedbacks)
}
