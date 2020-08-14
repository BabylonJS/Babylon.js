import { sourceTextureFormat, transcodeTarget } from './transcoder';
import { LiteTranscoder } from './LiteTranscoder';

/**
 * @hidden
 */
export class LiteTranscoder_UASTC_BC7 extends LiteTranscoder {

    public static CanTranscode(src: sourceTextureFormat, dst: transcodeTarget): boolean {
        return src === sourceTextureFormat.UASTC4x4 && dst === transcodeTarget.BC7_M5_RGBA;
    }

    public initialize(): void {
        this.setModulePath("/dist/preview release/basisTranscoder/uastc_bc7.wasm");
    }
}
