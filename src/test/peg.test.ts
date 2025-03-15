import * as util from "node:util"
import * as fs from "node:fs"
import {peggyParse, PegTopLevel} from "../compile/peggy/PegTypes"
import {describe} from "node:test"

describe("peggy parser test", () => {
    const s = fs.readFileSync("./src/test/test.hc", "utf-8")
    const message = peggyParse(s) as PegTopLevel[]
    // console.log(util.inspect(message, {depth: 10}))
})


describe("peggy error", () => {
    const s =  `
    iota i = [ 1 ,3
    func main {
    
    }
    `
    try {
        peggyParse(s)
    } catch (e) {
        console.log(util.inspect(e))
    }
})