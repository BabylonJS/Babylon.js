import { Observable } from "../../Misc/observable";
import type { Nullable } from "../../types";
import { _AudioNodeType, NamedAbstractAudioNode } from "./abstractAudioNode";
import type { _AbstractSoundInstance } from "./abstractSoundInstance";
import type { AbstractPrimaryAudioBus } from "./audioBus";
import type { AudioEngineV2 } from "./audioEngineV2";
import { SoundState } from "./soundState";
import type { _AbstractAudioSubGraph } from "./subNodes/abstractAudioSubGraph";
import { _AudioSubNode } from "./subNodes/audioSubNode";
import type { ISpatialAudioOptions } from "./subNodes/spatialAudioSubNode";
import type { IStereoAudioOptions } from "./subNodes/stereoAudioSubNode";
import type { _VolumeAudioSubNode, IVolumeAudioOptions } from "./subNodes/volumeAudioSubNode";
import { _VolumeAudio } from "./subNodes/volumeAudioSubNode";
import type { AbstractSpatialAudio } from "./subProperties/abstractSpatialAudio";
import type { AbstractStereoAudio } from "./subProperties/abstractStereoAudio";

/**
 * Options for creating a new sound.
 */
export interface IAbstractSoundOptions extends ISpatialAudioOptions, IStereoAudioOptions, IVolumeAudioOptions {
    /**
     * Whether the sound should start playing immediately.
     */
    autoplay?: boolean;
    /**
     * How long to play the sound in seconds.
     */
    duration?: number;
    /**
     * Whether the sound should loop.
     */
    loop?: boolean;
    /**
     * The maximum number of instances that can play at the same time.
     */
    maxInstances?: number;
    /**
     * The output bus for the sound.
     */
    outBus?: AbstractPrimaryAudioBus;
    /**
     * The sound's start offset in seconds.
     */
    startOffset?: number;
}

/**
 * Abstract class representing a sound in the audio engine.
 */
export abstract class AbstractSound extends NamedAbstractAudioNode {
    private _state: SoundState = SoundState.Stopped;

    protected _instances = new Set<_AbstractSoundInstance>();

    protected abstract _subGraph: _AbstractAudioSubGraph;

    private _outBus: Nullable<AbstractPrimaryAudioBus> = null;

    /**
     * Whether the sound should start playing automatically.
     */
    public readonly autoplay: boolean;

    /**
     * How long to play the sound, in seconds.
     */
    public duration: number;

    /**
     * Whether the sound should loop.
     */
    public loop: boolean;

    /**
     * The maximum number of instances that can play at the same time.
     */
    public maxInstances: number;

    /**
     * The sound's start offset in seconds.
     */
    public startOffset: number;

    /**
     * Observable for when the sound ends.
     */
    public onEndedObservable = new Observable<AbstractSound>();

    /**
     * The current playback time of the sound in seconds.
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
     * The state of the sound.
     */
    public get state(): SoundState {
        return this._state;
    }

    /**
     * The output bus for the sound.
     */
    public get outBus(): Nullable<AbstractPrimaryAudioBus> {
        return this._outBus;
    }

    public set outBus(outBus: Nullable<AbstractPrimaryAudioBus>) {
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

    protected constructor(name: string, engine: AudioEngineV2, options: Nullable<IAbstractSoundOptions> = null) {
        super(name, engine, _AudioNodeType.Out);

        this.autoplay = options?.autoplay ?? false;
        this.duration = options?.duration ?? 0;
        this.loop = options?.loop ?? false;
        this.maxInstances = options?.maxInstances ?? Infinity;
        this.startOffset = options?.startOffset ?? 0;
    }

    public abstract get spatial(): AbstractSpatialAudio;
    public abstract get stereo(): AbstractStereoAudio;

    /** */
    public get volume(): number {
        return this._subGraph.getSubNode<_VolumeAudioSubNode>(_AudioSubNode.Volume)?.volume ?? _VolumeAudio.DefaultVolume;
    }

    public set volume(value: number) {
        this._subGraph.callOnSubNode<_VolumeAudioSubNode>(_AudioSubNode.Volume, (node) => {
            node.volume = value;
        });
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

    protected abstract _createInstance(): _AbstractSoundInstance;

    public abstract play(): void;

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

    public abstract stop(): void;

    protected get _isPaused(): boolean {
        return this._state === SoundState.Paused && this._instances.size > 0;
    }

    protected _setState(state: SoundState): void {
        this._state = state;
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
}
