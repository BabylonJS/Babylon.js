import { SoundState } from "../soundState";
import type { IBaseSoundOptions, IBaseSoundPlayOptions } from "./abstractSound";
import { AbstractSound } from "./abstractSound";
import type { AudioEngineV2 } from "./audioEngineV2";
import type { StaticSoundBuffer } from "./staticSoundBuffer";
import type { _StaticSoundInstance } from "./staticSoundInstance";

/**
 * Options for playing a static sound.
 */
export interface IStaticSoundPlayOptions extends IBaseSoundPlayOptions {
    /**
     * The time to wait before playing the sound, in seconds.
     */
    waitTime: number;
}

/**
 * Options for stopping a static sound.
 */
export interface IStaticSoundStopOptions {
    /**
     * The time to wait before stopping the sound, in seconds.
     */
    waitTime: number;
}

/**
 * Options for creating a static sound.
 */
export interface IStaticSoundOptions extends IBaseSoundOptions {
    /**
     * The start of the loop range in seconds. Defaults to `0`.
     * - If less than or equal to `0`, the loop starts at the beginning of the sound.
     * - Has no effect if {@link loop} is `false`.
     *
     */
    loopStart: number;
    /**
     * The end of the loop range in seconds. Defaults to `0`.
     * - If less than or equal to `0`, the loop plays for the sound's full duration.
     * - Has no effect if {@link loop} is `false`.
     */
    loopEnd: number;
    /**
     * The pitch of the sound, in cents.
     * - Can be combined with {@link playbackRate}.
     */
    pitch: number;
    /**
     * The playback rate of the sound.
     * - Can be combined with {@link pitch}.
     */
    playbackRate: number;
    /**
     * Whether to skip codec checking before attempting to load each source URL when `source` is a string array.
     * - Has no effect if the sound's source is not a string array.
     * @see {@link CreateSoundAsync} `source` parameter.
     */
    skipCodecCheck: boolean;
}

/**
 * Abstract class representing a static sound.
 *
 * A static sound has a sound buffer that is loaded into memory all at once. This allows it to have more capabilities
 * than a streaming sound, such as loop points and playback rate changes, but it also means that the sound must be
 * fully downloaded and decoded before it can be played, which may take a long time for sounds with long durations.
 *
 * To prevent downloading and decoding a sound multiple times, a sound's buffer can be shared with other sounds.
 * See {@link CreateSoundBufferAsync}, {@link StaticSoundBuffer} and {@link StaticSound.buffer} for more information.
 *
 * Static sounds are created by the {@link CreateSoundAsync} function.
 */
export abstract class StaticSound extends AbstractSound {
    protected override _instances: Set<_StaticSoundInstance>;
    protected override _options: IStaticSoundOptions;

    /**
     * The sound buffer that the sound uses.
     *
     * This buffer can be shared with other static sounds.
     */
    public abstract readonly buffer: StaticSoundBuffer;

    protected constructor(name: string, engine: AudioEngineV2, options: Partial<IStaticSoundOptions> = {}) {
        super(name, engine, options);

        this._options.loopStart ??= 0;
        this._options.loopEnd ??= 0;
        this._options.pitch ??= 0;
        this._options.playbackRate ??= 1;
        this._options.skipCodecCheck ??= false;
    }

    /**
     * The start of the loop range, in seconds. Defaults to `0`.
     * - If less than or equal to `0`, the loop starts at the beginning of the sound.
     */
    public get loopStart(): number {
        return this._options.loopStart;
    }

    public set loopStart(value: number) {
        this._options.loopStart = value;
    }

    /**
     * The end of the loop range, in seconds. Defaults to `0`.
     * - If less than or equal to `0`, the loop plays for the sound's full duration.
     */
    public get loopEnd(): number {
        return this._options.loopEnd;
    }

    public set loopEnd(value: number) {
        this._options.loopEnd = value;
    }

    /**
     * The pitch of the sound, in cents.
     * - Gets combined with {@link playbackRate} to determine the final pitch.
     */
    public get pitch(): number {
        return this._options.pitch;
    }

    public set pitch(value: number) {
        this._options.pitch = value;
    }

    /**
     * The playback rate of the sound.
     * - Gets combined with {@link pitch} to determine the final playback rate.
     */
    public get playbackRate(): number {
        return this._options.playbackRate;
    }

    public set playbackRate(value: number) {
        this._options.playbackRate = value;
    }

    protected abstract override _createInstance(): _StaticSoundInstance;

    // Inherits doc from AbstractSound.
    // eslint-disable-next-line babylonjs/available
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
     * - Triggers `onEndedObservable` if the sound is playing.
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
            instance.stop(options);
        }
    }
}
