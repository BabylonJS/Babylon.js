import * as KTX2 from "core/Materials/Textures/ktx2decoderTypes";

import { LiteTranscoder } from "./liteTranscoder";

/**
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class LiteTranscoder_UASTC_BC7 extends LiteTranscoder {
    /**
     * URL to use when loading the wasm module for the transcoder
     */
    public static WasmModuleURL = "https://preview.babylonjs.com/ktx2Transcoders/1/uastc_bc7.wasm";

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public static CanTranscode(src: KTX2.SourceTextureFormat, dst: KTX2.TranscodeTarget, isInGammaSpace: boolean): boolean {
        return src === KTX2.SourceTextureFormat.UASTC4x4 && dst === KTX2.TranscodeTarget.BC7_RGBA;
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
