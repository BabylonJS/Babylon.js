import { AbstractAudioNode, AudioNodeType } from "./abstractAudioNode";
import type { AbstractSound } from "./abstractSound";

/**
 * Owned by AbstractAudioEngine.
 * Output-only node that connects to a downstream input node.
 */
export abstract class AbstractSoundInstance extends AbstractAudioNode {
    protected _source: AbstractSound;

    public constructor(source: AbstractSound) {
        super(source.engine, AudioNodeType.Output);

        this._source = source;
    }

    public async init(): Promise<void> {
        this._connect(this._source);
    }

    public override dispose(): void {
        super.dispose();

        this.stop();

        this.onDisposeObservable.notifyObservers(this);
    }

    public abstract get currentTime(): number;

    public abstract play(): Promise<void>;
    public abstract pause(): void;
    public abstract resume(): void;

    public stop(): void {
        this._onEnded();
    }

    protected _onEnded(): void {
        this._source._onSoundInstanceEnded(this);
    }
}
