import {Tag} from "../nbt/tag/Tag"
import CompoundPayload from "../nbt/tag/payloads/CompoundPayload"
import StringPayload from "../nbt/tag/payloads/StringPayload"
import DoublePayload from "../nbt/tag/payloads/DoublePayload"
import BytePayload from "../nbt/tag/payloads/BytePayload"
import ListPayload from "../nbt/tag/payloads/ListPayload"
import {IPayload} from "../nbt/tag/payloads/IPayload"
import ByteArrayPayload from "../nbt/tag/payloads/ByteArrayPayload"
import TagId from "../nbt/tag/TagId"

export interface Iota {
    asNbt(): CompoundPayload;
}

export function Iota$fromNBT(nbt: CompoundPayload): Iota {
    const {type} = parseNBT(nbt)

    if (type === DOUBLE_TYPE)
        return DoubleIota.fromNBT(nbt)
    if (type === BOOLEAN_TYPE)
        return BooleanIota.fromNBT(nbt)
    if (type === NULL_TYPE)
        return NullIota.fromNBT(nbt)
    if (type === GARBAGE_TYPE)
        return GarbageIota.fromNBT(nbt)
    if (type === LIST_TYPE)
        return ListIota.fromNBT(nbt)
    if (type === VEC3_TYPE)
        return Vec3Iota.fromNBT(nbt)
    if (type === PATTERN_TYPE)
        return PatternIota.fromNBT(nbt)

    return NBTIota.fromNBT(nbt)
}

const HEX_TYPE = "hexcasting:type"
const HEX_DATA = "hexcasting:data"

const DOUBLE_TYPE = "hexcasting:double"
const BOOLEAN_TYPE = "hexcasting:boolean"
const NULL_TYPE = "hexcasting:null"
const GARBAGE_TYPE = "hexcasting:garbage"
const LIST_TYPE = "hexcasting:list"
const VEC3_TYPE = "hexcasting:vec3"
const PATTERN_TYPE = "hexcasting:pattern"


function parseNBT(payload: CompoundPayload): { type: string, dataPayload: IPayload<any> } {
    const typePayload = payload
        .getValue()
        .find(tag => tag.getTagName() === HEX_TYPE)
        ?.getPayload()
    const dataPayload = payload
        .getValue()
        .find(tag => tag.getTagName() === HEX_DATA)
        ?.getPayload()

    if (!typePayload)
        throw new Error(`Invalid nbt: ${HEX_TYPE} not found, in ${payload.toSNBTValue('formated')}`)
    if (!dataPayload)
        throw new Error(`Invalid nbt: ${HEX_DATA} not found, in ${payload.toSNBTValue('formated')}`)
    if (typePayload.getTagId() !== TagId.STRING)
        throw new Error(`Invalid nbt: ${HEX_TYPE} is not a string, in ${payload.toSNBTValue('formated')}`)

    const type = typePayload.getValue() as string
    return {type, dataPayload}
}

export class DoubleIota implements Iota {
    constructor(public value: number) {
    }

    asNbt(): CompoundPayload {
        return new CompoundPayload([
            new Tag(
                HEX_TYPE,
                new StringPayload(DOUBLE_TYPE),
            ),
            new Tag(
                HEX_DATA,
                new DoublePayload(this.value),
            ),
        ])
    }

    static fromNBT(nbt: CompoundPayload): DoubleIota {
        const {type, dataPayload} = parseNBT(nbt)

        if (type !== DOUBLE_TYPE)
            throw new Error(`Invalid double iota: ${HEX_TYPE} is not ${DOUBLE_TYPE}, in ${nbt.toSNBTValue('formated')}`)
        if (dataPayload.getTagId() !== TagId.DOUBLE)
            throw new Error(`Invalid double iota: ${HEX_DATA} is not a double, in ${nbt.toSNBTValue('formated')}`)

        return new DoubleIota(dataPayload.getValue())
    }
}

export class BooleanIota implements Iota {
    constructor(public value: boolean) {
    }


    asNbt(): CompoundPayload {
        return new CompoundPayload([
            new Tag(
                HEX_TYPE,
                new StringPayload(BOOLEAN_TYPE),
            ),
            new Tag(
                HEX_DATA,
                new BytePayload(this.value ? 1 : 0),
            ),
        ])
    }

