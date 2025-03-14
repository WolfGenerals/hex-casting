import {PatternIota} from "./Iota"
import * as toml from "@iarna/toml"
import CompoundPayload from "../nbt/tag/payloads/CompoundPayload"
import Fuse from "fuse.js"

export class PatternManager {
    readonly patterns: Map<string, PatternDefine> = new Map()

    private getOrCreate(id: string): PatternDefine {
        let p = this.patterns.get(id)
        if (p) return p
        p=new PatternDefine(id, id)
        this.patterns.set(id, p)
        return p
    }

    private load(tomlPattern: PatternDefineToml) {
        const original = this.getOrCreate(tomlPattern.id)
        const name = tomlPattern.name || original.name
        const pattern = tomlPattern.pattern
            ? PatternIota.fromNBT(CompoundPayload.fromSNBTValue(tomlPattern.pattern))
            : original.patternIota
        const modid = tomlPattern.modid || original.modid
        const modName = tomlPattern.modName || original.modName
        const args = tomlPattern.args || original.args
        const description = tomlPattern.description || original.description

        if (name ==='patterns'){
            console.log(tomlPattern)
        }

        this.patterns.set(tomlPattern.id, new PatternDefine(
            tomlPattern.id, name, pattern, modid, modName, args, description,
        ))
    }

    loadFromFile(file: string) {
        const tomlPatterns = parseToml(file)
        for (const tomlPattern of tomlPatterns) {
            this.load(tomlPattern)
        }
    }

    search(query: string): PatternDefine[] {
        const fuse = new Fuse(Object.values(this.patterns), {
            // keys: ['id', 'name', 'modName', 'description'],
            keys:[
                {name: 'id',weight: 2},
                {name: 'name',weight: 1},
            ],
            threshold: 0.4,
        })
        return fuse.search(query).map(result => result.item)
    }

    get(id: string){
        return this.patterns.get(id)
    }
}

export class PatternDefine {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly patternIota?: PatternIota,
        public readonly modid?: string,
        public readonly modName?: string,
        public readonly args?: string,
        public readonly description?: string,
    ) {
    }
}


function parseToml(content: string): PatternDefineToml[] {
    const map = toml.parse(content) as object
    return Object.entries(map).map(([id, value]): PatternDefineToml => {
        return {
            id: id,
            name: value.name,
            pattern: value.pattern,
            modid: value.modid,
            modName: value.modName,
            args: value.args,
            description: value.description,
        }
    })
}

interface PatternDefineToml {
    id: string,
    pattern?: string,
    name?: string,
    modid?: string,
    modName?: string,
    args?: string,
    description?: string
}

