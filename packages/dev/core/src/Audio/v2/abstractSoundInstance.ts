import { Observable } from "../../Misc/observable";
import { AbstractAudioNode, AudioNodeType } from "./abstractAudioNode";
import type { AbstractSound } from "./abstractSound";

/**
 * Owned by AbstractAudioEngine.
 * Output-only node that connects to a downstream input node.
 */
export abstract class AbstractSoundInstance extends AbstractAudioNode {
    protected _source: AbstractSound;

    public onEndedObservable = new Observable<AbstractSoundInstance>();

    public constructor(source: AbstractSound) {
        super(source.engine, AudioNodeType.Output);

        this._source = source;
    }

    public override dispose(): void {
        super.dispose();

        this.stop();
    }

    public abstract get currentTime(): number;

    public abstract play(): Promise<void>;
    public abstract pause(): void;
    public abstract resume(): void;
    public abstract stop(): void;
}
