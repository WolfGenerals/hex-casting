import {IPayload} from './IPayload'
import TagId, {getPayloadType, getPayloadTypeBySNBTValue} from '../TagId'
import {Edition, SNBTCompression} from '../../FileFormat'
import NBTError from '../../NBTError'
import {concatUint8Arrays} from '../../utils'
import IntPayload from "./IntPayload"

export default class ListPayload implements IPayload<IPayload<any>[]> {
    private value: IPayload<any>[];

    constructor(value: IPayload<any>[]) {
        if (value.length >= 2 ** 31)
            throw new NBTError('List is too long');
        if (value.length > 0 && value.some(payload => payload.getTagId() !== value[0].getTagId()))
            throw new NBTError('List contains different types');
        this.value = value;
    }

    static fromSNBTValue(value: string): ListPayload {
        value = value.trim();
        if (!value.startsWith('[') || !value.endsWith(']'))
            throw new Error('Invalid compound SNBT value');
        const payloads: IPayload<any>[] = [];
        type DepthType = 'none' | 'list' | 'compound' | '"string"' | "'string'";
        let depth: DepthType[] = [];
        let payloadStr = '';
        for (let i = 1; i < value.length - 1; i++) {
            const char = value.charAt(i);
            const prevChar = i - 1 < 1 ? '' : value.charAt(i - 1);
            const nextChar = i + 1 >= value.length - 1 ? '' : value.charAt(i + 1);
            // 深度
            switch (char) {
                case '{':
                    if (!depth[depth.length - 1] || !depth[depth.length - 1].includes('string'))
                        depth.push('compound');
                    break;
                case '[':
                    if (!depth[depth.length - 1] || !depth[depth.length - 1].includes('string'))
                        depth.push('list');
                    break;
                case '"':
                    if (depth[depth.length - 1] === '"string"') {
                        if (prevChar !== '\\') {
                            depth.pop();
                        }
                    } else if (depth[depth.length - 1] !== '"string"') depth.push('"string"');
                    break;
                case "'":
                    if (depth[depth.length - 1] === "'string'") {
                        if (prevChar !== '\\') {
                            depth.pop()
                        }
                    } else if (depth[depth.length - 1] !== "'string'") depth.push("'string'");
                    break;
                case ']':
                    if (depth[depth.length - 1] === 'list') {
                        depth.pop();
                    }
                    break;
                case '}':
                    if (depth[depth.length - 1] === 'compound')
                        depth.pop();
                    break;
            }
            if (depth.length > 0) {
                payloadStr += char;
            } else {
                const addPayload = () => {
                    const Type = getPayloadTypeBySNBTValue(payloadStr);
                    payloads.push(Type.fromSNBTValue(payloadStr));
                    payloadStr = '';
                }
                if (char === ' ')
                    continue;
                else if (char === ',')
                    addPayload();
                else {
                    payloadStr += char;
                    if (nextChar === '')
                        addPayload();
                }
            }
        }
        return new ListPayload(payloads);
    }

    static fromUint8Array(data: Uint8Array, edition: Edition): ListPayload {
        const payloads: IPayload<any>[] = [];
        const length = IntPayload.fromUint8Array(data.slice(1, 5), edition).getValue();
        if (length > 0) {
            const Type = getPayloadType(data[0]);
            let offset = 5;
            for (let i = 0; i < length; i++) {
                const payload = Type.fromUint8Array(data.slice(offset), edition);
                payloads.push(payload);
                offset += payload.toUint8Array(edition).length;
            }
        }
        return new ListPayload(payloads);
    }

    fromSNBTValue(value: string): ListPayload {
        return ListPayload.fromSNBTValue(value);
    }

    fromUint8Array(data: Uint8Array, edition: Edition): ListPayload {
        return ListPayload.fromUint8Array(data, edition);
    }

    copy(): ListPayload {
        return new ListPayload(this.value);
    }

    equals(other: IPayload<any>): boolean {
        return other instanceof ListPayload && this.value.every((payload, index) => payload.equals(this.value[index]));
    }

    getValue(): IPayload<any>[] {
        return this.value;
    }

    getValueDeep(): any {
        return this.value.map(payload => payload.getValueDeep());
    }

    getTagId(): TagId {
        return ListPayload.getTagId();
    }

    setValue(value: IPayload<any>[]): void {
        if (value.length >= 2 ** 31)
            throw new NBTError('List is too long');
        if (value.length > 0 && value.some(payload => payload.getTagId() !== value[0].getTagId()))
            throw new NBTError('List contains different types');
        this.value = value;
    }

    toSNBTValue(compression: SNBTCompression): string {
        let string = '[';
        if (this.value.length > 0) {
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
            this.value.length === 0 ? new Uint8Array([0]) : new Uint8Array([this.value[0].getTagId()]), // 数据类型
            new IntPayload(this.value.length).toUint8Array(edition), // 长度
            ...this.value.map(payload => payload.toUint8Array(edition))
        );
    }

    static getTagId(): TagId {
        return TagId.LIST;
    }
}