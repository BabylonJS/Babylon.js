/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import { type ISoundOptions } from "./sound";
import { Observable } from "../../Misc/observable";

export enum VirtualVoiceType {
    Static,
    Streamed,
}

export enum VirtualVoiceState {
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
    public index: number;
    public loop: boolean;
    public priority: number;
    public sourceId: number;
    public spatial: boolean;
    public type: VirtualVoiceType;

    private _state: VirtualVoiceState = VirtualVoiceState.Starting;
    public readonly onStateChangedObservable = new Observable<VirtualVoice>();

    public init(type: VirtualVoiceType, sourceId: number, options?: ISoundOptions): void {
        this.loop = options?.loop ?? false;
        this.priority = options?.priority ?? 0;
        this.sourceId = sourceId;
        this.spatial = options?.spatial ?? false;
        this.type = type;
    }

    public get static(): boolean {
        return this.type === VirtualVoiceType.Static;
    }

    public get streamed(): boolean {
        return this.type === VirtualVoiceType.Streamed;
    }

    public get state(): VirtualVoiceState {
        return this._state;
    }

    public set state(value: VirtualVoiceState) {
        this.setState(value);
    }

    public setState(value: VirtualVoiceState) {
        if (this._state === value) {
            return;
        }
        this._state = value;
        this.onStateChangedObservable.notifyObservers(this);
    }

    public get updated(): boolean {
        return (
            this._state === VirtualVoiceState.Muted ||
            this._state === VirtualVoiceState.Paused ||
            this._state === VirtualVoiceState.Started ||
            this._state === VirtualVoiceState.Stopped
        );
    }

    public get active(): boolean {
        return this.state < VirtualVoiceState.Pausing;
    }

    public get waitingToStart(): boolean {
        return this.state < VirtualVoiceState.Started;
    }

    public get started(): boolean {
        return this.state === VirtualVoiceState.Started;
    }

    public get muting(): boolean {
        return this.state === VirtualVoiceState.Muting;
    }

    public get muted(): boolean {
        return this.state === VirtualVoiceState.Muted;
    }

    public get pausing(): boolean {
        return this.state === VirtualVoiceState.Pausing;
    }

    public get stopping(): boolean {
        return this.state === VirtualVoiceState.Stopping;
    }

    public compare(other: VirtualVoice): number {
        if (this.state !== other.state) {
            return this.state - other.state;
        }
        if (this.priority === other.priority) {
            return 0;
        }
        if (this.priority > other.priority) {
            return -1;
        }

        // Looped voices are more noticeable when they stop and start, so they are prioritized over non-looped voices.
        if (!this.loop && other.loop) {
            return -1;
        }

        // Streamed voices are hard to restart cleanly, so they are prioritized over static voices.
        if (this.static && other.streamed) {
            return -1;
        }

        return 1;
    }

    public start(): void {
        if (this._state === VirtualVoiceState.Muted) {
            this.state = VirtualVoiceState.Unmuting;
        } else if (this._state === VirtualVoiceState.Paused) {
            this.state = VirtualVoiceState.Resuming;
        } else if (this._state === VirtualVoiceState.Stopped) {
            this.state = VirtualVoiceState.Restarting;
        } else if (this._state === VirtualVoiceState.Muting || this._state === VirtualVoiceState.Pausing) {
            this.state = VirtualVoiceState.Started;
        }
    }

    public mute(): void {
        this.state = VirtualVoiceState.Muting;
    }

    public pause(): void {
        this.state = VirtualVoiceState.Pausing;
    }

    public resume(): void {
        this.state = VirtualVoiceState.Resuming;
    }

    public stop(): void {
        this.state = VirtualVoiceState.Stopping;
    }
}
