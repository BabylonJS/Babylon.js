import { Observable } from "../../Misc/observable";
import { AbstractAudioNode, AudioNodeType } from "./abstractAudioNode";
import type { AbstractSound } from "./abstractSound";

/**
 * Abstract class representing a sound instance in the audio engine.
 */
export abstract class AbstractSoundInstance extends AbstractAudioNode {
    // Owned by AbstractAudioEngine.
    // Output-only node that connects to a downstream input node.

    protected _source: AbstractSound;

    /**
     * The sound that the sound instance is playing.
     */
    public onEndedObservable = new Observable<AbstractSoundInstance>();

    /** @internal */
    constructor(source: AbstractSound) {
        super(source.engine, AudioNodeType.Output);

        this._source = source;
    }

    /**
     * Releases held resources.
     */
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
