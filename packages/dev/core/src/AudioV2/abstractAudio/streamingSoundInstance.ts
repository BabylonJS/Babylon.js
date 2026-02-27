import { Observable } from "../../Misc/observable";
import type { IAbstractSoundInstanceOptions } from "./abstractSoundInstance";
import { _AbstractSoundInstance } from "./abstractSoundInstance";
import type { IStreamingSoundOptionsBase, StreamingSound } from "./streamingSound";

/**
 * Options for creating streaming sound instance.
 * @internal
 */
export interface IStreamingSoundInstanceOptions extends IAbstractSoundInstanceOptions, IStreamingSoundOptionsBase {}

/** @internal */
export abstract class _StreamingSoundInstance extends _AbstractSoundInstance {
    private _rejectPreloadedPromise: (reason?: any) => void;
    private _resolvePreloadedPromise: () => void;

    protected abstract override readonly _options: IStreamingSoundInstanceOptions;

    /** @internal */
    public readonly onReadyObservable = new Observable<_StreamingSoundInstance>();

    /** @internal */
    public readonly preloadedPromise = new Promise<void>((resolve, reject) => {
        this._rejectPreloadedPromise = reject;
        this._resolvePreloadedPromise = resolve;
    });

    protected constructor(sound: StreamingSound) {
        super(sound);

        this.onErrorObservable.add(this._rejectPreloadedPromise);
        this.onReadyObservable.add(this._resolvePreloadedPromise);
    }

    /** @internal */
    public set startOffset(value: number) {
        this._options.startOffset = value;
    }

    /** @internal */
    public override dispose(): void {
        super.dispose();

        this.onErrorObservable.clear();
        this.onReadyObservable.clear();

        this._resolvePreloadedPromise();
    }
}
