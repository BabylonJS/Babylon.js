import { _StereoAudioDefaults, AbstractStereoAudio } from "../../abstractAudio/subProperties/abstractStereoAudio";
import type { _AbstractAudioSubGraph } from "../subNodes/abstractAudioSubGraph";
import { _SetStereoAudioProperty } from "../subNodes/stereoAudioSubNode";

/** @internal */
export class _StereoAudio extends AbstractStereoAudio {
    private _pan: number = _StereoAudioDefaults.pan;
    private _subGraph: _AbstractAudioSubGraph;

    /** @internal */
    public constructor(subGraph: _AbstractAudioSubGraph) {
        super();
        this._subGraph = subGraph;
    }

    /** @internal */
    public get pan(): number {
        return this._pan;
    }

    public set pan(value: number) {
        this._pan = value;
        _SetStereoAudioProperty(this._subGraph, "pan", value);
    }
}
