import type { Nullable } from "../../types";
import type { IAbstractAudioBusOptions } from "./abstractAudioBus";
import { AbstractAudioBus } from "./abstractAudioBus";
import type { AudioEngineV2 } from "./audioEngineV2";
import type { MainAudioBus } from "./mainAudioBus";
import type { AbstractSpatialAudio, ISpatialAudioOptions } from "./subProperties/abstractSpatialAudio";
import type { AbstractStereoAudio, IStereoAudioOptions } from "./subProperties/abstractStereoAudio";

// NB: Secondary audio buses will be added later.
export type PrimaryAudioBus = MainAudioBus | AudioBus;

/**
 * Options for creating an audio bus.
 */
export interface IAudioBusOptions extends IAbstractAudioBusOptions, ISpatialAudioOptions, IStereoAudioOptions {
    /**
     * The output bus of the audio bus. Defaults to the audio engine's default main bus.
     * @see {@link AudioEngineV2.defaultMainBus}
     */
    outBus: PrimaryAudioBus;
}

/**
 * Abstract class for an audio bus that has spatial audio and stereo output capabilities.
 *
 * Instances of this class can be connected to other audio buses.
 *
 * Audio buses are created by the {@link CreateAudioBusAsync} function.
 */
export abstract class AudioBus extends AbstractAudioBus {
    private _outBus: Nullable<PrimaryAudioBus> = null;

    protected constructor(name: string, engine: AudioEngineV2) {
        super(name, engine);
    }

    /**
     * The output bus of the audio bus. Defaults to the audio engine's default main bus.
     */
    public get outBus(): Nullable<PrimaryAudioBus> {
        return this._outBus;
    }

    public set outBus(outBus: Nullable<PrimaryAudioBus>) {
        if (this._outBus === outBus) {
            return;
        }

        if (this._outBus) {
            this._outBus.onDisposeObservable.removeCallback(this._onOutBusDisposed);

            if (!this._disconnect(this._outBus)) {
                throw new Error("Disconnect failed");
            }
        }

        this._outBus = outBus;

        if (this._outBus) {
            this._outBus.onDisposeObservable.add(this._onOutBusDisposed);

            if (!this._connect(this._outBus)) {
                throw new Error("Connect failed");
            }
        }
    }

    /**
     * The spatial features of the audio bus.
     */
    public abstract readonly spatial: AbstractSpatialAudio;

    /**
     * The stereo features of the audio bus.
     */
    public abstract readonly stereo: AbstractStereoAudio;

    /**
     * Releases associated resources.
     */
    public override dispose(): void {
        super.dispose();
        this._outBus = null;
    }

    private _onOutBusDisposed = () => {
        this.outBus = this.engine.defaultMainBus;
    };
}
