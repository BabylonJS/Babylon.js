import type { Nullable } from "../../types";
import { AbstractAudioBus } from "./abstractAudioBus";
import type { AudioEngineV2 } from "./audioEngineV2";
import type { MainAudioBus } from "./mainAudioBus";
import type { ISpatialAudioOptions } from "./subNodes/spatialAudioSubNode";
import type { IStereoAudioOptions } from "./subNodes/stereoAudioSubNode";
import type { IVolumeAudioOptions } from "./subNodes/volumeAudioSubNode";
import type { AbstractSpatialAudio } from "./subProperties/abstractSpatialAudio";
import type { AbstractStereoAudio } from "./subProperties/abstractStereoAudio";

// NB: Secondary audio buses will be added later.
export type PrimaryAudioBus = MainAudioBus | AudioBus;

/**
 * Options for creating a new audio bus.
 */
export interface IAudioBusOptions extends ISpatialAudioOptions, IStereoAudioOptions, IVolumeAudioOptions {
    /**
     * The output bus of the audio bus. Defaults to audio engine's default main bus.
     * @see {@link AudioEngineV2.defaultMainBus}
     */
    outBus: PrimaryAudioBus;
}

/**
 * Abstract class for an audio bus that has spatial audio and stereo output capabilities.
 *
 * Instances of this class can be connected to other audio buses.
 */
export abstract class AudioBus extends AbstractAudioBus {
    private _outBus: Nullable<PrimaryAudioBus> = null;

    protected constructor(name: string, engine: AudioEngineV2, options: Partial<IAudioBusOptions> = {}) {
        super(name, engine);

        if (options.outBus) {
            this.outBus = options.outBus;
        }
    }

    /**
     * The output bus of the audio bus. Defaults to audio engine's default main bus.
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
     * The spatial audio properties of the audio bus.
     */
    public abstract get spatial(): AbstractSpatialAudio;

    /**
     * The stereo audio properties of the audio bus.
     */
    public abstract get stereo(): AbstractStereoAudio;
}
