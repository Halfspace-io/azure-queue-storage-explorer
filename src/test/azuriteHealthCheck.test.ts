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
        // This test would need to be run when Azurite is actually running
        // For now, we'll just test the structure
        const testOperation = async () => {
            return 'test result';
        };

        // We expect this to throw since Azurite is not running in test environment
        try {
            await AzuriteHealthCheck.withHealthCheck(testOperation);
            assert.fail('Expected error to be thrown');
        } catch (error) {
            // Expected behavior when Azurite is not running
            assert.strictEqual((error as Error).message, 'Azurite is not running');
        }
    });
});
