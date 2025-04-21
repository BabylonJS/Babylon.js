import { Observable } from "../../Misc/observable";
import { SoundState } from "../soundState";
import { AbstractAudioNode, AudioNodeType } from "./abstractAudioNode";
import type { AbstractSound, IAbstractSoundPlayOptions, IAbstractSoundPlayOptionsBase } from "./abstractSound";

/**
 * Options for creating a sound instance.
 * @internal
 * */
export interface IAbstractSoundInstanceOptions extends IAbstractSoundPlayOptionsBase {}

/** @internal */
export abstract class _AbstractSoundInstance extends AbstractAudioNode {
    protected _sound: AbstractSound;
    protected _state: SoundState = SoundState.Stopped;

    /** Observable triggered when the sound instance's playback ends */
    public readonly onEndedObservable = new Observable<_AbstractSoundInstance>();

    /** Observable triggered if the sound instance encounters an error and can not be played */
    public readonly onErrorObservable = new Observable<any>();

    /** Observable triggered when the sound instance's state changes */
    public readonly onStateChangedObservable = new Observable<_AbstractSoundInstance>();

    protected abstract readonly _options: IAbstractSoundInstanceOptions;

    protected constructor(sound: AbstractSound) {
        super(sound.engine, AudioNodeType.HAS_OUTPUTS);

        this._sound = sound;
    }

    public abstract currentTime: number;

    public abstract readonly startTime: number;

    /** The playback state of the sound instance */
    public get state(): SoundState {
        return this._state;
    }

    /** @internal */
    public override dispose(): void {
        super.dispose();
        this.stop();
        this.onEndedObservable.clear();
        this.onStateChangedObservable.clear();
    }

    public abstract play(options: Partial<IAbstractSoundPlayOptions>): void;
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
