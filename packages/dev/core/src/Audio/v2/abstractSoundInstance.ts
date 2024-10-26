import { Observable } from "../../Misc/observable";
import type { Nullable } from "../../types";
import { AbstractAudioNode, AudioNodeType } from "./abstractAudioNode";
import type { AbstractSound } from "./abstractSound";

/** @internal */
export abstract class AbstractSoundInstance extends AbstractAudioNode {
    // Owned by AbstractAudioEngine.
    // Output-only node that connects to a downstream input node.

    protected _source: AbstractSound;
    protected _startOffset: number = 0;

    /** @internal */
    public onEndedObservable = new Observable<AbstractSoundInstance>();

    /** @internal */
    constructor(source: AbstractSound) {
        super(source.engine, AudioNodeType.Output);

        this._source = source;
        this._startOffset = source.startOffset;
    }

    /** @internal */
    public override dispose(): void {
        super.dispose();

        this.stop();
        this.onEndedObservable.clear();
    }

    public abstract get currentTime(): number;

    public abstract play(waitTime?: Nullable<number>, startOffset?: Nullable<number>, duration?: Nullable<number>): void;
    public abstract pause(): void;
    public abstract resume(): void;
    public abstract stop(waitTime?: Nullable<number>): void;
}
