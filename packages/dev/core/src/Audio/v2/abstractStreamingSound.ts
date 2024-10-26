import type { Nullable } from "../../types";
import type { AbstractAudioEngine } from "./abstractAudioEngine";
import type { SoundOptions } from "./abstractSound";
import { AbstractSound } from "./abstractSound";

export type StreamingSoundPreloadType = "none" | "metadata" | "auto";

/**
 * Options for creating a new streaming sound.
 */
export interface StreamingSoundOptions extends SoundOptions {
    /**
     * The preload type of the sound.
     */
    preload?: StreamingSoundPreloadType;
}

/**
 * Abstract class representing a streaming sound in the audio engine.
 */
export abstract class AbstractStreamingSound extends AbstractSound {
    private _preload: StreamingSoundPreloadType = "auto";

    /** @internal */
    constructor(name: string, engine: AbstractAudioEngine, options: Nullable<StreamingSoundOptions> = null) {
        super(name, engine, options);

        this._preload = options?.preload ?? "auto";
    }

    /**
     * The preload type of the sound.
     */
    public get preload(): StreamingSoundPreloadType {
        return this._preload;
    }

    public set preload(preload: StreamingSoundPreloadType) {
        if (this._preload === preload) {
            return;
        }

        this._preload = preload;
    }
}
