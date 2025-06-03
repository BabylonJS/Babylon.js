import type { Nullable } from "../../types";
import type { IAudioParamRampOptions } from "../audioParam";
import type { AudioNodeType } from "./abstractAudioNode";
import { AbstractNamedAudioNode } from "./abstractAudioNode";
import type { AudioEngineV2 } from "./audioEngineV2";
import type { _AbstractAudioSubGraph } from "./subNodes/abstractAudioSubGraph";
import type { IVolumeAudioOptions } from "./subNodes/volumeAudioSubNode";
import { _GetVolumeAudioProperty, _GetVolumeAudioSubNode } from "./subNodes/volumeAudioSubNode";
import type { AbstractAudioAnalyzer, IAudioAnalyzerOptions } from "./subProperties/abstractAudioAnalyzer";
import { _AudioAnalyzer } from "./subProperties/audioAnalyzer";

/** @internal */
export interface IAbstractAudioOutNodeOptions extends IAudioAnalyzerOptions, IVolumeAudioOptions {}

/**
 * Abstract class representing and audio output node with volume control.
 */
export abstract class AbstractAudioOutNode extends AbstractNamedAudioNode {
    private _analyzer: Nullable<AbstractAudioAnalyzer> = null;

    protected abstract _subGraph: _AbstractAudioSubGraph;

    protected constructor(name: string, engine: AudioEngineV2, nodeType: AudioNodeType) {
        super(name, engine, nodeType);
    }

    /**
     * The analyzer features of the bus.
     */
    public get analyzer(): AbstractAudioAnalyzer {
        return this._analyzer ?? (this._analyzer = new _AudioAnalyzer(this._subGraph));
    }

    /**
     * The audio output volume.
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

        this._subGraph.dispose();
    }

    /**
     * Fades the audio output volume to the given target volume over the given duration.
     * @param options Options for ramping the volume over time.
     * @param targetVolume the target volume to fade in to. Defaults to the current `volume` property's value.
     */
    public fadeIn(options: Nullable<Partial<IAudioParamRampOptions>> = null, targetVolume: number = this.volume): void {
        if (typeof targetVolume !== "number") {
            targetVolume = this.volume;
        }

        if (targetVolume <= 0) {
            return;
        }

        this.volume = 0;

        this.setVolume(targetVolume, options);
    }

    /**
     * Fades the audio output volume to zero over a specified duration.
     * @param options Options for ramping the volume over time.
     */
    public fadeOut(options: Nullable<Partial<IAudioParamRampOptions>> = null): void {
        this.setVolume(0, options);
    }

    /**
     * Sets the audio output volume with optional ramping.
     * @param volume The volume to set.
     * @param options Options for ramping the volume over time.
     */
    public setVolume(volume: number, options?: Nullable<Partial<IAudioParamRampOptions>>): void {
        // The volume subnode is created on initialization and should always exist.
        const node = _GetVolumeAudioSubNode(this._subGraph);
        if (!node) {
            throw new Error("No volume subnode");
        }

        node.setVolume(volume, options);
    }
}
