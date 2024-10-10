import type { AbstractAudioNode } from "./abstractAudioNode";
import { AbstractSoundInstance } from "./abstractSoundInstance";
import type { AbstractSoundSource } from "./abstractSoundSource";

export abstract class AbstractStreamingSoundInstance extends AbstractSoundInstance {
    constructor(source: AbstractSoundSource, inputNode: AbstractAudioNode) {
        super(source, inputNode);
    }
}
