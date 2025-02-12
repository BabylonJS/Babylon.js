import type { IAbstractSoundPlayOptionsBase } from "./abstractSound";
import { _AbstractSoundInstance } from "./abstractSoundInstance";
import type { IStaticSoundOptionsBase, IStaticSoundPlayOptions, IStaticSoundStopOptions } from "./staticSound";

/**
 * Options stored in a static sound instance.
 * @internal
 */
export interface IStaticSoundInstanceOptions extends IStaticSoundOptionsBase, IAbstractSoundPlayOptionsBase {}

/** @internal */
export abstract class _StaticSoundInstance extends _AbstractSoundInstance {
    protected abstract override readonly _options: IStaticSoundInstanceOptions;

    public abstract override play(options: Partial<IStaticSoundPlayOptions>): void;
    public abstract override stop(options?: Partial<IStaticSoundStopOptions>): void;
}
