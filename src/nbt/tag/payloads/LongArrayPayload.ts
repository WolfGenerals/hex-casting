import {IPayload} from './IPayload'
import TagId from '../TagId'
import {Edition, SNBTCompression} from '../../FileFormat'
import NBTError from '../../NBTError'
import {concatUint8Arrays} from '../../utils'
import LongPayload from "./LongPayload"
import IntPayload from "./IntPayload"

export default class LongArrayPayload implements IPayload<LongPayload[]> {
    private value: LongPayload[];

    constructor(value: LongPayload[]) {
        if (value.length >= 2 ** 31)
            throw new NBTError('Long array is too long');
        this.value = value;
    }

    static fromSNBTValue(value: string): LongArrayPayload {
        value = value.replace(' ', '').trim();
        const longs = value.replace('[L;', '').replace(']', '').split(',');
        const payloads: LongPayload[] = [];
        longs.forEach((value, index) => payloads[index] = LongPayload.fromSNBTValue(value));
        return new LongArrayPayload(payloads);
    }

    static fromUint8Array(data: Uint8Array, edition: Edition): LongArrayPayload {
        const payloads: LongPayload[] = [];
        const length = IntPayload.fromUint8Array(data.slice(0, 4), edition).getValue();
        let offset = 4;
        for (let i = 0; i < length; i++) {
            payloads.push(LongPayload.fromUint8Array(data.slice(offset, offset + 8), edition));
            offset += 8;
        }
        return new LongArrayPayload(payloads);
    }

    fromSNBTValue(value: string): LongArrayPayload {
        return LongArrayPayload.fromSNBTValue(value);
    }

    fromUint8Array(data: Uint8Array, edition: Edition): LongArrayPayload {
        return LongArrayPayload.fromUint8Array(data, edition);
    }

    copy(): LongArrayPayload {
        return new LongArrayPayload(this.value);
    }

    equals(other: IPayload<any>): boolean {
        return other instanceof LongArrayPayload && this.value.every((payload, index) => payload.equals(this.value[index]));
    }

    getValue(): LongPayload[] {
        return this.value;
    }

    getValueDeep(): bigint[] {
        return this.value.map(payload => payload.getValueDeep());
    }

    getTagId(): TagId {
        return LongArrayPayload.getTagId();
    }

    setValue(value: LongPayload[]): void {
        if (value.length >= 2 ** 31)
            throw new NBTError('Long array is too long');
        this.value = value;
    }

    toSNBTValue(compression: SNBTCompression): string {
        let string = '[L;' + (compression === 'formated' ? ' ' : '');
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
        return TagId.LONG_ARRAY;
    }
}