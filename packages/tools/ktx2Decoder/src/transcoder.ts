/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/naming-convention */
import type * as KTX2 from "core/Materials/Textures/ktx2decoderTypes";

import type { WASMMemoryManager } from "./wasmMemoryManager";
import type { KTX2FileReader, IKTX2_ImageDesc } from "./ktx2FileReader";

/**
 * @internal
 */
export class Transcoder {
    public static CanTranscode(src: KTX2.SourceTextureFormat, dst: KTX2.TranscodeTarget, isInGammaSpace: boolean): boolean {
        return false;
    }

    public static Name = "Transcoder";

    public getName(): string {
        return Transcoder.Name;
    }

    public initialize(): void {}

    public needMemoryManager(): boolean {
        return false;
    }

    public setMemoryManager(memoryMgr: WASMMemoryManager): void {}

    public transcode(
        src: KTX2.SourceTextureFormat,
        dst: KTX2.TranscodeTarget,
        level: number,
        width: number,
        height: number,
        uncompressedByteLength: number,
        ktx2Reader: KTX2FileReader,
        imageDesc: IKTX2_ImageDesc | null,
        encodedData: Uint8Array
    ): Promise<Uint8Array | null> {
        return Promise.resolve(null);
    }
}
