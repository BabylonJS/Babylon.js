/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { ISoundOptions, Sound } from "./sound";
import { type VirtualVoice } from "./virtualVoice";
import type { Observable } from "../../Misc/observable";

export interface IAudioSpatializer {
    id: number;
    sounds: Array<Sound>;
}

// TODO: Consider renaming this to `IAudioStaticSource`.
export interface IAudioStaticBuffer {
    id: number;
    loaded: boolean;
    duration: number; // seconds

    onLoadObservable: Observable<IAudioStaticBuffer>;
}

export interface IAudioStream {
    id: number;
}

export interface IAudioPhysicalEngine {
    /**
     * Returns a double representing an ever-increasing hardware time in seconds used for scheduling. It starts at 0.
     */
    currentTime: number;

    update(voices: Array<VirtualVoice>): void;

    createSpatializer(options?: ISoundOptions): number;
    createSource(options?: ISoundOptions): number;
}

export class AbstractPhysicalAudioEngine {
    private _nextSpatializerId: number = 0;
    private _nextSourceId: number = 0;

    protected _getNextSpatializerId(): number {
        return this._nextSpatializerId++;
    }

    protected _getNextSourceId(): number {
        return this._nextSourceId++;
    }
}
