# companion-module-kissbox-gpio

Bitfocus Buttons & Companion module for controlling KISSBOX IO3CC and IO8CC GPIO cardcage devices.

## Features

- Full UDP protocol implementation for KISSBOX IO3CC/IO8CC devices
- Real-time status updates with automatic heartbeat
- Digital and analog channel control
- Comprehensive feedback system with multiple conditions
- Rich variable support for status display
- Pre-configured presets for common use cases
- Support for up to 8 slots with 8 channels each

## Supported Devices

- **KISSBOX IO3CC** - 3-slot GPIO cardcage
- **KISSBOX IO8CC** - 8-slot GPIO cardcage

## Documentation

See [HELP.md](./companion/HELP.md) for complete usage documentation.

## Protocol Implementation

This module implements the KISSBOX UDP hexadecimal protocol for communication with IO3CC/IO8CC devices.

### Commands to Device

| Command | Hex   | Format | Description |
|---------|-------|--------|-------------|
| Read All Channels | `0xA0` | `[0xA0, slot]` | Read all 8 channels from a slot |
| Read One Channel | `0xA2` | `[0xA2, slot, channel]` | Read a single channel |
| Write All Channels | `0xA4` | `[0xA4, slot, v1, v2, v3, v4, v5, v6, v7, v8]` | Write all 8 channels in a slot |
| Write One Channel | `0xA5` | `[0xA5, slot, channel, value]` | Write a single channel |

### Responses from Device

| Response | Hex   | Format | Description |
|----------|-------|--------|-------------|
| All Channel Status | `0xA1` | `[0xA1, slot, v1, v2, v3, v4, v5, v6, v7, v8]` | Status of all 8 channels |
| Single Channel Status | `0xA3` | `[0xA3, slot, channel, value]` | Status of a single channel |

### Value Ranges

- **Digital cards**: `0x00` (OFF) or `0x01` (ON)
- **Analog cards**: `0x00` (OFF) to `0xFF` (255, full ON)

### Addressing

- **Slots**: 0-2 for IO3CC, 0-7 for IO8CC (displayed as 1-3 or 1-8 in UI)
- **Channels**: 0-7 per slot (displayed as 1-8 in UI)

### Network Communication

The module uses UDP for all communication with the KISSBOX device, providing:
- Fast, low-latency command transmission
- Real-time status updates from input cards
- Automatic heartbeat updates from output cards
- Bidirectional communication on configurable ports

## License

See [LICENSE](./LICENSE)

## Development

### Getting Started

1. Install dependencies:
   ```bash
   yarn
   ```

2. Build the module:
   ```bash
   yarn build
   ```

3. Development mode (watch for changes):
   ```bash
   yarn dev
   ```

### Building

The module can be built once with `yarn build`. This compiles the TypeScript source files in `src/` to JavaScript in `dist/` and makes the module loadable by Companion.

While developing, use `yarn dev` to run the compiler in watch mode and automatically recompile files on change.

## Support

For issues or feature requests, please use the [GitHub issue tracker](https://github.com/bitfocus/companion-module-kissbox-gpio/issues).

## About KISSBOX

KISSBOX B.V. manufactures professional GPIO control systems for broadcast and production environments.

Website: https://www.kiss-box.com
