import {PatternDefine, PatternManager} from "../compile/PatternLoader"
import vscode, {TextDocument} from "vscode"
import {PegDefineFunction, PegDefineIota, peggyParse, PegTopLevel} from "../compile/peggy/PegTypes"
import {SyntaxError} from "../compile/peggy/HexCasting"

export function patternMarkdown(pattern: PatternDefine) {
    const markdownString = new vscode.MarkdownString()
    markdownString.supportHtml = true
    markdownString.appendMarkdown(`***\`${pattern.id}\`***        ${(pattern.modName ?? pattern.modid ?? '')}  ` + '\n')
    markdownString.appendMarkdown(`**${pattern.args ?? "no args"}**  ` + '\n')
    markdownString.appendMarkdown("***\n")
    if (pattern.description) {
        markdownString.appendMarkdown(`${pattern.description}  ` + '\n')
        markdownString.appendMarkdown("***\n")
    }
    const svg = pattern.svg(200)
    if (svg)
        markdownString.appendMarkdown(`<img src="data:image/svg+xml;base64,${btoa(svg)}" alt="icon">`)
    else markdownString.appendMarkdown("\n\n\n\n\n\n*No Pattern Icon*")
    return markdownString
}

const cachePatternManager = {
    // input
    lastUpdated: Date.now(),
    usedToml: new Array<string>(),
    // result
    patterns: new PatternManager(),
}

export function parseAST(text: TextDocument, beforeLine?: number)
    : { ast: PegTopLevel[], endLine: number, error?: SyntaxError } {
    let line = beforeLine ?? text.lineCount
    const lines = text.getText().split("\n")
    let error:SyntaxError|undefined = undefined
    while (line >= 0) {
        try {
            const ast = peggyParse(lines.slice(0, line).join("\n"))
            return {ast, endLine: line, error}
        } catch (e) {
            if (!error) error = e as SyntaxError
            line--
        }
    }
    return {ast: [], endLine: line, error}
}

export async function collectPatterns(ast: PegTopLevel[], rootDir: vscode.Uri)
    : Promise<PatternManager> {
    const patterns = new PatternManager()
    const usedToml: string[] = ast
        .filter((topLevel) => topLevel.type === 'use_pattern')
        .map((usePattern) => usePattern.filePath)

    if (Date.now() - cachePatternManager.lastUpdated < 1000 * 60) {
        if (usedToml.length === cachePatternManager.usedToml.length) {
            if (usedToml.every((filePath, index) => filePath === cachePatternManager.usedToml[index])) {
                return cachePatternManager.patterns
            }
        }
    }

    await Promise.all(
        usedToml.map(async (filePath) => {
            const usedUri = vscode.Uri.joinPath(rootDir, filePath)
            if (!await checkFileExists(usedUri)) {
                vscode.window.showErrorMessage(`File '${usedUri.path}' not found`)
                return
            }
            const usedContent = (await vscode.workspace.openTextDocument(usedUri)).getText()
            patterns.loadFromFile(usedContent)
        }),
    )

    cachePatternManager.lastUpdated = Date.now()
    cachePatternManager.usedToml = usedToml
    cachePatternManager.patterns = patterns

    return patterns
}

export function collectSymbols(ast: PegTopLevel[])
    : (PegDefineFunction | PegDefineIota)[] {
    return ast
        .filter(topLevel => topLevel.type === 'define_func' || topLevel.type === 'define_iota')
}

export async function checkFileExists(uri: vscode.Uri): Promise<boolean> {
    try {
        await vscode.workspace.fs.stat(uri);
        return true; // 文件存在
    } catch (error) {
        // 文件不存在或其他错误
        return false;
    }
}