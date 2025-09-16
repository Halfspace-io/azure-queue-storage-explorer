import * as assert from 'assert';
import { AzuriteHealthCheck } from '../azuriteHealthCheck';

suite('AzuriteHealthCheck Tests', () => {
    test('isAzuriteRunning should return true when Azurite is running', async () => {
        const isRunning = await AzuriteHealthCheck.isAzuriteRunning();
        assert.strictEqual(isRunning, true, 'Azurite should be detected as running');
    });

    test('withHealthCheck should execute operation when Azurite is running', async () => {
        const testOperation = async () => {
            return 'test result';
        };

        const result = await AzuriteHealthCheck.withHealthCheck(testOperation);
        assert.strictEqual(result, 'test result', 'Operation should execute successfully when Azurite is running');
    });
});
