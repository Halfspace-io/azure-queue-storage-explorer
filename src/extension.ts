// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { QueueProvider } from './queueProvider';
import { CreateQueueCommand } from './createQueueCommand';
import { ListMessagesCommand } from './listMessagesCommand';
import { AddMessageCommand } from './addMessageCommand';
import { ClearMessagesCommand } from './clearMessagesCommand';
import { RemoveQueueCommand } from './removeQueueCommand';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Azure Queue Storage Explorer extension is now active!');

	// Initialize the queue provider
	const queueProvider = new QueueProvider();
	const createQueueCommand = new CreateQueueCommand(queueProvider);
	const listMessagesCommand = new ListMessagesCommand(queueProvider);
	const addMessageCommand = new AddMessageCommand(queueProvider);
	const clearMessagesCommand = new ClearMessagesCommand(queueProvider);
	const removeQueueCommand = new RemoveQueueCommand(queueProvider);

	// Register commands
	const createQueueDisposable = vscode.commands.registerCommand('azure-queue-storage-explorer.createQueue', () => {
		createQueueCommand.execute();
	});

	const listMessagesDisposable = vscode.commands.registerCommand('azure-queue-storage-explorer.listMessages', () => {
		listMessagesCommand.execute();
	});

	const addMessageDisposable = vscode.commands.registerCommand('azure-queue-storage-explorer.addMessage', () => {
		addMessageCommand.execute();
	});

	const clearMessagesDisposable = vscode.commands.registerCommand('azure-queue-storage-explorer.clearMessages', () => {
		clearMessagesCommand.execute();
	});

	const removeQueueDisposable = vscode.commands.registerCommand('azure-queue-storage-explorer.removeQueue', () => {
		removeQueueCommand.execute();
	});

	context.subscriptions.push(createQueueDisposable, listMessagesDisposable, addMessageDisposable, clearMessagesDisposable, removeQueueDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
