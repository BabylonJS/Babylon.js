import type { IAudioParentNode } from "../audioParentNode";
import type { IWebAudioInputNode } from "./webAudioInputNode";
import type { IWebAudioOutputNode } from "./webAudioOutputNode";

/** @internal */
export interface IWebAudioParentNode extends IAudioParentNode, IWebAudioInputNode, IWebAudioOutputNode {
    /** @internal */
    audioContext: AudioContext | OfflineAudioContext;
}
