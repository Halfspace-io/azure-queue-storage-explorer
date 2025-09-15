import * as vscode from 'vscode';
import { QueueProvider } from './queueProvider';
import { QueueTreeDataProvider } from './queueTreeDataProvider';

export class CreateQueueCommand {
    private queueProvider: QueueProvider;
    private treeDataProvider: QueueTreeDataProvider;

    constructor(queueProvider: QueueProvider, treeDataProvider: QueueTreeDataProvider) {
        this.queueProvider = queueProvider;
        this.treeDataProvider = treeDataProvider;
    }

    async execute(): Promise<void> {
        try {
            // Get queue name from user
            const queueName = await vscode.window.showInputBox({
                prompt: 'Enter queue name',
                placeHolder: 'my-queue-name',
                validateInput: (value) => {
                    if (!value || value.trim().length === 0) {
                        return 'Queue name cannot be empty';
                    }
                    
                    // Azure queue name validation rules
                    const trimmedValue = value.trim();
                    
                    // Must be 3-63 characters
                    if (trimmedValue.length < 3) {
                        return 'Queue name must be at least 3 characters long';
                    }
                    if (trimmedValue.length > 63) {
                        return 'Queue name must be no more than 63 characters long';
                    }
                    
                    // Must start and end with letter or number
                    if (!/^[a-zA-Z0-9]/.test(trimmedValue)) {
                        return 'Queue name must start with a letter or number';
                    }
                    if (!/[a-zA-Z0-9]$/.test(trimmedValue)) {
                        return 'Queue name must end with a letter or number';
                    }
                    
                    // Can contain letters, numbers, and hyphens
                    if (!/^[a-zA-Z0-9-]+$/.test(trimmedValue)) {
                        return 'Queue name can only contain letters, numbers, and hyphens';
                    }
                    
                    // Cannot have consecutive hyphens
                    if (trimmedValue.includes('--')) {
                        return 'Queue name cannot contain consecutive hyphens';
                    }
                    
                    return null;
                }
            });

            if (!queueName) {
                return;
            }

            const trimmedQueueName = queueName.trim();

            // Check if queue already exists
            const existingQueues = await this.queueProvider.getQueues();
            if (existingQueues.includes(trimmedQueueName)) {
                vscode.window.showWarningMessage(`Queue '${trimmedQueueName}' already exists.`);
                return;
            }

            // Create the queue
            await this.queueProvider.setQueue(trimmedQueueName);
            
            // Refresh the tree view
            this.treeDataProvider.refresh();
            
            vscode.window.showInformationMessage(`Queue '${trimmedQueueName}' created successfully!`);

        } catch (error) {
            // Check if it's an Azurite health check error
            if (error instanceof Error && error.message === 'Azurite is not running') {
                // Health check already showed the error message, no need to show another one
                return;
            }
            vscode.window.showErrorMessage(`Error creating queue: ${error}`);
        }
    }
}
