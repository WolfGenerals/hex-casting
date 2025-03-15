import vscode, {Diagnostic, Range, TextDocument} from "vscode"
import {checkFileExists, collectPatterns, collectSymbols, parseAST} from "./util"
import {iotaWalk, PegDefineFunction, PegDefineIota, PegIota, PegReference} from "../compile/peggy/PegTypes"

export async function checkFile(document: TextDocument): Promise<Diagnostic[]> {
    const diagnostics: Diagnostic[] = []

    const rootDir = vscode.workspace.getWorkspaceFolder(document.uri)!.uri
    const {ast,error} = parseAST(document)
    const patterns = await collectPatterns(ast, rootDir)
    const symbols = collectSymbols(ast)

    if (error){
        diagnostics.push(new vscode.Diagnostic(
            new Range(
                document.positionAt(error.location.start.offset),
                document.positionAt(error.location.end.offset),
            ),
            error.message,
            vscode.DiagnosticSeverity.Error,
        ))
    }


    // 检查use是否存在
    const uses = ast.filter(item => item.type === "use_pattern")
    for (const use of uses) {
        const uri = vscode.Uri.joinPath(rootDir, use.filePath)
        if (await checkFileExists(uri))
            continue
        diagnostics.push(new vscode.Diagnostic(
            new Range(
                document.positionAt(use.loc.end.offset - use.filePath.length - 2),
                document.positionAt(use.loc.end.offset),
            ),
            `Pattern Database file '${use.filePath}' not found.`,
            vscode.DiagnosticSeverity.Error,
        ))
    }

    // 检查Pattern/ref是否存在
    const declared: (PegDefineFunction | PegDefineIota)[] = []
    const checkIota = (iota:PegIota|PegReference) => {
        if (iota.type === 'ref_id') {
            const id = iota.id.data
            const find = declared.find(item => item.id.data === id)
            if (!find) {
                diagnostics.push(new vscode.Diagnostic(
                    new Range(
                        document.positionAt(iota.loc.start.offset),
                        document.positionAt(iota.loc.end.offset),
                    ),
                    `id '${id}' not found.`,
                ))
            }
        }
        if (iota.type === 'ref_pattern') {
            const id = iota.id.data
            const pattern = patterns.get(id)
            if (!pattern) {
                diagnostics.push(new vscode.Diagnostic(
                    new Range(
                        document.positionAt(iota.loc.start.offset),
                        document.positionAt(iota.loc.end.offset),
                    ),
                    `Pattern '${id}' not found.`,
                    vscode.DiagnosticSeverity.Error,
                ))
                return
            }
            if (!pattern.patternIota) {
                diagnostics.push(new vscode.Diagnostic(
                    new Range(
                        document.positionAt(iota.loc.start.offset),
                        document.positionAt(iota.loc.end.offset),
                    ),
                    `Pattern '${id}' requires a drawing method, you should add '${pattern.id}.pattern' in one of [${uses.map(item => item.filePath).join(', ')}]`,
                ))
            }
        }
    }

    symbols.forEach(def => {
        if (def.type === 'define_func') {
            def.body.statements
                .filter(item => item.type === 'call_statement')
                .map(item => item.data)
                .filter(item => item.type === 'ref_id')
                .forEach(item => {
                    const id = item.id.data
                    const find = declared.find(item => item.id.data === id)
                    if (!find) {
                        diagnostics.push(new vscode.Diagnostic(
                            new Range(
                                document.positionAt(item.loc.start.offset),
                                document.positionAt(item.loc.end.offset),
                            ),
                            `id '${id}' not found.`,
                            vscode.DiagnosticSeverity.Error,
                        ))
                        return
                    }
                    if (find.type === 'define_iota')
                        diagnostics.push(new vscode.Diagnostic(
                            new Range(
                                document.positionAt(item.loc.start.offset),
                                document.positionAt(item.loc.end.offset),
                            ),
                            `Iota '${id}' is called. it will be pushed to stack instead of being executed.`,
                            vscode.DiagnosticSeverity.Warning,
                        ))
                })
            def.body.statements
                .filter(item => item.type === 'call_statement')
                .map(item => item.data)
                .filter(item => item.type === 'ref_pattern')
                .forEach(item => {
                    const id = item.id.data
                    const pattern = patterns.get(id)
                    if (!pattern) {
                        diagnostics.push(new vscode.Diagnostic(
                            new Range(
                                document.positionAt(item.loc.start.offset),
                                document.positionAt(item.loc.end.offset),
                            ),
                            `Pattern '${id}' not found.`,
                            vscode.DiagnosticSeverity.Error,
                        ))
                        return
                    }
                    if (!pattern.patternIota) {
                        diagnostics.push(new vscode.Diagnostic(
                            new Range(
                                document.positionAt(item.loc.start.offset),
                                document.positionAt(item.loc.end.offset),
                            ),
                            `Pattern '${id}' requires a drawing method, you should add '${pattern.id}.pattern' in one of [${uses.map(item => item.filePath).join(', ')}]`,
                            vscode.DiagnosticSeverity.Error,
                        ))
                    }
                })
            def.body.statements
                .filter(item => item.type === 'push_statement')
                .map(item => item.data)
                .forEach(item => {
                    iotaWalk(item, checkIota)
                })
        }
        if (def.type==='define_iota'){
            const value = def.value
            iotaWalk(value, checkIota)
        }
        declared.push(def)
    })

    return diagnostics
}
