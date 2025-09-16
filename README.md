# Azure Queue Storage Explorer

[![GitHub release (latest by date)](https://img.shields.io/github/v/release/Halfspace-io/azure-queue-storage-explorer)](https://github.com/Halfspace-io/azure-queue-storage-explorer/releases)
[![License](https://img.shields.io/github/license/Halfspace-io/azure-queue-storage-explorer)](LICENSE)

A comprehensive VS Code extension for managing Azure Queue Storage with local Azurite emulator. Create, manage, and monitor your queues with an intuitive tree view interface.

## Features

- **🏗️ Create Queues**: Create new queues with proper validation
- **📋 Queue Management**: View all queues in a dedicated activity bar panel
- **💬 Message Operations**: Add, view, and remove individual messages
- **🗑️ Bulk Operations**: Clear all messages or delete entire queues
- **⚡ Inline Actions**: Quick actions directly in the tree view
- **🔄 Real-time Updates**: Automatic refresh after operations
- **🏠 Local Development**: Works seamlessly with Azurite emulator
- **🎨 Modern UI**: Clean, intuitive interface with VS Code integration

## Prerequisites

1. **Azurite**: Make sure Azurite is running locally

   **Option 1: VS Code Extension (Recommended)**
   - Install the [Azurite extension](https://marketplace.visualstudio.com/items?itemName=Azurite.azurite) by Microsoft
   - Open Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
   - Run "Azurite: Start" to start the emulator
   - The extension will automatically start Azurite on the default ports

   **Option 2: Command Line**
   ```bash
   pnpm add -g azurite
   azurite --silent --location c:\azurite --debug c:\azurite\debug.log
   ```

2. **VS Code**: Version 1.98.2 or higher

## Usage

### Getting Started
1. **Install Azurite Extension**: Install the [Azurite extension](https://marketplace.visualstudio.com/items?itemName=Azurite.azurite) and start it
2. **Open This Extension**: Click the "Local Azure Queues" icon in the activity bar
3. **Start Managing**: All operations are available through the tree view interface

### Tree View Interface
- **📁 Queues Panel**: View all your queues in a dedicated activity bar panel
- **➕ Create Queue**: Click the "+" button in the panel header
- **🔄 Refresh**: Click the refresh button to update the queue list

### Queue Operations
- **➕ Add Message**: Click the "+" icon next to any queue
- **🗑️ Clear Messages**: Click the clear icon to remove all messages
- **🗑️ Delete Queue**: Click the trash icon to delete the entire queue
- **📋 View Messages**: Click on a queue to expand and view its messages

### Message Operations
- **🗑️ Remove Message**: Click the trash icon next to any message
- **📄 Message Details**: Hover over messages to see detailed information

### Command Palette (Alternative)
All operations are also available through the Command Palette (`Ctrl+Shift+P`):
- "Queue: Create Queue"
- "Queue: Add Message"
- "Queue: List Messages"
- "Queue: Clear Messages"
- "Queue: Remove Queue"
- "Queue: Remove Message"
- "Select Queue"
- "Refresh"

## Configuration

The extension connects to Azurite using simple local settings:
- **Account Name**: devstoreaccount1
- **Queue Endpoint**: http://127.0.0.1:10001
- **Authentication**: Uses a simple key (Azurite accepts any key for local development)

No complex connection strings or real Azure credentials needed!

## Development

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Compile: `pnpm run compile`
4. Press `F5` to run the extension in a new Extension Development Host window

## License

MIT License - see LICENSE file for details