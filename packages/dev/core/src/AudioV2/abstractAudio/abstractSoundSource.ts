import type { Nullable } from "../../types";
import { AbstractNamedAudioNode, AudioNodeType } from "./abstractAudioNode";
import type { PrimaryAudioBus } from "./audioBus";
import type { AudioEngineV2 } from "./audioEngineV2";
import type { _AbstractAudioSubGraph } from "./subNodes/abstractAudioSubGraph";
import { _GetVolumeAudioProperty, _GetVolumeAudioSubNode } from "./subNodes/volumeAudioSubNode";
import type { AbstractAudioAnalyzer, IAudioAnalyzerOptions } from "./subProperties/abstractAudioAnalyzer";
import type { AbstractSpatialAudio, ISpatialAudioOptions } from "./subProperties/abstractSpatialAudio";
import type { AbstractStereoAudio, IStereoAudioOptions } from "./subProperties/abstractStereoAudio";
import { _AudioAnalyzer } from "./subProperties/audioAnalyzer";

/**
 * Options for creating a sound source.
 */
export interface ISoundSourceOptions extends IAudioAnalyzerOptions, ISpatialAudioOptions, IStereoAudioOptions {
    /**
     * The output bus for the sound source. Defaults to `null`.
     * - If not set or `null`, the sound source is automatically connected to the audio engine's default main bus.
     * @see {@link AudioEngineV2.defaultMainBus}
     */
    outBus: Nullable<PrimaryAudioBus>;
}

/**
 * Abstract class representing a sound in the audio engine.
 */
export abstract class AbstractSoundSource extends AbstractNamedAudioNode {
    private _analyzer: Nullable<AbstractAudioAnalyzer> = null;
    private _outBus: Nullable<PrimaryAudioBus> = null;

    protected abstract _subGraph: _AbstractAudioSubGraph;

    protected constructor(name: string, engine: AudioEngineV2, nodeType: AudioNodeType = AudioNodeType.HAS_OUTPUTS) {
        super(name, engine, nodeType);
    }

    /**
     * The analyzer features of the sound.
     */
    public get analyzer(): AbstractAudioAnalyzer {
        return this._analyzer ?? (this._analyzer = new _AudioAnalyzer(this._subGraph));
    }

    /**
     * The output bus for the sound. Defaults to `null`.
     * - If not set or `null`, the sound is automatically connected to the audio engine's default main bus.
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
     * The output volume of the sound.
     */
    public get volume(): number {
        return _GetVolumeAudioProperty(this._subGraph, "volume");
    }

    public set volume(value: number) {
        // The volume subnode is created on initialization and should always exist.
        const node = _GetVolumeAudioSubNode(this._subGraph);
        if (!node) {
            throw new Error("No volume subnode");
        }

        node.volume = value;
    }

    /**
     * Releases associated resources.
     */
    public override dispose(): void {
        super.dispose();

        this._analyzer?.dispose();
        this._analyzer = null;

        this._outBus = null;
    }

    private _onOutBusDisposed = () => {
        this._outBus = null;
    };
}
