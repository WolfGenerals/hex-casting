import {PatternManager} from "./PatternLoader"
import {BooleanIota, DoubleIota, GarbageIota, Iota, ListIota, NBTIota, NullIota, PatternIota, Vec3Iota} from "./Iota"
import {ESCAPE} from "./Patterns"
import {
    PegDefineFunction,
    PegDefineIota,
    PegIota,
    PegMacroStatement,
    PegReference,
    PegStatement,
} from "./peggy/PegTypes"
import * as util from "node:util"
import CompoundPayload from "../nbt/tag/payloads/CompoundPayload"

// noinspection DuplicatedCode
export class CompileScope {
    constructor(
        public readonly patterns: PatternManager,
        public readonly compiled: Map<string, Compiled>,
    ) {
    }

    compileRefCall(src: PegReference): Iota[] {
        if (src.type === "ref_id") {
            const compiled = this.compiled.get(src.id.data)
            if (!compiled)
                throw new Error(`Unknown id: ${src.id.data}, at ${src.id.loc.start.line}: ${src.id.loc.start.column}`)
            return compiled.asCall()
        }
        if (src.type === "ref_pattern") {
            const pattern = this.patterns.get(src.id.data)
            if (!pattern)
                throw new Error(`Unknown pattern: ${src.id.data}, at ${src.id.loc.start.line}: ${src.id.loc.start.column}`)
            const iota = pattern.patternIota
            if (!iota)
                throw new Error(`Pattern ${pattern.name} requires a drawing method (called at ${src.id.loc.start.line}:${src.id.loc.start.column})`)
            return [iota]
        }

        throw new Error(`Unknown reference type: ${util.inspect(src)}`)
    }

    compileRefIota(src: PegReference): Iota {
        if (src.type === "ref_id") {
            const compiled = this.compiled.get(src.id.data)
            if (!compiled)
                throw new Error(`Unknown id: ${src.id.data}, at ${src.id.loc.start.line}: ${src.id.loc.start.column}`)
            return compiled.asIota()
        }
        if (src.type === "ref_pattern") {
            const pattern = this.patterns.get(src.id.data)
            if (!pattern)
                throw new Error(`Unknown pattern: ${src.id.data}, at ${src.id.loc.start.line}: ${src.id.loc.start.column}`)
            const iota = pattern.patternIota
            if (!iota)
                throw new Error(`Pattern ${pattern.name} requires a drawing method (called at ${src.id.loc.start.line}:${src.id.loc.start.column})`)
            return iota
        }

        throw new Error(`Unknown reference type: ${util.inspect(src)}`)
    }

    compileIota(src: PegIota): Iota {
        switch (src.type) {
            case "double":
                return new DoubleIota(src.data)
            case "boolean":
                return new BooleanIota(src.data)
            case "null":
                return new NullIota()
            case "garbage":
                return new GarbageIota()
            case "raw":
                return PatternIota.fromAngles(src.data, 'EAST')
            case "list":
                return new ListIota(
                    src.data
                        .map((iota) => this.compileIotaWithRef(iota)),
                )
            case "vec3":
                return new Vec3Iota(src.data.x, src.data.y, src.data.z)
            case "external":
                return new NBTIota(CompoundPayload.fromSNBTValue(src.data))
        }
    }

    private compileIotaWithRef(iota: PegIota | PegReference) {
        if (iota.type === "ref_id" || iota.type === "ref_pattern")
            return this.compileRefIota(iota)
        else
            return this.compileIota(iota)
    }

    compileMacro(src: PegMacroStatement): Iota[] {
        const macro = src.macro
        switch (macro.type) {
            case "mask_macro":
                const SKIP = '_'
                const DELETE = '*'

                const [head, ...tail] = macro.mode
                // 初始化状态
                let result =
                    head === DELETE
                        ? {seq: 'a', isLine: false, direction: 'SOUTH_EAST'} // 删除第一个
                        : {seq: '', isLine: true, direction: 'EAST'}         // 保留第一个

                // 流式处理剩余字符
                result = tail.reduce((acc, char) => {
                    if (char === SKIP) return {
                        seq: acc.seq + (acc.isLine ? 'w' : 'e'),
                        isLine: true,
                        direction: acc.direction,
                    }
                    else return {
                        seq: acc.seq + (acc.isLine ? 'ea' : 'da'),
                        isLine: false,
                        direction: acc.direction,
                    }
                }, result)

                return [PatternIota.fromAngles(result.seq, result.direction)]
        }
    }

    compileStatement(src: PegStatement): Iota[] {
        switch (src.type) {
            case "macro_statement":
                return this.compileMacro(src)
            case "call_statement":
                return this.compileRefCall(src.data)
            case "push_statement":
                return [ESCAPE, this.compileIotaWithRef(src.data)]
        }
    }

    compileDefine(src: PegDefineFunction | PegDefineIota): Compiled {
        switch (src.type) {
            case "define_func":
                return new CompiledFunction(
                    src.id.data,
                    src.body.statements
                        .flatMap(statement => this.compileStatement(statement)),
                )
            case "define_iota":
                return new CompiledIota(
                    src.id.data,
                    this.compileIotaWithRef(src.value),
                )
        }
    }

    registerCompiled(compiled: Compiled) {
        this.compiled.set(compiled.id, compiled)
    }

}

export interface Compiled {
    id: string,

    asCall(): Iota[]

    asIota(): Iota
}

class CompiledFunction implements Compiled {
    constructor(
        public readonly id: string,
        public readonly iotas: Iota[],
    ) {
    }

    asCall(): Iota[] {
        return this.iotas
    }

    asIota(): Iota {
        return new ListIota(this.iotas)
    }
}

class CompiledIota implements Compiled {
    constructor(
        public readonly id: string,
        public readonly iota: Iota,
    ) {
    }

    asCall(): Iota[] {
        return [ESCAPE, this.iota]
    }

    asIota(): Iota {
        return this.iota
    }
}
