import type { AbstractAudioNode } from "../abstractAudioNode";
import { AudioSender } from "../audioSender";

/** @internal */
export class WebAudioSender extends AudioSender {
    /** @internal */
    constructor(parent: AbstractAudioNode) {
        super(parent);
    }
}
