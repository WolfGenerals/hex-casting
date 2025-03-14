import * as fs from "node:fs"
import * as toml from "@iarna/toml"
import lodash from "lodash"
import {PatternIota} from "../src/compile/Iota"

const src = fs.readFileSync('./data/registry.json', "utf-8")
const db = JSON.parse(src)
type dbType= {
    name:string
    modid:string
    modName:string
    direction:string
    pattern:string
    args:string
    description:string
}
const out = {
}

for (const [name, data] of Object.entries(db)){
    const dbData:dbType = data as dbType

    if (!dbData.name) continue


    const pattern =
        (dbData.pattern && dbData.direction)?
        PatternIota.fromAngles(dbData.pattern,dbData.direction).asNbt().toSNBTValue('formated')
            : undefined
    lodash.set(out,dbData.name,{
        // id:dbData.name,
        name:name,
        modid:dbData.modid,
        modName:dbData.modName,
        // direction:dbData.direction,
        // pattern:dbData.pattern,
        pattern: pattern,
        args:dbData.args,
        description:dbData.description
    })
}

const outString = toml.stringify(out)

fs.writeFileSync('./default.toml', outString)