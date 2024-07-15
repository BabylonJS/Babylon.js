/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import { type ISoundOptions, type Sound } from "./sound";
import { type VirtualVoice } from "./virtualVoice";
import { type Observable } from "../../Misc/observable";

export interface IAudioSpatializer {
    id: number;
    sounds: Array<Sound>;
}

export interface IAudioStaticSource {
    id: number;
    loaded: boolean;
    duration: number; // seconds

    onLoadObservable: Observable<IAudioStaticSource>;
}

export interface IAudioStreamedSource {
    id: number;
}

export abstract class AbstractAudioPhysicalEngine {
    private _nextSpatializerId: number = 0;
    private _nextSourceId: number = 0;

    /**
     * An ever-increasing hardware time in seconds used for scheduling. Starts at 0.
     */
    public abstract currentTime: number;

    public abstract update(voices: Array<VirtualVoice>): void;

    public abstract createSpatializer(options?: ISoundOptions): number;
    public abstract createSource(options?: ISoundOptions): number;

    protected _getNextSpatializerId(): number {
        return this._nextSpatializerId++;
    }

    protected _getNextSourceId(): number {
        return this._nextSourceId++;
    }
}
