/* eslint-disable @typescript-eslint/naming-convention */
import type { Nullable } from "core/types";
import type { DataCursor } from "./exrLoader.core";

export const INT32_SIZE = 4;
export const FLOAT32_SIZE = 4;
export const INT8_SIZE = 1;
export const INT16_SIZE = 2;
export const ULONG_SIZE = 8;
export const USHORT_RANGE = 1 << 16;
export const BITMAP_SIZE = USHORT_RANGE >> 3;
export const HUF_ENCBITS = 16;
export const HUF_DECBITS = 14;
export const HUF_ENCSIZE = (1 << HUF_ENCBITS) + 1;
export const HUF_DECSIZE = 1 << HUF_DECBITS;
export const HUF_DECMASK = HUF_DECSIZE - 1;
export const SHORT_ZEROCODE_RUN = 59;
export const LONG_ZEROCODE_RUN = 63;
export const SHORTEST_LONG_RUN = 2 + LONG_ZEROCODE_RUN - SHORT_ZEROCODE_RUN;

export interface IEXRCHannel {
    name: string;
    pixelType: number;
}

export interface IDecodeChannel {
    [name: string]: number;
}

/**
 * Interface used to define the EXR header
 */
export interface IEXRHeader {
    /** Version */
    version: number;
    /** Specifications */
    spec: {
        singleTile: boolean;
        longName: boolean;
        deepFormat: boolean;
        multiPart: boolean;
    };
    /** Data window */
    dataWindow: {
        xMin: number;
        xMax: number;
        yMin: number;
        yMax: number;
    };
    /** Channels */
    channels: IEXRCHannel[];
    /** Extra data */
    [name: string]: any;
}

export interface IEXRDecoder {
    size: number;
    viewer: DataView;
    array: Uint8Array;
    byteArray: Nullable<Float32Array | Uint16Array>;
    offset: DataCursor;
    width: number;
    height: number;
    channels: number;
    channelLineOffsets: IDecodeChannel;
    scanOrder: (value: number) => number;
    bytesPerLine: number;
    outLineWidth: number;
    lines: number;
    scanlineBlockSize: number;
    inputSize: Nullable<number>;
    type: number;
    uncompress: Nullable<(decoder: IEXRDecoder) => DataView>;
    getter: (dataView: DataView, offset: DataCursor) => number;
    format: number;
    outputChannels: number;
    decodeChannels: IDecodeChannel;
    blockCount: Nullable<number>;
    linearSpace: boolean;
    textureType: number;
}
