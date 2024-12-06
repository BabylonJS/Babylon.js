import { Observable } from "../../Misc/observable";
import type { AbstractSound } from "./abstractSound";
import { _AbstractSoundInstance } from "./abstractSoundInstance";

/**
 * A streaming sound instance.
 */
export abstract class _StreamingSoundInstance extends _AbstractSoundInstance {
    protected _resolvePreloadedPromise: () => void;

    /** Promise that is resolved when the instance is preloaded */
    public readonly preloadedPromise = new Promise<void>((resolve) => {
        this._resolvePreloadedPromise = resolve;
    });

    /** Observable triggered when the instance is ready to play */
    public onReadyObservable = new Observable<_StreamingSoundInstance>();

    protected constructor(source: AbstractSound) {
        super(source);

        this.onReadyObservable.add(this._resolvePreloadedPromise);
    }

    /** @internal */
    set startOffset(value: number) {
        this._startOffset = value;
    }

    /**
     * Dispose the instance and release its resources.
     */
    public override dispose(): void {
        super.dispose();

        this.onReadyObservable.clear();

        this._resolvePreloadedPromise();
    }
}
