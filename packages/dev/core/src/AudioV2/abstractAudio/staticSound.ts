import { SoundState } from "../soundState";
import type { IAbstractSoundOptions, IAbstractSoundPlayOptions, IAbstractSoundStoredOptions } from "./abstractSound";
import { AbstractSound } from "./abstractSound";
import type { AudioEngineV2 } from "./audioEngineV2";
import type { IStaticSoundBufferOptions, StaticSoundBuffer } from "./staticSoundBuffer";
import type { _StaticSoundInstance } from "./staticSoundInstance";

/** @internal */
export interface IStaticSoundOptionsBase {
    /**
     * The amount of time to play the sound for, in seconds. Defaults to `0`.
     * - If less than or equal to `0`, the sound plays for its full duration.
     */
    duration: number;
    /**
     * The end of the loop range in seconds. Defaults to `0`.
     * - If less than or equal to `0`, the loop plays for the sound's full duration.
     * - Has no effect if {@link loop} is `false`.
     */
    loopEnd: number;
    /**
     * The start of the loop range in seconds. Defaults to `0`.
     * - If less than or equal to `0`, the loop starts at the beginning of the sound.
     * - Has no effect if {@link loop} is `false`.
     *
     */
    loopStart: number;
}

/**
 * Options stored in a static sound.
 * @internal
 */
export interface IStaticSoundStoredOptions extends IAbstractSoundStoredOptions, IStaticSoundOptionsBase {
    /**
     * The pitch of the sound, in cents. Defaults to `0`.
     * - Can be combined with {@link playbackRate}.
     */
    pitch: number;
    /**
     * The playback rate of the sound. Defaults to `1`.
     * - Can be combined with {@link pitch}.
     */
    playbackRate: number;
}

/**
 * Options for creating a static sound.
 */
export interface IStaticSoundOptions extends IAbstractSoundOptions, IStaticSoundBufferOptions, IStaticSoundStoredOptions {}

/**
 * Options for playing a static sound.
 */
export interface IStaticSoundPlayOptions extends IAbstractSoundPlayOptions, IStaticSoundOptionsBase {
    /**
     * The time to wait before playing the sound, in seconds. Defaults to `0`.
     */
    waitTime: number;
}

/**
 * Options for stopping a static sound.
 */
export interface IStaticSoundStopOptions {
    /**
     * The time to wait before stopping the sound, in seconds. Defaults to `0`.
     */
    waitTime: number;
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
    protected abstract override readonly _options: IStaticSoundStoredOptions;

    /**
     * The sound buffer that the sound uses.
     *
     * This buffer can be shared with other static sounds.
     */
    public abstract readonly buffer: StaticSoundBuffer;

    protected constructor(name: string, engine: AudioEngineV2) {
        super(name, engine);
    }

    /**
     * The amount of time to play the sound for, in seconds. Defaults to `0`.
     * - If less than or equal to `0`, the sound plays for its full duration.
     */
    public get duration(): number {
        return this._options.duration;
    }

    public set duration(value: number) {
        this._options.duration = value;
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
     * The pitch of the sound, in cents. Defaults to `0`.
     * - Gets combined with {@link playbackRate} to determine the final pitch.
     */
    public get pitch(): number {
        return this._options.pitch;
    }

    public set pitch(value: number) {
        this._options.pitch = value;

        const it = this._instances.values();
        for (let instance = it.next(); !instance.done; instance = it.next()) {
            instance.value.pitch = value;
        }
    }

    /**
     * The playback rate of the sound. Defaults to `1`.
     * - Gets combined with {@link pitch} to determine the final playback rate.
     */
    public get playbackRate(): number {
        return this._options.playbackRate;
    }

    public set playbackRate(value: number) {
        this._options.playbackRate = value;

        const it = this._instances.values();
        for (let instance = it.next(); !instance.done; instance = it.next()) {
            instance.value.playbackRate = value;
        }
    }

    protected abstract override _createInstance(): _StaticSoundInstance;

    /**
     * Plays the sound.
     * - Triggers `onEndedObservable` if played for the full duration and the `loop` option is not set.
     * @param options The options to use when playing the sound. Options set here override the sound's options.
     */
    public play(options: Partial<IStaticSoundPlayOptions> = {}): void {
        if (this.state === SoundState.Paused) {
            this.resume();
            return;
        }

        options.duration ??= this.duration;
        options.loop ??= this.loop;
        options.loopStart ??= this.loopStart;
        options.loopEnd ??= this.loopEnd;
        options.startOffset ??= this.startOffset;
        options.volume ??= 1;
        options.waitTime ??= 0;

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
