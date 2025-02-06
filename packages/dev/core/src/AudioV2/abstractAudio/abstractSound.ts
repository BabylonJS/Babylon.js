import { Observable } from "../../Misc/observable";
import type { Nullable } from "../../types";
import { SoundState } from "../soundState";
import { AbstractNamedAudioNode, AudioNodeType } from "./abstractAudioNode";
import type { _AbstractSoundInstance } from "./abstractSoundInstance";
import type { PrimaryAudioBus } from "./audioBus";
import type { AudioEngineV2 } from "./audioEngineV2";
import type { _AbstractAudioSubGraph } from "./subNodes/abstractAudioSubGraph";
import type { IVolumeAudioOptions } from "./subNodes/volumeAudioSubNode";
import { _GetVolumeAudioProperty, _GetVolumeAudioSubNode, _VolumeAudioDefaults } from "./subNodes/volumeAudioSubNode";
import type { AbstractSpatialAudio, ISpatialAudioOptions } from "./subProperties/abstractSpatialAudio";
import type { AbstractStereoAudio, IStereoAudioOptions } from "./subProperties/abstractStereoAudio";

/**
 * Options for playing a sound.
 */
export interface ICommonSoundPlayOptions extends IVolumeAudioOptions {
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
export interface ICommonSoundOptions extends ICommonSoundPlayOptions, ISpatialAudioOptions, IStereoAudioOptions {
    /**
     * Whether the sound should start playing immediately. Defaults to `false`.
     */
    autoplay: boolean;
    /**
     * The maximum number of instances that can play at the same time. Defaults to `Infinity`.
     */
    maxInstances: number;
    /**
     * The output bus for the sound. Defaults to the audio engine's default main bus.
     * @see {@link AudioEngineV2.defaultMainBus}
     */
    outBus: PrimaryAudioBus;
}

/**
 * Abstract class representing a sound in the audio engine.
 */
export abstract class AbstractSound extends AbstractNamedAudioNode {
    private _outBus: Nullable<PrimaryAudioBus> = null;
    private _state: SoundState = SoundState.Stopped;

    protected _instances = new Set<_AbstractSoundInstance>();
    protected _options = {} as ICommonSoundOptions;
    protected abstract _subGraph: _AbstractAudioSubGraph;

    /**
     * Observable for when the sound stops playing.
     */
    public readonly onEndedObservable = new Observable<AbstractSound>();

    protected constructor(name: string, engine: AudioEngineV2, options: Partial<ICommonSoundOptions> = {}) {
        super(name, engine, AudioNodeType.HAS_OUTPUTS);

        this._options = {
            autoplay: false,
            loop: false,
            maxInstances: Infinity,
            startOffset: 0,
            volume: _VolumeAudioDefaults.volume,
            ...options,
        } as ICommonSoundOptions;
    }

    /**
     * Whether the sound should start playing immediately. Defaults to `false`.
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
     * The output bus for the sound. Defaults to the audio engine's default main bus.
     * @see {@link AudioEngineV2.defaultMainBus}
     */
    public get outBus(): Nullable<PrimaryAudioBus> {
        return this._outBus;
    }

    public set outBus(outBus: Nullable<PrimaryAudioBus>) {
        if (this._outBus === outBus) {
            return;
        }

        if (this._outBus) {
            this._outBus.onDisposeObservable.removeCallback(this._onOutBusDisposed);
            this._disconnect(this._outBus);
        }

        this._outBus = outBus;

        if (this._outBus) {
            this._outBus.onDisposeObservable.add(this._onOutBusDisposed);
            this._connect(this._outBus);
        }
    }

    /**
     * The spatial properties of the sound.
     */
    public abstract spatial: AbstractSpatialAudio;

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
     * The stereo properties of the sound.
     */
    public abstract stereo: AbstractStereoAudio;

    /**
     * The output volume of the sound.
     */
    public get volume(): number {
        return _GetVolumeAudioProperty(this._subGraph, "volume");
    }

    public set volume(value: number) {
        // The volume subnode is created on initialization and should always exist.
        const node = _GetVolumeAudioSubNode(this._subGraph);
        if (!node) {
            throw new Error("No volume subnode");
        }

        node.volume = value;
    }

    /**
     * Releases associated resources.
     */
    public override dispose(): void {
        super.dispose();

        this.stop();

        this._outBus = null;

        this._instances.clear();
        this.onEndedObservable.clear();
    }

    /**
     * Plays the sound.
     * - Triggers `onEndedObservable` if played for the full duration and the `loop` option is not set.
     * @param options The options to use when playing the sound. Options set here override the sound's options.
     */
    public abstract play(options?: Partial<ICommonSoundPlayOptions>): void;

    /**
     * Pauses the sound.
     */
    public pause(): void {
        for (const instance of Array.from(this._instances)) {
            instance.pause();
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

        for (const instance of Array.from(this._instances)) {
            instance.resume();
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
        this._instances.add(instance);
    }

    protected _afterPlay(instance: _AbstractSoundInstance): void {
        this._state = instance.state;
    }

    protected _setState(state: SoundState): void {
        this._state = state;
    }

    protected abstract _createInstance(): _AbstractSoundInstance;

    protected _stopExcessInstances(): void {
        if (this.maxInstances < Infinity) {
            const numberOfInstancesToStop = Array.from(this._instances).filter((instance) => instance.state === SoundState.Started).length - this.maxInstances;
            const it = this._instances.values();

            for (let i = 0; i < numberOfInstancesToStop; i++) {
                const instance = it.next().value;
                instance.stop();
            }
        }
    }

    private _getNewestInstance(): Nullable<_AbstractSoundInstance> {
        if (this._instances.size === 0) {
            return null;
        }

        let instance: Nullable<_AbstractSoundInstance> = null;

        const it = this._instances.values();
        for (let next = it.next(); !next.done; next = it.next()) {
            instance = next.value;
        }

        return instance;
    }

    private _onInstanceEnded: (instance: _AbstractSoundInstance) => void = (instance) => {
        this._instances.delete(instance);

        if (this._instances.size === 0) {
            this._state = SoundState.Stopped;
            this.onEndedObservable.notifyObservers(this);
        }
    };

    private _onOutBusDisposed = () => {
        this.outBus = this.engine.defaultMainBus;
    };
}
