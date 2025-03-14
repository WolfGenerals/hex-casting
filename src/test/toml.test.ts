import {describe} from "node:test"
import * as util from "node:util"
import {PatternManager} from "../compile/PatternLoader"
import * as fs from "node:fs"

describe("parse", () => {
    const s = `
[to_set]
name = "Uniqueness Purification"
modid = "hexcasting"
modName = "Hex Casting"
pattern = '{"hexcasting:type": "hexcasting:pattern", "hexcasting:data": {"angles": [B; 4b, 0b, 1b, 4b, 5b, 4b], "start_dir": 0b}}'
args = "list → list"
description = "Removes duplicate entries from a list."

[print]
name = "Reveal"
modid = "hexcasting"
modName = "Hex Casting"
args = "any → any"
arg2 = "any → any"
description = "Displays the top iota of the stack to me."

    `

    const manager = new PatternManager()
    manager.loadFromFile(s)
    console.log(util.inspect(manager.patterns, {depth: null}))
})

describe("search", () => {
    const file = fs.readFileSync('./src/test/patterns.toml', 'utf-8')
    const manager = new PatternManager()
    manager.loadFromFile(file)

    const message = manager.search('patterns')
        .map(p => {
            return {
                id: p.id,
                name: p.name,
                modName: p.modName,
                describe: p.description,
                pattern: p.patternIota?.asNbt().toSNBTValue('formated')
            }
        })
    console.log(message)

})