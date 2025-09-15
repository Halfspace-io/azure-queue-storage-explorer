import * as vscode from 'vscode';
import { QueueProvider } from './queueProvider';
import { QueueTreeDataProvider } from './queueTreeDataProvider';

export class AddMessageCommand {
    private queueProvider: QueueProvider;
    private treeDataProvider: QueueTreeDataProvider;

    constructor(queueProvider: QueueProvider, treeDataProvider: QueueTreeDataProvider) {
        this.queueProvider = queueProvider;
        this.treeDataProvider = treeDataProvider;
    }

    async execute(queueName?: string): Promise<void> {
        try {
            let selectedQueue: string;

            if (queueName) {
                // Use the provided queue name
                console.log('AddMessageCommand: Received queueName:', queueName, 'Type:', typeof queueName);
                
                // Validate that queueName is a string
                if (typeof queueName !== 'string') {
                    vscode.window.showErrorMessage('Invalid queue name provided');
                    return;
                }
                
                selectedQueue = queueName;
            } else {
                // First, let user select a queue
                const queues = await this.queueProvider.getQueues();
                
                if (queues.length === 0) {
                    vscode.window.showInformationMessage('No queues found. Create a queue first.');
                    return;
                }

                const pickedQueue = await vscode.window.showQuickPick(queues, {
                    placeHolder: 'Select a queue to add message to'
                });

                if (!pickedQueue) {
                    return;
                }

                selectedQueue = pickedQueue;
            }

            // Set the selected queue
            await this.queueProvider.setQueue(selectedQueue);

            // Get message text from user
            const messageText = await vscode.window.showInputBox({
                prompt: queueName ? `Enter message text for queue: ${queueName}` : 'Enter message text',
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
            
            // Refresh the tree view
            this.treeDataProvider.refresh();
            
            vscode.window.showInformationMessage(`Message added to queue: ${selectedQueue}`);

        } catch (error) {
            // Check if it's an Azurite health check error
            if (error instanceof Error && error.message === 'Azurite is not running') {
                // Health check already showed the error message, no need to show another one
                return;
            }
            vscode.window.showErrorMessage(`Error adding message: ${error}`);
        }
    }
}
