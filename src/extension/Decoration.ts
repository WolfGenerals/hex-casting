import vscode, {Range, TextDocument, TextEditor, Uri} from "vscode"
import {checkFileExists, collectPatterns, collectSymbols, parseAST} from "./util"
import {iotaWalk, PegDefineFunction, PegDefineIota, PegIota, PegReference} from "../compile/peggy/PegTypes"
import {PatternDefine, PatternManager} from "../compile/PatternLoader"
import {PatternIota} from "../compile/Iota"

// 类型定义
interface IotaLocation {
    start: { offset: number };
    end: { offset: number };
}
// SVG 缓存管理类
class SvgCacheManager {
    private static readonly CACHE_TTL_MS = 600_000; // 10 minutes
    private readonly lastUpdated = new Map<string, number>();

    async getSvgUri(pd: PatternDefine, rootDir: Uri, fontSize: number): Promise<Uri | undefined> {
        const svgUri = this.getSvgFileUri(pd, rootDir);
        const now = Date.now();

        if (await this.isCacheValid(pd.id, svgUri, now)) {
            return svgUri;
        }

        return this.generateNewSvg(pd, svgUri, fontSize, now);
    }

    private getSvgFileUri(pd: PatternDefine, rootDir: Uri): Uri {
        return vscode.Uri.joinPath(rootDir, 'out', '.svg', `${pd.id}.svg`);
    }

    private async isCacheValid(id: string, uri: Uri, timestamp: number): Promise<boolean> {
        const fileExists = await checkFileExists(uri);
        if (!fileExists) return false;

        const lastUpdated = this.lastUpdated.get(id) ?? 0;
        return timestamp - lastUpdated < SvgCacheManager.CACHE_TTL_MS;
    }

    private async generateNewSvg(
        pd: PatternDefine,
        uri: Uri,
        fontSize: number,
        timestamp: number
    ): Promise<Uri | undefined> {
        try {
            const svgContent = pd.svg(fontSize);
            if (!svgContent) return undefined;

            await this.writeSvgFile(uri, svgContent);
            this.lastUpdated.set(pd.id, timestamp);
            return uri;
        } catch (error) {
            console.error(`Failed to generate SVG for ${pd.id}:`, error);
            return undefined;
        }
    }

    private async writeSvgFile(uri: Uri, content: string): Promise<void> {
        await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf-8'));
    }
}

// 装饰器配置
const inlineDecoration = vscode.window.createTextEditorDecorationType({
    after: {
        contentIconPath: undefined,
        height: '100%',
        contentText: ' ',
        margin: '0 0 0 0',
    },
});

// 主逻辑
export async function updateDecorations(document: TextDocument, editor: TextEditor): Promise<void> {
    const rootDir = getWorkspaceRootDir(document.uri);
    const fontSize = getEditorFontSize();

    const { ast } = parseAST(document);
    const [patterns, symbols] = await Promise.all([
        collectPatterns(ast, rootDir),
        collectSymbols(ast)
    ]);

    const svgManager = new SvgCacheManager();
    const decorations = await createDecorations(document, symbols, patterns, rootDir, svgManager, fontSize);

    applyDecorations(editor, decorations);
}

// 工具函数
function getWorkspaceRootDir(uri: Uri): Uri {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
    if (!workspaceFolder) {
        throw new Error("Document not in workspace");
    }
    return workspaceFolder.uri;
}

function getEditorFontSize(): number {
    return vscode.workspace.getConfiguration('editor').get<number>('fontSize') ?? 14;
}

async function createDecorations(
    document: TextDocument,
    symbols: (PegDefineFunction|PegDefineIota)[],
    patterns: PatternManager,
    rootDir: Uri,
    svgManager: SvgCacheManager,
    fontSize: number
): Promise<Array<{ range: Range; uri: Uri | undefined }>> {
    const decorationPromises = symbols.flatMap(processSymbolItem)
        .flatMap(dataItem => findRefPatterns(dataItem, patterns))
        .map(({ pattern, loc }) => ({
            range: createRangeFromLocation(document, loc),
            uriPromise: svgManager.getSvgUri(pattern, rootDir, fontSize)
        }));

    return Promise.all(
        decorationPromises.map(async ({ range, uriPromise }) => ({
            range,
            uri: await uriPromise
        }))
    );
}

function processSymbolItem(item: PegDefineFunction|PegDefineIota) {
    return item.type === 'define_iota'
        ? [item.value]
        : item.body?.statements
        .filter(stmt => stmt.type !== 'macro_statement')
        .map(stmt => stmt.data) ?? [];
}

function findRefPatterns(dataItem: PegIota|PegReference, patterns: PatternManager): Array<{ pattern: PatternDefine; loc: IotaLocation }> {
    const results: Array<{ pattern: PatternDefine; loc: IotaLocation }> = [];

    iotaWalk(dataItem, (iota: PegIota|PegReference) => {

        const pattern = iota.type==='ref_pattern'?patterns.get(iota.id.data):undefined
        if (pattern) {
            results.push({ pattern, loc: iota.loc });
        }
        if (iota.type === 'raw'){
            results.push({ pattern:new PatternDefine('@raw/'+iota.data,iota.data,PatternIota.fromAngles(iota.data)), loc:iota.loc });
        }
    });

    return results;
}

function createRangeFromLocation(document: TextDocument, loc: IotaLocation): Range {
    return new vscode.Range(
        document.positionAt(loc.start.offset),
        document.positionAt(loc.end.offset)
    );
}

function applyDecorations(editor: TextEditor, decorations: Array<{ range: Range; uri: Uri | undefined }>): void {
    const validDecorations = decorations
        .filter(({ uri }) => !!uri)
        .map(({ range, uri }) => ({
            range,
            renderOptions: { after: { contentIconPath: uri! } }
        }));

    editor.setDecorations(inlineDecoration, validDecorations);
}
