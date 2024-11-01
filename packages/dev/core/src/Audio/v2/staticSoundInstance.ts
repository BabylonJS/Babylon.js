import type { AbstractSound } from "./abstractSound";
import { AbstractSoundInstance } from "./abstractSoundInstance";

/** @internal */
export abstract class StaticSoundInstance extends AbstractSoundInstance {
    /** @internal */
    constructor(source: AbstractSound) {
        super(source);
    }
}
