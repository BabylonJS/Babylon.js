import type { Nullable } from "../../types";
import type { AbstractAudioEngine } from "./abstractAudioEngine";
import type { ISoundOptions } from "./abstractSound";
import { AbstractSound } from "./abstractSound";
import type { StaticSoundBuffer } from "./staticSoundBuffer";

/**
 * Options for creating a new static sound.
 */
export interface IStaticSoundOptions extends ISoundOptions {
    /**
     * The start of the loop range in seconds.
     */
    loopStart?: number;
    /**
     * The end of the loop range in seconds.
     */
    loopEnd?: number;
}

/**
 * Abstract class representing a static sound in the audio engine.
 */
export abstract class StaticSound extends AbstractSound {

    /**
     * The start of the loop range in seconds.
     */
    public loopStart: number;

    /**
     * The end of the loop range in seconds.
     */
    public loopEnd: number;

    public abstract readonly buffer: StaticSoundBuffer;

    /** @internal */
    constructor(name: string, engine: AbstractAudioEngine, options: Nullable<IStaticSoundOptions> = null) {
        super(name, engine, options);

        this.loopStart = options?.loopStart ?? 0;
        this.loopEnd = options?.loopEnd ?? 0;
    }
}
