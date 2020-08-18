import { sourceTextureFormat, transcodeTarget } from './transcoder';
import { LiteTranscoder } from './LiteTranscoder';

/**
 * @hidden
 */
export class LiteTranscoder_UASTC_ASTC extends LiteTranscoder {

    public static CanTranscode(src: sourceTextureFormat, dst: transcodeTarget): boolean {
        return src === sourceTextureFormat.UASTC4x4 && dst === transcodeTarget.ASTC_4x4_RGBA;
    }

    public initialize(): void {
        this.setModulePath("https://cdn.babylonjs.com/ktx2Transcoders/uastc_astc.wasm");
    }
}
