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
export interface IWebAudioInputOutputNode extends IWebAudioInputNode, IWebAudioOutputNode {}

/** @internal */
export interface IWebAudioParentNode extends IWebAudioInputOutputNode {
    /** @internal */
    audioContext: AudioContext | OfflineAudioContext;
}
