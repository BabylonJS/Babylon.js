import type { Nullable } from "../../types";
import { AbstractAudioBus } from "./abstractAudioBus";
import type { AudioEngineV2 } from "./audioEngineV2";
import type { MainAudioBus } from "./mainAudioBus";
import type { ISpatialAudioOptions } from "./subNodes/spatialAudioSubNode";
import type { IStereoAudioOptions } from "./subNodes/stereoAudioSubNode";
import type { IVolumeAudioOptions } from "./subNodes/volumeAudioSubNode";
import type { AbstractSpatialAudio } from "./subProperties/abstractSpatialAudio";
import type { AbstractStereoAudio } from "./subProperties/abstractStereoAudio";

export type AbstractPrimaryAudioBus = MainAudioBus | AudioBus;

/**
 * Options for creating a new audio bus.
 */
export interface IAudioBusOptions extends ISpatialAudioOptions, IStereoAudioOptions, IVolumeAudioOptions {
    /**
     * The output bus of the audio bus.
     */
    outBus?: AbstractPrimaryAudioBus;
}

/**
 * Abstract class for an audio bus.
 */
export abstract class AudioBus extends AbstractAudioBus {
    private _outBus: Nullable<AbstractPrimaryAudioBus> = null;

    protected constructor(name: string, engine: AudioEngineV2, options: Partial<IAudioBusOptions> = {}) {
        super(name, engine);

        if (options.outBus) {
            this.outBus = options.outBus;
        }
    }

    /**
     * Gets the output bus of the audio bus.
     */
    public get outBus(): Nullable<AbstractPrimaryAudioBus> {
        return this._outBus;
    }

    /**
     * Sets the output bus of the audio bus.
     */
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

    public abstract get spatial(): AbstractSpatialAudio;
    public abstract get stereo(): AbstractStereoAudio;
}
