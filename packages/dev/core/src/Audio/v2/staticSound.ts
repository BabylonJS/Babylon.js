import type { Nullable } from "../../types";
import type { AudioEngineV2 } from "./audioEngineV2";
import type { ISoundOptions } from "./abstractSound";
import { AbstractSound } from "./abstractSound";
import type { StaticSoundBuffer } from "./staticSoundBuffer";
import type { _StaticSoundInstance } from "./staticSoundInstance";

/**
 * Options for creating a new static sound.
 */
export interface IStaticSoundOptions extends ISoundOptions {
    /**
     * How long to play the sound in seconds.
     */
    duration?: number;
    /**
     * The start of the loop range in seconds.
     */
    loopStart?: number;
    /**
     * The end of the loop range in seconds.
     */
    loopEnd?: number;
    /**
     * The pitch of the sound.
     */
    pitch?: number;
    /**
     * The playback rate of the sound.
     */
    playbackRate?: number;
    /**
     * Whether to skip codec checking before attempting to load each source URL when `source` is a string array.
     */
    skipCodecCheck?: boolean;
}

/**
 * Abstract class representing a static sound in the audio engine.
 */
export abstract class StaticSound extends AbstractSound {
    /**
     * How long to play the sound in seconds.
     */
    public duration: number;

    /**
     * The start of the loop range in seconds.
     */
    public loopStart: number;

    /**
     * The end of the loop range in seconds.
     */
    public loopEnd: number;

    /**
     * The pitch of the sound.
     */
    public pitch: number;

    /**
     * The playback rate of the sound.
     */
    public playbackRate: number;

    public abstract readonly buffer: StaticSoundBuffer;

    /** @internal */
    constructor(name: string, engine: AudioEngineV2, options: Nullable<IStaticSoundOptions> = null) {
        super(name, engine, options);

        this.duration = options?.duration ?? 0;
        this.loopStart = options?.loopStart ?? 0;
        this.loopEnd = options?.loopEnd ?? 0;
        this.pitch = options?.pitch ?? 0;
        this.playbackRate = options?.playbackRate ?? 1;
    }

    protected abstract override _createSoundInstance(): _StaticSoundInstance;

    /**
     * Plays the sound.
     * @param waitTime - The time to wait before playing the sound in seconds.
     * @param startOffset - The time within the sound source to start playing the sound in seconds.
     * @param duration - How long to play the sound in seconds.
     */
    public play(waitTime: Nullable<number> = null, startOffset: Nullable<number> = null, duration: Nullable<number> = null): void {
        if (this._isPaused && this._soundInstances.size > 0) {
            this.resume();
        }

        const instance = this._createSoundInstance();
        this._play(instance, waitTime, startOffset, duration);
        this._stopExcessInstances();
    }
}
