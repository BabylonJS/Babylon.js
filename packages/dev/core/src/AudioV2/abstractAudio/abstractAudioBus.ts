import { AbstractNamedAudioNode, AudioNodeType } from "./abstractAudioNode";
import type { AudioEngineV2 } from "./audioEngineV2";
import type { _AbstractAudioSubGraph } from "./subNodes/abstractAudioSubGraph";
import { _GetVolumeAudioProperty, _GetVolumeAudioSubNode } from "./subNodes/volumeAudioSubNode";

/**
 * Abstract class representing an audio bus with volume control.
 *
 * An audio bus is a node in the audio graph that can have multiple inputs and outputs. It is typically used to group
 * sounds together and apply effects to them.
 */
export abstract class AbstractAudioBus extends AbstractNamedAudioNode {
    protected abstract _subGraph: _AbstractAudioSubGraph;

    protected constructor(name: string, engine: AudioEngineV2) {
        super(name, engine, AudioNodeType.HAS_INPUTS_AND_OUTPUTS);
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
        this._subGraph.dispose();
    }
}
