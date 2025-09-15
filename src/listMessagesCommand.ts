import * as vscode from 'vscode';
import { QueueProvider } from './queueProvider';

export class ListMessagesCommand {
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
                placeHolder: 'Select a queue to list messages from'
            });

            if (!selectedQueue) {
                return;
            }

            // Set the selected queue
            await this.queueProvider.setQueue(selectedQueue);

            // List messages
            const messages = await this.queueProvider.listMessages();

            if (messages.length === 0) {
                vscode.window.showInformationMessage(`No messages found in queue: ${selectedQueue}`);
                return;
            }

            // Display messages in a new document
            const content = this.formatMessages(messages, selectedQueue);
            const doc = await vscode.workspace.openTextDocument({
                content,
                language: 'json'
            });
            
            await vscode.window.showTextDocument(doc);

        } catch (error) {
            // Check if it's an Azurite health check error
            if (error instanceof Error && error.message === 'Azurite is not running') {
                // Health check already showed the error message, no need to show another one
                return;
            }
            vscode.window.showErrorMessage(`Error listing messages: ${error}`);
        }
    }

    private formatMessages(messages: any[], queueName: string): string {
        const header = `Messages in queue: ${queueName}\n` +
                      `Total messages: ${messages.length}\n` +
                      `Generated at: ${new Date().toISOString()}\n\n`;
        
        const messagesJson = JSON.stringify(messages, null, 2);
        
        return header + messagesJson;
    }

}
