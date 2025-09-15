// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { QueueProvider } from './queueProvider';
import { CreateQueueCommand } from './createQueueCommand';
import { ListMessagesCommand } from './listMessagesCommand';
import { AddMessageCommand } from './addMessageCommand';
import { ClearMessagesCommand } from './clearMessagesCommand';
import { RemoveQueueCommand } from './removeQueueCommand';
import { QueueTreeDataProvider } from './queueTreeDataProvider';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Azure Queue Storage Explorer extension is now active!');

	// Initialize the queue provider
	const queueProvider = new QueueProvider();
	
	// Initialize the tree data provider
	const queueTreeDataProvider = new QueueTreeDataProvider(queueProvider);
	
	const createQueueCommand = new CreateQueueCommand(queueProvider, queueTreeDataProvider);
	const listMessagesCommand = new ListMessagesCommand(queueProvider);
	const addMessageCommand = new AddMessageCommand(queueProvider, queueTreeDataProvider);
	const clearMessagesCommand = new ClearMessagesCommand(queueProvider, queueTreeDataProvider);
	const removeQueueCommand = new RemoveQueueCommand(queueProvider, queueTreeDataProvider);

	// Register commands
	const createQueueDisposable = vscode.commands.registerCommand('azure-queue-storage-explorer.createQueue', () => {
		createQueueCommand.execute();
	});

	const listMessagesDisposable = vscode.commands.registerCommand('azure-queue-storage-explorer.listMessages', () => {
		listMessagesCommand.execute();
	});

	const addMessageDisposable = vscode.commands.registerCommand('azure-queue-storage-explorer.addMessage', (context: any) => {
		console.log('Extension: Received context:', context);
		
		let queueName: string | undefined;
		
		// Try to extract queue name from the tree item context
		if (context && context.queueName) {
			queueName = context.queueName;
		} else if (context && context.resourceUri) {
			const uri = context.resourceUri;
			if (uri.scheme === 'queue') {
				queueName = uri.path.substring(1); // Remove leading slash
			}
		} else if (context && typeof context === 'string') {
			queueName = context;
		}
		
		console.log('Extension: Extracted queueName:', queueName, 'Type:', typeof queueName);
		addMessageCommand.execute(queueName);
	});

	const clearMessagesDisposable = vscode.commands.registerCommand('azure-queue-storage-explorer.clearMessages', () => {
		clearMessagesCommand.execute();
	});

	const removeQueueDisposable = vscode.commands.registerCommand('azure-queue-storage-explorer.removeQueue', () => {
		removeQueueCommand.execute();
	});

	const refreshQueuesDisposable = vscode.commands.registerCommand('azure-queue-storage-explorer.refreshQueues', () => {
		queueTreeDataProvider.refresh();
	});

	// Register the tree view
	vscode.window.createTreeView('azure-queue-storage-explorer.queues', {
		treeDataProvider: queueTreeDataProvider
	});

	context.subscriptions.push(createQueueDisposable, listMessagesDisposable, addMessageDisposable, clearMessagesDisposable, removeQueueDisposable, refreshQueuesDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
