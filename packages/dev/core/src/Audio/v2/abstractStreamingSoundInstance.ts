import type { AbstractAudioNode } from "./abstractAudioNode";
import { AbstractSoundInstance } from "./abstractSoundInstance";
import type { AbstractSound } from "./abstractSound";

export abstract class AbstractStreamingSoundInstance extends AbstractSoundInstance {
    constructor(source: AbstractSound, inputNode: AbstractAudioNode) {
        super(source, inputNode);
    }
}
