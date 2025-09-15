import * as vscode from 'vscode';
import { QueueProvider } from './queueProvider';
import { QueueTreeDataProvider } from './queueTreeDataProvider';

export class RemoveMessageCommand {
    private queueProvider: QueueProvider;
    private treeDataProvider: QueueTreeDataProvider;

    constructor(queueProvider: QueueProvider, treeDataProvider: QueueTreeDataProvider) {
        this.queueProvider = queueProvider;
        this.treeDataProvider = treeDataProvider;
    }

    async execute(messageId?: string, popReceipt?: string, queueName?: string): Promise<void> {
        try {
            let selectedMessageId: string;
            let selectedPopReceipt: string | undefined;
            let selectedQueue: string;

            if (messageId && queueName) {
                // Use the provided parameters
                selectedMessageId = messageId;
                selectedPopReceipt = popReceipt;
                selectedQueue = queueName;
            } else {
                // First, let user select a queue
                const queues = await this.queueProvider.getQueues();
                
                if (queues.length === 0) {
                    vscode.window.showInformationMessage('No queues found. Create a queue first.');
                    return;
                }

                const pickedQueue = await vscode.window.showQuickPick(queues, {
                    placeHolder: 'Select a queue to remove message from'
                });

                if (!pickedQueue) {
                    return;
                }

                selectedQueue = pickedQueue;

                // Set the selected queue
                await this.queueProvider.setQueue(selectedQueue);

                // Get messages from the queue
                const messages = await this.queueProvider.listMessages();
                
                if (messages.length === 0) {
                    vscode.window.showInformationMessage('No messages found in this queue.');
                    return;
                }

                // Let user select a message
                const messageItems = messages.map(message => ({
                    label: `Message: ${message.messageText.substring(0, 50)}${message.messageText.length > 50 ? '...' : ''}`,
                    description: `ID: ${message.messageId}`,
                    messageId: message.messageId,
                    popReceipt: message.popReceipt
                }));

                const selectedMessage = await vscode.window.showQuickPick(messageItems, {
                    placeHolder: 'Select a message to remove'
                });

                if (!selectedMessage) {
                    return;
                }

                selectedMessageId = selectedMessage.messageId;
                selectedPopReceipt = selectedMessage.popReceipt;
            }

            // Show confirmation dialog
            const confirmRemove = await vscode.window.showWarningMessage(
                `Are you sure you want to remove this message? This action cannot be undone.`,
                { modal: true },
                'Yes, Remove Message'
            );

            if (confirmRemove !== 'Yes, Remove Message') {
                return;
            }

            // Set the queue if not already set
            if (!queueName) {
                await this.queueProvider.setQueue(selectedQueue);
            }

            // Remove the message (popReceipt will be fetched if not provided)
            await this.queueProvider.removeMessage(selectedMessageId, selectedPopReceipt);
            
            // Refresh the tree view
            this.treeDataProvider.refresh();
            
            vscode.window.showInformationMessage(`Message removed from queue: ${selectedQueue}`);

        } catch (error) {
            // Check if it's an Azurite health check error
            if (error instanceof Error && error.message === 'Azurite is not running') {
                // Health check already showed the error message, no need to show another one
                return;
            }
            vscode.window.showErrorMessage(`Error removing message: ${error}`);
        }
    }
}
