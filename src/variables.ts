import type { CompanionVariableDefinition, CompanionVariableValues } from '@companion-module/base'
import type { KissboxGPIOInstance } from './main.js'

export function UpdateVariableDefinitions(self: KissboxGPIOInstance): void {
	const variables: CompanionVariableDefinition[] = []

	// Device info variables
	variables.push({
		variableId: 'device_type',
		name: 'Device Type',
	})
	variables.push({
		variableId: 'device_host',
		name: 'Device IP Address',
	})
	variables.push({
		variableId: 'device_port',
		name: 'Device Port',
	})

	// Create variables for each slot and channel
	for (let slot = 0; slot < self.maxSlots; slot++) {
		const slotNum = slot + 1 // Convert to 1-based for user-friendly variable names
		// Variables for each individual channel
		for (let channel = 0; channel < 8; channel++) {
			const channelNum = channel + 1 // Convert to 1-based for user-friendly variable names
			variables.push({
				variableId: `slot_${slotNum}_ch_${channelNum}_value`,
				name: `Slot ${slotNum} Channel ${channelNum} Value`,
			})
			variables.push({
				variableId: `slot_${slotNum}_ch_${channelNum}_state`,
				name: `Slot ${slotNum} Channel ${channelNum} State (ON/OFF)`,
			})
			variables.push({
				variableId: `slot_${slotNum}_ch_${channelNum}_percent`,
				name: `Slot ${slotNum} Channel ${channelNum} Percentage`,
			})
		}

		// Summary variables for each slot
		variables.push({
			variableId: `slot_${slotNum}_active_count`,
			name: `Slot ${slotNum} Active Channels Count`,
		})
		variables.push({
			variableId: `slot_${slotNum}_all_values`,
			name: `Slot ${slotNum} All Channel Values`,
		})
		variables.push({
			variableId: `slot_${slotNum}_all_states`,
			name: `Slot ${slotNum} All Channel States`,
		})
	}

	// Global summary variables
	variables.push({
		variableId: 'total_active_channels',
		name: 'Total Active Channels (All Slots)',
	})

	self.setVariableDefinitions(variables)
}

export function CheckVariables(self: KissboxGPIOInstance): void {
	const variableValues: CompanionVariableValues = {}

	// Device info
	variableValues.device_type = self.config.deviceType
	variableValues.device_host = self.config.host
	variableValues.device_port = self.config.port

	let totalActiveChannels = 0

	// Update variables for each slot and channel
	for (let slot = 0; slot < self.maxSlots; slot++) {
		const slotNum = slot + 1 // Convert to 1-based for user-friendly variable names
		const channels = self.channelState.get(slot)
		if (!channels) continue

		let activeCount = 0
		const allValues: string[] = []
		const allStates: string[] = []

		for (let channel = 0; channel < 8; channel++) {
			const channelNum = channel + 1 // Convert to 1-based for user-friendly variable names
			const value = channels.get(channel) ?? 0
			const isActive = value > 0
			const percent = Math.round((value / 255) * 100)

			// Individual channel variables
			variableValues[`slot_${slotNum}_ch_${channelNum}_value`] = value
			variableValues[`slot_${slotNum}_ch_${channelNum}_state`] = isActive ? 'ON' : 'OFF'
			variableValues[`slot_${slotNum}_ch_${channelNum}_percent`] = `${percent}%`

			// Collect for summary
			allValues.push(value.toString())
			allStates.push(isActive ? '1' : '0')

			if (isActive) {
				activeCount++
				totalActiveChannels++
			}
		}

		// Slot summary variables
		variableValues[`slot_${slotNum}_active_count`] = activeCount
		variableValues[`slot_${slotNum}_all_values`] = allValues.join(',')
		variableValues[`slot_${slotNum}_all_states`] = allStates.join('')
	}

	// Global summary
	variableValues.total_active_channels = totalActiveChannels

	self.setVariableValues(variableValues)
}
