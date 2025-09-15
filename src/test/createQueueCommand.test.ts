import assert from 'assert';
import * as vscode from 'vscode';
import { CreateQueueCommand } from '../createQueueCommand';
import { QueueProvider } from '../queueProvider';
import { AzuriteHealthCheck } from '../azuriteHealthCheck';
import { QueueTreeDataProvider } from '../queueTreeDataProvider';

suite('CreateQueueCommand Tests', () => {
    let queueProvider: QueueProvider;
    let createQueueCommand: CreateQueueCommand;
    let azuriteRunning = false;

    suiteSetup(async () => {
        // Check if Azurite is running before running tests
        azuriteRunning = await AzuriteHealthCheck.isAzuriteRunning();
        
        if (!azuriteRunning) {
            console.log('Skipping CreateQueueCommand tests - Azurite is not running');
            return;
        }

        queueProvider = new QueueProvider();
        const treeDataProvider = new QueueTreeDataProvider(queueProvider);
        createQueueCommand = new CreateQueueCommand(queueProvider, treeDataProvider);
    });

    // Helper function to skip tests when Azurite is not running
    function skipIfAzuriteNotRunning() {
        if (!azuriteRunning) {
            console.log('Skipping test - Azurite is not running');
            return true;
        }
        return false;
    }

    test('should create queue successfully', async () => {
        if (skipIfAzuriteNotRunning()) {return;}

        const testQueueName = 'test-create-queue-' + Date.now();
        
        // Mock showInputBox to return our test queue name
        const originalShowInputBox = vscode.window.showInputBox;
        const mockShowInputBox = async (options: any) => {
            return testQueueName;
        };

        // Mock showInformationMessage to capture the success message
        let capturedMessage = '';
        const originalShowInformationMessage = vscode.window.showInformationMessage;
        const mockShowInformationMessage = async (message: string) => {
            capturedMessage = message;
            return undefined;
        };

        try {
            (vscode.window as any).showInputBox = mockShowInputBox;
            (vscode.window as any).showInformationMessage = mockShowInformationMessage;

            await createQueueCommand.execute();

            // Verify success message
            assert(capturedMessage.includes('created successfully'), 'Should show success message');
            assert(capturedMessage.includes(testQueueName), 'Should include queue name in success message');

            // Verify queue was actually created
            const queues = await queueProvider.getQueues();
            assert(queues.includes(testQueueName), 'Queue should be in the list of queues');

        } finally {
            // Restore original functions
            (vscode.window as any).showInputBox = originalShowInputBox;
            (vscode.window as any).showInformationMessage = originalShowInformationMessage;
            
            // Clean up
            const queueClient = (queueProvider as any).queueServiceClient.getQueueClient(testQueueName);
            await queueClient.delete();
        }
    });

    test('should handle no queue name input gracefully', async () => {
        if (skipIfAzuriteNotRunning()) {return;}

        // Mock showInputBox to return undefined (user cancelled)
        const originalShowInputBox = vscode.window.showInputBox;
        const mockShowInputBox = async (options: any) => {
            return undefined;
        };

        try {
            (vscode.window as any).showInputBox = mockShowInputBox;

            // Should not throw an error
            await createQueueCommand.execute();

        } finally {
            (vscode.window as any).showInputBox = originalShowInputBox;
        }
    });

    test('should validate empty queue name', async () => {
        if (skipIfAzuriteNotRunning()) {return;}

        // Mock showInputBox to test validation
        const originalShowInputBox = vscode.window.showInputBox;
        const mockShowInputBox = async (options: any) => {
            // Test validation with empty string
            const validationResult = options.validateInput('');
            assert(validationResult === 'Queue name cannot be empty', 'Should validate empty queue name');
            return '';
        };

        try {
            (vscode.window as any).showInputBox = mockShowInputBox;

            await createQueueCommand.execute();

        } finally {
            (vscode.window as any).showInputBox = originalShowInputBox;
        }
    });

    test('should validate queue name length', async () => {
        if (skipIfAzuriteNotRunning()) {return;}

        // Mock showInputBox to test validation
        const originalShowInputBox = vscode.window.showInputBox;
        const mockShowInputBox = async (options: any) => {
            // Test validation with too short name
            const shortName = 'ab';
            const shortValidation = options.validateInput(shortName);
            assert(shortValidation === 'Queue name must be at least 3 characters long', 'Should validate minimum length');
            
            // Test validation with too long name
            const longName = 'a'.repeat(64);
            const longValidation = options.validateInput(longName);
            assert(longValidation === 'Queue name must be no more than 63 characters long', 'Should validate maximum length');
            
            return shortName;
        };

        try {
            (vscode.window as any).showInputBox = mockShowInputBox;

            await createQueueCommand.execute();

        } finally {
            (vscode.window as any).showInputBox = originalShowInputBox;
        }
    });

    test('should validate queue name format', async () => {
        if (skipIfAzuriteNotRunning()) {return;}

        // Mock showInputBox to test validation
        const originalShowInputBox = vscode.window.showInputBox;
        const mockShowInputBox = async (options: any) => {
            // Test validation with invalid characters
            const invalidName = 'test_queue!';
            const invalidValidation = options.validateInput(invalidName);
            assert(invalidValidation === 'Queue name can only contain letters, numbers, and hyphens', 'Should validate character restrictions');
            
            // Test validation with consecutive hyphens
            const consecutiveHyphens = 'test--queue';
            const hyphenValidation = options.validateInput(consecutiveHyphens);
            assert(hyphenValidation === 'Queue name cannot contain consecutive hyphens', 'Should validate consecutive hyphens');
            
            // Test validation with invalid start character
            const invalidStart = '-test-queue';
            const startValidation = options.validateInput(invalidStart);
            assert(startValidation === 'Queue name must start with a letter or number', 'Should validate start character');
            
            // Test validation with invalid end character
            const invalidEnd = 'test-queue-';
            const endValidation = options.validateInput(invalidEnd);
            assert(endValidation === 'Queue name must end with a letter or number', 'Should validate end character');
            
            return invalidName;
        };

        try {
            (vscode.window as any).showInputBox = mockShowInputBox;

            await createQueueCommand.execute();

        } finally {
            (vscode.window as any).showInputBox = originalShowInputBox;
        }
    });

    test('should handle existing queue gracefully', async () => {
        if (skipIfAzuriteNotRunning()) {return;}

        const existingQueueName = 'existing-test-queue-' + Date.now();
        
        // Create a queue first
        await queueProvider.setQueue(existingQueueName);
        
        // Mock showInputBox to return the existing queue name
        const originalShowInputBox = vscode.window.showInputBox;
        const mockShowInputBox = async (options: any) => {
            return existingQueueName;
        };

        // Mock showWarningMessage to capture the warning
        let capturedWarning = '';
        const originalShowWarningMessage = vscode.window.showWarningMessage;
        const mockShowWarningMessage = async (message: string) => {
            capturedWarning = message;
            return undefined;
        };

        try {
            (vscode.window as any).showInputBox = mockShowInputBox;
            (vscode.window as any).showWarningMessage = mockShowWarningMessage;

            await createQueueCommand.execute();

            // Verify warning message
            assert(capturedWarning.includes('already exists'), 'Should show warning for existing queue');
            assert(capturedWarning.includes(existingQueueName), 'Should include queue name in warning');

        } finally {
            (vscode.window as any).showInputBox = originalShowInputBox;
            (vscode.window as any).showWarningMessage = originalShowWarningMessage;
            
            // Clean up
            const queueClient = (queueProvider as any).queueServiceClient.getQueueClient(existingQueueName);
            await queueClient.delete();
        }
    });

    test('should handle errors gracefully', async () => {
        if (skipIfAzuriteNotRunning()) {return;}

        // Create a command with a mock queue provider that throws an error
        const mockQueueProvider = {
            getQueues: async () => { throw new Error('Connection failed'); }
        } as any;

        const mockTreeDataProvider = { refresh: () => {} } as any;
        const errorCommand = new CreateQueueCommand(mockQueueProvider, mockTreeDataProvider);

        // Mock showInputBox to return a valid name
        const originalShowInputBox = vscode.window.showInputBox;
        const mockShowInputBox = async (options: any) => {
            return 'test-queue';
        };

        // Mock showErrorMessage to capture the error message
        let capturedErrorMessage = '';
        const originalShowErrorMessage = vscode.window.showErrorMessage;
        const mockShowErrorMessage = async (message: string) => {
            capturedErrorMessage = message;
            return undefined;
        };

        try {
            (vscode.window as any).showInputBox = mockShowInputBox;
            (vscode.window as any).showErrorMessage = mockShowErrorMessage;

            await errorCommand.execute();

            assert(capturedErrorMessage.includes('Error creating queue'), 'Should show error message');
            assert(capturedErrorMessage.includes('Connection failed'), 'Should include original error');

        } finally {
            (vscode.window as any).showInputBox = originalShowInputBox;
            (vscode.window as any).showErrorMessage = originalShowErrorMessage;
        }
    });
});
