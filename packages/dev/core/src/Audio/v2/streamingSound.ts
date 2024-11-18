import type { Nullable } from "../../types";
import type { AbstractAudioEngine } from "./abstractAudioEngine";
import type { ISoundOptions } from "./abstractSound";
import { AbstractSound } from "./abstractSound";
import { SoundState } from "./soundState";
import type { StreamingSoundInstance } from "./streamingSoundInstance";

export type StreamingSoundPreloadType = "none" | "metadata" | "auto";

/**
 * Options for creating a new streaming sound.
 */
export interface IStreamingSoundOptions extends ISoundOptions {
    /**
     * The preload type of the sound.
     */
    preload?: StreamingSoundPreloadType;
}

/**
 * Abstract class representing a streaming sound in the audio engine.
 */
export abstract class StreamingSound extends AbstractSound {
    /**
     * The preload type for the sound stream.
     */
    public preload: StreamingSoundPreloadType;

    /**
     * Set to `true` to preserve the pitch of the sound when changing the playback rate; otherwise `false`.
     */
    public preservesPitch: boolean;

    /** @internal */
    constructor(name: string, engine: AbstractAudioEngine, options: Nullable<IStreamingSoundOptions> = null) {
        super(name, engine, options);

        this.preload = options?.preload ?? "auto";
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

        const instance = this._createSoundInstance();
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
}
