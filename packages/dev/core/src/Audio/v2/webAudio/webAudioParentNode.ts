import type { IAudioParentNode } from "../audioParentNode";
import type { IWebAudioNode } from "./webAudioNode";

/** @internal */
export interface IWebAudioParentNode extends IAudioParentNode, IWebAudioNode {
    /** @internal */
    audioContext: AudioContext | OfflineAudioContext;
}
