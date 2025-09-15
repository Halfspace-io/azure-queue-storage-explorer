import assert from 'assert';
import * as vscode from 'vscode';
import { AddMessageCommand } from '../addMessageCommand';
import { QueueProvider } from '../queueProvider';
import { AzuriteHealthCheck } from '../azuriteHealthCheck';

suite('AddMessageCommand Tests', () => {
    let queueProvider: QueueProvider;
    let addMessageCommand: AddMessageCommand;
    let testQueueName: string;
    let azuriteRunning = false;

    suiteSetup(async () => {
        // Check if Azurite is running before running tests
        azuriteRunning = await AzuriteHealthCheck.isAzuriteRunning();
        
        if (!azuriteRunning) {
            console.log('Skipping AddMessageCommand tests - Azurite is not running');
            return;
        }

        queueProvider = new QueueProvider();
        addMessageCommand = new AddMessageCommand(queueProvider);
        testQueueName = 'test-queue-' + Date.now();
        
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

    test('should add message successfully', async () => {
        if (skipIfAzuriteNotRunning()) {return;}

        const testMessage = 'Test message ' + Date.now();
        
        // Mock the showQuickPick to return our test queue
        const originalShowQuickPick = vscode.window.showQuickPick;
        const mockShowQuickPick = async (items: any[]) => {
            return testQueueName;
        };

        // Mock the showInputBox to return our test message
        const originalShowInputBox = vscode.window.showInputBox;
        const mockShowInputBox = async (options: any) => {
            return testMessage;
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
            (vscode.window as any).showInputBox = mockShowInputBox;
            (vscode.window as any).showInformationMessage = mockShowInformationMessage;

            await addMessageCommand.execute();

            // Verify success message
            assert(capturedMessage.includes('Message added to queue'), 'Should show success message');
            assert(capturedMessage.includes(testQueueName), 'Should include queue name in success message');

            // Verify message was actually added
            const messages = await queueProvider.listMessages();
            const addedMessage = messages.find(msg => msg.messageText === testMessage);
            assert(addedMessage, 'Message should be found in queue');

        } finally {
            // Restore original functions
            (vscode.window as any).showQuickPick = originalShowQuickPick;
            (vscode.window as any).showInputBox = originalShowInputBox;
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
            await addMessageCommand.execute();

        } finally {
            (vscode.window as any).showQuickPick = originalShowQuickPick;
        }
    });

    test('should handle no message input gracefully', async () => {
        if (skipIfAzuriteNotRunning()) {return;}

        // Mock the showQuickPick to return our test queue
        const originalShowQuickPick = vscode.window.showQuickPick;
        const mockShowQuickPick = async (items: any[]) => {
            return testQueueName;
        };

        // Mock showInputBox to return undefined (user cancelled)
        const originalShowInputBox = vscode.window.showInputBox;
        const mockShowInputBox = async (options: any) => {
            return undefined;
        };

        try {
            (vscode.window as any).showQuickPick = mockShowQuickPick;
            (vscode.window as any).showInputBox = mockShowInputBox;

            // Should not throw an error
            await addMessageCommand.execute();

        } finally {
            (vscode.window as any).showQuickPick = originalShowQuickPick;
            (vscode.window as any).showInputBox = originalShowInputBox;
        }
    });

    test('should validate empty message text', async () => {
        if (skipIfAzuriteNotRunning()) {return;}

        // Mock the showQuickPick to return our test queue
        const originalShowQuickPick = vscode.window.showQuickPick;
        const mockShowQuickPick = async (items: any[]) => {
            return testQueueName;
        };

        // Mock showInputBox to return empty string
        const originalShowInputBox = vscode.window.showInputBox;
        const mockShowInputBox = async (options: any) => {
            // Test the validation function
            const validationResult = options.validateInput('');
            assert(validationResult === 'Message text cannot be empty', 'Should validate empty message');
            return '';
        };

        try {
            (vscode.window as any).showQuickPick = mockShowQuickPick;
            (vscode.window as any).showInputBox = mockShowInputBox;

            await addMessageCommand.execute();

        } finally {
            (vscode.window as any).showQuickPick = originalShowQuickPick;
            (vscode.window as any).showInputBox = originalShowInputBox;
        }
    });

    test('should validate message length', async () => {
        if (skipIfAzuriteNotRunning()) {return;}

        // Mock the showQuickPick to return our test queue
        const originalShowQuickPick = vscode.window.showQuickPick;
        const mockShowQuickPick = async (items: any[]) => {
            return testQueueName;
        };

        // Mock showInputBox to test validation
        const originalShowInputBox = vscode.window.showInputBox;
        const mockShowInputBox = async (options: any) => {
            // Test validation with a very long message
            const longMessage = 'A'.repeat(70000); // Longer than 65536 limit
            const validationResult = options.validateInput(longMessage);
            assert(validationResult === 'Message text is too long (max 65536 characters)', 'Should validate message length');
            return longMessage;
        };

        try {
            (vscode.window as any).showQuickPick = mockShowQuickPick;
            (vscode.window as any).showInputBox = mockShowInputBox;

            await addMessageCommand.execute();

        } finally {
            (vscode.window as any).showQuickPick = originalShowQuickPick;
            (vscode.window as any).showInputBox = originalShowInputBox;
        }
    });

    test('should handle errors gracefully', async () => {
        if (skipIfAzuriteNotRunning()) {return;}

        // Create a command with a mock queue provider that throws an error
        const mockQueueProvider = {
            getQueues: async () => { throw new Error('Connection failed'); }
        } as any;

        const errorCommand = new AddMessageCommand(mockQueueProvider);

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

            assert(capturedErrorMessage.includes('Error adding message'), 'Should show error message');
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

        const noQueuesCommand = new AddMessageCommand(mockQueueProvider);

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
});
