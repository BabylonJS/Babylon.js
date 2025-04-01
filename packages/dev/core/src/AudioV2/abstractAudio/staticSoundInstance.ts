import type { IAbstractSoundInstanceOptions } from "./abstractSoundInstance";
import { _AbstractSoundInstance } from "./abstractSoundInstance";
import type { IStaticSoundOptionsBase, IStaticSoundPlayOptions, IStaticSoundStopOptions } from "./staticSound";

/**
 * Options for creating a static sound instance.
 * @internal
 */
export interface IStaticSoundInstanceOptions extends IAbstractSoundInstanceOptions, IStaticSoundOptionsBase {}

/** @internal */
export abstract class _StaticSoundInstance extends _AbstractSoundInstance {
    protected abstract override readonly _options: IStaticSoundInstanceOptions;

    public abstract pitch: number;
    public abstract playbackRate: number;

    public abstract override play(options: Partial<IStaticSoundPlayOptions>): void;
    public abstract override stop(options?: Partial<IStaticSoundStopOptions>): void;
}
