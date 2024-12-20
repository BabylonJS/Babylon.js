import type { Nullable } from "../../types";
import type { IAbstractSoundOptions } from "./abstractSound";
import { AbstractSound } from "./abstractSound";
import type { AudioEngineV2 } from "./audioEngineV2";
import { SoundState } from "./soundState";
import type { _StreamingSoundInstance } from "./streamingSoundInstance";

export type StreamingSoundPreloadType = "none" | "metadata" | "auto";

/**
 * Options for creating a new streaming sound.
 */
export interface IStreamingSoundOptions extends IAbstractSoundOptions {
    /**
     * The number of instances to preload
     * */
    preloadCount?: number;

    /**
     * The preload type of the sound's instance.
     */
    preloadType?: "none" | "metadata" | "auto";
}

/**
 * Abstract class representing a streaming sound in the audio engine.
 */
export abstract class StreamingSound extends AbstractSound {
    private _preloadedInstances = new Array<_StreamingSoundInstance>();
    private _preloadedInstancesPromises = new Array<Promise<void>>();

    /**
     * The preload type for the sound stream.
     */
    public preloadType: StreamingSoundPreloadType;

    protected constructor(name: string, engine: AudioEngineV2, options: Nullable<IStreamingSoundOptions> = null) {
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
        const instance = this._createInstance();

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

    protected abstract override _createInstance(): _StreamingSoundInstance;

    /**
     * Plays the sound.
     * @param startOffset - The time within the sound source to start playing the sound in seconds.
     * @param duration - How long to play the sound in seconds.
     */
    public play(startOffset: Nullable<number> = null, duration: Nullable<number> = null): void {
        if (this._isPaused && this._instances.size > 0) {
            this.resume();
            return;
        }

        let instance: _StreamingSoundInstance;

        if (this.preloadedInstanceCount > 0) {
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

        this._beforePlay(instance);
        instance.play(startOffset, duration);
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

    protected get _instancesPreloadedPromise() {
        return Promise.all(this._preloadedInstancesPromises);
    }

    private _addPreloadedInstance(instance: _StreamingSoundInstance): void {
        if (!this._preloadedInstances.includes(instance)) {
            this._preloadedInstances.push(instance);
        }

        if (!this._preloadedInstancesPromises.includes(instance.preloadedPromise)) {
            this._preloadedInstancesPromises.push(instance.preloadedPromise);
        }
    }

    private _removePreloadedInstance: (instance: _StreamingSoundInstance) => void = (instance) => {
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
