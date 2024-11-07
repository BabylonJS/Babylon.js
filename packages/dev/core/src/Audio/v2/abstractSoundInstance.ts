import { Observable } from "../../Misc/observable";
import type { Nullable } from "../../types";
import { AbstractAudioNode, AudioNodeType } from "./abstractAudioNode";
import type { AbstractSound } from "./abstractSound";
import { SoundState } from "./soundState";

/** @internal */
export abstract class AbstractSoundInstance extends AbstractAudioNode {
    // Owned by audio engine.
    protected _state: SoundState = SoundState.Stopped;
    protected _source: AbstractSound;
    protected _startOffset: number = 0;

    /**
     * The state of the sound instance.
     */
    public get state(): SoundState {
        return this._state;
    }

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
