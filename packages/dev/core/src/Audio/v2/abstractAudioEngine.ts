/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import { type IAudioPhysicalEngine } from "./abstractAudioPhysicalEngine";
import { type ISoundOptions, type IStaticSoundOptions, type IStreamingSoundOptions } from "./abstractSound";
import { setCurrentAudioEngine } from "./audioEngine";
import { VirtualVoice, VirtualVoiceState, type VirtualVoiceType } from "./virtualVoice";

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

    createSpatializer(options?: ISoundOptions): number;
    createBuffer(options?: IStaticSoundOptions): number;
    createStream(options?: IStreamingSoundOptions): number;
    update(): void;
}

export class AbstractAudioEngine implements IAudioEngine {
    public readonly physicalEngine: IAudioPhysicalEngine;

    private _voices = new Array<VirtualVoice>();
    private _voicesDirty: boolean = false;
    private _inactiveVoiceIndex: number = 1;

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

    public activateVoices(count: number, type: VirtualVoiceType, sourceId: number, options?: ISoundOptions): Array<VirtualVoice> {
        const voices = new Array<VirtualVoice>(count);
        if (count === 0) {
            return voices;
        }

        this._inactiveVoiceIndex = 0;

        for (let i = 0; i < count; i++) {
            while (this._inactiveVoiceIndex < this._voices.length && this._voices[this._inactiveVoiceIndex].state !== VirtualVoiceState.Stopped) {
                this._inactiveVoiceIndex++;
            }

            const voice = this._inactiveVoiceIndex < this._voices.length ? this._voices[this._inactiveVoiceIndex] : this._createVoice();
            voices[i] = voice;

            voice.init(type, sourceId, options);
        }

        this._voicesDirty = true;

        return voices;
    }

    public deactivateVoices(voices: Array<VirtualVoice>): void {
        for (const voice of voices) {
            voice.stop();
        }
        // TODO: Finish implementation.
    }

    public createSpatializer(options?: ISoundOptions): number {
        return this.physicalEngine.createSpatializer(options);
    }

    public createBuffer(options?: IStaticSoundOptions): number {
        return this.physicalEngine.createBuffer(options);
    }

    public createStream(options?: IStreamingSoundOptions): number {
        return this.physicalEngine.createStream(options);
    }

    /**
     * Updates virtual and physical voices. Called automatically if `autoUpdate` is `true`.
     */
    public update(): void {
        if (!this._voicesDirty) {
            return;
        }

        // TODO: There maybe be a faster way to sort since we don't care about the order of inactive voices.
        this._voices.sort((a, b) => a.compare(b));

        this._voicesDirty = false;
        this.physicalEngine.update(this._voices);
    }

    private _createVoice(): VirtualVoice {
        const voice = new VirtualVoice();

        voice.onStateChangedObservable.add(() => {
            this._voicesDirty = true;
        });

        this._voices.push(voice);
        this._inactiveVoiceIndex = this._voices.length;

        return voice;
    }
}
