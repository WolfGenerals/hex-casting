import {IPayload} from './IPayload'
import TagId from '../TagId'
import {Edition, SNBTCompression} from '../../FileFormat'
import NBTError from '../../NBTError'

export default class BytePayload implements IPayload<number> {
    private value: number;

    constructor(value: number) {
        this.value = value & 0xFF;
    }

    static fromSNBTValue(value: string): BytePayload {
        value = value.trim();
        if (value === 'true')
            return new BytePayload(1);
        else if (value === 'false')
            return new BytePayload(0);
        else if (!/[-+]?(?:0|[1-9][0-9]*)[bB]?/.test(value))
            throw new NBTError('Invalid byte SNBT value');
        return new BytePayload(Number(value.replace(/[bB]/, '').trim()));
    }

    static fromUint8Array(data: Uint8Array, edition: Edition): BytePayload {
        return new BytePayload(new DataView(data.buffer).getInt8(0));
    }

    fromSNBTValue(value: string): BytePayload {
        return BytePayload.fromSNBTValue(value);
    }

    fromUint8Array(data: Uint8Array, edition: Edition): BytePayload {
        return BytePayload.fromUint8Array(data, edition);
    }

    copy(): BytePayload {
        return new BytePayload(this.value);
    }

    equals(other: IPayload<any>): boolean {
        return other instanceof BytePayload && this.value === other.getValue();
    }

    getValue(): number {
        return this.value;
    }

    getValueDeep(): number {
        return this.getValue();
    }

    getTagId(): TagId {
        return BytePayload.getTagId();
    }

    setValue(value: number): void {
        this.value = value & 0xFF;
    }

    toSNBTValue(compression: SNBTCompression): string {
        return this.value + 'b';
    }

    toUint8Array(edition: Edition): Uint8Array {
        const buffer = new ArrayBuffer(1);
        new DataView(buffer).setInt8(0, this.value);
        return new Uint8Array(buffer);
    }

    static getTagId(): TagId {
        return TagId.BYTE;
    }
}