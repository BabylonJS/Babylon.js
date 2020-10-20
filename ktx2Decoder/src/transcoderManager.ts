import { transcodeTarget, sourceTextureFormat, Transcoder } from './transcoder';
import { WASMMemoryManager } from './wasmMemoryManager';

/**
 * @hidden
 */
export class TranscoderManager {

    public static _Transcoders: Array<typeof Transcoder> = [];

    public static RegisterTranscoder(transcoder: typeof Transcoder) {
        TranscoderManager._Transcoders.push(transcoder);
    }

    private static _transcoderInstances: { [key: string]: Array<Transcoder> } = {};

    private _wasmMemoryManager: WASMMemoryManager;

    public findTranscoder(src: sourceTextureFormat, dst: transcodeTarget, isInGammaSpace: boolean, bypass?: string[]): Transcoder | null {
        let transcoder: Transcoder | null = null;

        const key = sourceTextureFormat[src] + "_" + transcodeTarget[dst];

        for (let i = 0; i < TranscoderManager._Transcoders.length; ++i) {
            if (TranscoderManager._Transcoders[i].CanTranscode(src, dst, isInGammaSpace) && (!bypass || bypass.indexOf(TranscoderManager._Transcoders[i].Name) < 0)) {
                transcoder = this._getExistingTranscoder(key, TranscoderManager._Transcoders[i].Name);
                if (!transcoder) {
                    transcoder = new TranscoderManager._Transcoders[i]();
                    transcoder!.initialize();
                    if (transcoder!.needMemoryManager()) {
                        if (!this._wasmMemoryManager) {
                            this._wasmMemoryManager = new WASMMemoryManager();
                        }
                        transcoder!.setMemoryManager(this._wasmMemoryManager);
                    }
                    if (!TranscoderManager._transcoderInstances[key]) {
                        TranscoderManager._transcoderInstances[key] = [];
                    }
                    TranscoderManager._transcoderInstances[key].push(transcoder);
                }
                break;
            }
        }

        return transcoder;
    }

    private _getExistingTranscoder(key: string, transcoderName: string): Transcoder | null {
        let transcoders = TranscoderManager._transcoderInstances[key];

        if (transcoders) {
            for (let t = 0; t < transcoders.length; ++t) {
                const transcoder = transcoders[t];
                if (transcoderName === transcoder.getName()) {
                    return transcoder;
                }
            }
        }

        return null;
    }
}
