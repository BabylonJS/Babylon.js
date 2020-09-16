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

    private static _transcoderInstances: { [key: string]: Transcoder } = {};

    private _wasmMemoryManager: WASMMemoryManager;

    public findTranscoder(src: sourceTextureFormat, dst: transcodeTarget): Transcoder | null {
        let transcoder: Transcoder | null = null;

        for (let i = 0; i < TranscoderManager._Transcoders.length; ++i) {
            if (TranscoderManager._Transcoders[i].CanTranscode(src, dst)) {
                const key = sourceTextureFormat[src] + "_" + transcodeTarget[dst];
                transcoder = TranscoderManager._transcoderInstances[key];
                if (!transcoder) {
                    transcoder = new TranscoderManager._Transcoders[i]();
                    transcoder!.initialize();
                    if (transcoder!.needMemoryManager()) {
                        if (!this._wasmMemoryManager) {
                            this._wasmMemoryManager = new WASMMemoryManager();
                        }
                        transcoder!.setMemoryManager(this._wasmMemoryManager);
                    }
                    TranscoderManager._transcoderInstances[key] = transcoder;
                }
                break;
            }
        }

        return transcoder;
    }
}
