import type { Nullable } from "../../types";
import { AbstractNamedAudioNode, AudioNodeType } from "./abstractAudioNode";
import type { AudioEngineV2 } from "./audioEngineV2";
import type { _AbstractAudioSubGraph } from "./subNodes/abstractAudioSubGraph";
import type { IVolumeAudioOptions } from "./subNodes/volumeAudioSubNode";
import { _GetVolumeAudioProperty, _GetVolumeAudioSubNode } from "./subNodes/volumeAudioSubNode";
import type { AbstractAudioAnalyzer, IAudioAnalyzerOptions } from "./subProperties/abstractAudioAnalyzer";
import { _AudioAnalyzer } from "./subProperties/audioAnalyzer";

/** @internal */
export interface IAbstractAudioBusOptions extends IAudioAnalyzerOptions, IVolumeAudioOptions {}

/**
 * Abstract class representing an audio bus with volume control.
 *
 * An audio bus is a node in the audio graph that can have multiple inputs and outputs. It is typically used to group
 * sounds together and apply effects to them.
 */
export abstract class AbstractAudioBus extends AbstractNamedAudioNode {
    private _analyzer: Nullable<AbstractAudioAnalyzer> = null;

    protected abstract _subGraph: _AbstractAudioSubGraph;

    protected constructor(name: string, engine: AudioEngineV2) {
        super(name, engine, AudioNodeType.HAS_INPUTS_AND_OUTPUTS);
    }

    /**
     * The analyzer features of the bus.
     */
    public get analyzer(): AbstractAudioAnalyzer {
        return this._analyzer ?? (this._analyzer = new _AudioAnalyzer(this._subGraph));
    }

    /**
     * The output volume of the bus.
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
}
