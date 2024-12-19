import type { IWebAudioInputNode } from "./webAudioInputNode";
import type { IWebAudioOutputNode } from "./webAudioOutputNode";

/** @internal */
export interface IWebAudioParentNode extends IWebAudioInputNode, IWebAudioOutputNode {
    /** @internal */
    audioContext: AudioContext | OfflineAudioContext;
}
