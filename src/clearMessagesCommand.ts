import * as vscode from 'vscode';
import { QueueProvider } from './queueProvider';

export class ClearMessagesCommand {
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
                placeHolder: 'Select a queue to clear messages from'
            });

            if (!selectedQueue) {
                return;
            }

            // Set the selected queue
            await this.queueProvider.setQueue(selectedQueue);

            // Show confirmation dialog
            const confirmClear = await vscode.window.showWarningMessage(
                `Are you sure you want to clear all messages from queue "${selectedQueue}"? This action cannot be undone.`,
                { modal: true },
                'Yes, Clear All Messages'
            );

            if (confirmClear !== 'Yes, Clear All Messages') {
                return;
            }

            // Clear the messages
            await this.queueProvider.clearMessages();
            
            vscode.window.showInformationMessage(`All messages cleared from queue: ${selectedQueue}`);

        } catch (error) {
            // Check if it's an Azurite health check error
            if (error instanceof Error && error.message === 'Azurite is not running') {
                // Health check already showed the error message, no need to show another one
                return;
            }
            vscode.window.showErrorMessage(`Error clearing messages: ${error}`);
        }
    }
}
