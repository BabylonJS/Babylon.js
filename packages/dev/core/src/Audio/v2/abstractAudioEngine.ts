/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { AbstractAudioPhysicalEngine } from "./abstractAudioPhysicalEngine";
import type { AudioBusOptions } from "./audioBus";
import { AudioBus } from "./audioBus";
import { setCurrentAudioEngine } from "./audioEngine";
import type { AudioSpatializerOptions } from "./audioSpatializer";
import type { SoundOptions } from "./sound";
import type { VirtualVoiceType } from "./virtualVoice";
import { VirtualVoice, VirtualVoiceState } from "./virtualVoice";

export interface AudioEngineOptions {
    /**
     * Update the audio engine automatically. Defaults to `true`.
     */
    autoUpdate?: boolean;

    /**
     * The automatic update rate in milliseconds. Defaults to 50. Ignored if `autoUpdate` is `false`.
     */
    autoUpdateRate?: number;

    /**
     * The maximum number of simultaneously playing sound field voices. Defaults to 64.
     */
    maxSoundFieldVoices?: number;

    /**
     * The maximum number of simultaneously playing spatial voices. Defaults to 64.
     */
    maxSpatialVoices?: number;

    /**
     * The maximum number of simultaneously playing static voices. Defaults to 128.
     */
    maxStaticVoices?: number;

    /**
     * The maximum number of simultaneously playing streamed voices. Defaults to 8.
     */
    maxStreamedVoices?: number;
}

export abstract class AbstractAudioEngine {
    private _voices = new Array<VirtualVoice>();
    private _voicesDirty: boolean = false;
    private _inactiveVoiceIndex: number = 1;

    public readonly mainBus: AudioBus;
    public readonly physicalEngine: AbstractAudioPhysicalEngine;

    /**
     * Returns the current time in seconds.
     */
    public get currentTime(): number {
        return this.physicalEngine.currentTime;
    }

    public constructor(physicalEngine: AbstractAudioPhysicalEngine) {
        setCurrentAudioEngine(this);

        this.physicalEngine = physicalEngine;
        this.mainBus = new AudioBus(undefined, this);
    }

    public allocateVoices(count: number, type: VirtualVoiceType, physicalSourceId: number, options?: SoundOptions): Array<VirtualVoice> {
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

            voice.init(type, physicalSourceId, options);
        }

        this._voicesDirty = true;

        return voices;
    }

    public freeVoices(voices: Array<VirtualVoice>): void {
        for (const voice of voices) {
            voice.stop();
        }
        // TODO: Finish implementation.
    }

    // TODO: Do these `createXXX` functions need to be exposed? Do they even need to exist? Can they only be on the
    //  physical audio engine?
    public createPhysicalBus(options?: AudioBusOptions): number {
        return this.physicalEngine.createBus(options, options?.outputBus?.physicalId ?? this.mainBus?.physicalId);
    }

    public createPhysicalSpatializer(options?: AudioSpatializerOptions): number {
        return this.physicalEngine.createSpatializer(options);
    }

    public createPhysicalSource(options?: SoundOptions): number {
        return this.physicalEngine.createSource(options);
    }

    /**
     * Updates virtual and physical voices. Called automatically if `autoUpdate` is `true`.
     *
     * TODO: Add option to skip prioritization and sorting by default since most users won't need it.
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
