import type { AbstractAudioNode } from "../abstractAudioNode";
import { AudioSender } from "../audioSender";

/** @internal */
export async function _CreateAudioSenderAsync(parent: AbstractAudioNode): Promise<AudioSender> {
    return new WebAudioSender(parent);
}

class WebAudioSender extends AudioSender {
    /** @internal */
    constructor(parent: AbstractAudioNode) {
        super(parent);
    }

    /** @internal */
    public getClassName(): string {
        return "WebAudioSender";
    }
}
