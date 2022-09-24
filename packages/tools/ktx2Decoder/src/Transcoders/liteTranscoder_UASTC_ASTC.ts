import { sourceTextureFormat, transcodeTarget } from "../transcoder";
import { LiteTranscoder } from "./liteTranscoder";

/**
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class LiteTranscoder_UASTC_ASTC extends LiteTranscoder {
    /**
     * URL to use when loading the wasm module for the transcoder
     */
    public static WasmModuleURL = "https://preview.babylonjs.com/ktx2Transcoders/uastc_astc.wasm";

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public static CanTranscode(src: sourceTextureFormat, dst: transcodeTarget, isInGammaSpace: boolean): boolean {
        return src === sourceTextureFormat.UASTC4x4 && dst === transcodeTarget.ASTC_4x4_RGBA;
    }

    public static Name = "UniversalTranscoder_UASTC_ASTC";

    public getName(): string {
        return LiteTranscoder_UASTC_ASTC.Name;
    }

    public initialize(): void {
        super.initialize();
        this.setModulePath(LiteTranscoder_UASTC_ASTC.WasmModuleURL);
    }
}
