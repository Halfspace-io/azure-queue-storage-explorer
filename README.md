# Azure Queue Storage Explorer

A minimalistic VS Code extension for managing Azure Queue Storage messages using Azurite emulated storage.

## Features

- **Create Queue**: Create new queues with proper validation
- **List Queue Messages**: View all messages in a formatted JSON document (messages remain in queue)
- **Add Messages**: Add new messages to a queue
- **Azurite Integration**: Works with local Azurite emulated storage

## Prerequisites

1. **Azurite**: Make sure Azurite is running locally
   ```bash
   npm install -g azurite
   azurite --silent --location c:\azurite --debug c:\azurite\debug.log
   ```

2. **VS Code**: Version 1.104.0 or higher

## Usage

### Create Queue
1. Open Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Run "Queue: Create Queue"
3. Enter a queue name (3-63 characters, letters, numbers, and hyphens only)
4. Queue will be created and ready to use

### List Messages
1. Open Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Run "Queue: List Messages"
3. Select a queue from the list
4. View messages in a new JSON document with formatted output

### Add Message
1. Open Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Run "Queue: Add Message"
3. Select a queue from the list
4. Enter your message text
5. Message will be added to the selected queue

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