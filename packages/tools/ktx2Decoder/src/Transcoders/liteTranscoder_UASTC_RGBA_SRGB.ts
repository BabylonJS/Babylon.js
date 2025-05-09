// eslint-disable-next-line @typescript-eslint/naming-convention
import * as KTX2 from "core/Materials/Textures/ktx2decoderTypes";

import { LiteTranscoder } from "./liteTranscoder";
import type { KTX2FileReader, IKTX2_ImageDesc } from "../ktx2FileReader";

/**
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class LiteTranscoder_UASTC_RGBA_SRGB extends LiteTranscoder {
    /**
     * URL to use when loading the wasm module for the transcoder (srgb)
     */
    public static WasmModuleURL = "https://cdn.babylonjs.com/ktx2Transcoders/1/uastc_rgba8_srgb_v2.wasm";

    /**
     * Binary data of the wasm module
     */
    public static WasmBinary: ArrayBuffer | null = null;

    public static override CanTranscode(src: KTX2.SourceTextureFormat, dst: KTX2.TranscodeTarget, isInGammaSpace: boolean): boolean {
        return src === KTX2.SourceTextureFormat.UASTC4x4 && dst === KTX2.TranscodeTarget.RGBA32 && isInGammaSpace;
    }

    public static override Name = "UniversalTranscoder_UASTC_RGBA_SRGB";

    public override getName(): string {
        return LiteTranscoder_UASTC_RGBA_SRGB.Name;
    }

    public override initialize(): void {
        super.initialize();
        this._transcodeInPlace = false;
        this.setModulePath(LiteTranscoder_UASTC_RGBA_SRGB.WasmModuleURL, LiteTranscoder_UASTC_RGBA_SRGB.WasmBinary);
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    public override async transcode(
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
        const moduleWrapper = await this._loadModuleAsync();
        const transcoder: any = moduleWrapper.module;
        const [, uncompressedTextureView] = this._prepareTranscoding(width, height, uncompressedByteLength, encodedData, 4);

        return transcoder.decode(width, height) === 0 ? uncompressedTextureView!.slice() : null;
    }
}
