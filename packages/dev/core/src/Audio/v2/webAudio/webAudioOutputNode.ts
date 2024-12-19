import type { Nullable } from "../../../types";
import type { AbstractAudioNode } from "../abstractAudioNode";

/** @internal */
export interface IWebAudioOutputNode extends AbstractAudioNode {
    /** @internal */
    webAudioOutputNode: Nullable<AudioNode>;
}
