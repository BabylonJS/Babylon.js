import { AudioNodeType, AbstractNamedAudioNode } from "./abstractAudioNode";
import type { AudioEngineV2 } from "./audioEngineV2";
import type { _AbstractAudioSubGraph } from "./subNodes/abstractAudioSubGraph";
import { _AudioSubNode } from "./subNodes/audioSubNode";
import type { _VolumeAudioSubNode } from "./subNodes/volumeAudioSubNode";
import { _VolumeAudioDefaults } from "./subNodes/volumeAudioSubNode";

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
        return this._subGraph.getSubNode<_VolumeAudioSubNode>(_AudioSubNode.VOLUME)?.volume ?? _VolumeAudioDefaults.Volume;
    }

    public set volume(value: number) {
        // Note that the volume subnode is created at initialization time and it always exists, so the callback that
        // sets the node's volume is always called synchronously.
        this._subGraph.callOnSubNode<_VolumeAudioSubNode>(_AudioSubNode.VOLUME, (node) => {
            node.volume = value;
        });
    }

    /**
     * Releases associated resources.
     */
    public override dispose(): void {
        super.dispose();
        this._subGraph.dispose();
    }
}
