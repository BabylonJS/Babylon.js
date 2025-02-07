import { Observable } from "../../Misc/observable";
import { _AbstractSoundInstance } from "./abstractSoundInstance";
import type { IStreamingSoundOptions, StreamingSound } from "./streamingSound";

/** @internal */
export abstract class _StreamingSoundInstance extends _AbstractSoundInstance {
    private _rejectPreloadedProimse: (reason?: any) => void;
    private _resolvePreloadedPromise: () => void;

    /** @internal */
    public readonly onReadyObservable = new Observable<_StreamingSoundInstance>();

    /** @internal */
    public override options: IStreamingSoundOptions;

    /** @internal */
    public readonly preloadedPromise = new Promise<void>((resolve, reject) => {
        this._rejectPreloadedProimse = reject;
        this._resolvePreloadedPromise = resolve;
    });

    protected constructor(sound: StreamingSound, options: Partial<IStreamingSoundOptions>) {
        super(sound, options);

        this.onErrorObservable.add(this._rejectPreloadedProimse);
        this.onReadyObservable.add(this._resolvePreloadedPromise);
    }

    /** @internal */
    public override dispose(): void {
        super.dispose();

        this.onErrorObservable.clear();
        this.onReadyObservable.clear();

        this._resolvePreloadedPromise();
    }
}
