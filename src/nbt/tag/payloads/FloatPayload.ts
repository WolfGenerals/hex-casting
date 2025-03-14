import {IPayload} from './IPayload'
import TagId from '../TagId'
import {Edition, SNBTCompression} from '../../FileFormat'
import NBTError from '../../NBTError'
import {isLittleEndian} from "../../utils"

export default class FloatPayload implements IPayload<number> {
    private value: number;

    constructor(value: number) {
        this.value = FloatPayload.numToFloat(value);
    }

    static fromSNBTValue(value: string): FloatPayload {
        value = value.trim();
        if (!/[-+]?(?:[0-9]+[.]?|[0-9]*[.][0-9]+)(?:e[-+]?[0-9]+)?[fF]?/.test(value))
            throw new NBTError('Invalid float SNBT value');
        return new FloatPayload(Number(value.replace(/[fF]/, '').trim()));
    }

    static fromUint8Array(data: Uint8Array, edition: Edition): FloatPayload {
        return new FloatPayload(new DataView(data.buffer).getFloat32(0, isLittleEndian(edition)));
    }

    fromSNBTValue(value: string): FloatPayload {
        return FloatPayload.fromSNBTValue(value);
    }

    fromUint8Array(data: Uint8Array, edition: Edition): FloatPayload {
        return FloatPayload.fromUint8Array(data, edition);
    }

    copy(): FloatPayload {
        return new FloatPayload(this.value);
    }

    equals(other: IPayload<any>): boolean {
        return other instanceof FloatPayload && this.value === other.getValue();
    }

    getValue(): number {
        return this.value;
    }

    getValueDeep(): number {
        return this.getValue();
    }

    getTagId(): TagId {
        return FloatPayload.getTagId();
    }

    setValue(value: number): void {
        this.value = FloatPayload.numToFloat(value);
    }

    toSNBTValue(compression: SNBTCompression): string {
        return this.value + 'f';
    }

    toUint8Array(edition: Edition): Uint8Array {
        const buffer = new ArrayBuffer(4);
        new DataView(buffer).setFloat32(0, this.value, isLittleEndian(edition));
        return new Uint8Array(buffer);
    }

    static getTagId(): TagId {
        return TagId.FLOAT;
    }

    private static numToFloat(num: number): number {
        return new Float32Array([<number>num])[0]
    }
}