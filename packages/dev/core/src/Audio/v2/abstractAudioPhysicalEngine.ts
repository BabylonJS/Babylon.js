/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import { type AudioBusOptions } from "./audioBus";
import { type AudioSpatializerOptions } from "./audioSpatializer";
import { type SoundOptions, type Sound } from "./sound";
import { type VirtualVoice } from "./virtualVoice";
import { Observable } from "../../Misc/observable";

export abstract class AbstractAudioBus {
    public readonly id: number;
    public readonly sounds = new Array<Sound>();

    public constructor(id: number) {
        this.id = id;
    }
}

export abstract class AbstractAudioSpatializer {
    public readonly id: number;
    public readonly sounds = new Array<Sound>();

    public constructor(id: number) {
        this.id = id;
    }
}

export abstract class AbstractAudioStaticSource {
    public readonly id: number;
    public onLoadObservable = new Observable<AbstractAudioStaticSource>();

    public abstract loaded: boolean;
    public abstract duration: number; // seconds

    public constructor(id: number) {
        this.id = id;
    }
}

export abstract class AbstractAudioStreamedSource {
    public readonly id: number;

    public constructor(id: number) {
        this.id = id;
    }
}

export abstract class AbstractAudioPhysicalEngine {
    private _nextBusId: number = 1;
    private _nextSoundFieldRotatorId: number = 1;
    private _nextSpatializerId: number = 1;
    private _nextSourceId: number = 1;

    /**
     * An ever-increasing hardware time in seconds used for scheduling. Starts at 0.
     */
    public abstract currentTime: number;

    public abstract update(voices: Array<VirtualVoice>): void;

    public abstract createBus(options?: AudioBusOptions): number;
    public abstract createSpatializer(options?: AudioSpatializerOptions): number;
    public abstract createSource(options?: SoundOptions): number;

    protected _getNextBusId(): number {
        return this._nextBusId++;
    }

    protected _getNextSoundFieldRotatorId(): number {
        return this._nextSoundFieldRotatorId++;
    }

    protected _getNextSpatializerId(): number {
        return this._nextSpatializerId++;
    }

    protected _getNextSourceId(): number {
        return this._nextSourceId++;
    }
}
