import { _AudioNodeType } from "./abstractAudioNode";
import { AbstractAudioSuperNode } from "./abstractAudioSuperNode";
import type { AudioEngineV2 } from "./audioEngineV2";
import { _AudioSubNode } from "./subNodes/audioSubNode";
import type { _VolumeAudioSubNode } from "./subNodes/volumeAudioSubNode";
import { _VolumeAudio } from "./subNodes/volumeAudioSubNode";

/**
 * Abstract class representing an audio bus node with volume control.
 */
export abstract class AbstractAudioBus extends AbstractAudioSuperNode {
    protected constructor(name: string, engine: AudioEngineV2) {
        super(name, engine, _AudioNodeType.InputOutput);
    }

    /** */
    public get volume(): number {
        return this._subGraph.getSubNode<_VolumeAudioSubNode>(_AudioSubNode.Volume)?.volume ?? _VolumeAudio.DefaultVolume;
    }

    public set volume(value: number) {
        this._subGraph.callOnSubNode<_VolumeAudioSubNode>(_AudioSubNode.Volume, (node) => {
            node.volume = value;
        });
    }
}
