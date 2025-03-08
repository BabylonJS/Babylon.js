import type { Nullable } from "../../../types";
import type { AudioEngineV2 } from "../../abstractAudio/audioEngineV2";
import { _AbstractAudioSubNode } from "../../abstractAudio/subNodes/abstractAudioSubNode";
import { AudioSubNode } from "../../abstractAudio/subNodes/audioSubNode";
import type { IStereoAudioOptions } from "../../abstractAudio/subProperties/abstractStereoAudio";
import { _StereoAudioDefaults } from "../../abstractAudio/subProperties/abstractStereoAudio";
import type { _AbstractAudioSubGraph } from "./abstractAudioSubGraph";

/** @internal */
export abstract class _StereoAudioSubNode extends _AbstractAudioSubNode {
    protected constructor(engine: AudioEngineV2) {
        super(AudioSubNode.STEREO, engine);
    }

    public abstract pan: number;

    /** @internal */
    public setOptions(options: Partial<IStereoAudioOptions>): void {
        this.pan = options.stereoPan ?? _StereoAudioDefaults.pan;
    }
}

/** @internal */
export function _GetStereoAudioSubNode(subGraph: _AbstractAudioSubGraph): Nullable<_StereoAudioSubNode> {
    return subGraph.getSubNode<_StereoAudioSubNode>(AudioSubNode.STEREO);
}

/** @internal */
export function _GetStereoAudioProperty<K extends keyof typeof _StereoAudioDefaults>(subGraph: _AbstractAudioSubGraph, property: K): (typeof _StereoAudioDefaults)[K] {
    return _GetStereoAudioSubNode(subGraph)?.[property] ?? _StereoAudioDefaults[property];
}

/** @internal */
export function _SetStereoAudioProperty<K extends keyof typeof _StereoAudioDefaults>(subGraph: _AbstractAudioSubGraph, property: K, value: _StereoAudioSubNode[K]): void {
    subGraph.callOnSubNode<_StereoAudioSubNode>(AudioSubNode.STEREO, (node) => {
        node[property] = value;
    });
}
