import type { Nullable } from "../../types";
import { AudioNodeType } from "./abstractAudioNode";
import type { IAbstractAudioOutNodeOptions } from "./abstractAudioOutNode";
import { AbstractAudioOutNode } from "./abstractAudioOutNode";
import type { PrimaryAudioBus } from "./audioBus";
import type { AudioEngineV2 } from "./audioEngineV2";
import type { AbstractSpatialAudio, ISpatialAudioOptions } from "./subProperties/abstractSpatialAudio";
import type { AbstractStereoAudio, IStereoAudioOptions } from "./subProperties/abstractStereoAudio";

/**
 * Options for creating a sound source.
 */
export interface ISoundSourceOptions extends IAbstractAudioOutNodeOptions, ISpatialAudioOptions, IStereoAudioOptions {
    /**
     * The output bus for the sound source. Defaults to `null`.
     * - If not set or `null`, and `outBusAutoDefault` is `true`, then the sound source is automatically connected to the audio engine's default main bus.
     * @see {@link AudioEngineV2.defaultMainBus}
     */
    outBus: Nullable<PrimaryAudioBus>;

    /**
     * Whether the sound's `outBus` should default to the audio engine's main bus. Defaults to `true` for all sound sources except microphones.
     */
    outBusAutoDefault: boolean;
}

/**
 * Abstract class representing a sound in the audio engine.
 */
export abstract class AbstractSoundSource extends AbstractAudioOutNode {
    private _outBus: Nullable<PrimaryAudioBus> = null;

    protected constructor(name: string, engine: AudioEngineV2, nodeType: AudioNodeType = AudioNodeType.HAS_OUTPUTS) {
        super(name, engine, nodeType);
    }

    /**
     * The output bus for the sound.
     * @see {@link AudioEngineV2.defaultMainBus}
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
     * The spatial features of the sound.
     */
    public abstract spatial: AbstractSpatialAudio;

    /**
     * The stereo features of the sound.
     */
    public abstract stereo: AbstractStereoAudio;

    /**
     * Releases associated resources.
     */
    public override dispose(): void {
        super.dispose();

        this._outBus = null;
    }

    private _onOutBusDisposed = () => {
        this._outBus = null;
    };
}
