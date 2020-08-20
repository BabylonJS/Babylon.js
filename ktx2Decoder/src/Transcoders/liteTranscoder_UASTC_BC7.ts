import { sourceTextureFormat, transcodeTarget } from '../transcoder';
import { LiteTranscoder } from './liteTranscoder';

/**
 * @hidden
 */
export class LiteTranscoder_UASTC_BC7 extends LiteTranscoder {
    /**
     * URL to use when loading the wasm module for the transcoder
     */
    public static WasmModuleURL = "https://preview.babylonjs.com/ktx2Transcoders/uastc_bc7.wasm";

    public static CanTranscode(src: sourceTextureFormat, dst: transcodeTarget): boolean {
        return src === sourceTextureFormat.UASTC4x4 && dst === transcodeTarget.BC7_M5_RGBA;
    }

    public initialize(): void {
        this.setModulePath(LiteTranscoder_UASTC_BC7.WasmModuleURL);
    }
}
