import { AbstractStereoAudio, _StereoAudioDefaults } from "../../abstractAudio/subProperties/abstractStereoAudio";
import type { _AbstractAudioSubGraph } from "../subNodes/abstractAudioSubGraph";
import { _AudioSubNode } from "../subNodes/audioSubNode";
import type { _StereoAudioSubNode } from "../subNodes/stereoAudioSubNode";

/** @internal */
export class _StereoAudio extends AbstractStereoAudio {
    private _subGraph: _AbstractAudioSubGraph;

    /** @internal */
    public constructor(subGraph: _AbstractAudioSubGraph) {
        super();
        this._subGraph = subGraph;
    }

    /** @internal */
    public get pan(): number {
        return this._subGraph.getSubNode<_StereoAudioSubNode>(_AudioSubNode.STEREO)?.pan ?? _StereoAudioDefaults.PAN;
    }

    public set pan(value: number) {
        this._subGraph.callOnSubNode<_StereoAudioSubNode>(_AudioSubNode.STEREO, (node) => {
            node.pan = value;
        });
    }
}
