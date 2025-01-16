import type { _AbstractAudioSubGraph } from "../subNodes/abstractAudioSubGraph";
import { _AudioSubNode } from "../subNodes/audioSubNode";
import type { _StereoAudioSubNode } from "../subNodes/stereoAudioSubNode";
import { AbstractStereoAudio, _StereoAudioDefaults } from "./abstractStereoAudio";

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
        return this._subGraph.getSubNode<_StereoAudioSubNode>(_AudioSubNode.Stereo)?.pan ?? _StereoAudioDefaults.Pan;
    }

    public set pan(value: number) {
        this._subGraph.callOnSubNode<_StereoAudioSubNode>(_AudioSubNode.Stereo, (node) => {
            node.pan = value;
        });
    }
}
