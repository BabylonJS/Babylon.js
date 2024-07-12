/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { IAudioPhysicalEngine } from "./abstractAudioPhysicalEngine";
import { setCurrentAudioEngine } from "./audioEngine";
import type { IVirtualVoice } from "./virtualVoice";

export type VirtualVoicesByPriority = { [key: number]: Map<number, IVirtualVoice> };

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

        setCurrentAudioEngine(this);
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

        voice.onDeactivatedObservable.addOnce((voice) => {
            this.removeVoice(voice);
        });

        this._voicesDirty = true;

        voice.onPlayingChangedObservable.add(() => {
            this._voicesDirty = true;
        });
    }

    removeVoice(voice: IVirtualVoice): void {
        this._voices.delete(voice.id);
        this._voicesByPriority[voice.priority].delete(voice.id);

        this._voicesDirty = true;
    }

    /**
     * Updates virtual voices. Called automatically if `autoUpdate` is `true`.
     */
    public update(): void {
        this.physicalEngine.update(this._voicesByPriority, this._voicesDirty);
        this._voicesDirty = false;
    }
}
