import {Edition} from './FileFormat'

export function concatUint8Arrays(...arrays: Uint8Array[]) {
    let totalLength = 0;
    for (let arr of arrays) {
        totalLength += arr.length;
    }
    let result = new Uint8Array(totalLength);
    let offset = 0;
    for (let arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}

export function isLittleEndian(edition: Edition): boolean {
    return edition === 'bedrock';
}
