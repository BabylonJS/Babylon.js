import { Observable } from "../../Misc/observable";
import type { Nullable } from "../../types";
import type { AudioEngineV2 } from "./audioEngineV2";
import { AbstractNamedAudioNode, AudioNodeType } from "./abstractAudioNode";
import type { _AbstractSoundInstance } from "./abstractSoundInstance";
import type { AbstractPrimaryAudioBus } from "./audioBus";
import { SoundState } from "./soundState";

/**
 * Options for creating a new sound.
 */
export interface ISoundOptions {
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
     * The volume of the sound.
     */
    volume?: number;
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
export abstract class AbstractSound extends AbstractNamedAudioNode {
    private _state: SoundState = SoundState.Stopped;

    // Owned by AbstractAudioEngine.

    // Non-owning.
    protected _soundInstances = new Set<_AbstractSoundInstance>();

    protected _outputBus: Nullable<AbstractPrimaryAudioBus> = null;

    /**
     * Whether the sound should start playing immediately.
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
     * The volume of the sound.
     */
    public abstract get volume(): number;
    public abstract set volume(value: number);

    /**
     * The sound's start offset in seconds.
     */
    public startOffset: number;

    /**
     * Observable for when the sound ends.
     */
    public onEndedObservable = new Observable<AbstractSound>();

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

    /** @internal */
    constructor(name: string, engine: AudioEngineV2, options: Nullable<ISoundOptions> = null) {
        super(name, engine, AudioNodeType.Output);

        this.autoplay = options?.autoplay ?? false;
        this.loop = options?.loop ?? false;
        this.maxInstances = options?.maxInstances ?? Infinity;
        this.startOffset = options?.startOffset ?? 0;
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

    /**
     * Stops the sound.
     * @param waitTime - The time to wait before stopping the sound in seconds.
     */
    public stop(waitTime: Nullable<number> = null): void {
        if (waitTime && 0 < waitTime) {
            this._state = SoundState.Stopping;
        } else {
            this._state = SoundState.Stopped;
        }

        if (!this._soundInstances) {
            return;
        }

        for (const instance of Array.from(this._soundInstances)) {
            instance.stop(waitTime);
        }
    }

    protected get _isPaused(): boolean {
        return this._state === SoundState.Paused && this._soundInstances.size > 0;
    }

    protected _onSoundInstanceEnded: (instance: _AbstractSoundInstance) => void = (instance) => {
        this._soundInstances.delete(instance);

        if (this._soundInstances.size === 0) {
            this._state = SoundState.Stopped;
            this.onEndedObservable.notifyObservers(this);
        }
    };

    protected _play(instance: _AbstractSoundInstance, waitTime: Nullable<number> = null, startOffset: Nullable<number> = null, duration: Nullable<number> = null): void {
        if (this.state === SoundState.Paused && this._soundInstances.size > 0) {
            this.resume();
            return;
        }

        instance.onEndedObservable.addOnce(this._onSoundInstanceEnded);

        this._soundInstances.add(instance);

        instance.play(waitTime, startOffset, duration);

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
