import { sourceTextureFormat, transcodeTarget } from './transcoder';
import { LiteTranscoder } from './LiteTranscoder';

/**
 * @hidden
 */
export class LiteTranscoder_UASTC_ASTC extends LiteTranscoder {
    /**
     * URL to use when loading the wasm module for the transcoder
     */
    public static WasmModuleURL = "https://preview.babylonjs.com/ktx2Transcoders/uastc_astc.wasm";

    public static CanTranscode(src: sourceTextureFormat, dst: transcodeTarget): boolean {
        return src === sourceTextureFormat.UASTC4x4 && dst === transcodeTarget.ASTC_4x4_RGBA;
    }

    public initialize(): void {
        this.setModulePath(LiteTranscoder_UASTC_ASTC.WasmModuleURL);
    }
}
