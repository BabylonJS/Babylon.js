import { AudioNodeType } from "./abstractAudioNode";
import { AbstractAudioSuperNode } from "./abstractAudioSuperNode";
import type { AudioEngineV2 } from "./audioEngineV2";
import { AudioSubNode } from "./subNodes/audioSubNode";
import type { VolumeAudioSubNode } from "./subNodes/volumeAudioSubNode";
import { VolumeAudio } from "./subNodes/volumeAudioSubNode";

/**
 * Abstract class representing an audio bus node with volume control.
 */
export abstract class AbstractAudioBus extends AbstractAudioSuperNode {
    protected constructor(name: string, engine: AudioEngineV2) {
        super(name, engine, AudioNodeType.InputOutput);
    }

    /** */
    public get volume(): number {
        return this._subGraph.getSubNode<VolumeAudioSubNode>(AudioSubNode.Volume)?.volume ?? VolumeAudio.DefaultVolume;
    }

    public set volume(value: number) {
        this._subGraph.callOnSubNode<VolumeAudioSubNode>(AudioSubNode.Volume, (node) => {
            node.volume = value;
        });
    }
}
