import {describe} from "node:test"
import {ListIota} from "../compile/Iota"
import CompoundPayload from "../nbt/tag/payloads/CompoundPayload"

describe("",()=>{
    const s = `{"hexcasting:data":[{"hexcasting:data":[],"hexcasting:type":"hexcasting:list"},{"hexcasting:data":[],"hexcasting:type":"hexcasting:list"}],"hexcasting:type":"hexcasting:list"}`


    ListIota.fromNBT(CompoundPayload.fromSNBTValue(s))
})