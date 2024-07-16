/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import { type AbstractAudioEngine } from "./abstractAudioEngine";
import { type AudioBusSendOptions } from "./audioBus";
import { getCurrentAudioEngine } from "./audioEngine";
import { type VirtualVoice, VirtualVoiceType } from "./virtualVoice";
import { type IDisposable } from "../../scene";

export interface SoundOptions {
    name?: string;

    physicalSourceId?: number;
    physicalSpatializerId?: number;

    sourceUrl?: string;
    sourceUrls?: string[];

    autoplay?: boolean;
    loop?: boolean;
    maxVoices?: number;
    outputBusId?: number;
    pitch?: number;
    playbackRate?: number;
    priority?: number;
    sends?: Array<AudioBusSendOptions>;
    streaming?: boolean;
    volume?: number;
}

export class Sound implements IDisposable {
    private _paused: boolean = false;
    private _voices: Array<VirtualVoice>;
    private _voiceIndex: number = 0;

    public readonly audioEngine: AbstractAudioEngine;
    public readonly options?: SoundOptions;
    public readonly physicalSourceId: number;
    public readonly physicalSpatializerId: number;
    public readonly type: VirtualVoiceType;

    public constructor(options?: SoundOptions, audioEngine?: AbstractAudioEngine) {
        this.audioEngine = (audioEngine ?? getCurrentAudioEngine()) as AbstractAudioEngine;
        this.options = options;
        this.physicalSourceId = options?.physicalSourceId !== undefined ? options.physicalSourceId : this.audioEngine.createPhysicalSource(options);
        this.physicalSpatializerId = options?.physicalSpatializerId ?? 0;
        this.type = options?.streaming ? VirtualVoiceType.Streamed : VirtualVoiceType.Static;

        this._voices = this.audioEngine.allocateVoices(options?.maxVoices ?? 1, this.type, this.physicalSourceId, options);
    }

    public dispose(): void {
        this.stop();
        this.audioEngine.freeVoices(this._voices);
    }

    public get paused(): boolean {
        return this._paused;
    }

    public play(): VirtualVoice {
        this.resume();

        const voice = this._voices[this._voiceIndex];
        voice.start();

        this._voiceIndex = (this._voiceIndex + 1) % this._voices.length;

        return voice;
    }

    public stop(): void {
        for (const voice of this._voices) {
            voice.stop();
        }
    }

    public pause(): void {
        if (this.paused) {
            return;
        }

        for (const voice of this._voices) {
            voice.pause();
        }

        this._paused = true;
    }

    public resume(): void {
        if (!this.paused) {
            return;
        }

        for (const voice of this._voices) {
            voice.resume();
        }

        this._paused = false;
    }
}
