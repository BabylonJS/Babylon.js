import type { Nullable } from "../../../types";
import type { AbstractAudioNode } from "../abstractAudioNode";

/** @internal */
export interface IWebAudioInputNode extends AbstractAudioNode {
    /** @internal */
    webAudioInputNode: Nullable<AudioNode>;
}

/** @internal */
export interface IWebAudioOutputNode extends AbstractAudioNode {
    /** @internal */
    webAudioOutputNode: Nullable<AudioNode>;
}

/** @internal */
export interface IWebAudioParentNode extends IWebAudioInputNode, IWebAudioOutputNode {
    /** @internal */
    audioContext: AudioContext | OfflineAudioContext;
}
