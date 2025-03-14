import {IPayload} from './IPayload'
import TagId from '../TagId'
import {Edition, SNBTCompression} from '../../FileFormat'
import NBTError from '../../NBTError'
import {concatUint8Arrays} from '../../utils'
import IntPayload from "./IntPayload"

export default class IntArrayPayload implements IPayload<IntPayload[]> {
    private value: IntPayload[];

    constructor(value: IntPayload[]) {
        if (value.length >= 2 ** 31)
            throw new NBTError('Int array is too long');
        this.value = value;
    }

    static fromSNBTValue(value: string): IntArrayPayload {
        value = value.replace(' ', '');
        const ints = value.replace('[I;', '').replace(']', '').split(',');
        const payloads: IntPayload[] = [];
        ints.forEach((value, index) => payloads[index] = IntPayload.fromSNBTValue(value));
        return new IntArrayPayload(payloads);
    }

    static fromUint8Array(data: Uint8Array, edition: Edition): IntArrayPayload {
        const payloads: IntPayload[] = [];
        const length = IntPayload.fromUint8Array(data.slice(0, 4), edition).getValue();
        let offset = 4;
        for (let i = 0; i < length; i++) {
            payloads.push(IntPayload.fromUint8Array(data.slice(offset, offset + 4), edition));
            offset += 4;
        }
        return new IntArrayPayload(payloads);
    }

    fromSNBTValue(value: string): IntArrayPayload {
        return IntArrayPayload.fromSNBTValue(value);
    }

    fromUint8Array(data: Uint8Array, edition: Edition): IntArrayPayload {
        return IntArrayPayload.fromUint8Array(data, edition);
    }

    copy(): IntArrayPayload {
        return new IntArrayPayload(this.value);
    }

    equals(other: IPayload<any>): boolean {
        return other instanceof IntArrayPayload && this.value.every((payload, index) => payload.equals(this.value[index]));
    }

    getValue(): IntPayload[] {
        return this.value;
    }

    getValueDeep(): number[] {
        return this.value.map(payload => payload.getValueDeep());
    }

    getTagId(): TagId {
        return IntArrayPayload.getTagId();
    }

    setValue(value: IntPayload[]): void {
        if (value.length >= 2 ** 31)
            throw new NBTError('Int array is too long');
        this.value = value;
    }

    toSNBTValue(compression: SNBTCompression): string {
        let string = '[I;';
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
        return TagId.INT_ARRAY;
    }
}