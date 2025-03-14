import {IPayload} from './IPayload'
import TagId from '../TagId'
import {Edition, SNBTCompression} from '../../FileFormat'
import NBTError from '../../NBTError'
import {concatUint8Arrays} from "../../utils"

export default class StringPayload implements IPayload<string> {
    private value: string;

    constructor(value: string) {
        this.value = value;
    }

    static fromSNBTValue(value: string): StringPayload {
        value = value.trim();
        if (new TextEncoder().encode(value).length > 65535)
            throw new NBTError('String is too long');
        else if (!/([a-zA-Z0-9_\-.+]+)|('.+')|(".+")/.test(value))
            throw new NBTError('Invalid string SNBT value');
        else if (value.startsWith("'") && value.endsWith("'"))
            value = value.substring(1, value.length - 1).replace("\\'", "'");
        else if (value.startsWith('"') && value.endsWith('"'))
            value = value.substring(1, value.length - 1).replace('\\"', '"');
        return new StringPayload(value);
    }

    static fromUint8Array(data: Uint8Array, edition: Edition): StringPayload {
        const length = new DataView(data.slice(0, 2).buffer).getUint16(0);
        return new StringPayload(new TextDecoder().decode(data.slice(2, length + 2)));
    }

    fromSNBTValue(value: string): StringPayload {
        return StringPayload.fromSNBTValue(value);
    }

    fromUint8Array(data: Uint8Array, edition: Edition): StringPayload {
        return StringPayload.fromUint8Array(data, edition);
    }

    copy(): StringPayload {
        return new StringPayload(this.value);
    }

    equals(other: IPayload<any>): boolean {
        return other instanceof StringPayload && this.value === other.getValue();
    }

    getValue(): string {
        return this.value;
    }

    getValueDeep(): string {
        return this.getValue();
    }

    getTagId(): TagId {
        return StringPayload.getTagId();
    }

    setValue(value: string): void {
        this.value = value;
    }

    toSNBTValue(compression: SNBTCompression): string {
        return '"' + this.value.replace('"', '\\"') + '"';
    }

    toUint8Array(edition: Edition): Uint8Array {
        const data = new TextEncoder().encode(this.value);
        // 长度
        const buffer = new ArrayBuffer(2);
        new DataView(buffer).setUint16(0, data.length);
        return concatUint8Arrays(
            new Uint8Array(buffer), // 长度
            data
        );
    }

    static getTagId(): TagId {
        return TagId.STRING;
    }
}