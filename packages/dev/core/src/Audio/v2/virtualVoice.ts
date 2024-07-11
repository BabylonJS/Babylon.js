/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { ISoundOptions } from "./audioEngine";
import { Observable } from "../../Misc/observable";

export enum VirtualVoiceType {
    Static,
    Streaming,
}

export interface IVirtualVoice {
    id: number;
    sourceId: number;
    priority: number;
    type: VirtualVoiceType;
    spatial: boolean;

    active: boolean; // `true` if playing or paused.
    onDeactivatedObservable: Observable<IVirtualVoice>;

    playing: boolean; // `true` if playing; `false` if paused.

    play(): void;
    stop(): void;

    pause(): void;
    resume(): void;
}

export class VirtualVoice implements IVirtualVoice {
    public readonly type: VirtualVoiceType;
    public readonly id: number;
    public readonly sourceId: number;
    public readonly priority: number;
    public readonly spatial: boolean;

    public readonly onDeactivatedObservable = new Observable<IVirtualVoice>();

    private _active: boolean = false;
    private _playing: boolean = false;

    public constructor(type: VirtualVoiceType, id: number, sourceId: number, options: ISoundOptions) {
        this.type = type;
        this.id = id;
        this.sourceId = sourceId;
        this.priority = options?.priority ?? 0;
        this.spatial = options?.spatial ?? false;
    }

    public get active(): boolean {
        return this._active;
    }

    public get playing(): boolean {
        return this._playing;
    }

    public play(): void {
        this._active = true;
        this._playing = true;
    }

    public stop(): void {
        this._playing = false;
        this._active = false;
        this.onDeactivatedObservable.notifyObservers(this);
    }

    public pause(): void {
        this._playing = false;
    }

    public resume(): void {
        this._playing = true;
    }
}
