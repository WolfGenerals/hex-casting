import vscode from "vscode"
import {collectPatterns, collectSymbols, parseAST, patternMarkdown} from "./util"
import {PatternIota} from "../compile/Iota"

export class HoverProvider implements vscode.HoverProvider {

    provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover> {
        return this._provideHover(document, position, token)
    }

    async _provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
    ): Promise<vscode.Hover> {
        const rootDir = vscode.workspace.getWorkspaceFolder(document.uri)!.uri
        const patterns = await collectPatterns(parseAST(document).ast, rootDir)
        const symbols = collectSymbols(parseAST(document).ast)

        const currentLine = document.lineAt(position.line).text.slice(0, position.character)
        const currentLineRemaining = document.lineAt(position.line).text.slice(position.character)

        const ignoreRE =[
            /vec<[^>]*$/,
            /<[^>]*$/,
            /#.*$/,
            /[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/
        ]
        if (ignoreRE.some((re) => re.test(currentLine)))
            return new vscode.Hover([])

        const remainingRE = /^([^\s}\],]*)/

        const idRefRE = /(?:\$|&\$)\b([a-zA-Z0-9_/]*)$/
        if (idRefRE.test(currentLine)) {
            const before = currentLine.match(idRefRE)![1]
            const after = currentLineRemaining.match(remainingRE)![1]
            const id = before + after

            const find = symbols.find((symbol) => symbol.id.data === id)
            return find ?
                new vscode.Hover(`${find.type === "define_func" ? "Function" : "Iota"} ${find.id.data}`)
                : new vscode.Hover([])
        }
        const rawPatternRefRE = /`([wedsaq]*)$/
        if (rawPatternRefRE.test(currentLine)) {
            const before = currentLine.match(rawPatternRefRE)![1]
            const after = currentLineRemaining.match(/^([wedsaq]*)`/)![1]
            const id = before + after

            const pattern = PatternIota.fromAngles(id)
            const mdString = new vscode.MarkdownString()
            mdString.supportHtml = true
            mdString.appendMarkdown(`<img src="data:image/svg+xml;base64,${btoa(pattern.svg(150))}" alt="icon">`)
            return new vscode.Hover(mdString)
        }
        const patternRefRE = /&?(?<!$)\b([a-zA-Z0-9_/]*)$/
        if (patternRefRE.test(currentLine)) {
            const before = currentLine.match(patternRefRE)![1]
            const after = currentLineRemaining.match(remainingRE)![1]

            const id = before + after
            const pattern = patterns.get(id)
            return new vscode.Hover(pattern ? patternMarkdown(pattern) : [])
        }


        return new vscode.Hover([])
    }
}