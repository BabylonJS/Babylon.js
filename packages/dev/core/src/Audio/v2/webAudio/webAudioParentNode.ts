import type { IAudioParentNode } from "../audioParentNode";
import type { IWebAudioInputNode } from "./webAudioInputNode";

/** @internal */
export interface IWebAudioParentNode extends IAudioParentNode, IWebAudioInputNode {
    /** @internal */
    audioContext: AudioContext | OfflineAudioContext;
}
