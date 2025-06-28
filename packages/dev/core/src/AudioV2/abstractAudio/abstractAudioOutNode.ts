import type { Nullable } from "../../types";
import type { IAudioParameterRampOptions } from "../audioParameter";
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
 * Abstract class representing and audio output node with an analyzer and volume control.
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
     * If the duration is 0 then the volume is set immediately, otherwise it is ramped to the new value over the given duration using the given shape.
     * If a ramp is already in progress then the volume is not set and an error is thrown.
     * @param value The value to set the volume to.
     * @param options The options to use for ramping the volume change.
     */
    public setVolume(value: number, options: Nullable<Partial<IAudioParameterRampOptions>> = null): void {
        const node = _GetVolumeAudioSubNode(this._subGraph);
        if (!node) {
            throw new Error("No volume subnode");
        }

        node.setVolume(value, options);
    }
}
