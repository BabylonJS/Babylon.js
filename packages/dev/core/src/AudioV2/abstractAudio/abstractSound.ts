import { Observable } from "../../Misc/observable";
import type { Nullable } from "../../types";
import { SoundState } from "../soundState";
import { AudioNodeType } from "./abstractAudioNode";
import type { _AbstractSoundInstance } from "./abstractSoundInstance";
import { AbstractSoundSource, type ISoundSourceOptions } from "./abstractSoundSource";
import type { AudioEngineV2 } from "./audioEngineV2";
import type { IVolumeAudioOptions } from "./subNodes/volumeAudioSubNode";

/** @internal */
export interface IAbstractSoundOptionsBase {
    /**
     * Whether the sound should start playing automatically. Defaults to `false`.
     */
    autoplay: boolean;
    /**
     * The maximum number of instances that can play at the same time. Defaults to `Infinity`.
     */
    maxInstances: number;
}

/** @internal */
export interface IAbstractSoundPlayOptionsBase {
    /**
     * Whether the sound should loop. Defaults to `false`.
     */
    loop: boolean;
    /**
     * The time within the sound buffer to start playing at, in seconds. Defaults to `0`.
     */
    startOffset: number;
}

/**
 * Options for creating a sound.
 */
export interface IAbstractSoundOptions extends IAbstractSoundOptionsBase, IAbstractSoundPlayOptions, ISoundSourceOptions {}

/**
 * Options for playing a sound.
 */
export interface IAbstractSoundPlayOptions extends IAbstractSoundPlayOptionsBase, IVolumeAudioOptions {}

/**
 * Options stored in a sound.
 * @internal
 */
export interface IAbstractSoundStoredOptions extends IAbstractSoundOptionsBase, IAbstractSoundPlayOptionsBase {}

/**
 * Abstract class representing a sound in the audio engine.
 */
export abstract class AbstractSound extends AbstractSoundSource {
    private _newestInstance: Nullable<_AbstractSoundInstance> = null;
    private _privateInstances = new Set<_AbstractSoundInstance>();
    private _state: SoundState = SoundState.Stopped;

    protected _instances: ReadonlySet<_AbstractSoundInstance> = this._privateInstances;
    protected abstract readonly _options: IAbstractSoundStoredOptions;

    /**
     * Observable for when the sound stops playing.
     */
    public readonly onEndedObservable = new Observable<AbstractSound>();

    protected constructor(name: string, engine: AudioEngineV2, options: Partial<IAbstractSoundOptions>) {
        super(name, engine, options, AudioNodeType.HAS_INPUTS_AND_OUTPUTS); // Inputs are for instances.
    }

    /**
     * The number of active instances of the sound that are currently playing.
     */
    public get activeInstancesCount(): number {
        return this._instances.size;
    }

    /**
     * Whether the sound should start playing automatically. Defaults to `false`.
     */
    public get autoplay(): boolean {
        return this._options.autoplay;
    }

    /**
     * The current playback time of the sound, in seconds.
     */
    public get currentTime(): number {
        const instance = this._getNewestInstance();
        return instance ? instance.currentTime : 0;
    }

    public set currentTime(value: number) {
        this.startOffset = value;

        const instance = this._getNewestInstance();
        if (instance) {
            instance.currentTime = value;
        }
    }

    /**
     * Whether the sound should loop. Defaults to `false`.
     */
    public get loop(): boolean {
        return this._options.loop;
    }

    public set loop(value: boolean) {
        this._options.loop = value;
    }

    /**
     * The maximum number of instances that can play at the same time. Defaults to `Infinity`.
     */
    public get maxInstances(): number {
        return this._options.maxInstances;
    }

    public set maxInstances(value: number) {
        this._options.maxInstances = value;
    }

    /**
     * The time within the sound buffer to start playing at, in seconds. Defaults to `0`.
     */
    public get startOffset(): number {
        return this._options.startOffset;
    }

    public set startOffset(value: number) {
        this._options.startOffset = value;
    }

    /**
     * The state of the sound.
     */
    public get state(): SoundState {
        return this._state;
    }

    /**
     * Releases associated resources.
     */
    public override dispose(): void {
        super.dispose();

        this.stop();

        this._newestInstance = null;

        this._privateInstances.clear();
        this.onEndedObservable.clear();
    }

    /**
     * Plays the sound.
     * - Triggers `onEndedObservable` if played for the full duration and the `loop` option is not set.
     * @param options The options to use when playing the sound. Options set here override the sound's options.
     */
    public abstract play(options?: Partial<IAbstractSoundPlayOptions>): void;

    /**
     * Pauses the sound.
     */
    public pause(): void {
        const it = this._instances.values();
        for (let next = it.next(); !next.done; next = it.next()) {
            next.value.pause();
        }

        this._state = SoundState.Paused;
    }

    /**
     * Resumes the sound.
     */
    public resume(): void {
        if (this._state !== SoundState.Paused) {
            return;
        }

        const it = this._instances.values();
        for (let next = it.next(); !next.done; next = it.next()) {
            next.value.resume();
        }

        this._state = SoundState.Started;
    }

    /**
     * Stops the sound.
     * - Triggers `onEndedObservable` if the sound is playing.
     */
    public abstract stop(): void;

    protected _beforePlay(instance: _AbstractSoundInstance): void {
        if (this.state === SoundState.Paused && this._instances.size > 0) {
            this.resume();
            return;
        }

        instance.onEndedObservable.addOnce(this._onInstanceEnded);
        this._privateInstances.add(instance);
        this._newestInstance = instance;
    }

    protected _afterPlay(instance: _AbstractSoundInstance): void {
        this._state = instance.state;
    }

    protected _getNewestInstance(): Nullable<_AbstractSoundInstance> {
        if (this._instances.size === 0) {
            return null;
        }

        if (!this._newestInstance) {
            const it = this._instances.values();
            for (let next = it.next(); !next.done; next = it.next()) {
                this._newestInstance = next.value;
            }
        }

        return this._newestInstance;
    }

    protected _setState(state: SoundState): void {
        this._state = state;
    }

    protected abstract _createInstance(): _AbstractSoundInstance;

    protected _stopExcessInstances(): void {
        if (this.maxInstances < Infinity) {
            const startedInstances = Array.from(this._instances).filter((instance) => instance.state === SoundState.Started);
            const numberOfInstancesToStop = startedInstances.length - this.maxInstances;

            for (let i = 0; i < numberOfInstancesToStop; i++) {
                startedInstances[i].stop();
            }
        }
    }

    private _onInstanceEnded: (instance: _AbstractSoundInstance) => void = (instance) => {
        if (this._newestInstance === instance) {
            this._newestInstance = null;
        }

        this._privateInstances.delete(instance);

        if (this._instances.size === 0) {
            this._state = SoundState.Stopped;
            this.onEndedObservable.notifyObservers(this);
        }

        instance.dispose();
    };
}
