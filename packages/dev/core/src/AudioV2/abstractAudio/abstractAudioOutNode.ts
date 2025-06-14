import type { Nullable } from "../../types";
import { AudioParameterCurveShape } from "../audioParameter";
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
     * Sets the audio output volume with optional ramping.
     * @param value The value to set the volume to.
     * @param duration The duration over which to ramp the volume, in seconds. Defaults to 0 (no ramping).
     * @param curve The shape of the ramp to use for the volume change. Defaults to logarithmic when decreasing volume, or linear when increasing volume.
     */
    public setVolume(value: number, duration: number = 0, curve: Nullable<AudioParameterCurveShape> = null): void {
        const node = _GetVolumeAudioSubNode(this._subGraph);
        if (!node) {
            throw new Error("No volume subnode");
        }

        node.setVolume(value, duration, curve);
    }
}
