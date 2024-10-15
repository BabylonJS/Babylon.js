import type { AbstractAudioNode } from "./abstractAudioNode";
import type { AbstractSound } from "./abstractSound";
import { AbstractSoundInstance } from "./abstractSoundInstance";

export abstract class AbstractStreamingSoundInstance extends AbstractSoundInstance {
    constructor(source: AbstractSound, inputNode: AbstractAudioNode) {
        super(source, inputNode);
    }
}
