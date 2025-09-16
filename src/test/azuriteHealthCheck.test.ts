import * as assert from 'assert';
import { AzuriteHealthCheck } from '../azuriteHealthCheck';

suite('AzuriteHealthCheck Tests', () => {
    test('isAzuriteRunning should return false when Azurite is not running', async () => {
        // This test assumes Azurite is not running
        // In a real test environment, you might want to mock the fetch call
        const isRunning = await AzuriteHealthCheck.isAzuriteRunning();
        assert.strictEqual(isRunning, false);
    });

    test('withHealthCheck should throw error when Azurite is not running', async () => {
        let errorThrown = false;
        try {
            await AzuriteHealthCheck.withHealthCheck(async () => {
                return 'test result';
            });
        } catch (error) {
            errorThrown = true;
            assert.strictEqual(error instanceof Error, true);
            assert.strictEqual((error as Error).message, 'Azurite is not running');
        }
        assert.strictEqual(errorThrown, true);
    });

    test('withHealthCheck should execute operation when Azurite is running', async () => {
        // Check if Azurite is running
        const isAzuriteRunning = await AzuriteHealthCheck.isAzuriteRunning();
        
        if (!isAzuriteRunning) {
            // Skip this test if Azurite is not running
            console.log('Skipping test - Azurite is not running');
            return;
        }

        const testOperation = async () => {
            return 'test result';
        };

        // This should succeed when Azurite is running
        const result = await AzuriteHealthCheck.withHealthCheck(testOperation);
        assert.strictEqual(result, 'test result', 'Operation should execute successfully when Azurite is running');
    });
});
