import {IPayload} from './IPayload'
import TagId from '../TagId'
import {Edition, SNBTCompression} from '../../FileFormat'
import NBTError from '../../NBTError'
import {concatUint8Arrays} from '../../utils'
import BytePayload from "./BytePayload"
import IntPayload from "./IntPayload"

export default class ByteArrayPayload implements IPayload<BytePayload[]> {
    private value: BytePayload[];

    constructor(value: BytePayload[]) {
        if (value.length >= 2 ** 31)
            throw new NBTError('Byte array is too long');
        this.value = value;
    }

    static fromSNBTValue(value: string): ByteArrayPayload {
        value = value.replace(' ', '').trim();
        const bytes = value.replace('[B;', '').replace(']', '').split(',');
        const payloads: BytePayload[] = [];
        bytes.forEach((value, index) => payloads[index] = BytePayload.fromSNBTValue(value));
        return new ByteArrayPayload(payloads);
    }

    static fromUint8Array(data: Uint8Array, edition: Edition): ByteArrayPayload {
        const payloads: BytePayload[] = [];
        const length = IntPayload.fromUint8Array(data.slice(0, 4), edition).getValue();
        for (let i = 0; i < length; i++) {
            payloads.push(BytePayload.fromUint8Array(data.slice(i + 4, i + 5), edition));
        }
        return new ByteArrayPayload(payloads);
    }

    fromSNBTValue(value: string): ByteArrayPayload {
        return ByteArrayPayload.fromSNBTValue(value);
    }

    fromUint8Array(data: Uint8Array, edition: Edition): ByteArrayPayload {
        return ByteArrayPayload.fromUint8Array(data, edition);
    }

    copy(): ByteArrayPayload {
        return new ByteArrayPayload(this.value);
    }

    equals(other: IPayload<any>): boolean {
        return other instanceof ByteArrayPayload && this.value.every((payload, index) => payload.equals(this.value[index]));
    }

    getValue(): BytePayload[] {
        return this.value;
    }

    getValueDeep(): number[] {
        return this.value.map(payload => payload.getValueDeep());
    }

    getTagId(): TagId {
        return ByteArrayPayload.getTagId();
    }

    setValue(value: BytePayload[]): void {
        if (value.length >= 2 ** 31)
            throw new NBTError('Byte array is too long');
        this.value = value;
    }

    toSNBTValue(compression: SNBTCompression): string {
        let string = '[B;';
        if (this.value.length > 0) {
            string += (compression === 'formated' ? ' ' : '');
            for (let i = 0; i < this.value.length - 1; i++) {
                string += this.value[i].toSNBTValue(compression) + ',' + (compression === 'formated' ? ' ' : '');
            }
            string += this.value[this.value.length - 1].toSNBTValue(compression);
        }
        string += ']';
        return string;
    }

    toUint8Array(edition: Edition): Uint8Array {
        return concatUint8Arrays(
            new IntPayload(this.value.length).toUint8Array(edition), // 长度
            ...this.value.map(payload => payload.toUint8Array(edition))
        );
    }

    static getTagId(): TagId {
        return TagId.BYTE_ARRAY;
    }
}