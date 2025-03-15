import * as vscode from "vscode"
import {CompletionProvider} from "./CompletionProvider"
import {HoverProvider} from "./HoverProvider"
import {checkFile} from "./DiagnosticCollection"
import {updateDecorations} from "./Decoration"

export function registerLanguage(ctx: vscode.ExtensionContext) {
    const completionItemProvider = vscode.languages.registerCompletionItemProvider("hexcasting", new CompletionProvider())
    ctx.subscriptions.push(completionItemProvider)

    const hoverProvider = vscode.languages.registerHoverProvider("hexcasting", new HoverProvider())
    ctx.subscriptions.push(hoverProvider)

    const diagnosticCollection = vscode.languages.createDiagnosticCollection("hexcasting")
    vscode.workspace.onDidChangeTextDocument(async e => {
        if (e.document.languageId !== "hexcasting") return
        diagnosticCollection.set(e.document.uri, await checkFile(e.document))
    }, null)

    vscode.workspace.onDidOpenTextDocument(async document => {
        if (document.languageId !== "hexcasting") return
        const editor = vscode.window.activeTextEditor
        if (editor && editor.document === document)
            await updateDecorations(document, editor)
    }, null)
    vscode.workspace.onDidChangeTextDocument(async e => {
        if (e.document.languageId !== "hexcasting") return
        const editor = vscode.window.activeTextEditor
        if (editor && editor.document === e.document)
            await updateDecorations(e.document, editor)
    })
}

