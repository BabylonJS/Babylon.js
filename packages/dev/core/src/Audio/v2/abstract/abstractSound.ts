import { Observable } from "../../../Misc/observable";
import type { Nullable } from "../../../types";
import { SoundState } from "../soundState";
import { _AudioNodeType, AbstractNamedAudioNode } from "./abstractAudioNode";
import type { _AbstractSoundInstance } from "./abstractSoundInstance";
import type { PrimaryAudioBus } from "./audioBus";
import type { AudioEngineV2 } from "./audioEngineV2";
import type { _AbstractAudioSubGraph } from "./subNodes/abstractAudioSubGraph";
import { _AudioSubNode } from "./subNodes/audioSubNode";
import type { ISpatialAudioOptions } from "./subNodes/spatialAudioSubNode";
import type { IStereoAudioOptions } from "./subNodes/stereoAudioSubNode";
import type { _VolumeAudioSubNode, IVolumeAudioOptions } from "./subNodes/volumeAudioSubNode";
import { _VolumeAudioDefaults } from "./subNodes/volumeAudioSubNode";
import type { AbstractSpatialAudio } from "./subProperties/abstractSpatialAudio";
import type { AbstractStereoAudio } from "./subProperties/abstractStereoAudio";

/**
 * Options for playing a sound.
 */
export interface IAbstractSoundPlayOptions extends IVolumeAudioOptions {
    /**
     * The amount of time to play the sound for, in seconds. If not specified, the sound plays for its full duration.
     */
    duration: number;
    /**
     * The time within the sound buffer to start playing at, in seconds. Defaults to `0`.
     */
    startOffset: number;
}

/**
 * Options for creating a sound.
 */
export interface IAbstractSoundOptions extends IAbstractSoundPlayOptions, ISpatialAudioOptions, IStereoAudioOptions {
    /**
     * Whether the sound should start playing immediately. Defaults to `false`.
     */
    autoplay: boolean;
    /**
     * Whether the sound should loop. Defaults to `false`.
     */
    loop: boolean;
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
    protected _options = {} as IAbstractSoundOptions;

    protected abstract _subGraph: _AbstractAudioSubGraph;

    /**
     * Observable for when the sound stops playing.
     */
    public readonly onEndedObservable = new Observable<AbstractSound>();

    protected constructor(name: string, engine: AudioEngineV2, options: Partial<IAbstractSoundOptions> = {}) {
        super(name, engine, _AudioNodeType.Out);

        Object.assign(this._options, options);
        this._options.autoplay ??= false;
        this._options.duration ??= 0;
        this._options.loop ??= false;
        this._options.maxInstances ??= Infinity;
        this._options.startOffset ??= 0;
        this._options.volume ??= _VolumeAudioDefaults.Volume;
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
        this._options.startOffset = value;

        const instance = this._getNewestInstance();
        if (instance) {
            instance.currentTime = value;
        }
    }

    /**
     * The amount of time to play the sound for, in seconds.
     * - If less than or equal to `0`, the sound plays for its full duration.
     */
    public get duration(): number {
        return this._options.duration;
    }

    public set duration(value: number) {
        this._options.duration = value;
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
            this._disconnect(this._outBus);
        }

        this._outBus = outBus;

        if (this._outBus) {
            this._connect(this._outBus);
        }
    }

    /**
     * The spatial properties of the sound.
     */
    public abstract get spatial(): AbstractSpatialAudio;

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
    public abstract get stereo(): AbstractStereoAudio;

    /**
     * The output volume of the sound.
     */
    public get volume(): number {
        return this._subGraph.getSubNode<_VolumeAudioSubNode>(_AudioSubNode.Volume)?.volume ?? _VolumeAudioDefaults.Volume;
    }

    public set volume(value: number) {
        // Note that the volume subnode is created at initialization time and it always exists, so the callback that
        // sets the node's volume is always called synchronously.
        this._subGraph.callOnSubNode<_VolumeAudioSubNode>(_AudioSubNode.Volume, (node) => {
            node.volume = value;
        });
    }

    protected get _isPaused(): boolean {
        return this._state === SoundState.Paused && this._instances.size > 0;
    }

    /**
     * Releases associated resources.
     */
    public override dispose(): void {
        super.dispose();

        this.stop();

        this._outBus = null;

        this._instances.clear();
        this._subGraph.dispose();
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
        if (!this._instances) {
            return;
        }

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

        if (!this._instances) {
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
        if (this._options.maxInstances < Infinity) {
            const numberOfInstancesToStop = Array.from(this._instances).filter((instance) => instance.state === SoundState.Started).length - this._options.maxInstances;
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
}