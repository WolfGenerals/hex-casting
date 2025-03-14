import {IPayload} from './payloads/IPayload'
import NBTError from '../NBTError'
import {concatUint8Arrays} from '../utils'
import TagId, {getPayloadType} from './TagId'
import {Edition, SNBTCompression} from '../FileFormat'
import BytePayload from './payloads/BytePayload'
import ShortPayload from './payloads/ShortPayload'
import LongPayload from './payloads/LongPayload'
import IntPayload from './payloads/IntPayload'
import FloatPayload from './payloads/FloatPayload'
import DoublePayload from "./payloads/DoublePayload"
import StringPayload from "./payloads/StringPayload"
import ListPayload from "./payloads/ListPayload"
import CompoundPayload from "./payloads/CompoundPayload"

export class Tag {
    private name: string;
    private payload: IPayload<any>;
    private readonly root: boolean;

    constructor(name: string, payload: IPayload<any>, root: boolean = false) {
        if (name.length > 65535)
            throw new NBTError('Tag name is too long');
        if (root && (payload.getTagId() !== TagId.COMPOUND || name !== ''))
            throw new NBTError('Root tag must be a compound and its name must by empty');
        this.name = name;
        this.payload = payload;
        this.root = root;
    }

    copy(): Tag {
        return new Tag(this.name, this.payload.copy());
    };

    equals(other: Tag): boolean {
        return this.name === other.name && this.payload.equals(other.payload);
    }

    getTagId(): TagId {
        return this.payload.getTagId();
    }

    getTagName(): string {
        return this.name;
    }

    isRoot(): boolean {
        return this.root;
    }

    setTagName(name: string): void {
        if (name.length > 65535)
            throw new NBTError('Tag name is too long');
        this.name = name;
    }

    getPayload(): IPayload<any> {
        return this.payload;
    }

    setPayload(payload: IPayload<any>): void {
        this.payload = payload;
    }

    toSNBT(compress: SNBTCompression = 'formated'): string {
        if (this.root)
            return this.payload.toSNBTValue(compress);
        return `"${this.name.replace('"', '\\"')}":${compress === 'formated' ? ' ' : ''}${this.payload.toSNBTValue(compress)}`;
    }

    toJSON(): object {
        if (this.root)
            return this.payload.getValueDeep();
        return {
            [this.name]: this.payload.getValueDeep()
        };
    }

    toUint8Array(edition: Edition): Uint8Array {
        // 名称
        const name = new TextEncoder().encode(this.name);
        // 长度
        const buffer = new ArrayBuffer(2);
        new DataView(buffer).setUint16(0, name.length, false)
        return concatUint8Arrays(
            new Uint8Array([this.payload.getTagId()]), // TagID
            new Uint8Array(buffer), // 名称长度
            name, // 名称
            this.payload.toUint8Array(edition) // 负载
        );
    }

    static fromJSON(json: any, root: boolean = false): Tag {
        const keys = Object.keys(json)
        if (keys.length !== 1)
            return Tag.fromJSON({'': json}, root);
        switch (typeof json[keys[0]]) {
            case 'string':
                return new Tag(keys[0], new StringPayload(json[keys[0]]), root);
            case 'boolean':
                return new Tag(keys[0], new BytePayload(json[keys[0]] ? 1 : 0), root);
            case 'bigint':
            case 'number':
                const num: bigint | number = json[keys[0]];
                const number = Number(num);
                if (typeof num === 'bigint' || Number.isInteger(num)) {
                    if (num <= 127 && num >= -128)
                        return new Tag(keys[0], new BytePayload(number), root);
                    else if (num <= 32767 && num >= -32768)
                        return new Tag(keys[0], new ShortPayload(number), root);
                    else if (num <= 2 ** 31 && num >= -(2 ** 31))
                        return new Tag(keys[0], new IntPayload(number));
                    else if (num <= 2n ** 63n - 1n && num >= -(2n ** 63n))
                        return new Tag(keys[0], new LongPayload(BigInt(num)), root);
                }
                if (new Float32Array([number])[0] == num) // 能安全转为float
                    return new Tag(keys[0], new FloatPayload(number), root);
                else // 否则double
                    return new Tag(keys[0], new DoublePayload(Number(number)), root);
            case 'object':
                if (Array.isArray(json[keys[0]])) {
                    return new Tag(keys[0], new ListPayload(json[keys[0]].map((item: any) => Tag.fromJSON({'': item}).getPayload())), root);
                } else {
                    const tags: Tag[] = []
                    for (const key in json[keys[0]]) {
                        tags.push(Tag.fromJSON({[key]: json[keys[0]][key]}));
                    }
                    return new Tag(keys[0], new CompoundPayload(tags), root);
                }
        }
        throw new NBTError('Invalid value format');
    }

    static fromUint8Array(data: Uint8Array, edition: Edition, root: boolean = false): Tag {
        const Type = getPayloadType(data[0]);
        const nameLength = new DataView(data.slice(1, 5).buffer).getUint16(0, false);
        return new Tag(
            new TextDecoder().decode(data.slice(3, 3 + nameLength)),
            Type.fromUint8Array(data.slice(3 + nameLength), edition),
            root
        );
    }

    static fromSNBTTag(snbt: string, root: boolean = false): Tag {
        snbt = snbt.trim();
        return new Tag('', CompoundPayload.fromSNBTValue(snbt), root);
    }
}