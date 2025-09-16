# Azure Queue Storage Explorer - Development Guide

## What's in the folder

* This folder contains all of the files necessary for the Azure Queue Storage Explorer extension.
* `package.json` - this is the manifest file in which the extension and its commands are declared.
  * The extension registers multiple commands for queue management and defines their titles and command names.
  * It also defines the tree view provider for displaying queues in the activity bar.
* `src/extension.ts` - this is the main file where the extension is activated.
  * The file exports the `activate` function, which is called when the extension is activated.
  * It registers the tree data provider and various commands for queue operations.
* `src/` - contains all the source code for the extension including commands, providers, and utilities.

## Get up and running straight away

* Press `F5` to open a new window with your extension loaded.
* Make sure Azurite is running locally (see README.md for setup instructions).
* Open the "Local Azure Queues" panel in the activity bar.
* Try creating a queue and adding messages to test the functionality.
* Set breakpoints in your code to debug the extension.
* Find output from your extension in the debug console.

## Make changes

* You can relaunch the extension from the debug toolbar after changing code in `src/extension.ts`.
* You can also reload (`Ctrl+R` or `Cmd+R` on Mac) the VS Code window with your extension to load your changes.

## Explore the API

* You can open the full set of our API when you open the file `node_modules/@types/vscode/index.d.ts`.

## Run tests

* The project uses Mocha for testing with comprehensive test coverage.
* Tests run both with and without Azurite to ensure compatibility.
* Run tests using: `pnpm test`
* Tests are located in the `src/test/` directory.
* The test suite includes:
  - Azurite health check tests
  - Queue provider tests
  - Command tests for all operations
  - Error handling and edge case tests

## Go further

* [Follow UX guidelines](https://code.visualstudio.com/api/ux-guidelines/overview) to create extensions that seamlessly integrate with VS Code's native interface and patterns.
* Reduce the extension size and improve the startup time by [bundling your extension](https://code.visualstudio.com/api/working-with-extensions/bundling-extension).
* [Publish your extension](https://code.visualstudio.com/api/working-with-extensions/publishing-extension) on the VS Code extension marketplace.
* Automate builds by setting up [Continuous Integration](https://code.visualstudio.com/api/working-with-extensions/continuous-integration).
* Integrate to the [report issue](https://code.visualstudio.com/api/get-started/wrapping-up#issue-reporting) flow to get issue and feature requests reported by users.
