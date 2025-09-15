import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
	files: 'out/test/**/*.test.js',
	launchArgs: ['--disable-gpu', '--no-sandbox', '--disable-setuid-sandbox'],
	extensionDevelopmentPath: '.',
	extensionTestsPath: 'out/test',
	version: '1.104.0'
});
