import LongArrayPayload from "./payloads/LongArrayPayload"
import IntArrayPayload from "./payloads/IntArrayPayload"
import ListPayload from "./payloads/ListPayload"
import BytePayload from "./payloads/BytePayload"
import ShortPayload from "./payloads/ShortPayload"
import IntPayload from "./payloads/IntPayload"
import LongPayload from "./payloads/LongPayload"
import FloatPayload from "./payloads/FloatPayload"
import DoublePayload from "./payloads/DoublePayload"
import StringPayload from "./payloads/StringPayload"
import ByteArrayPayload from "./payloads/ByteArrayPayload"
import CompoundPayload from "./payloads/CompoundPayload"
import NBTError from "../NBTError"

enum TagId {
    END = 0x00,
    BYTE = 0x01,
    SHORT = 0x02,
    INT = 0x03,
    LONG = 0x04,
    FLOAT = 0x05,
    DOUBLE = 0x06,
    BYTE_ARRAY = 0x07,
    STRING = 0x08,
    LIST = 0x09,
    COMPOUND = 0x0a,
    INT_ARRAY = 0x0b,
    LONG_ARRAY = 0x0c
}

export const payloadTypes = [
    BytePayload,
    ShortPayload,
    IntPayload,
    LongPayload,
    FloatPayload,
    DoublePayload,
    ByteArrayPayload,
    StringPayload,
    ListPayload,
    CompoundPayload,
    IntArrayPayload,
    LongArrayPayload
];

export function getPayloadType(tagId: TagId): any {
    const type = payloadTypes.find((payloadType) => payloadType.getTagId() === tagId);
    if (!type) throw new NBTError("Unknown payload type");
    return type;
}

export function getPayloadTypeBySNBTValue(value: string): any {
    value = value.trim();
    if (value.startsWith('{') && value.endsWith('}'))
        return getPayloadType(TagId.COMPOUND);
    else if (value.startsWith('[') && value.endsWith(']')) {
        value = value.replace(' ', '');
        if (value.startsWith('[B;'))
            return getPayloadType(TagId.BYTE_ARRAY);
        else if (value.startsWith('[I;'))
            return getPayloadType(TagId.INT_ARRAY);
        else if (value.startsWith('[L;'))
            return getPayloadType(TagId.LONG_ARRAY);
        else return getPayloadType(TagId.LIST);
    } else if (value === 'false' || value === 'true')
        return getPayloadType(TagId.BYTE);
    const lastChar = value[value.length - 1];
    if (lastChar === 'b' || lastChar === 'B')
        return getPayloadType(TagId.BYTE);
    else if (lastChar === 's' || lastChar === 'S')
        return getPayloadType(TagId.SHORT);
    else if (lastChar === 'l' || lastChar === 'L')
        return getPayloadType(TagId.LONG);
    else if (lastChar === 'f' || lastChar === 'F')
        return getPayloadType(TagId.FLOAT);
    else if (lastChar === 'd' || lastChar === 'D' || /[-+]?(?:[0-9]+[.]|[0-9]*[.][0-9]+)(?:e[-+]?[0-9]+)?/.test(value))
        return getPayloadType(TagId.DOUBLE);
    else if (/[-+]?(?:0|[1-9][0-9]*)/.test(value) && -(2 ** 31) < Number(value) && Number(value) < (2 ** 31 - 1))
        return getPayloadType(TagId.INT);
    else return getPayloadType(TagId.STRING);
}

export default TagId;