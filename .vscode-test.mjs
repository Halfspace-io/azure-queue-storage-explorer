import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
	files: 'out/test/**/*.test.js',
	launchArgs: ['--disable-gpu', '--no-sandbox', '--disable-setuid-sandbox'],
	extensionDevelopmentPath: '.',
	extensionTestsPath: 'out/test',
	version: '1.104.0',
	platform: process.platform === 'win32' ? 'win32' : 'linux',
	arch: process.arch === 'x64' ? 'x64' : 'ia32'
});
