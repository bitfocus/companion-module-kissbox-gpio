import type { SomeCompanionConfigField } from '@companion-module/base'

export type CardType =
	| 'empty'
	| 'DI8DC' // 8 digital inputs
	| 'DO8SK' // 8 digital outputs (relay)
	| 'DO4PR' // 4 digital outputs (relay)
	| 'AI8RA' // 8 analog inputs
	| 'AO8DA' // 8 analog outputs

export interface CardConfig {
	type: CardType
	label?: string
}

export interface ModuleConfig {
	host: string
	port: number
	udpReceivePort?: number
	deviceType: 'IO3CC' | 'IO8CC'
	slot0: CardType
	slot1: CardType
	slot2: CardType
	slot3?: CardType
	slot4?: CardType
	slot5?: CardType
	slot6?: CardType
	slot7?: CardType
	verbose: boolean
}

// Card information database
export const CARD_INFO: Record<CardType, { channels: number; isInput: boolean; isAnalog: boolean; name: string }> = {
	empty: { channels: 0, isInput: false, isAnalog: false, name: 'Empty Slot' },
	DI8DC: { channels: 8, isInput: true, isAnalog: false, name: 'DI8DC - 8 Digital Inputs' },
	DO8SK: { channels: 8, isInput: false, isAnalog: false, name: 'DO8SK - 8 Digital Outputs (Relay)' },
	DO4PR: { channels: 4, isInput: false, isAnalog: false, name: 'DO4PR - 4 Digital Outputs (Relay)' },
	AI8RA: { channels: 8, isInput: true, isAnalog: true, name: 'AI8RA - 8 Analog Inputs' },
	AO8DA: { channels: 8, isInput: false, isAnalog: true, name: 'AO8DA - 8 Analog Outputs' },
}

export function GetConfigFields(): SomeCompanionConfigField[] {
	const cardChoices = [
		{ id: 'empty', label: 'Empty Slot' },
		{ id: 'DI8DC', label: 'DI8DC - 8 Digital Inputs' },
		{ id: 'DO8SK', label: 'DO8SK - 8 Digital Outputs (Relay)' },
		{ id: 'DO4PR', label: 'DO4PR - 4 Digital Outputs (Relay)' },
		{ id: 'AI8RA', label: 'AI8RA - 8 Analog Inputs' },
		{ id: 'AO8DA', label: 'AO8DA - 8 Analog Outputs' },
	]

	return [
		{
			type: 'static-text',
			id: 'info',
			width: 12,
			label: 'Information',
			value: 'This module controls KISSBOX IO3CC and IO8CC GPIO devices via UDP protocol.',
		},
		{
			type: 'textinput',
			id: 'host',
			width: 6,
			label: 'Device IP Address',
			default: '192.168.1.100',
			regex: '/^(?:\\d{1,3}\\.){3}\\d{1,3}$/',
		},
		{
			type: 'number',
			id: 'port',
			width: 6,
			label: 'Device Port',
			tooltip: 'Port to send commands to on the KISSBOX device',
			default: 10001,
			min: 1,
			max: 65535,
		},
		{
			type: 'number',
			id: 'udpReceivePort',
			width: 6,
			label: 'UDP Listen Port',
			tooltip:
				'Port the server listens on for responses from KISSBOX (default: 10002). Configure this IP:Port in the KissBox Editor software as the return data destination.',
			default: 10002,
			min: 0,
			max: 65535,
		},
		{
			type: 'dropdown',
			id: 'deviceType',
			width: 6,
			label: 'Device Type',
			default: 'IO8CC',
			choices: [
				{ id: 'IO3CC', label: 'IO3CC (3 slots)' },
				{ id: 'IO8CC', label: 'IO8CC (8 slots)' },
			],
		},
		{
			type: 'static-text',
			id: 'hr_slots',
			width: 12,
			label: 'Card Configuration',
			value: 'Configure which card type is installed in each slot:',
		},
		{
			type: 'dropdown',
			id: 'slot0',
			width: 6,
			label: 'Slot 1',
			default: 'empty',
			choices: cardChoices,
		},
		{
			type: 'dropdown',
			id: 'slot1',
			width: 6,
			label: 'Slot 2',
			default: 'empty',
			choices: cardChoices,
		},
		{
			type: 'dropdown',
			id: 'slot2',
			width: 6,
			label: 'Slot 3',
			default: 'empty',
			choices: cardChoices,
		},
		{
			type: 'dropdown',
			id: 'slot3',
			width: 6,
			label: 'Slot 4',
			default: 'empty',
			choices: cardChoices,
			isVisible: (options) => options.deviceType === 'IO8CC',
		},
		{
			type: 'dropdown',
			id: 'slot4',
			width: 6,
			label: 'Slot 5',
			default: 'empty',
			choices: cardChoices,
			isVisible: (options) => options.deviceType === 'IO8CC',
		},
		{
			type: 'dropdown',
			id: 'slot5',
			width: 6,
			label: 'Slot 6',
			default: 'empty',
			choices: cardChoices,
			isVisible: (options) => options.deviceType === 'IO8CC',
		},
		{
			type: 'dropdown',
			id: 'slot6',
			width: 6,
			label: 'Slot 7',
			default: 'empty',
			choices: cardChoices,
			isVisible: (options) => options.deviceType === 'IO8CC',
		},
		{
			type: 'dropdown',
			id: 'slot7',
			width: 6,
			label: 'Slot 8',
			default: 'empty',
			choices: cardChoices,
			isVisible: (options) => options.deviceType === 'IO8CC',
		},
		{
			type: 'static-text',
			id: 'kissbox_setup',
			width: 12,
			label: 'KISSBOX Device Configuration',
			value:
				'Important: Configure automatic status updates in the KISSBOX web interface per card. ' +
				'INPUT cards: UNCHECK "Disable time-out" to receive real-time status updates. ' +
				'OUTPUT cards: CHECK "Disable time-out" to prevent automatic timeouts. ' +
				'Also remember to set the return IP address to your Companion server IP in the KISSBOX settings.',
		},
		{
			type: 'static-text',
			id: 'hr2',
			width: 12,
			label: ' ',
			value: '---',
		},
		{
			type: 'checkbox',
			id: 'verbose',
			label: 'Enable Verbose Logging',
			default: false,
			width: 4,
		},
	]
}
