import { AzuriteHealthCheck } from '../azuriteHealthCheck';

/**
 * Ensures Azurite is running before running tests.
 * If Azurite is not running, this will throw an error with a helpful message.
 */
export async function requireAzurite(): Promise<void> {
    const isRunning = await AzuriteHealthCheck.isAzuriteRunning();
    if (!isRunning) {
        throw new Error('❌ Azurite is required for running tests but is not running. Please start Azurite before running tests.');
    }
}
