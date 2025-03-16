import vscode, {
    CancellationToken,
    CompletionContext,
    CompletionItem,
    Position,
    ProviderResult,
    Range,
    TextDocument,
} from "vscode"
import {PatternDefine} from "../compile/PatternLoader"
import lodash from "lodash"
import Fuse from "fuse.js"
import {PegDefineFunction, PegDefineIota} from "../compile/peggy/PegTypes"
import {collectPatterns, collectSymbols, parseAST, patternMarkdown} from "./util"

export class CompletionProvider implements vscode.CompletionItemProvider {
    provideCompletionItems(
        document: TextDocument,
        position: Position,
        token: CancellationToken,
        context: CompletionContext,
    ): ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
        return this._provideCompletionItems(document, position, token, context)
    }

    async _provideCompletionItems(
        document: TextDocument,
        position: Position,
        token: CancellationToken,
        context: CompletionContext,
    ): Promise<CompletionItem[]> {
        const rootDir = vscode.workspace.getWorkspaceFolder(document.uri)!.uri
        const patterns = await collectPatterns(parseAST(document).ast, rootDir)
        const symbols = collectSymbols(parseAST(document, position.line).ast)

        const currentLine = document.lineAt(position.line).text.slice(0, position.character)
        const currentLineRemaining = document.lineAt(position.line).text.slice(position.character)
        let range: Range | null = null
        let searches: CompletionData[] = []
        let uncompleted = ""


        const idRefRE = /(?:\$|&\$)\b([a-zA-Z0-9_/]*)$/
        const pushRE = /&\b([a-zA-Z0-9_/]*)$/
        const anyCharRE = /\b([a-zA-Z0-9_/]*)$/
        if (idRefRE.test(currentLine)) {
            uncompleted = currentLine.match(idRefRE)![1]
            range = new Range(position.translate(0, -uncompleted.length), position)
            searches = lodash.concat(searches, symbols.map(fromSymbol))
        } else if (pushRE.test(currentLine)) {
            uncompleted = currentLine.match(pushRE)![1]
            range = new Range(position.translate(0, -uncompleted.length), position)
            searches = lodash.concat(searches, patterns.getAll().map(fromPatternDefine))
        } else if (anyCharRE.test(currentLine)) {
            uncompleted = currentLine.match(anyCharRE)![1]
            range = new Range(position.translate(0, -uncompleted.length), position)
            searches = lodash.concat(searches, buildInKeywords)
            searches = lodash.concat(searches, patterns.getAll().map(fromPatternDefine))
        }

        if (range === null) return []

        const remainingRE = /^([a-zA-Z0-9_/]*)/
        if (remainingRE.test(currentLineRemaining)) {
            const remaining = currentLineRemaining.match(remainingRE)![1]
            range = new Range(range.start, position.translate(0, remaining.length))
        }
        searches.forEach(data => data.completionItem.range = range)
        searches.forEach(data => data.detail = data.detail ?? "")

        const fuse = new Fuse(
            searches,
            {
                keys: [
                    {
                        name: "label",
                        weight: 0.6,
                    },
                    {
                        name: "detail",
                        weight: 0.5,
                    },
                ],
                threshold: 0.8,
            },
        )
        return fuse.search(uncompleted).map(result => result.item.completionItem)
    }
}

interface CompletionData {
    label: string
    detail?: string
    completionItem: CompletionItem
}

function fromPatternDefine(pattern: PatternDefine): CompletionData {
    const completionItem = new vscode.CompletionItem(pattern.id, vscode.CompletionItemKind.Variable)
    completionItem.detail = pattern.name
    completionItem.documentation = patternMarkdown(pattern)

    return {
        label: pattern.id,
        detail: pattern.name,
        completionItem: completionItem,
    }
}

function fromSymbol(symbol: PegDefineFunction | PegDefineIota): CompletionData {
    const completionItem = new vscode.CompletionItem(symbol.id.data, vscode.CompletionItemKind.Function)
    return {
        label: symbol.id.data,
        completionItem: completionItem,
    }
}

const buildInKeywords: CompletionData[] = [
    {
        label: "true",
        completionItem: new vscode.CompletionItem("true", vscode.CompletionItemKind.Constant),
    },
    {
        label: "false",
        completionItem: new vscode.CompletionItem("false", vscode.CompletionItemKind.Constant),
    },
    {
        label: "null",
        completionItem: new vscode.CompletionItem("null", vscode.CompletionItemKind.Constant),
    },
    {
        label: "garbage",
        completionItem: new vscode.CompletionItem("garbage", vscode.CompletionItemKind.Constant),
    },
    {
        label: "vec<",
        detail: "vec<?,?,?>",
        completionItem: (() => {
            const completionItem = new vscode.CompletionItem("vec", vscode.CompletionItemKind.Constant)
            completionItem.detail = "vec<?,?,?>"
            completionItem.insertText = new vscode.SnippetString("vec<${1:.0}, ${2:.0}, ${3:.0}>")
            return completionItem
        })(),
    },
    {
        label: "iota",
        completionItem: (() => {
            const completionItem = new vscode.CompletionItem("iota", vscode.CompletionItemKind.Keyword)
            completionItem.insertText = new vscode.SnippetString("iota ${1:name} = ${2:garbage}")
            return completionItem
        })(),
    },
    {
        label: "function",
        completionItem: (() => {
            const completionItem = new vscode.CompletionItem("func", vscode.CompletionItemKind.Keyword)
            completionItem.insertText = new vscode.SnippetString("func ${1:name} {\n    $2\n}")
            return completionItem
        })(),
    },

]