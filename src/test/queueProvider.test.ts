import assert from 'assert';
import { QueueProvider } from '../queueProvider';

suite('QueueProvider Tests', () => {
    let queueProvider: QueueProvider;
    const testQueueName = 'test-queue-' + Date.now(); // Unique queue name for each test run
    suiteSetup(async () => {
        queueProvider = new QueueProvider();
        // Ensure the test queue exists
        await queueProvider.setQueue(testQueueName);
    });

    suiteTeardown(async () => {
        // Clean up: delete the test queue
        try {
            const queueClient = (queueProvider as any).queueServiceClient.getQueueClient(testQueueName);
            await queueClient.delete();
        } catch (error) {
            // Ignore cleanup errors
            console.log('Cleanup error (ignored):', error);
        }
    });


    test('should create queue if it does not exist', async () => {

        const newQueueName = 'new-test-queue-' + Date.now();
        await queueProvider.setQueue(newQueueName);
        
        // Verify queue exists by trying to list messages (should not throw)
        const messages = await queueProvider.listMessages();
        assert(Array.isArray(messages), 'Should return an array of messages');
        
        // Clean up
        const queueClient = (queueProvider as any).queueServiceClient.getQueueClient(newQueueName);
        await queueClient.delete();
    });

    test('should list messages from empty queue', async () => {

        const emptyQueueName = 'empty-test-queue-' + Date.now();
        await queueProvider.setQueue(emptyQueueName);
        
        const messages = await queueProvider.listMessages();
        assert(Array.isArray(messages), 'Should return an array');
        assert.strictEqual(messages.length, 0, 'Empty queue should return empty array');
        
        // Clean up
        const queueClient = (queueProvider as any).queueServiceClient.getQueueClient(emptyQueueName);
        await queueClient.delete();
    });

    test('should add and list messages', async () => {

        const messageQueueName = 'message-test-queue-' + Date.now();
        await queueProvider.setQueue(messageQueueName);
        
        const testMessage = 'Test message ' + Date.now();
        
        // Add a message
        await queueProvider.addMessage(testMessage);
        
        // List messages
        const messages = await queueProvider.listMessages();
        
        assert(Array.isArray(messages), 'Should return an array');
        assert(messages.length > 0, 'Should have at least one message');
        
        const addedMessage = messages.find(msg => msg.messageText === testMessage);
        assert(addedMessage, 'Should find the added message');
        assert.strictEqual(addedMessage.messageText, testMessage, 'Message text should match');
        assert(addedMessage.messageId, 'Message should have an ID');
        assert(addedMessage.dequeueCount >= 0, 'Message should have dequeue count');
        
        // Clean up
        const queueClient = (queueProvider as any).queueServiceClient.getQueueClient(messageQueueName);
        await queueClient.delete();
    });

    test('should add multiple messages and list them', async () => {

        const multiQueueName = 'multi-test-queue-' + Date.now();
        await queueProvider.setQueue(multiQueueName);
        
        const messages = [
            'First test message ' + Date.now(),
            'Second test message ' + Date.now(),
            'Third test message ' + Date.now()
        ];
        
        // Add multiple messages
        for (const message of messages) {
            await queueProvider.addMessage(message);
        }
        
        // List messages
        const retrievedMessages = await queueProvider.listMessages();
        
        assert(Array.isArray(retrievedMessages), 'Should return an array');
        assert(retrievedMessages.length >= messages.length, 'Should have at least the added messages');
        
        // Verify all messages are present
        for (const message of messages) {
            const foundMessage = retrievedMessages.find(msg => msg.messageText === message);
            assert(foundMessage, `Should find message: ${message}`);
        }
        
        // Clean up
        const queueClient = (queueProvider as any).queueServiceClient.getQueueClient(multiQueueName);
        await queueClient.delete();
    });

    test('should not dequeue messages when listing (peek only)', async () => {

        const peekQueueName = 'peek-test-queue-' + Date.now();
        await queueProvider.setQueue(peekQueueName);
        
        const testMessage = 'Peek test message ' + Date.now();
        
        // Add a message
        await queueProvider.addMessage(testMessage);
        
        // List messages first time
        const firstList = await queueProvider.listMessages();
        assert(Array.isArray(firstList), 'Should return an array');
        assert(firstList.length > 0, 'Should have at least one message');
        
        const firstMessage = firstList.find(msg => msg.messageText === testMessage);
        assert(firstMessage, 'Should find the added message in first list');
        
        // List messages second time - should still be there (not dequeued)
        const secondList = await queueProvider.listMessages();
        assert(Array.isArray(secondList), 'Should return an array');
        assert(secondList.length > 0, 'Should still have messages after second list');
        
        const secondMessage = secondList.find(msg => msg.messageText === testMessage);
        assert(secondMessage, 'Should find the same message in second list');
        
        // Verify the message IDs are the same (same message, not a copy)
        assert.strictEqual(firstMessage.messageId, secondMessage.messageId, 'Should be the same message ID');
        assert.strictEqual(firstMessage.messageText, secondMessage.messageText, 'Should be the same message text');
        
        // Clean up
        const queueClient = (queueProvider as any).queueServiceClient.getQueueClient(peekQueueName);
        await queueClient.delete();
    });

    test('should handle empty message text', async () => {

        try {
            await queueProvider.addMessage('');
            assert.fail('Should throw error for empty message');
        } catch (error) {
            assert(error instanceof Error, 'Should throw an error');
        }
    });

    test('should handle very long message', async () => {

        const longQueueName = 'long-test-queue-' + Date.now();
        await queueProvider.setQueue(longQueueName);
        
        const longMessage = 'A'.repeat(1000); // 1000 character message
        
        await queueProvider.addMessage(longMessage);
        
        const messages = await queueProvider.listMessages();
        const foundMessage = messages.find(msg => msg.messageText === longMessage);
        assert(foundMessage, 'Should find the long message');
        
        // Clean up
        const queueClient = (queueProvider as any).queueServiceClient.getQueueClient(longQueueName);
        await queueClient.delete();
    });

    test('should get list of queues', async () => {

        const queues = await queueProvider.getQueues();
        
        assert(Array.isArray(queues), 'Should return an array of queue names');
        assert(queues.includes(testQueueName), 'Should include our test queue');
    });

    test('should throw error when no queue is selected', async () => {

        const newProvider = new QueueProvider();
        
        try {
            await newProvider.listMessages();
            assert.fail('Should throw error when no queue is selected');
        } catch (error) {
            assert(error instanceof Error, 'Should throw an error');
            assert((error as Error).message.includes('No queue selected'), 'Error message should mention no queue selected');
        }
    });

    test('should throw error when adding message without queue selected', async () => {

        const newProvider = new QueueProvider();
        
        try {
            await newProvider.addMessage('test message');
            assert.fail('Should throw error when no queue is selected');
        } catch (error) {
            assert(error instanceof Error, 'Should throw an error');
            assert((error as Error).message.includes('No queue selected'), 'Error message should mention no queue selected');
        }
    });
});
