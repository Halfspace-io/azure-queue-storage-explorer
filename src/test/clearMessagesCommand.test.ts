import assert from 'assert';
import * as vscode from 'vscode';
import { ClearMessagesCommand } from '../clearMessagesCommand';
import { QueueProvider } from '../queueProvider';
import { AzuriteHealthCheck } from '../azuriteHealthCheck';
import { QueueTreeDataProvider } from '../queueTreeDataProvider';

suite('ClearMessagesCommand Tests', () => {
    let queueProvider: QueueProvider;
    let clearMessagesCommand: ClearMessagesCommand;
    let testQueueName: string;
    let azuriteRunning = false;

    suiteSetup(async () => {
        // Check if Azurite is running before running tests
        azuriteRunning = await AzuriteHealthCheck.isAzuriteRunning();
        
        if (!azuriteRunning) {
            console.log('Skipping ClearMessagesCommand tests - Azurite is not running');
            return;
        }

        queueProvider = new QueueProvider();
        const treeDataProvider = new QueueTreeDataProvider(queueProvider);
        clearMessagesCommand = new ClearMessagesCommand(queueProvider, treeDataProvider);
        testQueueName = 'test-clear-queue-' + Date.now();
        
        // Create a test queue
        await queueProvider.setQueue(testQueueName);
    });

    suiteTeardown(async () => {
        if (!azuriteRunning) {
            return;
        }

        // Clean up: delete the test queue
        try {
            const queueClient = (queueProvider as any).queueServiceClient.getQueueClient(testQueueName);
            await queueClient.delete();
        } catch (error) {
            // Ignore cleanup errors
            console.log('Cleanup error (ignored):', error);
        }
    });

    // Helper function to skip tests when Azurite is not running
    function skipIfAzuriteNotRunning() {
        if (!azuriteRunning) {
            console.log('Skipping test - Azurite is not running');
            return true;
        }
        return false;
    }

    test('should clear messages successfully', async () => {
        if (skipIfAzuriteNotRunning()) {return;}

        // First add some test messages
        await queueProvider.addMessage('Test message 1');
        await queueProvider.addMessage('Test message 2');
        await queueProvider.addMessage('Test message 3');

        // Verify messages were added
        let messages = await queueProvider.listMessages();
        assert(messages.length === 3, 'Should have 3 messages before clearing');

        // Mock the showQuickPick to return our test queue
        const originalShowQuickPick = vscode.window.showQuickPick;
        const mockShowQuickPick = async (items: any[]) => {
            return testQueueName;
        };

        // Mock showWarningMessage to return confirmation
        const originalShowWarningMessage = vscode.window.showWarningMessage;
        const mockShowWarningMessage = async (message: string, options: any) => {
            return 'Yes, Clear All Messages';
        };

        // Mock showInformationMessage to capture the success message
        let capturedMessage = '';
        const originalShowInformationMessage = vscode.window.showInformationMessage;
        const mockShowInformationMessage = async (message: string) => {
            capturedMessage = message;
            return undefined;
        };

        try {
            (vscode.window as any).showQuickPick = mockShowQuickPick;
            (vscode.window as any).showWarningMessage = mockShowWarningMessage;
            (vscode.window as any).showInformationMessage = mockShowInformationMessage;

            await clearMessagesCommand.execute();

            // Verify success message
            assert(capturedMessage.includes('All messages cleared from queue'), 'Should show success message');
            assert(capturedMessage.includes(testQueueName), 'Should include queue name in success message');

            // Verify messages were actually cleared
            messages = await queueProvider.listMessages();
            assert(messages.length === 0, 'Should have 0 messages after clearing');

        } finally {
            // Restore original functions
            (vscode.window as any).showQuickPick = originalShowQuickPick;
            (vscode.window as any).showWarningMessage = originalShowWarningMessage;
            (vscode.window as any).showInformationMessage = originalShowInformationMessage;
        }
    });

    test('should handle no queue selection gracefully', async () => {
        if (skipIfAzuriteNotRunning()) {return;}

        // Mock showQuickPick to return undefined (user cancelled)
        const originalShowQuickPick = vscode.window.showQuickPick;
        const mockShowQuickPick = async (items: any[]) => {
            return undefined;
        };

        try {
            (vscode.window as any).showQuickPick = mockShowQuickPick;

            // Should not throw an error
            await clearMessagesCommand.execute();

        } finally {
            (vscode.window as any).showQuickPick = originalShowQuickPick;
        }
    });

    test('should handle user cancellation of confirmation', async () => {
        if (skipIfAzuriteNotRunning()) {return;}

        // Add a test message first
        await queueProvider.addMessage('Test message for cancellation');

        // Mock the showQuickPick to return our test queue
        const originalShowQuickPick = vscode.window.showQuickPick;
        const mockShowQuickPick = async (items: any[]) => {
            return testQueueName;
        };

        // Mock showWarningMessage to return undefined (user cancelled)
        const originalShowWarningMessage = vscode.window.showWarningMessage;
        const mockShowWarningMessage = async (message: string, options: any) => {
            return undefined;
        };

        try {
            (vscode.window as any).showQuickPick = mockShowQuickPick;
            (vscode.window as any).showWarningMessage = mockShowWarningMessage;

            await clearMessagesCommand.execute();

            // Verify message is still there (not cleared)
            const messages = await queueProvider.listMessages();
            assert(messages.length === 1, 'Should still have 1 message after cancellation');
            assert(messages[0].messageText === 'Test message for cancellation', 'Should have the original message');

        } finally {
            (vscode.window as any).showQuickPick = originalShowQuickPick;
            (vscode.window as any).showWarningMessage = originalShowWarningMessage;
        }
    });

    test('should handle errors gracefully', async () => {
        if (skipIfAzuriteNotRunning()) {return;}

        // Create a command with a mock queue provider that throws an error
        const mockQueueProvider = {
            getQueues: async () => { throw new Error('Connection failed'); }
        } as any;

        const mockTreeDataProvider = { refresh: () => {} } as any;
        const errorCommand = new ClearMessagesCommand(mockQueueProvider, mockTreeDataProvider);

        // Mock showErrorMessage to capture the error message
        let capturedErrorMessage = '';
        const originalShowErrorMessage = vscode.window.showErrorMessage;
        const mockShowErrorMessage = async (message: string) => {
            capturedErrorMessage = message;
            return undefined;
        };

        try {
            (vscode.window as any).showErrorMessage = mockShowErrorMessage;

            await errorCommand.execute();

            assert(capturedErrorMessage.includes('Error clearing messages'), 'Should show error message');
            assert(capturedErrorMessage.includes('Connection failed'), 'Should include original error');

        } finally {
            (vscode.window as any).showErrorMessage = originalShowErrorMessage;
        }
    });

    test('should handle no queues available', async () => {
        if (skipIfAzuriteNotRunning()) {return;}

        // Create a command with a mock queue provider that returns no queues
        const mockQueueProvider = {
            getQueues: async () => []
        } as any;

        const mockTreeDataProvider = { refresh: () => {} } as any;
        const noQueuesCommand = new ClearMessagesCommand(mockQueueProvider, mockTreeDataProvider);

        // Mock showInformationMessage to capture the message
        let capturedMessage = '';
        const originalShowInformationMessage = vscode.window.showInformationMessage;
        const mockShowInformationMessage = async (message: string) => {
            capturedMessage = message;
            return undefined;
        };

        try {
            (vscode.window as any).showInformationMessage = mockShowInformationMessage;

            await noQueuesCommand.execute();

            assert(capturedMessage.includes('No queues found'), 'Should show no queues message');

        } finally {
            (vscode.window as any).showInformationMessage = originalShowInformationMessage;
        }
    });

    test('should handle clear messages when queue is empty', async () => {
        if (skipIfAzuriteNotRunning()) {return;}

        // Ensure queue is empty
        await queueProvider.clearMessages();

        // Mock the showQuickPick to return our test queue
        const originalShowQuickPick = vscode.window.showQuickPick;
        const mockShowQuickPick = async (items: any[]) => {
            return testQueueName;
        };

        // Mock showWarningMessage to return confirmation
        const originalShowWarningMessage = vscode.window.showWarningMessage;
        const mockShowWarningMessage = async (message: string, options: any) => {
            return 'Yes, Clear All Messages';
        };

        // Mock showInformationMessage to capture the success message
        let capturedMessage = '';
        const originalShowInformationMessage = vscode.window.showInformationMessage;
        const mockShowInformationMessage = async (message: string) => {
            capturedMessage = message;
            return undefined;
        };

        try {
            (vscode.window as any).showQuickPick = mockShowQuickPick;
            (vscode.window as any).showWarningMessage = mockShowWarningMessage;
            (vscode.window as any).showInformationMessage = mockShowInformationMessage;

            await clearMessagesCommand.execute();

            // Verify success message
            assert(capturedMessage.includes('All messages cleared from queue'), 'Should show success message even for empty queue');

            // Verify queue is still empty
            const messages = await queueProvider.listMessages();
            assert(messages.length === 0, 'Should still have 0 messages');

        } finally {
            // Restore original functions
            (vscode.window as any).showQuickPick = originalShowQuickPick;
            (vscode.window as any).showWarningMessage = originalShowWarningMessage;
            (vscode.window as any).showInformationMessage = originalShowInformationMessage;
        }
    });
});
