import { SoundState } from "../soundState";
import type { IAbstractSoundOptions, IAbstractSoundPlayOptions, IAbstractSoundStoredOptions } from "./abstractSound";
import { AbstractSound } from "./abstractSound";
import type { AudioEngineV2 } from "./audioEngineV2";
import type { _StreamingSoundInstance } from "./streamingSoundInstance";

/** @internal */
export interface IStreamingSoundOptionsBase {
    /**
     * The number of instances to preload. Defaults to 1.
     * */
    preloadCount: number;
}

/**
 * Options for creating a streaming sound.
 */
export interface IStreamingSoundOptions extends IAbstractSoundOptions, IStreamingSoundOptionsBase {}

/**
 * Options for playing a streaming sound.
 */
export interface IStreamingSoundPlayOptions extends IAbstractSoundPlayOptions {}

/**
 * Options stored in a streaming sound.
 * @internal
 */
export interface IStreamingSoundStoredOptions extends IAbstractSoundStoredOptions, IStreamingSoundOptionsBase {}

/**
 * Abstract class representing a streaming sound.
 *
 * A streaming sound has a sound buffer that is loaded into memory in chunks as it is played. This allows it to be played
 * more quickly than a static sound, but it also means that it cannot have loop points or playback rate changes.
 *
 * Due to the way streaming sounds are typically implemented, there can be a significant delay when attempting to play
 * a streaming sound for the first time. To prevent this delay, it is recommended to preload instances of the sound
 * using the {@link IStreamingSoundStoredOptions.preloadCount} options, or the {@link preloadInstance} and
 * {@link preloadInstances} methods before calling the `play` method.
 *
 * Streaming sounds are created by the {@link CreateStreamingSoundAsync} function.
 */
export abstract class StreamingSound extends AbstractSound {
    private _preloadedInstances = new Array<_StreamingSoundInstance>();

    protected abstract override readonly _options: IStreamingSoundStoredOptions;

    protected constructor(name: string, engine: AudioEngineV2) {
        super(name, engine);
    }

    /**
     * The number of instances to preload. Defaults to `1`.
     */
    public get preloadCount(): number {
        return this._options.preloadCount ?? 1;
    }

    /**
     * Returns the number of instances that have been preloaded.
     */
    public get preloadCompletedCount(): number {
        return this._preloadedInstances.length;
    }

    /**
     * Preloads an instance of the sound.
     * @returns A promise that resolves when the instance is preloaded.
     */
    public preloadInstance(): Promise<void> {
        const instance = this._createInstance();

        this._addPreloadedInstance(instance);

        return instance.preloadedPromise;
    }

    /**
     * Preloads the given number of instances of the sound.
     * @param count - The number of instances to preload.
     * @returns A promise that resolves when all instances are preloaded.
     */
    public async preloadInstances(count: number): Promise<void> {
        for (let i = 0; i < count; i++) {
            this.preloadInstance();
        }

        await Promise.all(this._preloadedInstances.map((instance) => instance.preloadedPromise));
    }

    /**
     * Plays the sound.
     * - Triggers `onEndedObservable` if played for the full duration and the `loop` option is not set.
     * @param options The options to use when playing the sound. Options set here override the sound's options.
     */
    public play(options: Partial<IStreamingSoundPlayOptions> = {}): void {
        if (this.state === SoundState.Paused) {
            this.resume();
            return;
        }

        let instance: _StreamingSoundInstance;

        if (this.preloadCompletedCount > 0) {
            instance = this._preloadedInstances[0];
            instance.startOffset = this.startOffset;
            this._removePreloadedInstance(instance);
        } else {
            instance = this._createInstance();
        }

        const onInstanceStateChanged = () => {
            if (instance.state === SoundState.Started) {
                this._stopExcessInstances();
                instance.onStateChangedObservable.removeCallback(onInstanceStateChanged);
            }
        };
        instance.onStateChangedObservable.add(onInstanceStateChanged);

        options.startOffset ??= this.startOffset;
        options.loop ??= this.loop;
        options.volume ??= 1;

        this._beforePlay(instance);
        instance.play(options);
        this._afterPlay(instance);
    }

    /**
     * Stops the sound.
     */
    public stop(): void {
        this._setState(SoundState.Stopped);

        if (!this._instances) {
            return;
        }

        for (const instance of Array.from(this._instances)) {
            instance.stop();
        }
    }

    protected abstract override _createInstance(): _StreamingSoundInstance;

    private _addPreloadedInstance(instance: _StreamingSoundInstance): void {
        if (!this._preloadedInstances.includes(instance)) {
            this._preloadedInstances.push(instance);
        }
    }

    private _removePreloadedInstance(instance: _StreamingSoundInstance): void {
        const index = this._preloadedInstances.indexOf(instance);
        if (index !== -1) {
            this._preloadedInstances.splice(index, 1);
        }
    }
}
