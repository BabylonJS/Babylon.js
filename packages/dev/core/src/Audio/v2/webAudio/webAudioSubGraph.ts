import type { AbstractAudioSubGraph } from "../abstractAudioSubGraph";

/** @internal */
export interface IWebAudioSubGraph extends AbstractAudioSubGraph {
    get webAudioInputNode(): AudioNode;
    get webAudioOutputNode(): AudioNode;
}
