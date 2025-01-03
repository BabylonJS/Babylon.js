import type { Nullable } from "../../types";
import type { IAbstractSoundOptions } from "./abstractSound";
import { AbstractSound } from "./abstractSound";
import type { AudioEngineV2 } from "./audioEngineV2";
import { SoundState } from "./soundState";
import type { StaticSoundBuffer } from "./staticSoundBuffer";
import type { _StaticSoundInstance } from "./staticSoundInstance";

/**
 * Options for creating a new static sound.
 */
export interface IStaticSoundOptions extends IAbstractSoundOptions {
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
     * The start of the loop range in seconds.
     */
    public loopStart: number;

    /**
     * The end of the loop range in seconds.
     */
    public loopEnd: number;

    /**
     * The pitch offset of the sound in cents. Default is 0.
     */
    public pitch: number;

    /**
     * The playback rate of the sound. Default is 1.
     */
    public playbackRate: number;

    public abstract readonly buffer: StaticSoundBuffer;

    protected constructor(name: string, engine: AudioEngineV2, options: Nullable<IStaticSoundOptions> = null) {
        super(name, engine, options);

        this.loopStart = options?.loopStart ?? 0;
        this.loopEnd = options?.loopEnd ?? 0;
        this.pitch = options?.pitch ?? 0;
        this.playbackRate = options?.playbackRate ?? 1;
    }

    protected abstract override _createInstance(): _StaticSoundInstance;

    /**
     * Plays the sound.
     * @param waitTime - The time to wait before playing the sound in seconds.
     */
    public play(waitTime: Nullable<number> = null): void {
        if (this._isPaused && this._instances.size > 0) {
            this.resume();
            return;
        }

        const instance = this._createInstance();
        this._beforePlay(instance);
        instance.play(this.startOffset, this.duration != 0 ? this.duration : null, waitTime);
        this._afterPlay(instance);

        this._stopExcessInstances();
    }

    /**
     * Stops the sound.
     * @param waitTime - The time to wait before stopping the sound in seconds.
     */
    public stop(waitTime: Nullable<number> = null): void {
        if (waitTime && 0 < waitTime) {
            this._setState(SoundState.Stopping);
        } else {
            this._setState(SoundState.Stopped);
        }

        if (!this._instances) {
            return;
        }

        for (const instance of Array.from(this._instances)) {
            (instance as _StaticSoundInstance).stop(waitTime);
        }
    }
}
