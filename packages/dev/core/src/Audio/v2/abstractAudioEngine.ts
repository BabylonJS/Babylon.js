/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import { type IAudioPhysicalEngine } from "./abstractAudioPhysicalEngine";
import { type ISoundOptions } from "./abstractSound";
import { setCurrentAudioEngine } from "./audioEngine";
import { VirtualVoice, type VirtualVoiceType } from "./virtualVoice";

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
    private _voices = new Array<VirtualVoice>();
    private _voicesDirty: boolean = false;
    private _lastActiveVoiceIndex: number = 1;

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

    public activateVoices(count: number, type: VirtualVoiceType, sourceId: number, options?: ISoundOptions): Array<VirtualVoice> {
        const voices = new Array<VirtualVoice>(count);
        if (count === 0) {
            return voices;
        }

        for (let i = 0; i < count; i++) {
            const voice = this._lastActiveVoiceIndex < this._voices.length ? this._voices[this._lastActiveVoiceIndex] : this._createVoice();
            voices[i] = voice;

            voice.init(type, this.getNextVoiceId(), sourceId, options);
        }

        this._voicesDirty = true;

        return voices;
    }

    public deactivateVoices(voices: Array<VirtualVoice>): void {
        for (const voice of voices) {
            this._voices[voice.index].stop();
        }
    }

    /**
     * Updates virtual voices. Called automatically if `autoUpdate` is `true`.
     */
    public update(): void {
        if (this._voicesDirty) {
            this._voices.sort((_a, _b) => {
                return 0;
            });
        }

        this.physicalEngine.update(this._voices);
        this._voicesDirty = false;
    }

    private _createVoice(): VirtualVoice {
        const voice = new VirtualVoice(this._voices.length);
        this._voices.push(voice);

        voice.onStateChangedObservable.add(() => {
            this._voicesDirty = true;
        });

        return voice;
    }
}
