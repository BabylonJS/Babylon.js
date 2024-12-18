import type { AbstractAudioNode } from "../abstractAudioNode";
import type { AbstractAudioSubGraph } from "../abstractAudioSubGraph";
import type { IAudioParentNode } from "../audioParentNode";
import type { IWebAudioNode } from "./webAudioNode";

/** @internal */
export interface IWebAudioParentNode extends AbstractAudioNode, IAudioParentNode, IWebAudioNode {
    /** @internal */
    audioContext: AudioContext | OfflineAudioContext;

    /** @internal */
    subGraph: AbstractAudioSubGraph;
}
