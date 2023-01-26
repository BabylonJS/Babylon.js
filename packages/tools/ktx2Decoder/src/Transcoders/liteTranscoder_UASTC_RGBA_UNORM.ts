import * as KTX2 from "core/Materials/Textures/ktx2decoderTypes";

import { LiteTranscoder } from "./liteTranscoder";
import type { KTX2FileReader, IKTX2_ImageDesc } from "../ktx2FileReader";

/**
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class LiteTranscoder_UASTC_RGBA_UNORM extends LiteTranscoder {
    /**
     * URL to use when loading the wasm module for the transcoder (unorm)
     */
    public static WasmModuleURL = "https://preview.babylonjs.com/ktx2Transcoders/1/uastc_rgba8_unorm_v2.wasm";

    public static CanTranscode(src: KTX2.SourceTextureFormat, dst: KTX2.TranscodeTarget, isInGammaSpace: boolean): boolean {
        return src === KTX2.SourceTextureFormat.UASTC4x4 && dst === KTX2.TranscodeTarget.RGBA32 && !isInGammaSpace;
    }

    public static Name = "UniversalTranscoder_UASTC_RGBA_UNORM";

    public getName(): string {
        return LiteTranscoder_UASTC_RGBA_UNORM.Name;
    }

    public initialize(): void {
        super.initialize();
        this._transcodeInPlace = false;
        this.setModulePath(LiteTranscoder_UASTC_RGBA_UNORM.WasmModuleURL);
    }

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
        return this._loadModule().then((moduleWrapper: any) => {
            const transcoder: any = moduleWrapper.module;
            const [, uncompressedTextureView] = this._prepareTranscoding(width, height, uncompressedByteLength, encodedData, 4);

            return transcoder.decode(width, height) === 0 ? uncompressedTextureView!.slice() : null;
        });
    }
}
