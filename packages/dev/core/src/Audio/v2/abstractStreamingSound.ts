import type { AbstractAudioEngine } from "./abstractAudioEngine";
import type { AbstractAudioNode } from "./abstractAudioNode";
import type { AbstractSoundInstance } from "./abstractSoundInstance";
import type { ISoundOptions } from "./abstractSound";
import { AbstractSound } from "./abstractSound";

export type StreamingSoundPreloadType = "none" | "metadata" | "auto";

export interface IStreamingSoundOptions extends ISoundOptions {
    preload?: StreamingSoundPreloadType;
}

export abstract class AbstractStreamingSound extends AbstractSound {
    private _preload: StreamingSoundPreloadType = "auto";

    public constructor(name: string, engine: AbstractAudioEngine, options?: IStreamingSoundOptions) {
        super(name, engine, options);

        this._preload = options?.preload ?? "auto";
    }

    public get preload(): StreamingSoundPreloadType {
        return this._preload;
    }

    public set preload(preload: StreamingSoundPreloadType) {
        if (this._preload === preload) {
            return;
        }

        this._preload = preload;
    }

    protected _createSoundInstance(inputNode: AbstractAudioNode): AbstractSoundInstance {
        return {} as any; //this.engine.createStreamingSoundInstance(this, inputNode);
    }
}
