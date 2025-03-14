// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
import {registerCommands} from "./commands.js"

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
// noinspection JSUnusedGlobalSymbols
export function activate(context: vscode.ExtensionContext) {
    registerCommands(context)
}

// This method is called when your extension is deactivated
// noinspection JSUnusedGlobalSymbols
export function deactivate() {

}
