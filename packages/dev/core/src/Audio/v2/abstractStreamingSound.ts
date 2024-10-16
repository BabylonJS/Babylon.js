import type { Nullable } from "../../types";
import type { AbstractAudioEngine } from "./abstractAudioEngine";
import type { ISoundOptions } from "./abstractSound";
import { AbstractSound } from "./abstractSound";
import type { AbstractSoundInstance } from "./abstractSoundInstance";

export type StreamingSoundPreloadType = "none" | "metadata" | "auto";

export interface IStreamingSoundOptions extends ISoundOptions {
    preload?: StreamingSoundPreloadType;
}

export abstract class AbstractStreamingSound extends AbstractSound {
    private _preload: StreamingSoundPreloadType = "auto";

    public constructor(name: string, engine: AbstractAudioEngine, options: Nullable<IStreamingSoundOptions> = null) {
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

    protected _createSoundInstance(): Promise<AbstractSoundInstance> {
        return this.engine.createStreamingSoundInstance(this);
    }
}
