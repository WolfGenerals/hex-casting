import {IPayload} from './IPayload'
import TagId from '../TagId'
import {Edition, SNBTCompression} from '../../FileFormat'
import NBTError from '../../NBTError'
import {isLittleEndian} from '../../utils'

export default class IntPayload implements IPayload<number> {
    private value: number;

    constructor(value: number) {
        this.value = value & 0xFFFFFFFF;
    }

    static fromSNBTValue(value: string): IntPayload {
        value = value.trim();
        if (!/[-+]?(?:0|[1-9][0-9]*)/.test(value))
            throw new NBTError('Invalid int SNBT value');
        return new IntPayload(Number(value.trim()));
    }

    static fromUint8Array(data: Uint8Array, edition: Edition): IntPayload {
        return new IntPayload(new DataView(data.buffer).getInt32(0, isLittleEndian(edition)));
    }

    fromSNBTValue(value: string): IntPayload {
        return IntPayload.fromSNBTValue(value);
    }

    fromUint8Array(data: Uint8Array, edition: Edition): IntPayload {
        return IntPayload.fromUint8Array(data, edition);
    }

    copy(): IntPayload {
        return new IntPayload(this.value);
    }

    equals(other: IPayload<any>): boolean {
        return other instanceof IntPayload && this.value === other.getValue();
    }

    getValue(): number {
        return this.value;
    }

    getValueDeep(): number {
        return this.getValue();
    }

    getTagId(): TagId {
        return IntPayload.getTagId();
    }

    setValue(value: number): void {
        this.value = value & 0xFFFFFFFF;
    }

    toSNBTValue(compression: SNBTCompression): string {
        return this.value.toString();
    }

    toUint8Array(edition: Edition): Uint8Array {
        const buffer = new ArrayBuffer(4);
        new DataView(buffer).setInt32(0, this.value, isLittleEndian(edition));
        return new Uint8Array(buffer);
    }

    static getTagId(): TagId {
        return TagId.INT;
    }
}