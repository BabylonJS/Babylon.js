import { type IAbstractSoundInstanceOptions, _AbstractSoundInstance } from "./abstractSoundInstance";
import { type IStaticSoundOptionsBase, type IStaticSoundPlayOptions, type IStaticSoundStopOptions } from "./staticSound";

/**
 * Options for creating a static sound instance.
 * @internal
 */
export interface IStaticSoundInstanceOptions extends IAbstractSoundInstanceOptions, IStaticSoundOptionsBase {}

/** @internal */
export abstract class _StaticSoundInstance extends _AbstractSoundInstance {
    protected abstract override readonly _options: IStaticSoundInstanceOptions;

    public abstract set loopStart(value: number);
    public abstract set loopEnd(value: number);
    public abstract set pitch(value: number);
    public abstract set playbackRate(value: number);

    public abstract override play(options: Partial<IStaticSoundPlayOptions>): void;
    public abstract override stop(options?: Partial<IStaticSoundStopOptions>): void;
}
