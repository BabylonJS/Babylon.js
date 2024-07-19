/* eslint-disable */

import * as Physical from "./physical";
import { Observable } from "../../Misc/observable";

export enum VoiceState {
    Starting,
    Unmuting,
    Resuming,
    Restarting,
    Started,
    Muting,
    Muted,
    Pausing,
    Paused,
    Stopping,
    Stopped,
}

export class VirtualVoice {
    physicalSource: Physical.Source;
    options: any;

    _state: VoiceState = VoiceState.Starting;
    onStateChangedObservable = new Observable<VirtualVoice>();

    init(physicalSource: Physical.Source, options?: any): void {
        this.physicalSource = physicalSource;
        this.options = options;
    }

    get state(): VoiceState {
        return this._state;
    }

    set state(value: VoiceState) {
        this.setState(value);
    }

    setState(value: VoiceState) {
        if (this._state === value) {
            return;
        }
        this._state = value;
        this.onStateChangedObservable.notifyObservers(this);
    }

    get priority(): number {
        return this.options?.priority !== undefined ? this.options.priority : 0;
    }

    get loop(): boolean {
        return this.options?.loop === true;
    }

    get static(): boolean {
        return this.options?.stream !== true;
    }

    get streamed(): boolean {
        return this.options?.stream === true;
    }

    get spatial(): boolean {
        return this.options?.spatial === true;
    }

    get updated(): boolean {
        return this._state === VoiceState.Muted || this._state === VoiceState.Paused || this._state === VoiceState.Started || this._state === VoiceState.Stopped;
    }

    get active(): boolean {
        return this.state < VoiceState.Pausing;
    }

    get waitingToStart(): boolean {
        return this.state < VoiceState.Started;
    }

    get started(): boolean {
        return this.state === VoiceState.Started;
    }

    get muting(): boolean {
        return this.state === VoiceState.Muting;
    }

    get muted(): boolean {
        return this.state === VoiceState.Muted;
    }

    get pausing(): boolean {
        return this.state === VoiceState.Pausing;
    }

    get stopping(): boolean {
        return this.state === VoiceState.Stopping;
    }

    compare(other: VirtualVoice): number {
        if (this.state !== other.state) {
            return this.state - other.state;
        }
        if (this.priority < other.priority) {
            return 1;
        }
        if (this.priority > other.priority) {
            return -1;
        }

        // Looped voices are more noticeable when they stop and start, so they are prioritized over non-looped voices.
        if (this.loop && !other.loop) {
            return 1;
        }
        if (!this.loop && other.loop) {
            return -1;
        }

        // Streamed voices are hard to restart cleanly, so they are prioritized over static voices.
        if (this.stream && other.static) {
            return 1;
        }
        if (this.static && other.stream) {
            return -1;
        }

        return 0;
    }

    start(): void {
        if (this._state === VoiceState.Muted) {
            this.state = VoiceState.Unmuting;
        } else if (this._state === VoiceState.Paused) {
            this.state = VoiceState.Resuming;
        } else if (this._state === VoiceState.Stopped) {
            this.state = VoiceState.Restarting;
        } else if (this._state === VoiceState.Muting || this._state === VoiceState.Pausing) {
            this.state = VoiceState.Started;
        }
    }

    mute(): void {
        this.state = VoiceState.Muting;
    }

    pause(): void {
        this.state = VoiceState.Pausing;
    }

    resume(): void {
        this.state = VoiceState.Resuming;
    }

    stop(): void {
        this.state = VoiceState.Stopping;
    }
}
