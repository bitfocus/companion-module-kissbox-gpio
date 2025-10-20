import type { SomeCompanionConfigField } from '@companion-module/base'

export interface ModuleConfig {
	host: string
	port: number
	udpReceivePort?: number
	deviceType: 'IO3CC' | 'IO8CC'
	verbose: boolean
}

export function GetConfigFields(): SomeCompanionConfigField[] {
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
				'Port to listen on for incoming UDP responses. 0 = automatic (random port), or set to specific port (e.g., 9812)',
			default: 10002,
			min: 0,
			max: 65535,
		},
		{
			type: 'dropdown',
			id: 'deviceType',
			width: 12,
			label: 'Device Type',
			default: 'IO8CC',
			choices: [
				{ id: 'IO3CC', label: 'IO3CC (3 slots)' },
				{ id: 'IO8CC', label: 'IO8CC (8 slots)' },
			],
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
