import * as vscode from "vscode"
import {logger, resetBuildLogger} from "./logger.js"
import path from "node:path"
import * as fs from 'fs/promises'
import {Compiled, CompileScope} from "../compile/CompileScope"
import {PatternManager} from "../compile/PatternLoader"
import {peggyParse} from "../compile/peggy/PegTypes"


export function registerCommands(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand("hexcasting.build", build))
}

export async function createTargetDirectory(fileUri: vscode.Uri): Promise<vscode.Uri> {
    // 获取工作区文件夹信息
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(fileUri)
    if (!workspaceFolder) {
        throw new Error('文件不属于任何已打开的工作区')
    }

    // 获取项目根目录路径
    const rootPath = workspaceFolder.uri.fsPath

    // 计算文件相对于项目根的路径
    const relativePath = path.relative(rootPath, fileUri.fsPath)
    const parsedPath = path.parse(relativePath)

    // 构建目标目录路径
    const targetDirPath = path.join(
        rootPath,
        'out',
        parsedPath.dir,
        parsedPath.name,  // 移除文件扩展名
    )

    try {
        // 尝试删除已存在的目录（包含子目录和文件）
        await fs.rm(targetDirPath, {recursive: true, force: true})
    } catch (error) {
    }

    // 递归创建目录结构
    await fs.mkdir(targetDirPath, {recursive: true})

    return vscode.Uri.file(targetDirPath)
}

async function build(file?: vscode.Uri) {
    if (!file) {
        vscode.window.showErrorMessage('请选择一个文件')
        return
    }
    const targetDir = await createTargetDirectory(file)
    const rootDir = vscode.workspace.getWorkspaceFolder(file)!.uri
    await resetBuildLogger(vscode.Uri.joinPath(rootDir, './out/build.log').fsPath)

    try {
        logger.info("- init compileScope")
        const compileScope = new CompileScope(
            new PatternManager(),
            new Map(),
        )

        logger.info("- parsing file")
        const fileContent = (await vscode.workspace.openTextDocument(file)).getText()
        const pegTopLevels = peggyParse(fileContent)

        logger.info("- loading pattern database")
        // const loadingUsePattern = pegTopLevels
        //     .filter((topLevel) => topLevel.type === 'use_pattern')
        //     .map(async (usePattern) => {
        //         logger.info(`loading ${usePattern.filePath}`)
        //         const usedUri = vscode.Uri.joinPath(rootDir, usePattern.filePath)
        //         const usedContent = (await vscode.workspace.openTextDocument(usedUri)).getText()
        //         compileScope.patterns.loadFromFile(usedContent)
        //     })
        // await Promise.all(loadingUsePattern)
        for (const use of pegTopLevels.filter((topLevel) => topLevel.type === 'use_pattern')){
            const usedUri = vscode.Uri.joinPath(rootDir, use.filePath)
            const usedContent = (await vscode.workspace.openTextDocument(usedUri)).getText()
            compileScope.patterns.loadFromFile(usedContent)
        }

        logger.info("- compiling")
        const exportList: Compiled[] = []
        for (const topLevel of pegTopLevels) {
            if (topLevel.type === 'use_pattern') {
                continue
            }
            logger.info(`compiling ${topLevel.type} ${topLevel.id.data}`)
            const compiled = compileScope.compileDefine(topLevel)
            compileScope.registerCompiled(compiled)
            exportList.push(compiled)
        }

        for (const compiled of exportList) {
            const uri = vscode.Uri.joinPath(targetDir, compiled.id + '.snbt')
            logger.info(`writing ${uri.fsPath}`)
            vscode.workspace.fs.writeFile(
                uri,
                Buffer.from(compiled.asIota().asNbt().toSNBTValue('compressed')),
            )
        }
    } catch (e) {
        if (e instanceof Error) {
            logger.error(e.stack)
        } else
            logger.error(e)
    }
}
