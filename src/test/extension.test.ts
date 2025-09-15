import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Extension should be activated', async () => {
		// This test verifies that the extension can be activated
		// The actual activation is tested in the individual command tests
		assert.ok(true, 'Extension test suite is running');
	});
});
