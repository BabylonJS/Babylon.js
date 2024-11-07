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
    private _loopStart: number;
    private _loopEnd: number;

    public abstract readonly buffer: StaticSoundBuffer;

    /** @internal */
    constructor(name: string, engine: AbstractAudioEngine, options: Nullable<IStaticSoundOptions> = null) {
        super(name, engine, options);

        this._loopStart = options?.loopStart ?? 0;
        this._loopEnd = options?.loopEnd ?? 0;
    }

    /**
     * The start of the loop range in seconds.
     */
    public get loopStart(): number {
        return this._loopStart;
    }

    public set loopStart(value: number) {
        this._loopStart = value;
    }

    /**
     * The end of the loop range in seconds.
     */
    public get loopEnd(): number {
        return this._loopEnd;
    }

    public set loopEnd(value: number) {
        this._loopEnd = value;
    }
}
