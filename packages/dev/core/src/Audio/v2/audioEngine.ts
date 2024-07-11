/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { IVirtualVoice } from "./virtualVoice";
import type { Observable } from "../../Misc/observable";

export type VirtualVoicesByPriority = { [key: number]: Map<number, IVirtualVoice> };

export interface ISound {}

/**
 * Physical.
 */
export interface IAudioSpatializer {
    id: number;
    sounds: Array<ISound>; // TODO: Fix this. ISound is logical, but it's being referenced from physical here.
}

/**
 * Physical.
 */
export interface IAudioBuffer {
    id: number;
    loaded: boolean;
    duration: number; // seconds

    onLoadObservable: Observable<IAudioBuffer>;
}

/**
 * Physical.
 */
export interface IAudioStream {
    id: number;
}

export interface ISpatialSoundOptions {}

export interface ISoundOptions {
    sourceUrl?: string;
    sourceUrls?: string[];

    loop?: boolean;
    maxVoices?: number;
    priority?: number;
    spatial?: boolean;
    volume?: number;
}

export interface IStaticSoundOptions extends ISoundOptions {
    sourceBuffer?: IAudioBuffer;

    pitch?: number;
    playbackRate?: number;
}

export interface IStreamingSoundOptions extends ISoundOptions {}

/**
 * Physical.
 */
export interface IAudioPhysicalEngine {
    /**
     * Returns a double representing an ever-increasing hardware time in seconds used for scheduling. It starts at 0.
     */
    currentTime: number;

    update(voicesByPriority: VirtualVoicesByPriority): void;

    createSpatializer(options: ISpatialSoundOptions): number;
    createBuffer(options: IStaticSoundOptions): number;
    createStream(options: IStreamingSoundOptions): number;
}

export interface IAudioEngineOptions {
    /**
     * Update the audio engine automatically. Defaults to `true`.
     */
    autoUpdate?: boolean;

    /**
     * The automatic update rate in milliseconds. Defaults to 50. Ignored if `autoUpdate` is `false`.
     */
    autoUpdateRate?: number;

    /**
     * The maximum number of simultaneously playing spatial voices. Defaults to 64.
     */
    maxSpatialVoices?: number;

    /**
     * The maximum number of simultaneously playing static voices. Defaults to 128.
     */
    maxStaticVoices?: number;

    /**
     * The maximum number of simultaneously playing streaming voices. Defaults to 8.
     */
    maxStreamingVoices?: number;
}

export interface IAudioEngine {
    readonly currentTime: number;

    update(): void;
}

export class AbstractAudioEngine implements IAudioEngine {
    public readonly physicalEngine: IAudioPhysicalEngine;

    private _nextVoiceId: number = 0;
    private _voices = new Map<number, IVirtualVoice>();
    private _voicesByPriority: VirtualVoicesByPriority = {};
    private _voicesDirty: boolean = false;

    public constructor(physicalEngine: IAudioPhysicalEngine) {
        this.physicalEngine = physicalEngine;
    }

    /**
     * Returns the current time in seconds.
     */
    public get currentTime(): number {
        return this.physicalEngine.currentTime;
    }

    public getNextVoiceId(): number {
        return this._nextVoiceId++;
    }

    addVoice(voice: IVirtualVoice): void {
        this._voices.set(voice.id, voice);

        this._voicesByPriority[voice.priority] ??= new Map<number, IVirtualVoice>();
        const priorityMap = this._voicesByPriority[voice.priority];
        priorityMap.set(voice.id, voice);

        this._voicesDirty = true;
    }

    removeVoice(voice: IVirtualVoice): void {
        this._voices.delete(voice.id);
        this._voicesByPriority[voice.priority].delete(voice.id);

        this._voicesDirty = true;
    }

    /**
     * Updates virtual voice statuses. Called automatically if `autoUpdate` is `true`.
     */
    public update(): void {
        if (!this._voicesDirty) {
            return;
        }

        this.physicalEngine.update(this._voicesByPriority);

        this._voicesDirty = false;
    }
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
