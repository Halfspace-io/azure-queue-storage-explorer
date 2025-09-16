import { requireAzurite } from './testHelper';

// Global setup that runs once before all tests
suite('Global Test Setup', () => {
    suiteSetup(async () => {
        console.log('🔍 Checking Azurite availability...');
        await requireAzurite();
        console.log('✅ Azurite is running - all tests can proceed');
    });
});
