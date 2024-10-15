import type { AbstractAudioNode } from "../abstractAudioNode";
import { AbstractAudioSender } from "../abstractAudioSender";

/** @internal */
export class WebAudioSender extends AbstractAudioSender {
    public constructor(parent: AbstractAudioNode) {
        super(parent);
    }
}
