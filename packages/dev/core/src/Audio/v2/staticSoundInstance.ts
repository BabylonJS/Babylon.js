import type { Nullable } from "../../types";
import type { AbstractSound } from "./abstractSound";
import { _AbstractSoundInstance } from "./abstractSoundInstance";

/** @internal */
export abstract class _StaticSoundInstance extends _AbstractSoundInstance {
    /** @internal */
    constructor(source: AbstractSound) {
        super(source);
    }

    public abstract override play(startOffset?: Nullable<number>, duration?: Nullable<number>, waitTime?: Nullable<number>): void;
    public abstract override stop(waitTime?: Nullable<number>): void;
}
