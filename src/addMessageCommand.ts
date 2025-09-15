import * as vscode from 'vscode';
import { QueueProvider } from './queueProvider';

export class AddMessageCommand {
    private queueProvider: QueueProvider;

    constructor(queueProvider: QueueProvider) {
        this.queueProvider = queueProvider;
    }

    async execute(): Promise<void> {
        try {
            // First, let user select a queue
            const queues = await this.queueProvider.getQueues();
            
            if (queues.length === 0) {
                vscode.window.showInformationMessage('No queues found. Create a queue first.');
                return;
            }

            const selectedQueue = await vscode.window.showQuickPick(queues, {
                placeHolder: 'Select a queue to add message to'
            });

            if (!selectedQueue) {
                return;
            }

            // Set the selected queue
            await this.queueProvider.setQueue(selectedQueue);

            // Get message text from user
            const messageText = await vscode.window.showInputBox({
                prompt: 'Enter message text',
                placeHolder: 'Type your message here...',
                validateInput: (value) => {
                    if (!value || value.trim().length === 0) {
                        return 'Message text cannot be empty';
                    }
                    if (value.length > 65536) {
                        return 'Message text is too long (max 65536 characters)';
                    }
                    return null;
                }
            });

            if (!messageText) {
                return;
            }

            // Add the message
            await this.queueProvider.addMessage(messageText);
            
            vscode.window.showInformationMessage(`Message added to queue: ${selectedQueue}`);

        } catch (error) {
            vscode.window.showErrorMessage(`Error adding message: ${error}`);
        }
    }
}
