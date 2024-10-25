import type { AbstractSound } from "./abstractSound";
import { AbstractSoundInstance } from "./abstractSoundInstance";

/**
 * Abstract class representing a static sound instance in the audio engine.
 */
export abstract class AbstractStaticSoundInstance extends AbstractSoundInstance {
    /** @internal */
    constructor(source: AbstractSound) {
        super(source);
    }
}
