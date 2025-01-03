import type { Nullable } from "../../types";
import { _AbstractSoundInstance } from "./abstractSoundInstance";

/** @internal */
export abstract class _StaticSoundInstance extends _AbstractSoundInstance {
    public abstract override play(startOffset?: Nullable<number>, duration?: Nullable<number>, waitTime?: Nullable<number>): void;
    public abstract override stop(waitTime?: Nullable<number>): void;
}
