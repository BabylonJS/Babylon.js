import type { IAbstractSoundOptions, IAbstractSoundPlayOptions } from "./abstractSound";
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
    preloadCount: number;

    /**
     * The preload type of the sound's instances.
     */
    preloadType: "none" | "metadata" | "auto";
}

/**
 * Abstract class representing a streaming sound.
 */
export abstract class StreamingSound extends AbstractSound {
    private _preloadedInstances = new Array<_StreamingSoundInstance>();
    private _preloadedInstancesPromises = new Array<Promise<void>>();

    protected override _options: IStreamingSoundOptions;

    protected constructor(name: string, engine: AudioEngineV2, options: Partial<IStreamingSoundOptions> = {}) {
        super(name, engine, options);

        this._options.preloadCount ??= Infinity;
        this._options.preloadType ??= "auto";
    }

    /**
     * The number of instances to preload.
     */
    public get preloadCount(): number {
        return this._options.preloadCount;
    }

    /**
     * Returns the number of preloaded instances.
     */
    public get preloadedInstanceCount(): number {
        return this._preloadedInstances.length;
    }

    /**
     * The preload type of the sound's instances.
     */
    public get preloadType(): StreamingSoundPreloadType {
        return this._options.preloadType;
    }
    public set preloadType(value: StreamingSoundPreloadType) {
        this._options.preloadType = value;
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
     * @param options - The options to use when playing the sound.
     */
    public play(options: Partial<IAbstractSoundPlayOptions> = {}): void {
        if (this._isPaused && this._instances.size > 0) {
            this.resume();
            return;
        }

        let instance: _StreamingSoundInstance;

        if (this.preloadedInstanceCount > 0) {
            instance = this._preloadedInstances[0];
            instance.options.startOffset = this._options.startOffset;
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

        if (options.startOffset === undefined) {
            options.startOffset = this._options.startOffset;
        }
        if (options.duration === undefined) {
            options.duration = this._options.duration;
        }
        if (options.volume === undefined) {
            options.volume = 1;
        }

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
