import assert from 'assert';
import * as vscode from 'vscode';
import { ListMessagesCommand } from '../listMessagesCommand';
import { QueueProvider } from '../queueProvider';
import { AzuriteHealthCheck } from '../azuriteHealthCheck';

suite('ListMessagesCommand Tests', () => {
    let queueProvider: QueueProvider;
    let listMessagesCommand: ListMessagesCommand;
    let testQueueName: string;
    let azuriteRunning = false;

    suiteSetup(async () => {
        // Check if Azurite is running before running tests
        azuriteRunning = await AzuriteHealthCheck.isAzuriteRunning();
        
        if (!azuriteRunning) {
            console.log('Skipping ListMessagesCommand tests - Azurite is not running');
            return;
        }

        queueProvider = new QueueProvider();
        listMessagesCommand = new ListMessagesCommand(queueProvider);
        testQueueName = 'test-queue-' + Date.now();
        
        // Create a test queue with some messages
        await queueProvider.setQueue(testQueueName);
        await queueProvider.addMessage('Test message 1');
        await queueProvider.addMessage('Test message 2');
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

    test('should execute successfully with existing queue', async () => {
        if (skipIfAzuriteNotRunning()) {
            console.log('Skipping test - Azurite is not running');
            return;
        }

        // Mock the showQuickPick to return our test queue
        const originalShowQuickPick = vscode.window.showQuickPick;
        const mockShowQuickPick = async (items: any[]) => {
            return testQueueName;
        };
        
        // Mock the showTextDocument to capture the document content
        let capturedContent = '';
        const originalShowTextDocument = vscode.window.showTextDocument;
        const mockShowTextDocument = async (doc: vscode.TextDocument) => {
            capturedContent = doc.getText();
            return {} as vscode.TextEditor;
        };

        try {
            (vscode.window as any).showQuickPick = mockShowQuickPick;
            (vscode.window as any).showTextDocument = mockShowTextDocument;

            await listMessagesCommand.execute();

            // Verify the content was formatted correctly
            assert(capturedContent.includes(`Messages in queue: ${testQueueName}`), 'Should include queue name in content');
            assert(capturedContent.includes('Total messages:'), 'Should include message count');
            assert(capturedContent.includes('Test message 1'), 'Should include first test message');
            assert(capturedContent.includes('Test message 2'), 'Should include second test message');
            assert(capturedContent.includes('messageId'), 'Should include message properties');
            assert(capturedContent.includes('messageText'), 'Should include message text property');
            assert(capturedContent.includes('dequeueCount'), 'Should include dequeue count property');

        } finally {
            // Restore original functions
            (vscode.window as any).showQuickPick = originalShowQuickPick;
            (vscode.window as any).showTextDocument = originalShowTextDocument;
        }
    });

    test('should handle no queue selection gracefully', async () => {
        if (skipIfAzuriteNotRunning()) {
            console.log('Skipping test - Azurite is not running');
            return;
        }

        // Mock showQuickPick to return undefined (user cancelled)
        const originalShowQuickPick = vscode.window.showQuickPick;
        const mockShowQuickPick = async (items: any[]) => {
            return undefined;
        };

        try {
            (vscode.window as any).showQuickPick = mockShowQuickPick;

            // Should not throw an error
            await listMessagesCommand.execute();

        } finally {
            (vscode.window as any).showQuickPick = originalShowQuickPick;
        }
    });

    test('should handle empty queue gracefully', async () => {
        if (skipIfAzuriteNotRunning()) {
            console.log('Skipping test - Azurite is not running');
            return;
        }

        const emptyQueueName = 'empty-test-queue-' + Date.now();
        
        // Create an empty queue
        await queueProvider.setQueue(emptyQueueName);

        // Mock the showQuickPick to return the empty queue
        const originalShowQuickPick = vscode.window.showQuickPick;
        const mockShowQuickPick = async (items: any[]) => {
            return emptyQueueName;
        };

        // Mock showInformationMessage to capture the message
        let capturedMessage = '';
        const originalShowInformationMessage = vscode.window.showInformationMessage;
        const mockShowInformationMessage = async (message: string) => {
            capturedMessage = message;
            return undefined;
        };

        try {
            (vscode.window as any).showQuickPick = mockShowQuickPick;
            (vscode.window as any).showInformationMessage = mockShowInformationMessage;

            await listMessagesCommand.execute();

            assert(capturedMessage.includes('No messages found'), 'Should show no messages message');
            assert(capturedMessage.includes(emptyQueueName), 'Should include queue name in message');

        } finally {
            (vscode.window as any).showQuickPick = originalShowQuickPick;
            (vscode.window as any).showInformationMessage = originalShowInformationMessage;
            
            // Clean up empty queue
            const queueClient = (queueProvider as any).queueServiceClient.getQueueClient(emptyQueueName);
            await queueClient.delete();
        }
    });

    test('should not dequeue messages when listing (end-to-end test)', async () => {
        if (skipIfAzuriteNotRunning()) {
            console.log('Skipping test - Azurite is not running');
            return;
        }

        const peekTestQueueName = 'peek-command-test-queue-' + Date.now();
        
        // Create a test queue with a message
        await queueProvider.setQueue(peekTestQueueName);
        await queueProvider.addMessage('Peek command test message ' + Date.now());

        // Test the queue provider directly to verify peek behavior
        const firstList = await queueProvider.listMessages();
        assert(Array.isArray(firstList), 'Should return an array');
        assert(firstList.length > 0, 'Should have at least one message');
        
        const firstMessage = firstList.find(msg => msg.messageText.includes('Peek command test message'));
        assert(firstMessage, 'Should find the test message in first list');
        
        // List messages again - should still be there (not dequeued)
        const secondList = await queueProvider.listMessages();
        assert(Array.isArray(secondList), 'Should return an array');
        assert(secondList.length > 0, 'Should still have messages after second list');
        
        const secondMessage = secondList.find(msg => msg.messageText.includes('Peek command test message'));
        assert(secondMessage, 'Should find the same message in second list');
        
        // Verify the message IDs are the same (same message, not a copy)
        assert.strictEqual(firstMessage.messageId, secondMessage.messageId, 'Should be the same message ID');
        assert.strictEqual(firstMessage.messageText, secondMessage.messageText, 'Should be the same message text');
        
        // Clean up
        const queueClient = (queueProvider as any).queueServiceClient.getQueueClient(peekTestQueueName);
        await queueClient.delete();
    });

    test('should handle errors gracefully', async () => {
        if (skipIfAzuriteNotRunning()) {
            console.log('Skipping test - Azurite is not running');
            return;
        }

        // Create a command with a mock queue provider that throws an error
        const mockQueueProvider = {
            getQueues: async () => { throw new Error('Connection failed'); }
        } as any;

        const errorCommand = new ListMessagesCommand(mockQueueProvider);

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

            assert(capturedErrorMessage.includes('Error listing messages'), 'Should show error message');
            assert(capturedErrorMessage.includes('Connection failed'), 'Should include original error');

        } finally {
            (vscode.window as any).showErrorMessage = originalShowErrorMessage;
        }
    });
});
