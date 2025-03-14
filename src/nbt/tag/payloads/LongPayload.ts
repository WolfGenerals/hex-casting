import {IPayload} from './IPayload'
import TagId from '../TagId'
import {Edition, SNBTCompression} from '../../FileFormat'
import NBTError from '../../NBTError'
import {isLittleEndian} from '../../utils'

export default class LongPayload implements IPayload<bigint> {
    private value: bigint;

    constructor(value: bigint) {
        this.value = value & 0xFFFFFFFFFFFFFFFFn;
    }

    static fromSNBTValue(value: string): LongPayload {
        value = value.trim();
        if (!/[-+]?(?:0|[1-9][0-9]*)[lL]?/.test(value))
            throw new NBTError('Invalid long SNBT value');
        return new LongPayload(BigInt(value.replace(/[lL]/, '').trim()));
    }

    static fromUint8Array(data: Uint8Array, edition: Edition): LongPayload {
        return new LongPayload(new DataView(data.buffer).getBigInt64(0, isLittleEndian(edition)));
    }

    fromSNBTValue(value: string): LongPayload {
        return LongPayload.fromSNBTValue(value);
    }

    fromUint8Array(data: Uint8Array, edition: Edition): LongPayload {
        return LongPayload.fromUint8Array(data, edition);
    }

    copy(): LongPayload {
        return new LongPayload(this.value);
    }

    equals(other: IPayload<any>): boolean {
        return other instanceof LongPayload && this.value === other.getValue();
    }

    getValue(): bigint {
        return this.value;
    }

    getValueDeep(): bigint {
        return this.getValue();
    }

    getTagId(): TagId {
        return LongPayload.getTagId();
    }

    setValue(value: bigint): void {
        this.value = value & 0xFFFFFFFFFFFFFFFFn;
    }

    toSNBTValue(compression: SNBTCompression): string {
        return this.value + 'l';
    }

    toUint8Array(edition: Edition): Uint8Array {
        const buffer = new ArrayBuffer(8);
        new DataView(buffer).setBigInt64(0, this.value, isLittleEndian(edition));
        return new Uint8Array(buffer);
    }

    static getTagId(): TagId {
        return TagId.LONG;
    }
}