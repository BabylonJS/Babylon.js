import { Observable } from "../../Misc/observable";
import type { Nullable } from "../../types";
import { _AudioNodeType, AbstractAudioNode } from "./abstractAudioNode";
import type { AbstractSound } from "./abstractSound";
import { SoundState } from "./soundState";

/** @internal */
export abstract class _AbstractSoundInstance extends AbstractAudioNode {
    protected _state: SoundState = SoundState.Stopped;
    protected _sound: AbstractSound;
    protected _startOffset: number = 0;

    /** Observable triggered when the sound instance's playback ends */
    public readonly onEndedObservable = new Observable<_AbstractSoundInstance>();

    /** Observable triggered when the sound instance's state changes */
    public readonly onStateChangedObservable = new Observable<_AbstractSoundInstance>();

    protected constructor(sound: AbstractSound) {
        super(sound.engine, _AudioNodeType.Out);

        this._sound = sound;
        this._startOffset = sound.startOffset;
    }

    /** @internal */
    public override dispose(): void {
        super.dispose();
        this.stop();
        this.onStateChangedObservable.clear();
    }

    public abstract get currentTime(): number;
    public abstract set currentTime(value: number);
    public abstract get startTime(): number;

    /** The playback state of sound instance */
    public get state(): SoundState {
        return this._state;
    }

    public abstract play(startOffset?: Nullable<number>, duration?: Nullable<number>): void;
    public abstract pause(): void;
    public abstract resume(): void;
    public abstract stop(): void;

    protected _setState(value: SoundState) {
        if (this._state === value) {
            return;
        }

        this._state = value;
        this.onStateChangedObservable.notifyObservers(this);
    }
}
