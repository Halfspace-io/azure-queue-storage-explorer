import * as vscode from 'vscode';
import { QueueProvider } from './queueProvider';

export class QueueTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly queueName?: string,
        public readonly messageData?: any
    ) {
        super(label, collapsibleState);
        
        if (queueName && !messageData) {
            // This is a queue item
            this.contextValue = 'queue';
            this.iconPath = new vscode.ThemeIcon('database');
            // Store queue name in the tree item for the command to access
            (this as any).queueName = queueName;
        } else if (messageData) {
            // This is a message item
            this.contextValue = 'message';
            this.iconPath = new vscode.ThemeIcon('mail');
            this.tooltip = `Message ID: ${messageData.messageId}\nText: ${messageData.messageText}\nInserted: ${messageData.insertedOn}\nDequeue Count: ${messageData.dequeueCount}`;
        }
    }
}

export class QueueTreeDataProvider implements vscode.TreeDataProvider<QueueTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<QueueTreeItem | undefined | null | void> = new vscode.EventEmitter<QueueTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<QueueTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private queueProvider: QueueProvider) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: QueueTreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: QueueTreeItem): Promise<QueueTreeItem[]> {
        if (!element) {
            // Root level - return all queues
            try {
                const queues = await this.queueProvider.getQueues();
                return queues.map(queueName => 
                    new QueueTreeItem(queueName, vscode.TreeItemCollapsibleState.Collapsed, queueName)
                );
            } catch (error) {
                console.error('Error fetching queues:', error);
                return [];
            }
        } else if (element.queueName && !element.messageData) {
            // Queue level - return messages for this queue
            try {
                // Set the queue in the provider
                await this.queueProvider.setQueue(element.queueName);
                const messages = await this.queueProvider.listMessages();
                
                if (messages.length === 0) {
                    return [new QueueTreeItem('No messages', vscode.TreeItemCollapsibleState.None)];
                }
                
                return messages.map(message => 
                    new QueueTreeItem(
                        `Message: ${message.messageText.substring(0, 50)}${message.messageText.length > 50 ? '...' : ''}`,
                        vscode.TreeItemCollapsibleState.None,
                        element.queueName,
                        message
                    )
                );
            } catch (error) {
                console.error(`Error fetching messages for queue ${element.queueName}:`, error);
                return [new QueueTreeItem('Error loading messages', vscode.TreeItemCollapsibleState.None)];
            }
        }
        
        return [];
    }
}
