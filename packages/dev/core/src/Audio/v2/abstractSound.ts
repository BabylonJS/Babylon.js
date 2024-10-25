import { Observable } from "../../Misc/observable";
import type { Nullable } from "../../types";
import type { AbstractPrimaryAudioBus } from "./abstractAudioBus";
import type { AbstractAudioEngine } from "./abstractAudioEngine";
import { AbstractNamedAudioNode, AudioNodeType } from "./abstractAudioNode";
import type { AbstractSoundInstance } from "./abstractSoundInstance";

/**
 * Options for creating a new sound.
 */
export interface SoundOptions {
    /**
     * Whether the sound should start playing immediately.
     */
    autoplay?: boolean;
    /**
     * Whether the sound should loop.
     */
    loop?: boolean;
    /**
     * The pitch of the sound.
     */
    pitch?: number;
    /**
     * The playback rate of the sound.
     */
    playbackRate?: number;
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
    // Owned by AbstractAudioEngine.

    // Non-owning.
    protected _soundInstances = new Set<AbstractSoundInstance>();

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
     * The pitch of the sound.
     */
    public pitch: number;

    /**
     * The playback rate of the sound.
     */
    public playbackRate: number;

    /**
     * The volume of the sound.
     */
    public volume: number;

    /**
     * The sound's start offset in seconds.
     */
    public startOffset: number;

    /**
     * Observable for when the sound ends.
     */
    public onEndedObservable = new Observable<AbstractSound>();

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
    constructor(name: string, engine: AbstractAudioEngine, options: Nullable<SoundOptions> = null) {
        super(name, engine, AudioNodeType.Output);

        this.autoplay = options?.autoplay ?? false;
        this.loop = options?.loop ?? false;
        this.pitch = options?.pitch ?? 0;
        this.playbackRate = options?.playbackRate ?? 1;
        this.volume = options?.volume ?? 1;
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

    protected abstract _createSoundInstance(): Promise<AbstractSoundInstance>;

    /**
     * Plays the sound.
     * @param waitTime - The time to wait before playing the sound in seconds.
     * @param startOffset - The time within the sound source to start playing the sound in seconds.
     * @param duration - How long to play the sound in seconds.
     * @returns A promise that resolves when the sound is playing.
     */
    public async play(waitTime: Nullable<number> = null, startOffset: Nullable<number> = null, duration: Nullable<number> = null): Promise<AbstractSoundInstance> {
        const instance = await this._createSoundInstance();
        instance.onEndedObservable.addOnce(this._onSoundInstanceEnded.bind(this));

        await instance.play(waitTime, startOffset, duration);

        this._soundInstances.add(instance);

        return instance;
    }

    /**
     * Pauses the sound.
     */
    public pause(): void {
        if (!this._soundInstances) {
            return;
        }

        for (const instance of this._soundInstances) {
            instance.pause();
        }
    }

    /**
     * Resumes the sound.
     */
    public resume(): void {
        if (!this._soundInstances) {
            return;
        }

        for (const instance of this._soundInstances) {
            instance.resume();
        }
    }

    /**
     * Stops the sound.
     * @param waitTime - The time to wait before stopping the sound in seconds.
     */
    public stop(waitTime: Nullable<number> = null): void {
        if (!this._soundInstances) {
            return;
        }

        for (const instance of this._soundInstances) {
            instance.stop(waitTime);
        }
    }

    protected _onSoundInstanceEnded(instance: AbstractSoundInstance): void {
        this._soundInstances.delete(instance);

        if (this._soundInstances.size === 0) {
            this.onEndedObservable.notifyObservers(this);
        }
    }
}
