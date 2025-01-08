import type { IAbstractSoundOptions, IAbstractSoundPlayOptions } from "./abstractSound";
import { AbstractSound } from "./abstractSound";
import type { AudioEngineV2 } from "./audioEngineV2";
import { SoundState } from "./soundState";
import type { StaticSoundBuffer } from "./staticSoundBuffer";
import type { _StaticSoundInstance } from "./staticSoundInstance";

/**
 * Options for playing a static sound.
 */
export interface IStaticSoundPlayOptions extends IAbstractSoundPlayOptions {
    /**
     * The time to wait before playing the sound in seconds.
     */
    waitTime: number;
}

/**
 * Options for stopping a static sound.
 */
export interface IStaticSoundStopOptions {
    /**
     * The time to wait before stopping the sound in seconds.
     */
    waitTime: number;
}
/**
 * Options for creating a new static sound.
 */
export interface IStaticSoundOptions extends IStaticSoundPlayOptions, IAbstractSoundOptions {
    /**
     * The start of the loop range in seconds.
     */
    loopStart: number;
    /**
     * The end of the loop range in seconds.
     */
    loopEnd: number;
    /**
     * The pitch of the sound, in cents.
     */
    pitch: number;
    /**
     * The playback rate of the sound.
     */
    playbackRate: number;
    /**
     * Whether to skip codec checking before attempting to load each source URL when `source` is a string array.
     */
    skipCodecCheck: boolean;
}

/**
 * Abstract class representing a static sound in the audio engine.
 */
export abstract class StaticSound extends AbstractSound {
    public abstract readonly buffer: StaticSoundBuffer;

    protected override _options: IStaticSoundOptions;

    protected constructor(name: string, engine: AudioEngineV2, options: Partial<IStaticSoundOptions> = {}) {
        super(name, engine, options);

        this._options.loopStart ??= 0;
        this._options.loopEnd ??= 0;
        this._options.pitch ??= 0;
        this._options.playbackRate ??= 1;
        this._options.skipCodecCheck ??= false;
        this._options.waitTime ??= 0;
    }

    /**
     * The start of the loop range in seconds.
     */
    public get loopStart(): number {
        return this._options.loopStart;
    }
    public set loopStart(value: number) {
        this._options.loopStart = value;
    }

    /**
     * The end of the loop range in seconds.
     */
    public get loopEnd(): number {
        return this._options.loopEnd;
    }
    public set loopEnd(value: number) {
        this._options.loopEnd = value;
    }

    /**
     * The pitch of the sound, in cents.
     */
    public get pitch(): number {
        return this._options.pitch;
    }
    public set pitch(value: number) {
        this._options.pitch = value;
    }

    /**
     * The playback rate of the sound.
     */
    public get playbackRate(): number {
        return this._options.playbackRate;
    }
    public set playbackRate(value: number) {
        this._options.playbackRate = value;
    }

    protected abstract override _createInstance(): _StaticSoundInstance;

    /**
     * Plays the sound.
     * @param options - The options to use when playing the sound.
     */
    public play(options: Partial<IStaticSoundPlayOptions> = {}): void {
        if (this._isPaused && this._instances.size > 0) {
            this.resume();
            return;
        }

        if (options) {
            if (options.startOffset === undefined) {
                options.startOffset = this._options.startOffset;
            }
            if (options.duration === undefined) {
                options.duration = this._options.duration;
            }
        } else {
            options = this._options;
        }

        if (options.volume === undefined) {
            options.volume = 1;
        }

        const instance = this._createInstance();
        this._beforePlay(instance);
        instance.play(options);
        this._afterPlay(instance);

        this._stopExcessInstances();
    }

    /**
     * Stops the sound.
     * @param options - The options to use when stopping the sound.
     */
    public stop(options: Partial<IStaticSoundStopOptions> = {}): void {
        if (options.waitTime && 0 < options.waitTime) {
            this._setState(SoundState.Stopping);
        } else {
            this._setState(SoundState.Stopped);
        }

        if (!this._instances) {
            return;
        }

        for (const instance of Array.from(this._instances)) {
            (instance as _StaticSoundInstance).stop(options);
        }
    }
}
