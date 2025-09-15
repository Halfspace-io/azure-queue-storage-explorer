import assert from 'assert';
import * as vscode from 'vscode';
import { RemoveQueueCommand } from '../removeQueueCommand';
import { QueueProvider } from '../queueProvider';
import { AzuriteHealthCheck } from '../azuriteHealthCheck';

suite('RemoveQueueCommand Tests', () => {
    let queueProvider: QueueProvider;
    let removeQueueCommand: RemoveQueueCommand;
    let testQueueName: string;
    let azuriteRunning = false;

    suiteSetup(async () => {
        // Check if Azurite is running before running tests
        azuriteRunning = await AzuriteHealthCheck.isAzuriteRunning();
        
        if (!azuriteRunning) {
            console.log('Skipping RemoveQueueCommand tests - Azurite is not running');
            return;
        }

        queueProvider = new QueueProvider();
        removeQueueCommand = new RemoveQueueCommand(queueProvider);
        testQueueName = 'test-remove-queue-' + Date.now();
        
        // Create a test queue
        await queueProvider.setQueue(testQueueName);
    });

    suiteTeardown(async () => {
        if (!azuriteRunning) {
            return;
        }

        // Clean up: try to delete the test queue if it still exists
        try {
            await queueProvider.deleteQueue(testQueueName);
        } catch (error) {
            // Ignore cleanup errors (queue might already be deleted)
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

    test('should remove queue successfully', async () => {
        if (skipIfAzuriteNotRunning()) {return;}

        // Verify queue exists before deletion
        const queuesBefore = await queueProvider.getQueues();
        assert(queuesBefore.includes(testQueueName), 'Test queue should exist before deletion');

        // Mock the showQuickPick to return our test queue
        const originalShowQuickPick = vscode.window.showQuickPick;
        const mockShowQuickPick = async (items: any[]) => {
            return testQueueName;
        };

        // Mock showWarningMessage to return confirmation
        const originalShowWarningMessage = vscode.window.showWarningMessage;
        const mockShowWarningMessage = async (message: string, options: any) => {
            return 'Yes, Delete Queue';
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

            await removeQueueCommand.execute();

            // Verify success message
            assert(capturedMessage.includes('Queue deleted'), 'Should show success message');
            assert(capturedMessage.includes(testQueueName), 'Should include queue name in success message');

            // Verify queue was actually deleted
            const queuesAfter = await queueProvider.getQueues();
            assert(!queuesAfter.includes(testQueueName), 'Queue should be deleted from the list');

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
            await removeQueueCommand.execute();

        } finally {
            (vscode.window as any).showQuickPick = originalShowQuickPick;
        }
    });

    test('should handle user cancellation of confirmation', async () => {
        if (skipIfAzuriteNotRunning()) {return;}

        // Create a new test queue for this test
        const testQueueForCancellation = 'test-cancellation-queue-' + Date.now();
        await queueProvider.setQueue(testQueueForCancellation);

        // Mock the showQuickPick to return our test queue
        const originalShowQuickPick = vscode.window.showQuickPick;
        const mockShowQuickPick = async (items: any[]) => {
            return testQueueForCancellation;
        };

        // Mock showWarningMessage to return undefined (user cancelled)
        const originalShowWarningMessage = vscode.window.showWarningMessage;
        const mockShowWarningMessage = async (message: string, options: any) => {
            return undefined;
        };

        try {
            (vscode.window as any).showQuickPick = mockShowQuickPick;
            (vscode.window as any).showWarningMessage = mockShowWarningMessage;

            await removeQueueCommand.execute();

            // Verify queue still exists (not deleted)
            const queues = await queueProvider.getQueues();
            assert(queues.includes(testQueueForCancellation), 'Queue should still exist after cancellation');

            // Clean up the test queue
            await queueProvider.deleteQueue(testQueueForCancellation);

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

        const errorCommand = new RemoveQueueCommand(mockQueueProvider);

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

            assert(capturedErrorMessage.includes('Error deleting queue'), 'Should show error message');
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

        const noQueuesCommand = new RemoveQueueCommand(mockQueueProvider);

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

    test('should handle deletion of non-existent queue gracefully', async () => {
        if (skipIfAzuriteNotRunning()) {return;}

        const nonExistentQueue = 'non-existent-queue-' + Date.now();

        // Mock the showQuickPick to return our non-existent queue
        const originalShowQuickPick = vscode.window.showQuickPick;
        const mockShowQuickPick = async (items: any[]) => {
            return nonExistentQueue;
        };

        // Mock showWarningMessage to return confirmation
        const originalShowWarningMessage = vscode.window.showWarningMessage;
        const mockShowWarningMessage = async (message: string, options: any) => {
            return 'Yes, Delete Queue';
        };

        // Mock showErrorMessage to capture the error message
        let capturedErrorMessage = '';
        const originalShowErrorMessage = vscode.window.showErrorMessage;
        const mockShowErrorMessage = async (message: string) => {
            capturedErrorMessage = message;
            return undefined;
        };

        try {
            (vscode.window as any).showQuickPick = mockShowQuickPick;
            (vscode.window as any).showWarningMessage = mockShowWarningMessage;
            (vscode.window as any).showErrorMessage = mockShowErrorMessage;

            await removeQueueCommand.execute();

            // Should show error message for non-existent queue
            assert(capturedErrorMessage.includes('Error deleting queue'), 'Should show error message for non-existent queue');

        } finally {
            // Restore original functions
            (vscode.window as any).showQuickPick = originalShowQuickPick;
            (vscode.window as any).showWarningMessage = originalShowWarningMessage;
            (vscode.window as any).showErrorMessage = originalShowErrorMessage;
        }
    });
});
