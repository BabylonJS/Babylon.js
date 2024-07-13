/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { AbstractAudioEngine, IAudioEngine } from "./abstractAudioEngine";
import type { IAudioStaticBuffer } from "./abstractAudioPhysicalEngine";
import { getCurrentAudioEngine } from "./audioEngine";
import type { VirtualVoice, VirtualVoiceType } from "./virtualVoice";

export interface ISoundOptions {
    name?: string;

    sourceUrl?: string;
    sourceUrls?: string[];

    loop?: boolean;
    maxVoices?: number;
    priority?: number;
    spatial?: boolean;
    volume?: number;
}

export interface IStaticSoundOptions extends ISoundOptions {
    sourceBuffer?: IAudioStaticBuffer;

    pitch?: number;
    playbackRate?: number;
}

export interface IStreamingSoundOptions extends ISoundOptions {}

export interface ISound {
    audioEngine: IAudioEngine;

    play(): VirtualVoice;
    stop(): void;

    pause(): void;
    resume(): void;
}

export class AbstractSound {
    public readonly audioEngine: AbstractAudioEngine;
    public readonly options?: ISoundOptions;
    public readonly sourceId: number;

    private _paused: boolean = false;

    private _voices: Array<VirtualVoice>;
    private _voiceIndex: number = 0;

    public constructor(type: VirtualVoiceType, sourceId: number, options?: ISoundOptions, audioEngine?: IAudioEngine) {
        this.audioEngine = (audioEngine ?? getCurrentAudioEngine()) as AbstractAudioEngine;
        this.options = options;
        this.sourceId = sourceId;

        this._voices = this.audioEngine.activateVoices(options?.maxVoices ?? 1, type, this.sourceId, options);
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
