/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import { type AbstractAudioEngine } from "./abstractAudioEngine";
import { getCurrentAudioEngine } from "./audioEngine";
import { type VirtualVoice, VirtualVoiceType } from "./virtualVoice";
import { type IDisposable } from "../../scene";

export interface ISoundOptions {
    name?: string;

    sourceId?: number;
    sourceUrl?: string;
    sourceUrls?: string[];

    loop?: boolean;
    maxVoices?: number;
    pitch?: number;
    playbackRate?: number;
    priority?: number;
    spatial?: boolean;
    streaming?: boolean;
    volume?: number;
}

export class Sound implements IDisposable {
    public readonly audioEngine: AbstractAudioEngine;
    public readonly options?: ISoundOptions;
    public readonly sourceId: number;
    public readonly type: VirtualVoiceType;

    private _paused: boolean = false;

    private _voices: Array<VirtualVoice>;
    private _voiceIndex: number = 0;

    public constructor(options?: ISoundOptions, audioEngine?: AbstractAudioEngine) {
        this.audioEngine = (audioEngine ?? getCurrentAudioEngine()) as AbstractAudioEngine;
        this.options = options;
        this.sourceId = options?.sourceId !== undefined ? options.sourceId : this.audioEngine.createSource(options);
        this.type = options?.streaming ? VirtualVoiceType.Streamed : VirtualVoiceType.Static;

        this._voices = this.audioEngine.allocateVoices(options?.maxVoices ?? 1, this.type, this.sourceId, options);
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
