import { _AudioNodeType, NamedAbstractAudioNode } from "./abstractAudioNode";
import type { AudioEngineV2 } from "./audioEngineV2";
import type { _AbstractAudioSubGraph } from "./subNodes/abstractAudioSubGraph";
import { _AudioSubNode } from "./subNodes/audioSubNode";
import type { _VolumeAudioSubNode } from "./subNodes/volumeAudioSubNode";
import { _VolumeAudio } from "./subNodes/volumeAudioSubNode";

/**
 * Abstract class representing an audio bus with volume control.
 */
export abstract class AbstractAudioBus extends NamedAbstractAudioNode {
    protected abstract _subGraph: _AbstractAudioSubGraph;

    protected constructor(name: string, engine: AudioEngineV2) {
        super(name, engine, _AudioNodeType.InOut);
    }

    /**
     * The output volume of the bus.
     */
    public get volume(): number {
        return this._subGraph.getSubNode<_VolumeAudioSubNode>(_AudioSubNode.Volume)?.volume ?? _VolumeAudio.DefaultVolume;
    }
    public set volume(value: number) {
        // Note that the volume sub-node is created at initialization time and it always exists, so the callback that
        // sets the node's volume is always called synchronously.
        this._subGraph.callOnSubNode<_VolumeAudioSubNode>(_AudioSubNode.Volume, (node) => {
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
