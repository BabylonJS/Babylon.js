import type { Nullable } from "../../../../types";
import type { AbstractAudioSubGraph } from "../../abstractAudioSubGraph";

/** @internal */
export interface IWebAudioSubGraph extends AbstractAudioSubGraph {
    get webAudioInputNode(): Nullable<AudioNode>;
    get webAudioOutputNode(): Nullable<AudioNode>;
}
