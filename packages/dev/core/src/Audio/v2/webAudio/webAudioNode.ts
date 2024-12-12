import type { AbstractAudioNode } from "../abstractAudioNode";

/** @internal */
export interface IWebAudioNode extends AbstractAudioNode {
    /** @internal */
    webAudioInputNode: AudioNode;
}
