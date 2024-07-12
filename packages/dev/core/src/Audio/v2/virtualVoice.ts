/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import { type ISoundOptions, SoundPriority } from "./abstractSound";
import { Observable } from "../../Misc/observable";

export enum VirtualVoiceType {
    Static,
    Streaming,
}

export interface IVirtualVoice {
    id: number;
    sourceId: number;
    priority: SoundPriority;
    type: VirtualVoiceType;
    spatial: boolean;

    active: boolean; // `true` if playing or paused.
    onDeactivatedObservable: Observable<IVirtualVoice>;

    playing: boolean; // `true` if playing; `false` if paused.
    onPlayingChangedObservable: Observable<IVirtualVoice>;

    stop(): void;

    pause(): void;
    resume(): void;
}

export class VirtualVoice implements IVirtualVoice {
    public readonly type: VirtualVoiceType;
    public readonly id: number;
    public readonly sourceId: number;
    public readonly spatial: boolean;

    public priority: number;
    public updated: boolean = false;

    public readonly onDeactivatedObservable = new Observable<IVirtualVoice>();
    public readonly onPlayingChangedObservable = new Observable<IVirtualVoice>();

    private _active: boolean = true;
    private _playing: boolean = true;

    public constructor(type: VirtualVoiceType, id: number, sourceId: number, options?: ISoundOptions) {
        this.type = type;
        this.id = id;
        this.sourceId = sourceId;
        this.priority = options?.priority ?? SoundPriority.Optional; // TODO: What default should be used here?
        this.spatial = options?.spatial ?? false;
    }

    public get active(): boolean {
        return this._active;
    }

    public get playing(): boolean {
        return this._playing;
    }

    public stop(): void {
        if (!this._active) {
            return;
        }

        this._playing = false;
        this._active = false;
        this.onDeactivatedObservable.notifyObservers(this);
    }

    public pause(): void {
        if (!this._playing) {
            return;
        }

        this._playing = false;
        this.onPlayingChangedObservable.notifyObservers(this);
    }

    public resume(): void {
        if (this._playing) {
            return;
        }

        this._playing = true;
        this.onPlayingChangedObservable.notifyObservers(this);
    }
}