    static fromNBT(nbt: CompoundPayload): BooleanIota {
        const {type, dataPayload} = parseNBT(nbt)

        if (type !== BOOLEAN_TYPE)
            throw new Error(`Invalid boolean iota: ${HEX_TYPE} is not ${BOOLEAN_TYPE}, in ${nbt.toSNBTValue('formated')}`)
        if (dataPayload.getTagId() !== TagId.BYTE)
            throw new Error(`Invalid boolean iota: ${HEX_DATA} is not a byte, in ${nbt.toSNBTValue('formated')}`)

        return new BooleanIota(dataPayload.getValue() !== 0)
    }

}

export class NullIota implements Iota {
    constructor() {
    }

    asNbt(): CompoundPayload {
        return new CompoundPayload([
            new Tag(
                HEX_TYPE,
                new StringPayload(NULL_TYPE),
            ),
            new Tag(
                HEX_DATA,
                new CompoundPayload([]),
            ),
        ])
    }

    static fromNBT(nbt: CompoundPayload): NullIota {
        const {type} = parseNBT(nbt)

        if (type !== NULL_TYPE)
            throw new Error(`Invalid null iota: ${HEX_TYPE} is not ${NULL_TYPE}, in ${nbt.toSNBTValue('formated')}`)

        return new NullIota()
    }
}

export class GarbageIota implements Iota {
    constructor() {
    }

    asNbt(): CompoundPayload {
        return new CompoundPayload([
            new Tag(
                HEX_TYPE,
                new StringPayload(GARBAGE_TYPE),
            ),
            new Tag(
                HEX_DATA,
                new CompoundPayload([]),
            ),
        ])
    }

    static fromNBT(nbt: CompoundPayload): GarbageIota {
        const {type} = parseNBT(nbt)

        if (type !== GARBAGE_TYPE)
            throw new Error(`Invalid garbage iota: ${HEX_TYPE} is not ${GARBAGE_TYPE}, in ${nbt.toSNBTValue('formated')}`)

        return new GarbageIota()
    }
}

export class ListIota implements Iota {
    constructor(public value: Iota[]) {
    }

    asNbt(): CompoundPayload {
        return new CompoundPayload([
            new Tag(
                HEX_TYPE,
                new StringPayload(LIST_TYPE),
            ),
            new Tag(
                HEX_DATA,
                new ListPayload(
                    this.value.map(iota => iota.asNbt()),
                ),
            ),
        ])
    }

    static fromNBT(nbt: CompoundPayload): ListIota {
        const {type, dataPayload} = parseNBT(nbt)

        if (type !== LIST_TYPE)
            throw new Error(`Invalid list iota: ${HEX_TYPE} is not ${LIST_TYPE}, in ${nbt.toSNBTValue('formated')}`)
        if (dataPayload.getTagId() !== TagId.LIST)
            throw new Error(`Invalid list iota: ${HEX_DATA} is not a list, in ${nbt.toSNBTValue('formated')}`)

        const list: IPayload<any>[] = dataPayload.getValue()
        return new ListIota(
            list
                .map(tag => {
                    if (tag.getTagId()!== TagId.COMPOUND)
                        throw new Error(`Invalid list iota: ${tag.toSNBTValue('formated')} is not a element, in ${nbt.toSNBTValue('formated')}`)
                    return tag as CompoundPayload
                })
                .map(tag => Iota$fromNBT(tag)),
        )
    }
}

export class Vec3Iota implements Iota {
    constructor(public x: number, public y: number, public z: number) {
    }

    asNbt(): CompoundPayload {
        return new CompoundPayload([
            new Tag(
                HEX_TYPE,
                new StringPayload(VEC3_TYPE),
            ),
            new Tag(
                HEX_DATA,
                new CompoundPayload([
                    new Tag(
                        "x",
                        new DoublePayload(this.x),
                    ),
                    new Tag(
                        "y",
                        new DoublePayload(this.y),
                    ),
                    new Tag(
                        "z",
                        new DoublePayload(this.z),
                    ),
                ]),
            ),
        ])
    }

