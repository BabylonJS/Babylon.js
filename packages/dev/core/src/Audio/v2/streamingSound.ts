import type { Nullable } from "../../types";
import type { ISoundOptions } from "./abstractSound";
import { AbstractSound } from "./abstractSound";
import type { AudioEngineV2 } from "./audioEngineV2";
import { SoundState } from "./soundState";
import type { StreamingSoundInstance } from "./streamingSoundInstance";

export type StreamingSoundPreloadType = "none" | "metadata" | "auto";

/**
 * Options for creating a new streaming sound.
 */
export interface IStreamingSoundOptions extends ISoundOptions {
    /**
     * The preload type of the sound's instance.
     */
    preloadType?: StreamingSoundPreloadType;

    /** The number of instances to preload */
    preloadCount?: number;
}

/**
 * Abstract class representing a streaming sound in the audio engine.
 */
export abstract class StreamingSound extends AbstractSound {
    private _preloadedInstances = new Array<StreamingSoundInstance>();
    private _preloadedInstancesPromises = new Array<Promise<void>>();

    /**
     * The preload type for the sound stream.
     */
    public preloadType: StreamingSoundPreloadType;

    /**
     * Set to `true` to preserve the pitch of the sound when changing the playback rate; otherwise `false`.
     */
    public preservesPitch: boolean;

    /** @internal */
    constructor(name: string, engine: AudioEngineV2, options: Nullable<IStreamingSoundOptions> = null) {
        super(name, engine, options);

        this.preloadType = options?.preloadType ?? "auto";
    }

    /**
     * Returns the number of preloaded instances.
     */
    public get preloadedInstanceCount(): number {
        return this._preloadedInstances.length;
    }

    /**
     * Preloads an instance of the sound.
     */
    public async preloadInstance(): Promise<void> {
        const instance = this._createSoundInstance();

        this._addPreloadedInstance(instance);

        await instance.preloadedPromise;
    }

    /**
     * Preloads the given number of instances of the sound.
     * @param count - The number of instances to preload.
     */
    public async preloadInstances(count: number): Promise<void> {
        for (let i = 0; i < count; i++) {
            this.preloadInstance();
        }

        await Promise.all(this._preloadedInstancesPromises);
    }

    protected abstract override _createSoundInstance(): StreamingSoundInstance;

    /**
     * Plays the sound.
     * @param waitTime - The time to wait before playing the sound in seconds.
     * @param startOffset - The time within the sound source to start playing the sound in seconds.
     * @param duration - How long to play the sound in seconds.
     * @returns The new playback instance, or `null` if the sound was resumed from pause.
     */
    public play(waitTime: Nullable<number> = null, startOffset: Nullable<number> = null, duration: Nullable<number> = null): StreamingSoundInstance {
        if (this._isPaused && this._soundInstances.size > 0) {
            this.resume();
            return Array.from(this._soundInstances)[this._soundInstances.size - 1] as StreamingSoundInstance;
        }

        let instance: Nullable<StreamingSoundInstance> = null;

        if (this.preloadedInstanceCount > 0) {
            instance = this._preloadedInstances[0];
            this._removePreloadedInstance(instance);
        }

        if (!instance) {
            instance = this._createSoundInstance();
        }

        this._play(instance, waitTime, startOffset, duration);

        const onInstanceStateChanged = () => {
            if (instance.state === SoundState.Started) {
                this._stopExcessInstances();
                instance.onStateChangedObservable.removeCallback(onInstanceStateChanged);
            }
        };
        instance.onStateChangedObservable.add(onInstanceStateChanged);

        return instance;
    }

    protected get _instancesPreloadedPromise() {
        return Promise.all(this._preloadedInstancesPromises);
    }

    protected _addPreloadedInstance(instance: StreamingSoundInstance): void {
        if (!this._preloadedInstances.includes(instance)) {
            this._preloadedInstances.push(instance);
        }

        if (!this._preloadedInstancesPromises.includes(instance.preloadedPromise)) {
            this._preloadedInstancesPromises.push(instance.preloadedPromise);
        }

        instance.onReadyObservable.add(this._removePreloadedInstance);
    }

    protected _removePreloadedInstance: (instance: StreamingSoundInstance) => void = (instance) => {
        let index = this._preloadedInstances.indexOf(instance);
        if (index !== -1) {
            this._preloadedInstances.splice(index, 1);
        }

        index = this._preloadedInstancesPromises.indexOf(instance.preloadedPromise);
        if (index !== -1) {
            this._preloadedInstancesPromises.splice(index, 1);
        }

        instance.onReadyObservable.removeCallback(this._removePreloadedInstance);
    };
}
