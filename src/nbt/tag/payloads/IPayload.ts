import TagId from '../TagId'
import {Edition, SNBTCompression} from '../../FileFormat'

export interface IPayload<T> {
    fromSNBTValue(value: string): any;

    fromUint8Array(data: Uint8Array, edition: Edition): any;

    toSNBTValue(compression: SNBTCompression): string;

    toUint8Array(edition: Edition): Uint8Array;

    copy(): any;

    equals(other: IPayload<any>): boolean;

    getValue(): T;

    getValueDeep(): any;

    setValue(value: T): void;

    getTagId(): TagId;
}