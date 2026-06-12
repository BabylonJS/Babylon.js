/* eslint-disable @typescript-eslint/naming-convention, jsdoc/require-param, jsdoc/require-returns */
import { type FBXDocument, type FBXNode, type FBXProperty, type FBXPropertyType } from "../types/fbxTypes";
import { inflateZlib } from "./zlibInflate";

const FBX_MAGIC = "Kaydara FBX Binary  \0";
const HEADER_SIZE = 27; // 21 magic + 2 padding + 4 version uint32

/**
 * Parse a binary FBX file into an FBXDocument.
 * Supports FBX versions 7.0–7.7 (v7.5+ uses 64-bit node headers).
 */
export function parseBinaryFBX(buffer: ArrayBuffer): FBXDocument {
    const view = new DataView(buffer);
    const bytes = new Uint8Array(buffer);

    // Validate magic
    const magic = decodeASCII(bytes, 0, 21);
    if (magic !== FBX_MAGIC) {
        throw new Error("Not a valid binary FBX file");
    }
    if (buffer.byteLength < HEADER_SIZE) {
        throw new Error("Truncated binary FBX header");
    }

    const version = view.getUint32(23, true);
    // v7.5+ uses 64-bit offsets in node records
    const is64Bit = version >= 7500;

    const nodes: FBXNode[] = [];
    let offset = HEADER_SIZE;

    while (offset < buffer.byteLength) {
        const result = parseNode(view, bytes, offset, is64Bit, buffer.byteLength);
        if (result === null) {
            break; // null sentinel node
        }
        nodes.push(result.node);
        offset = result.endOffset;
    }

    return { version, nodes };
}

interface ParsedNode {
    node: FBXNode;
    endOffset: number;
}

function parseNode(view: DataView, bytes: Uint8Array, offset: number, is64Bit: boolean, limit: number): ParsedNode | null {
    // Read node header
    let endOffset: number;
    let numProperties: number;
    let propertyListLen: number;
    let headerSize: number;

    if (is64Bit) {
        ensureRange(bytes, offset, 25, limit, "FBX node header");
        endOffset = readUint64AsNumber(view, offset);
        numProperties = readUint64AsNumber(view, offset + 8);
        propertyListLen = readUint64AsNumber(view, offset + 16);
        headerSize = 25; // 8+8+8+1 (nameLen byte)
    } else {
        ensureRange(bytes, offset, 13, limit, "FBX node header");
        endOffset = view.getUint32(offset, true);
        numProperties = view.getUint32(offset + 4, true);
        propertyListLen = view.getUint32(offset + 8, true);
        headerSize = 13; // 4+4+4+1 (nameLen byte)
    }

    // Null sentinel: all header fields are zero
    if (endOffset === 0) {
        return null;
    }
    if (endOffset <= offset || endOffset > limit) {
        throw new Error(`Invalid FBX node end offset ${endOffset} at offset ${offset}`);
    }

    const nameLen = bytes[offset + headerSize - 1];
    ensureRange(bytes, offset + headerSize, nameLen, endOffset, "FBX node name");
    const name = decodeASCII(bytes, offset + headerSize, nameLen);

    let cursor = offset + headerSize + nameLen;
    const propertiesStart = cursor;
    const propertiesEnd = propertiesStart + propertyListLen;
    if (propertiesEnd > endOffset) {
        throw new Error(`Invalid FBX property list length for node '${name}' at offset ${offset}`);
    }

    // Parse properties
    const properties: FBXProperty[] = [];
    for (let i = 0; i < numProperties; i++) {
        const result = parseProperty(view, bytes, cursor, propertiesEnd);
        properties.push(result.property);
        cursor = result.nextOffset;
    }
    if (cursor !== propertiesEnd) {
        throw new Error(`Invalid FBX property list length for node '${name}' at offset ${offset}`);
    }

    // Parse nested child nodes (between end of properties and endOffset)
    const children: FBXNode[] = [];
    if (cursor < endOffset) {
        while (cursor < endOffset) {
            const child = parseNode(view, bytes, cursor, is64Bit, endOffset);
            if (child === null) {
                break;
            }
            if (child.endOffset <= cursor || child.endOffset > endOffset) {
                throw new Error(`Invalid FBX child node end offset ${child.endOffset} at offset ${cursor}`);
            }
            children.push(child.node);
            cursor = child.endOffset;
        }
    }

    return {
        node: { name, properties, children },
        endOffset,
    };
}

interface ParsedProperty {
    property: FBXProperty;
    nextOffset: number;
}

