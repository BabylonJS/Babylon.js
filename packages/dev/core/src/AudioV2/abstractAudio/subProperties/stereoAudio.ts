import { AbstractStereoAudio } from "../../abstractAudio/subProperties/abstractStereoAudio";
import type { _AbstractAudioSubGraph } from "../subNodes/abstractAudioSubGraph";
import { _GetStereoAudioProperty, _SetStereoAudioProperty } from "../subNodes/stereoAudioSubNode";

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
        return _GetStereoAudioProperty(this._subGraph, "pan");
    }

    public set pan(value: number) {
        _SetStereoAudioProperty(this._subGraph, "pan", value);
    }
}
