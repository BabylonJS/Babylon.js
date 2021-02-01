import { sourceTextureFormat, transcodeTarget } from '../transcoder';
import { LiteTranscoder } from './liteTranscoder';
import { KTX2FileReader, IKTX2_ImageDesc } from '../ktx2FileReader';

/**
 * @hidden
 */
export class LiteTranscoder_UASTC_RGBA_SRGB extends LiteTranscoder {
    /**
     * URL to use when loading the wasm module for the transcoder (srgb)
     */
    public static WasmModuleURL = "https://preview.babylonjs.com/ktx2Transcoders/uastc_rgba32_srgb.wasm";

    public static CanTranscode(src: sourceTextureFormat, dst: transcodeTarget, isInGammaSpace: boolean): boolean {
        return src === sourceTextureFormat.UASTC4x4 && dst === transcodeTarget.RGBA32 && isInGammaSpace;
    }

    public static Name = "UniversalTranscoder_UASTC_RGBA_SRGB";

    public getName(): string {
        return LiteTranscoder_UASTC_RGBA_SRGB.Name;
    }

    public initialize(): void {
        super.initialize();
        this._transcodeInPlace = false;
        this.setModulePath(LiteTranscoder_UASTC_RGBA_SRGB.WasmModuleURL);
    }

    public transcode(src: sourceTextureFormat, dst: transcodeTarget, level: number, width: number, height: number, uncompressedByteLength: number, ktx2Reader: KTX2FileReader, imageDesc: IKTX2_ImageDesc | null, encodedData: Uint8Array): Promise<Uint8Array | null> {
        return this._loadModule().then((moduleWrapper: any) => {
            const transcoder: any = moduleWrapper.module;
            const [, uncompressedTextureView, ] = this._prepareTranscoding(width, height, uncompressedByteLength, encodedData, true);

            return transcoder.decodeRGBA32(width, height) === 0 ? uncompressedTextureView!.slice() : null;
        });
    }
}
