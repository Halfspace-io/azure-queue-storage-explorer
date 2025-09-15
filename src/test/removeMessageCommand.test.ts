import * as assert from 'assert';
import * as vscode from 'vscode';
import { RemoveMessageCommand } from '../removeMessageCommand';
import { QueueProvider } from '../queueProvider';
import { QueueTreeDataProvider } from '../queueTreeDataProvider';

suite('RemoveMessageCommand Test Suite', () => {
    let queueProvider: QueueProvider;
    let treeDataProvider: QueueTreeDataProvider;
    let removeMessageCommand: RemoveMessageCommand;

    setup(() => {
        queueProvider = new QueueProvider();
        treeDataProvider = new QueueTreeDataProvider(queueProvider);
        removeMessageCommand = new RemoveMessageCommand(queueProvider, treeDataProvider);
    });

    test('should be defined', () => {
        assert.ok(removeMessageCommand);
    });

    test('should have execute method', () => {
        assert.ok(typeof removeMessageCommand.execute === 'function');
    });
});
