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

    public static WasmBaseUrl = "";

    public static GetWasmUrl(wasmUrl: string) {
        if (Transcoder.WasmBaseUrl && wasmUrl.startsWith("https://cdn.babylonjs.com")) {
            // Normalize the base url
            const baseUrl =
                Transcoder.WasmBaseUrl[Transcoder.WasmBaseUrl.length - 1] === "/" ? Transcoder.WasmBaseUrl.substring(0, Transcoder.WasmBaseUrl.length - 1) : Transcoder.WasmBaseUrl;
            wasmUrl = wasmUrl.replace("https://cdn.babylonjs.com", baseUrl);
        }
        return wasmUrl;
    }

    public getName(): string {
        return Transcoder.Name;
    }

    public initialize(): void {}

    public needMemoryManager(): boolean {
        return false;
    }

    public setMemoryManager(memoryMgr: WASMMemoryManager): void {}

    public async transcode(
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
        return null;
    }
}
