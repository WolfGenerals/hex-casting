import {IPayload} from './IPayload'
import TagId from '../TagId'
import {Edition, SNBTCompression} from '../../FileFormat'
import NBTError from '../../NBTError'
import {isLittleEndian} from "../../utils"

export default class DoublePayload implements IPayload<number> {
    private value: number;

    constructor(value: number) {
        this.value = value;
    }

    static fromSNBTValue(value: string): DoublePayload {
        value = value.trim();
        if (/![-+]?(?:[0-9]+[.]?|[0-9]*[.][0-9]+)(?:e[-+]?[0-9]+)?[dD]?/.test(value))
            throw new NBTError('Invalid double SNBT value');
        return new DoublePayload(Number(value.replace(/[dD]/, '').trim()));
    }

    static fromUint8Array(data: Uint8Array, edition: Edition): DoublePayload {
        return new DoublePayload(new DataView(data.buffer).getFloat64(0, isLittleEndian(edition)));
    }

    fromSNBTValue(value: string): DoublePayload {
        return DoublePayload.fromSNBTValue(value);
    }

    fromUint8Array(data: Uint8Array, edition: Edition): DoublePayload {
        return DoublePayload.fromUint8Array(data, edition);
    }

    copy(): DoublePayload {
        return new DoublePayload(this.value);
    }

    equals(other: IPayload<any>): boolean {
        return other instanceof DoublePayload && this.value === other.getValue();
    }

    getValue(): number {
        return this.value;
    }

    getValueDeep(): number {
        return this.getValue();
    }

    getTagId(): TagId {
        return DoublePayload.getTagId();
    }

    setValue(value: number): void {
        this.value = value;
    }

    toSNBTValue(compression: SNBTCompression): string {
        return this.value + 'd';
    }

    toUint8Array(edition: Edition): Uint8Array {
        const buffer = new ArrayBuffer(8);
        new DataView(buffer).setFloat64(0, this.value, isLittleEndian(edition));
        return new Uint8Array(buffer);
    }

    static getTagId(): TagId {
        return TagId.DOUBLE;
    }
}