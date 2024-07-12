/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import { type ISoundOptions, SoundPriority } from "./abstractSound";
import { Observable } from "../../Misc/observable";

export enum VirtualVoiceType {
    Static,
    Streaming,
}

export enum VirtualVoiceState {
    Starting,
    Resuming,
    Restarting,
    Started,
    Pausing,
    Paused,
    Stopping,
    Stopped,
}

export class VirtualVoice {
    public id: number;
    public index: number;
    public priority: number;
    public sourceId: number;
    public spatial: boolean;
    public type: VirtualVoiceType;
    public updated: boolean = false;

    private _state: VirtualVoiceState = VirtualVoiceState.Starting;
    public readonly onStateChangedObservable = new Observable<VirtualVoice>();

    public constructor(index: number) {
        this.index = index;
    }

    public init(type: VirtualVoiceType, id: number, sourceId: number, options?: ISoundOptions): void {
        this.id = id;
        this.priority = options?.priority ?? SoundPriority.Optional; // TODO: What default should be used here?
        this.sourceId = sourceId;
        this.spatial = options?.spatial ?? false;
        this.type = type;
    }

    public get state(): VirtualVoiceState {
        return this._state;
    }

    public set state(value: VirtualVoiceState) {
        if (this._state === value) {
            return;
        }
        this.updated = false;
        this._state = value;
        this.onStateChangedObservable.notifyObservers(this);
    }

    public start(): void {
        this.state = this._state === VirtualVoiceState.Stopped ? VirtualVoiceState.Starting : VirtualVoiceState.Restarting;
    }

    public stop(): void {
        this.state = VirtualVoiceState.Stopping;
    }

    public pause(): void {
        this.state = VirtualVoiceState.Pausing;
    }

    public resume(): void {
        this.state = VirtualVoiceState.Resuming;
    }
}
