import { Nullable } from './types';
import { WASMMemoryManager } from './wasmMemoryManager';
import { KTX2FileReader, IKTX2_ImageDesc } from './KTX2FileReader';

/**
 * @hidden
 */
export enum sourceTextureFormat {
    ETC1S,
    UASTC4x4
}

/**
 * @hidden
 */
export enum transcodeTarget {
    ASTC_4x4_RGBA,
    BC7_M5_RGBA,
    BC3_RGBA,
    BC1_RGB,
    PVRTC1_4_RGBA,
    PVRTC1_4_RGB,
    ETC2_RGBA,
    ETC1_RGB,
    RGBA32
}

/**
 * @hidden
 */
export class Transcoder {

    public static CanTranscode(src: sourceTextureFormat, dst: transcodeTarget): boolean {
        return false;
    }

    public initialize(): void {
    }

    public needMemoryManager(): boolean {
        return false;
    }

    public setMemoryManager(memoryMgr: WASMMemoryManager): void {
    }

    public transcode(src: sourceTextureFormat, dst: transcodeTarget, level: number, width: number, height: number, uncompressedByteLength: number, ktx2Reader: KTX2FileReader, imageDesc: Nullable<IKTX2_ImageDesc>, encodedData: Uint8Array): Promise<Nullable<Uint8Array>> {
        return Promise.resolve(null);
    }
}
