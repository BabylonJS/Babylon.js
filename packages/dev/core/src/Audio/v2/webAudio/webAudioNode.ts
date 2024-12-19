import type { Nullable } from "../../../types";
import type { AbstractAudioNode } from "../abstractAudioNode";

/** @internal */
export interface IWebAudioNode extends AbstractAudioNode {
    /** @internal */
    webAudioInputNode: Nullable<AudioNode>;
}