function parseProperty(view: DataView, bytes: Uint8Array, offset: number, limit: number): ParsedProperty {
    ensureRange(bytes, offset, 1, limit, "FBX property type");
    const typeCode = String.fromCharCode(bytes[offset]);
    offset += 1;

    switch (typeCode) {
        case "C": {
            // Boolean (1 byte)
            ensureRange(bytes, offset, 1, limit, "FBX boolean property");
            const value = bytes[offset] !== 0;
            return { property: { type: "boolean", value }, nextOffset: offset + 1 };
        }
        case "Y": {
            // Int16
            ensureRange(bytes, offset, 2, limit, "FBX int16 property");
            const value = view.getInt16(offset, true);
            return { property: { type: "int16", value }, nextOffset: offset + 2 };
        }
        case "I": {
            // Int32
            ensureRange(bytes, offset, 4, limit, "FBX int32 property");
            const value = view.getInt32(offset, true);
            return { property: { type: "int32", value }, nextOffset: offset + 4 };
        }
        case "F": {
            // Float32
            ensureRange(bytes, offset, 4, limit, "FBX float32 property");
            const value = view.getFloat32(offset, true);
            return { property: { type: "float32", value }, nextOffset: offset + 4 };
        }
        case "D": {
            // Float64
            ensureRange(bytes, offset, 8, limit, "FBX float64 property");
            const value = view.getFloat64(offset, true);
            return { property: { type: "float64", value }, nextOffset: offset + 8 };
        }
        case "L": {
            // Int64
            ensureRange(bytes, offset, 8, limit, "FBX int64 property");
            const value = readInt64AsNumber(view, offset);
            return { property: { type: "int64", value }, nextOffset: offset + 8 };
        }
        case "S": {
            // String (uint32 length + data)
            ensureRange(bytes, offset, 4, limit, "FBX string property length");
            const len = view.getUint32(offset, true);
            ensureRange(bytes, offset + 4, len, limit, "FBX string property data");
            const value = decodeUTF8(bytes, offset + 4, len);
            return { property: { type: "string", value }, nextOffset: offset + 4 + len };
        }
        case "R": {
            // Raw binary data (uint32 length + data)
            ensureRange(bytes, offset, 4, limit, "FBX raw property length");
            const len = view.getUint32(offset, true);
            ensureRange(bytes, offset + 4, len, limit, "FBX raw property data");
            const value = bytes.slice(offset + 4, offset + 4 + len);
            return { property: { type: "raw", value }, nextOffset: offset + 4 + len };
        }
        // Array types
        case "f":
            return parseArrayProperty(view, bytes, offset, "float32[]", 4, limit);
        case "d":
            return parseArrayProperty(view, bytes, offset, "float64[]", 8, limit);
        case "i":
            return parseArrayProperty(view, bytes, offset, "int32[]", 4, limit);
        case "l":
            return parseArrayProperty(view, bytes, offset, "int64[]", 8, limit);
        case "b":
            return parseArrayProperty(view, bytes, offset, "boolean[]", 1, limit);
        default:
            throw new Error(`Unknown FBX property type: '${typeCode}' at offset ${offset - 1}`);
    }
}

function parseArrayProperty(view: DataView, bytes: Uint8Array, offset: number, type: FBXPropertyType, elementSize: number, limit: number): ParsedProperty {
    ensureRange(bytes, offset, 12, limit, `FBX array property header for ${type}`);
    const arrayLength = view.getUint32(offset, true);
    const encoding = view.getUint32(offset + 4, true); // 0=raw, 1=zlib
    const compressedLength = view.getUint32(offset + 8, true);
    offset += 12;
    const expectedByteLength = arrayLength * elementSize;
    ensureRange(bytes, offset, compressedLength, limit, `FBX array property data for ${type}`);

    let arrayData: Uint8Array;
    if (encoding === 1) {
        // zlib compressed
        const compressed = bytes.subarray(offset, offset + compressedLength);
        arrayData = inflateZlib(compressed, expectedByteLength);
    } else {
        if (encoding !== 0) {
            throw new Error(`Unsupported FBX array encoding: ${encoding}`);
        }
        if (compressedLength !== expectedByteLength) {
            throw new Error(`Invalid FBX array byte length for ${type}`);
        }
        arrayData = bytes.slice(offset, offset + compressedLength);
    }

    const arrayBuffer = arrayData.buffer.slice(arrayData.byteOffset, arrayData.byteOffset + arrayData.byteLength);

    let value: Float32Array | Float64Array | Int32Array | Uint8Array;
    switch (type) {
        case "float32[]":
            value = new Float32Array(arrayBuffer);
            break;
        case "float64[]":
            value = new Float64Array(arrayBuffer);
            break;
        case "int32[]":
            value = new Int32Array(arrayBuffer);
            break;
        case "boolean[]":
            value = arrayData;
            break;
        case "int64[]":
            value = readInt64ArrayData(arrayData);
            break;
        default:
            throw new Error(`Unexpected array type: ${type}`);
    }

    return {
        property: { type, value },
        nextOffset: offset + compressedLength,
    };
}

function ensureRange(bytes: Uint8Array, offset: number, byteLength: number, limit: number, context: string): void {
    if (offset < 0 || byteLength < 0 || offset + byteLength > limit || offset + byteLength > bytes.byteLength) {
        throw new Error(`${context}: unexpected end of input`);
    }
}

function readUint64AsNumber(view: DataView, offset: number): number {
    const low = view.getUint32(offset, true);
    const high = view.getUint32(offset + 4, true);
    return high * 0x100000000 + low;
}

function readInt64AsNumber(view: DataView, offset: number): number {
    const low = view.getUint32(offset, true);
    const high = view.getInt32(offset + 4, true);
    return high * 0x100000000 + low;
}

function readInt64ArrayData(arrayData: Uint8Array): Float64Array {
    const view = new DataView(arrayData.buffer, arrayData.byteOffset, arrayData.byteLength);
    const values = new Float64Array(arrayData.byteLength / 8);
    for (let i = 0; i < values.length; i++) {
        values[i] = readInt64AsNumber(view, i * 8);
    }
    return values;
}

function decodeASCII(bytes: Uint8Array, offset: number, length: number): string {
    let result = "";
    for (let i = 0; i < length; i++) {
        result += String.fromCharCode(bytes[offset + i]);
    }
    return result;
}

function decodeUTF8(bytes: Uint8Array, offset: number, length: number): string {
    const decoder = new TextDecoder("utf-8");
    return decoder.decode(bytes.subarray(offset, offset + length));
}
