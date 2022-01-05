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

    public static CanTranscode(src: sourceTextureFormat, dst: transcodeTarget, isInGammaSpace: boolean): boolean {
        return src === sourceTextureFormat.UASTC4x4 && dst === transcodeTarget.BC7_RGBA;
    }

    public static Name = "UniversalTranscoder_UASTC_BC7";

    public getName(): string {
        return LiteTranscoder_UASTC_BC7.Name;
    }

    public initialize(): void {
        super.initialize();
        this.setModulePath(LiteTranscoder_UASTC_BC7.WasmModuleURL);
    }
}
