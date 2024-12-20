import { Observable } from "../../Misc/observable";
import type { AbstractSound } from "./abstractSound";
import { _AbstractSoundInstance } from "./abstractSoundInstance";

/** @internal */
export abstract class _StreamingSoundInstance extends _AbstractSoundInstance {
    private _resolvePreloadedPromise: () => void;

    /** @internal */
    public readonly preloadedPromise = new Promise<void>((resolve) => {
        this._resolvePreloadedPromise = resolve;
    });

    /** @internal */
    public onReadyObservable = new Observable<_StreamingSoundInstance>();

    protected constructor(sound: AbstractSound) {
        super(sound);

        this.onReadyObservable.add(this._resolvePreloadedPromise);
    }

    /** @internal */
    public set startOffset(value: number) {
        this._startOffset = value;
    }

    /** @internal */
    public override dispose(): void {
        super.dispose();

        this.onReadyObservable.clear();

        this._resolvePreloadedPromise();
    }
}
