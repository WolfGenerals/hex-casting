import {IPayload} from './IPayload'
import TagId, {getPayloadTypeBySNBTValue} from '../TagId'
import {Edition, SNBTCompression} from '../../FileFormat'
import {concatUint8Arrays} from '../../utils'
import {Tag} from "../Tag"
import NBTError from "../../NBTError"

export default class CompoundPayload implements IPayload<Tag[]> {
    private value: Tag[];

    constructor(value: Tag[]) {
        this.value = value;
    }

    static fromSNBTValue(value: string): CompoundPayload {
        value = value.trim();
        if (!value.startsWith('{') || !value.endsWith('}'))
            throw new Error('Invalid compound SNBT value');
        const tags: Tag[] = [];
        let mode: 'name' | 'after-name' | 'payload' = 'name';
        let nameMode: '?' | '' | '"' | "'" = '?'
        type DepthType = 'none' | 'list' | 'compound' | '"string"' | "'string'";
        let depth: DepthType[] = [];
        let name = '';
        let payloadStr = '';
        for (let i = 1; i < value.length - 1; i++) {
            const char = value.charAt(i);
            const prevChar = i - 1 < 1 ? '' : value.charAt(i - 1);
            const nextChar = i + 1 >= value.length - 1 ? '' : value.charAt(i + 1);
            switch (mode) {
                case "name":
                    switch (nameMode) {
                        case '?':
                            if (char === "'") {
                                nameMode = "'";
                            } else if (char === '"') {
                                nameMode = '"';
                            } else if (char === ' ') {
                                continue;
                            } else if (/[a-zA-Z0-9_\-.+]/.test(char)) {
                                nameMode = ''
                                name += char;
                            } else {
                                throw new NBTError('Wrong SNBT format');
                            }
                            break;
                        case '"':
                            if (char === '"') {
                                if (prevChar === '\\')
                                    name += char;
                                else {
                                    nameMode = '?';
                                    mode = 'after-name';
                                }
                            } else if (char === '\\') {
                                if (nextChar === '"')
                                    continue;
                                else
                                    name += char;
                            } else {
                                name += char;
                            }
                            break;
                        case "'":
                            if (char === "'") {
                                if (prevChar === '\\')
                                    name += char;
                                else {
                                    nameMode = '?';
                                    mode = 'after-name'
                                }
                            } else if (char === '\\') {
                                if (nextChar === "'")
                                    continue;
                                else
                                    name += char;
                            } else {
                                name += char;
                            }
                            break;
                        case '':
                            if (/[a-zA-Z0-9_\-.+]/.test(char))
                                name += char;
                            else {
                                nameMode = '?';
                                mode = 'after-name';
                                i--;
                            }
                    }
                    break;
                case 'after-name':
                    if (char === ':')
                        mode = 'payload';
                    else if (char === ' ')
                        continue;
                    else
                        throw new NBTError('Wrong SNBT format');
                    break;
                case "payload":
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
                        const addTag = () => {
                            const Type = getPayloadTypeBySNBTValue(payloadStr);
                            tags.push(new Tag(name, Type.fromSNBTValue(payloadStr)));
                            payloadStr = '';
                            mode = 'name';
                            name = '';
                        }
                        if (char === ' ')
                            continue;
                        else if (char === ',')
                            addTag();
                        else {
                            payloadStr += char;
                            if (nextChar === '')
                                addTag();
                        }
                    }
            }
        }
        return new CompoundPayload(tags);
    }

    static fromUint8Array(data: Uint8Array, edition: Edition): CompoundPayload {
        const tags: Tag[] = [];
        for (let i = 0; i < data.length;) {
            const sliced = data.slice(i);
            if (sliced[0] === TagId.END)
                break;
            const tag = Tag.fromUint8Array(sliced, edition);
            tags.push(tag);
            i += tag.toUint8Array(edition).length;
        }
        return new CompoundPayload(tags);
    }

    hasTagName(name: string): boolean {
        return this.value.some(tag => tag.getTagName() === name);
    }

    hasTag(tag: Tag): boolean {
        return this.value.some(t => t.equals(tag));
    }

    fromSNBTValue(value: string): CompoundPayload {
        return CompoundPayload.fromSNBTValue(value);
    }

    fromUint8Array(data: Uint8Array, edition: Edition): CompoundPayload {
        return CompoundPayload.fromUint8Array(data, edition);
    }

    copy(): CompoundPayload {
        return new CompoundPayload(this.value);
    }

    equals(other: IPayload<any>): boolean {
        return other instanceof CompoundPayload && this.value.every((tag, index) => tag.equals(this.value[index]));
    }

    getValue(): Tag[] {
        return this.value;
    }

    getValueDeep(): any {
        const data: any = {}
        this.value.forEach(tag => data[tag.getTagName()] = tag.getPayload().getValueDeep());
        return data
    }

    getTagId(): TagId {
        return CompoundPayload.getTagId();
    }

    setValue(value: Tag[]): void {
        this.value = value;
    }

    toSNBTValue(compression: SNBTCompression): string {
        let string = '{';
        if (this.value.length > 0) {
            for (let i = 0; i < this.value.length - 1; i++) {
                string += this.value[i].toSNBT(compression) + ',' + (compression === 'formated' ? ' ' : '');
            }
            string += this.value[this.value.length - 1].toSNBT(compression);
        }
        string += '}';
        return string;
    }

    toUint8Array(edition: Edition): Uint8Array {
        return concatUint8Arrays(
            ...this.value.map(tag => tag.toUint8Array(edition)),
            new Uint8Array([0])
        );
    }

    static getTagId(): TagId {
        return TagId.COMPOUND;
    }
}