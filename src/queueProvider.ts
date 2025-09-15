import { QueueServiceClient, QueueClient, StorageSharedKeyCredential } from '@azure/storage-queue';
import { AzuriteHealthCheck } from './azuriteHealthCheck';

export class QueueProvider {
    private queueServiceClient: QueueServiceClient;
    private queueClient: QueueClient | null = null;

    constructor() {
        // Connect to Azurite emulated storage
        // For local development, Azurite accepts any key or even no authentication
        const accountName = 'devstoreaccount1';
        const queueEndpoint = 'http://127.0.0.1:10001';
        
        // Use the default Azurite key for local development
        const credential = new StorageSharedKeyCredential(accountName, 'Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==');
        
        this.queueServiceClient = new QueueServiceClient(
            `${queueEndpoint}/${accountName}`,
            credential
        );
    }

    async setQueue(queueName: string): Promise<void> {
        return AzuriteHealthCheck.withHealthCheck(async () => {
            this.queueClient = this.queueServiceClient.getQueueClient(queueName);
            
            // Ensure the queue exists
            try {
                await this.queueClient.createIfNotExists();
            } catch (error) {
                throw new Error(`Failed to create queue: ${error}`);
            }
        }, 'Azurite is not running');
    }

    async listMessages(): Promise<any[]> {
        if (!this.queueClient) {
            throw new Error('No queue selected. Please select a queue first.');
        }

        return AzuriteHealthCheck.withHealthCheck(async () => {
            try {
                const response = await this.queueClient!.peekMessages({ numberOfMessages: 32 });
                return response.peekedMessageItems.map(item => ({
                    messageId: item.messageId,
                    messageText: item.messageText,
                    insertedOn: item.insertedOn,
                    expiresOn: item.expiresOn,
                    dequeueCount: item.dequeueCount
                }));
            } catch (error) {
                throw new Error(`Failed to list messages: ${error}`);
            }
        }, 'Azurite is not running');
    }

    async addMessage(messageText: string): Promise<void> {
        if (!this.queueClient) {
            throw new Error('No queue selected. Please select a queue first.');
        }

        return AzuriteHealthCheck.withHealthCheck(async () => {
            try {
                await this.queueClient!.sendMessage(messageText);
            } catch (error) {
                throw new Error(`Failed to add message: ${error}`);
            }
        }, 'Azurite is not running');
    }

    async getQueues(): Promise<string[]> {
        return AzuriteHealthCheck.withHealthCheck(async () => {
            try {
                const queues = [];
                for await (const queue of this.queueServiceClient.listQueues()) {
                    queues.push(queue.name);
                }
                return queues;
            } catch (error) {
                throw new Error(`Failed to list queues: ${error}`);
            }
        }, 'Azurite is not running');
    }
}
