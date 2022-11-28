import { sourceTextureFormat, transcodeTarget } from "../transcoder";
import { LiteTranscoder } from "./liteTranscoder";
import type { KTX2FileReader, IKTX2_ImageDesc } from "../ktx2FileReader";

/**
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class LiteTranscoder_UASTC_RG8_UNORM extends LiteTranscoder {
    /**
     * URL to use when loading the wasm module for the transcoder (srgb)
     */
    public static WasmModuleURL = "https://preview.babylonjs.com/ktx2Transcoders/1/uastc_rg8_unorm.wasm";

    public static CanTranscode(src: sourceTextureFormat, dst: transcodeTarget, isInGammaSpace: boolean): boolean {
        return src === sourceTextureFormat.UASTC4x4 && dst === transcodeTarget.RG8;
    }

    public static Name = "UniversalTranscoder_UASTC_RG8_UNORM";

    public getName(): string {
        return LiteTranscoder_UASTC_RG8_UNORM.Name;
    }

    public initialize(): void {
        super.initialize();
        this._transcodeInPlace = false;
        this.setModulePath(LiteTranscoder_UASTC_RG8_UNORM.WasmModuleURL);
    }

    public transcode(
        src: sourceTextureFormat,
        dst: transcodeTarget,
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
            const [, uncompressedTextureView] = this._prepareTranscoding(width, height, uncompressedByteLength, encodedData, 2);

            return transcoder.decode(width, height) === 0 ? uncompressedTextureView!.slice() : null;
        });
    }
}
