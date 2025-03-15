import {parse} from "./HexCasting"

export function peggyParse(input: string): PegTopLevel[] {
    return parse(input)
}

export type PegTopLevel =
    PegDefineIota
    | PegDefineFunction
    | PegUsePattern;

export interface Location {
    start: { offset: number; line: number; column: number };
    end: { offset: number; line: number; column: number };
}

// 基础类型
export interface PegIdentifier {
    readonly type: "id";
    readonly data: string;
    readonly loc: Location;
}

// Top Level 定义
export interface PegUsePattern {
    readonly type: "use_pattern";
    readonly filePath: string;
    readonly loc: Location;
}

export interface PegDefineIota {
    readonly type: "define_iota";
    readonly id: PegIdentifier;
    readonly value: PegIota;
    readonly loc: Location;
}

export interface PegDefineFunction {
    readonly type: "define_func"; // 注意：原始语法文件中此处可能是笔误，应为"define_function"
    readonly id: PegIdentifier;
    readonly body: PegFunctionBody;
    readonly loc: Location;
}

// 函数相关
export interface PegFunctionBody {
    readonly type: "function_body";
    readonly statements: PegStatement[];
    readonly loc: Location;
}

export type PegStatement = PegMacroStatement | PegCallStatement | PegPushStatement;

export interface PegPushStatement {
    readonly type: "push_statement";
    readonly data: PegIota | PegReference;
    readonly loc: Location;
}

export interface PegCallStatement {
    readonly type: "call_statement";
    readonly data: PegReference;
    readonly loc: Location;
}

export interface PegMacroStatement {
    readonly type: "macro_statement";
    readonly macro: PegMaskMacro;
    readonly loc: Location;
}

export interface PegMaskMacro {
    readonly type: "mask_macro";
    readonly mode: string;
    readonly loc: Location;
}

// 引用相关
export type PegReference = PegIdentifierRef | PegPatternRef;

export interface PegIdentifierRef {
    readonly type: "ref_id";
    readonly id: PegIdentifier;
    readonly loc: Location;
}

export interface PegPatternRef {
    readonly type: "ref_pattern";
    readonly id: PegIdentifier;
    readonly loc: Location;
}

// Iota 类型
export type PegIota =
    PegDoubleIota |
    PegBooleanIota |
    PegNullIota |
    PegGarbageIota |
    PegListIota |
    PegVec3Iota |
    PegRawPatternIota |
    PegExternalIota;

export interface PegDoubleIota {
    readonly type: "double";
    readonly data: number;
    readonly loc: Location;
}

export interface PegBooleanIota {
    readonly type: "boolean";
    readonly data: boolean;
    readonly loc: Location;
}

export interface PegNullIota {
    readonly type: "null";
    readonly data: null;
    readonly loc: Location;
}

export interface PegGarbageIota {
    readonly type: "garbage";
    readonly data: null;
    readonly loc: Location;
}

export interface PegListIota {
    readonly type: "list";
    readonly data: Array<PegIota | PegReference>;
    readonly loc: Location;
}

export interface PegVec3Iota {
    readonly type: "vec3";
    readonly data: { x: number; y: number; z: number };
    readonly loc: Location;
}

export interface PegRawPatternIota {
    readonly type: "raw";
    readonly data: string;
    readonly loc: Location;
}

export interface PegExternalIota {
    readonly type: "external";
    readonly data: string;
    readonly loc: Location;
}

export function iotaWalk(iota: PegIota | PegReference, callback: (item: PegIota | PegReference) => void) {
    callback(iota)
    if (iota.type === "list")
        iota.data.forEach(item => iotaWalk(item, callback))
}