import type { AbstractSound } from "./abstractSound";
import { _AbstractSoundInstance } from "./abstractSoundInstance";

/** @internal */
export abstract class _StaticSoundInstance extends _AbstractSoundInstance {
    /** @internal */
    constructor(source: AbstractSound) {
        super(source);
    }
}
