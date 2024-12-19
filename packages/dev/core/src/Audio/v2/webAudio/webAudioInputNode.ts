import type { Nullable } from "../../../types";
import type { AbstractAudioNode } from "../abstractAudioNode";

/** @internal */
export interface IWebAudioInputNode extends AbstractAudioNode {
    /** @internal */
    webAudioInputNode: Nullable<AudioNode>;
}
