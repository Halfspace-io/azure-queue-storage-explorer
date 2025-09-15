import * as vscode from 'vscode';

export class AzuriteHealthCheck {
    private static readonly AZURITE_QUEUE_ENDPOINT = 'http://127.0.0.1:10001';
    private static readonly HEALTH_CHECK_TIMEOUT = 2000; // 2 seconds timeout

    /**
     * Checks if Azurite is running by attempting to connect to the queue service endpoint
     * @returns Promise<boolean> - true if Azurite is running, false otherwise
     */
    static async isAzuriteRunning(): Promise<boolean> {
        try {
            // Create a promise that resolves when the fetch completes or rejects on timeout
            const healthCheckPromise = fetch(`${this.AZURITE_QUEUE_ENDPOINT}/devstoreaccount1`, {
                method: 'GET',
                headers: {
                    'x-ms-version': '2020-04-08'
                }
            });

            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Timeout')), this.HEALTH_CHECK_TIMEOUT);
            });

            await Promise.race([healthCheckPromise, timeoutPromise]);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Shows a helpful error message when Azurite is not running
     */
    static showAzuriteNotRunningMessage(): void {
        vscode.window.showErrorMessage('Azurite is not running. Please start Azurite to use this extension.');
    }

    /**
     * Wraps an async operation with Azurite health check
     * @param operation - The operation to execute if Azurite is running
     * @param errorMessage - Custom error message to show if Azurite is not running
     */
    static async withHealthCheck<T>(
        operation: () => Promise<T>,
        errorMessage?: string
    ): Promise<T> {
        const isRunning = await this.isAzuriteRunning();
        
        if (!isRunning) {
            if (errorMessage) {
                vscode.window.showErrorMessage(errorMessage);
            } else {
                this.showAzuriteNotRunningMessage();
            }
            throw new Error('Azurite is not running');
        }

        return operation();
    }
}
