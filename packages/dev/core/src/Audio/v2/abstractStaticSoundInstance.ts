import type { AbstractSound } from "./abstractSound";
import { AbstractSoundInstance } from "./abstractSoundInstance";

export abstract class AbstractStaticSoundInstance extends AbstractSoundInstance {
    constructor(source: AbstractSound) {
        super(source);
    }
}
