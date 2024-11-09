import type { Nullable } from "../../types";
import type { AbstractAudioEngine } from "./abstractAudioEngine";
import type { ISoundOptions } from "./abstractSound";
import { AbstractSound } from "./abstractSound";

export type StreamingSoundPreloadType = "none" | "metadata" | "auto";

/**
 * Options for creating a new streaming sound.
 */
export interface IStreamingSoundOptions extends ISoundOptions {
    /**
     * The preload type of the sound.
     */
    preload?: StreamingSoundPreloadType;

    /**
     * Set to `true` to preserve the pitch of the sound when changing the playback rate; otherwise `false`. Default is `false`.
     */
    preservesPitch?: boolean;
}

/**
 * Abstract class representing a streaming sound in the audio engine.
 */
export abstract class StreamingSound extends AbstractSound {
    /**
     * The preload type for the sound stream.
     */
    public preload: StreamingSoundPreloadType = "auto";

    /**
     * Set to `true` to preserve the pitch of the sound when changing the playback rate; otherwise `false`.
     */
    public preservesPitch: boolean = false;

    /** @internal */
    constructor(name: string, engine: AbstractAudioEngine, options: Nullable<IStreamingSoundOptions> = null) {
        super(name, engine, options);

        this.preload = options?.preload ?? "auto";
        this.preservesPitch = options?.preservesPitch ?? false;
    }
}
