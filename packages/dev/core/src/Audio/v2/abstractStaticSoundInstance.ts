import type { AbstractAudioNode } from "./abstractAudioNode";
import { AbstractSoundInstance } from "./abstractSoundInstance";
import type { AbstractSound } from "./abstractSound";

export abstract class AbstractStaticSoundInstance extends AbstractSoundInstance {
    constructor(source: AbstractSound, inputNode: AbstractAudioNode) {
        super(source, inputNode);
    }
}
