import { Observable } from "../../Misc/observable";
import type { Nullable } from "../../types";
import { AbstractAudioNode, AudioNodeType } from "./abstractAudioNode";
import type { AbstractAudioSubGraph } from "./abstractAudioSubGraph";
import type { _AbstractSoundInstance } from "./abstractSoundInstance";
import type { AbstractPrimaryAudioBus } from "./audioBus";
import type { AudioEngineV2 } from "./audioEngineV2";
import { SoundState } from "./soundState";
import { AudioSubNode } from "./subNodes/audioSubNode";
import type { ISpatialAudioOptions } from "./subNodes/spatialAudioSubNode";
import { StereoAudio, type IStereoAudioOptions, type StereoAudioSubNode } from "./subNodes/stereoAudioSubNode";
import { VolumeAudio, type IVolumeAudioOptions, type VolumeAudioSubNode } from "./subNodes/volumeAudioSubNode";

/**
 * Options for creating a new sound.
 */
export interface IAbstractSoundOptions extends ISpatialAudioOptions, IStereoAudioOptions, IVolumeAudioOptions {
    /**
     * Whether the sound should start playing immediately.
     */
    autoplay?: boolean;
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
    outputBus?: AbstractPrimaryAudioBus;
    /**
     * The sound's start offset in seconds.
     */
    startOffset?: number;
}

/**
 * Abstract class representing a sound in the audio engine.
 */
export abstract class AbstractSound extends AbstractAudioNode {
    private _state: SoundState = SoundState.Stopped;

    // Non-owning.
    protected _soundInstances = new Set<_AbstractSoundInstance>();

    protected _outputBus: Nullable<AbstractPrimaryAudioBus> = null;

    protected abstract _subGraph: AbstractAudioSubGraph;

    /**
     * Whether the sound should start playing automatically.
     */
    public readonly autoplay: boolean;

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
    public get outputBus(): Nullable<AbstractPrimaryAudioBus> {
        return this._outputBus;
    }

    public set outputBus(outputBus: Nullable<AbstractPrimaryAudioBus>) {
        if (this._outputBus === outputBus) {
            return;
        }

        if (this._outputBus) {
            this._disconnect(this._outputBus);
        }

        this._outputBus = outputBus;

        if (this._outputBus) {
            this._connect(this._outputBus);
        }
    }

    protected constructor(name: string, engine: AudioEngineV2, options: Nullable<IAbstractSoundOptions> = null) {
        super(engine, AudioNodeType.Output, null, name);

        this.autoplay = options?.autoplay ?? false;
        this.loop = options?.loop ?? false;
        this.maxInstances = options?.maxInstances ?? Infinity;
        this.startOffset = options?.startOffset ?? 0;
    }

    /** */
    public get stereoPan(): number {
        return this._subGraph.getSubNode<StereoAudioSubNode>(AudioSubNode.Stereo)?.pan ?? StereoAudio.DefaultPan;
    }

    public set stereoPan(value: number) {
        this._subGraph.callOnSubNode<StereoAudioSubNode>(AudioSubNode.Stereo, (node) => {
            node.pan = value;
        });
    }

    /** */
    public get volume(): number {
        return this._subGraph.getSubNode<VolumeAudioSubNode>(AudioSubNode.Volume)?.volume ?? VolumeAudio.DefaultVolume;
    }

    public set volume(value: number) {
        this._subGraph.callOnSubNode<VolumeAudioSubNode>(AudioSubNode.Volume, (node) => {
            node.volume = value;
        });
    }

    /**
     * Releases associated resources.
     */
    public override dispose(): void {
        super.dispose();

        this.stop();

        this._outputBus = null;
        this._soundInstances.clear();
        this.onEndedObservable.clear();

        this.onDisposeObservable.notifyObservers(this);
    }

    protected abstract _createSoundInstance(): _AbstractSoundInstance;

    public abstract play(startOffset?: Nullable<number>, duration?: Nullable<number>): void;

    /**
     * Pauses the sound.
     */
    public pause(): void {
        if (!this._soundInstances) {
            return;
        }

        for (const instance of Array.from(this._soundInstances)) {
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

        if (!this._soundInstances) {
            return;
        }

        for (const instance of Array.from(this._soundInstances)) {
            instance.resume();
        }

        this._state = SoundState.Started;
    }

    public abstract stop(): void;

    protected get _isPaused(): boolean {
        return this._state === SoundState.Paused && this._soundInstances.size > 0;
    }

    protected _setState(state: SoundState): void {
        this._state = state;
    }

    protected _getNewestInstance(): Nullable<_AbstractSoundInstance> {
        if (this._soundInstances.size === 0) {
            return null;
        }

        let instance: Nullable<_AbstractSoundInstance> = null;

        const it = this._soundInstances.values();
        for (let next = it.next(); !next.done; next = it.next()) {
            instance = next.value;
        }

        return instance;
    }

    protected _onSoundInstanceEnded: (instance: _AbstractSoundInstance) => void = (instance) => {
        this._soundInstances.delete(instance);

        if (this._soundInstances.size === 0) {
            this._state = SoundState.Stopped;
            this.onEndedObservable.notifyObservers(this);
        }
    };

    protected _beforePlay(instance: _AbstractSoundInstance): void {
        if (this.state === SoundState.Paused && this._soundInstances.size > 0) {
            this.resume();
            return;
        }

        instance.onEndedObservable.addOnce(this._onSoundInstanceEnded);
        this._soundInstances.add(instance);
    }

    protected _afterPlay(instance: _AbstractSoundInstance): void {
        this._state = instance.state;
    }

    protected _stopExcessInstances(): void {
        if (this.maxInstances < Infinity) {
            const numberOfInstancesToStop = Array.from(this._soundInstances).filter((instance) => instance.state === SoundState.Started).length - this.maxInstances;
            const it = this._soundInstances.values();

            for (let i = 0; i < numberOfInstancesToStop; i++) {
                const instance = it.next().value;
                instance.stop();
            }
        }
    }
}
