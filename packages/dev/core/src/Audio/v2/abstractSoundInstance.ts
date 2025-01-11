import { Observable } from "../../Misc/observable";
import { _AudioNodeType, AbstractAudioNode } from "./abstractAudioNode";
import type { AbstractSound, IAbstractSoundOptions, IAbstractSoundPlayOptions } from "./abstractSound";
import { SoundState } from "./soundState";

/** @internal */
export abstract class _AbstractSoundInstance extends AbstractAudioNode {
    protected _sound: AbstractSound;
    protected _state: SoundState = SoundState.Stopped;

    /** Observable triggered when the sound instance's playback ends */
    public readonly onEndedObservable = new Observable<_AbstractSoundInstance>();

    /** Observable triggered when the sound instance's state changes */
    public readonly onStateChangedObservable = new Observable<_AbstractSoundInstance>();

    /** @internal */
    public options = {} as IAbstractSoundOptions;

    protected constructor(sound: AbstractSound, options: Partial<IAbstractSoundOptions>) {
        super(sound.engine, _AudioNodeType.Out);

        Object.assign(this.options, options);

        this._sound = sound;
    }

    public abstract get currentTime(): number;
    public abstract set currentTime(value: number);

    public abstract get startTime(): number;

    /** The playback state of the sound instance */
    public get state(): SoundState {
        return this._state;
    }

    /** @internal */
    public override dispose(): void {
        super.dispose();
        this.stop();
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
