/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { IAudioBuffer, IAudioStream, ISoundOptions, IStaticSoundOptions, IStreamingSoundOptions } from "./audioEngine";
import { Observable } from "../../Misc/observable";

enum VirtualVoiceType {
    Static,
    Streaming,
}

export interface IVirtualVoice {
    id: number;
    priority: number;
    type: VirtualVoiceType;
    spatial: boolean;

    active: boolean; // `true` if playing or paused.
    onDeactivatedObservable: Observable<IVirtualVoice>;

    playing: boolean;

    play(): void;
    stop(): void;

    pause(): void;
    resume(): void;
}

class AbstractVirtualVoice {
    public readonly id: number;
    public readonly priority: number;
    public readonly spatial: boolean;

    public readonly onDeactivatedObservable = new Observable<IVirtualVoice>();

    private _active: boolean = false;
    private _playing: boolean = false;

    public constructor(id: number, options: ISoundOptions) {
        this.id = id;
        this.priority = options?.priority ?? 0;
        this.spatial = options?.spatial ?? false;
    }

    public get active(): boolean {
        return this._active;
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

export class StaticVirtualVoice extends AbstractVirtualVoice implements IVirtualVoice {
    public readonly type: VirtualVoiceType = VirtualVoiceType.Static;

    public constructor(id: number, options: IStaticSoundOptions, _buffer: IAudioBuffer) {
        super(id, options);
    }
}

export class StreamingVirtualVoice extends AbstractVirtualVoice implements IVirtualVoice {
    public readonly type: VirtualVoiceType = VirtualVoiceType.Streaming;

    public constructor(id: number, options: IStreamingSoundOptions, _stream: IAudioStream) {
        super(id, options);
    }
}
