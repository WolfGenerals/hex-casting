import {IPayload} from './IPayload'
import TagId from '../TagId'
import {Edition, SNBTCompression} from '../../FileFormat'
import NBTError from '../../NBTError'
import {isLittleEndian} from "../../utils"

export default class ShortPayload implements IPayload<number> {
    private value: number;

    constructor(value: number) {
        this.value = value & 0xFFFF;
    }

    static fromSNBTValue(value: string): ShortPayload {
        value = value = value.replace(' ', '').trim();
        if (!/[-+]?(?:0|[1-9][0-9]*)[sS]?/.test(value))
            throw new NBTError('Invalid short SNBT value');
        return new ShortPayload(Number(value.replace(/[sS]/, '').trim()));
    }

    static fromUint8Array(data: Uint8Array, edition: Edition): ShortPayload {
        return new ShortPayload(new DataView(data.buffer).getInt32(0, isLittleEndian(edition)));
    }

    fromSNBTValue(value: string): ShortPayload {
        return ShortPayload.fromSNBTValue(value);
    }

    fromUint8Array(data: Uint8Array, edition: Edition): ShortPayload {
        return ShortPayload.fromUint8Array(data, edition);
    }

    copy(): ShortPayload {
        return new ShortPayload(this.value);
    }

    equals(other: IPayload<any>): boolean {
        return other instanceof ShortPayload && this.value === other.getValue();
    }

    getValue(): number {
        return this.value;
    }

    getValueDeep(): number {
        return this.getValue();
    }

    getTagId(): TagId {
        return ShortPayload.getTagId();
    }

    setValue(value: number): void {
        this.value = value & 0xFFFF;
    }

    toSNBTValue(compression: SNBTCompression): string {
        return this.value + 's';
    }

    toUint8Array(edition: Edition): Uint8Array {
        const buffer = new ArrayBuffer(2);
        new DataView(buffer).setInt16(0, this.value, isLittleEndian(edition));
        return new Uint8Array(buffer);
    }

    static getTagId(): TagId {
        return TagId.SHORT;
    }
}