    static fromNBT(nbt: CompoundPayload): Vec3Iota {
        const {type, dataPayload} = parseNBT(nbt)

        if (type !== VEC3_TYPE)
            throw new Error(`Invalid vec3 iota: ${HEX_TYPE} is not ${VEC3_TYPE}, in ${nbt.toSNBTValue('formated')}`)
        if (dataPayload.getTagId()!== TagId.COMPOUND)
            throw new Error(`Invalid vec3 iota: ${HEX_DATA} is not a compound, in ${nbt.toSNBTValue('formated')}`)
        const vec3 = dataPayload as CompoundPayload

        const xPayload = vec3
            .getValue()
            .find(tag => tag.getTagName() === "x")
            ?.getPayload()
        const yPayload = vec3
            .getValue()
            .find(tag => tag.getTagName() === "y")
            ?.getPayload()
        const zPayload = vec3
            .getValue()
            .find(tag => tag.getTagName() === "z")
            ?.getPayload()

        if (
            !xPayload || !yPayload || !zPayload
            || !(
                   xPayload.getTagId() === TagId.DOUBLE
                && yPayload.getTagId() === TagId.DOUBLE
                && zPayload.getTagId() === TagId.DOUBLE
            )
        )
            throw new Error(`Invalid vec3 iota: ${vec3.toSNBTValue('formated')} is not a vec3`)

        return new Vec3Iota(
            xPayload.getValue(),
            yPayload.getValue(),
            zPayload.getValue(),
        )
    }
}

export class PatternIota implements Iota {
    constructor(public angles: BytePayload[], public start_dir: BytePayload) {
    }

    asNbt(): CompoundPayload {
        return new CompoundPayload([
            new Tag(
                HEX_TYPE,
                new StringPayload(PATTERN_TYPE),
            ),
            new Tag(
                HEX_DATA,
                new CompoundPayload([
                    new Tag(
                        "angles",
                        new ByteArrayPayload(
                            this.angles,
                        ),
                    ),
                    new Tag(
                        "start_dir",
                        this.start_dir,
                    ),
                ]),
            ),
        ])
    }

    static fromAngles(signature: string, startDir: string): PatternIota {
        const mappingSig: Record<string, BytePayload> = {
            w: new BytePayload(0),
            e: new BytePayload(1),
            d: new BytePayload(2),
            s: new BytePayload(3),
            a: new BytePayload(4),
            q: new BytePayload(5),
        }
        const mappingDir: Record<string, BytePayload> = {
            NORTH_EAST: new BytePayload(0),
            EAST: new BytePayload(1),
            SOUTH_EAST: new BytePayload(2),
            SOUTH_WEST: new BytePayload(3),
            WEST: new BytePayload(4),
            NORTH_WEST: new BytePayload(5),
        }

        if (!signature.match(/^[wedsaq]+$/))
            throw new Error(`Invalid signature: ${signature}`)
        if (!startDir.match(/^(NORTH_EAST|EAST|SOUTH_EAST|SOUTH_WEST|WEST|NORTH_WEST)$/))
            throw new Error(`Invalid start direction: ${startDir}`)

        const angles = Array
            .from(signature)
            .map(c => mappingSig[c])

        return new PatternIota(angles, mappingDir[startDir])
    }

    static fromNBT(nbt: CompoundPayload): PatternIota {
        const {type, dataPayload} = parseNBT(nbt)

        if (type !== PATTERN_TYPE)
            throw new Error(`Invalid pattern iota: ${HEX_TYPE} is not ${PATTERN_TYPE}, in ${nbt.toSNBTValue('formated')}`)
        if (dataPayload.getTagId()!== TagId.COMPOUND)
            throw new Error(`Invalid pattern iota: ${HEX_DATA} is not a compound, in ${nbt.toSNBTValue('formated')}`)
        const pattern = dataPayload as CompoundPayload

        const anglesPayload = pattern
            .getValue()
            .find(tag => tag.getTagName() === "angles")
            ?.getPayload()
        const startDirPayload = pattern
            .getValue()
            .find(tag => tag.getTagName() === "start_dir")
            ?.getPayload()

        if (
            !(anglesPayload && startDirPayload)
            || !(
                anglesPayload.getTagId() === TagId.BYTE_ARRAY
                && startDirPayload.getTagId() === TagId.BYTE
            )
        )
            throw new Error(`Invalid pattern iota: ${pattern.toSNBTValue('formated')} is not a pattern`)

        return new PatternIota(
            anglesPayload.getValue(),
            startDirPayload as BytePayload,
        )
    }
}

// 直接把NBT当成Iota，存在风险
export class NBTIota implements Iota {
    constructor(public value: CompoundPayload) {
    }

    asNbt(): CompoundPayload {
        return this.value
    }

    static fromNBT(nbt: CompoundPayload): NBTIota {
        return new NBTIota(nbt)
    }
}