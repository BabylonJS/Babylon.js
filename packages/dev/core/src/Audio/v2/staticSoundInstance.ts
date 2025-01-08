import { _AbstractSoundInstance } from "./abstractSoundInstance";
import type { IStaticSoundOptions, IStaticSoundPlayOptions, IStaticSoundStopOptions } from "./staticSound";

/** @internal */
export abstract class _StaticSoundInstance extends _AbstractSoundInstance {
    /** @internal */
    public override options: IStaticSoundOptions;

    public abstract override play(options: Partial<IStaticSoundPlayOptions>): void;
    public abstract override stop(options?: Partial<IStaticSoundStopOptions>): void;
}
