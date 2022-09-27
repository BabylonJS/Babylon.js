import type { Transcoder } from "./transcoder";
import { transcodeTarget, sourceTextureFormat } from "./transcoder";
import { WASMMemoryManager } from "./wasmMemoryManager";

/**
 * @internal
 */
export class TranscoderManager {
    public static _Transcoders: Array<typeof Transcoder> = [];

    public static RegisterTranscoder(transcoder: typeof Transcoder) {
        TranscoderManager._Transcoders.push(transcoder);
    }

    private static _TranscoderInstances: { [key: string]: Array<Transcoder> } = {};

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
                    if (!TranscoderManager._TranscoderInstances[key]) {
                        TranscoderManager._TranscoderInstances[key] = [];
                    }
                    TranscoderManager._TranscoderInstances[key].push(transcoder);
                }
                break;
            }
        }

        return transcoder;
    }

    private _getExistingTranscoder(key: string, transcoderName: string): Transcoder | null {
        const transcoders = TranscoderManager._TranscoderInstances[key];

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
