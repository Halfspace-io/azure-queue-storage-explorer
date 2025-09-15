import * as vscode from 'vscode';
import { QueueProvider } from './queueProvider';
import { QueueTreeDataProvider } from './queueTreeDataProvider';

export class RemoveQueueCommand {
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
                selectedQueue = queueName;
            } else {
                // First, let user select a queue
                const queues = await this.queueProvider.getQueues();
                
                if (queues.length === 0) {
                    vscode.window.showInformationMessage('No queues found. Create a queue first.');
                    return;
                }

                const pickedQueue = await vscode.window.showQuickPick(queues, {
                    placeHolder: 'Select a queue to remove'
                });

                if (!pickedQueue) {
                    return;
                }

                selectedQueue = pickedQueue;
            }

            // Show confirmation dialog
            const confirmDelete = await vscode.window.showWarningMessage(
                `Are you sure you want to delete queue "${selectedQueue}"? This action cannot be undone and will remove the queue and all its messages.`,
                { modal: true },
                'Yes, Delete Queue'
            );

            if (confirmDelete !== 'Yes, Delete Queue') {
                return;
            }

            // Delete the queue
            await this.queueProvider.deleteQueue(selectedQueue);
            
            // Refresh the tree view
            this.treeDataProvider.refresh();
            
            vscode.window.showInformationMessage(`Queue deleted: ${selectedQueue}`);

        } catch (error) {
            // Check if it's an Azurite health check error
            if (error instanceof Error && error.message === 'Azurite is not running') {
                // Health check already showed the error message, no need to show another one
                return;
            }
            vscode.window.showErrorMessage(`Error deleting queue: ${error}`);
        }
    }
}
