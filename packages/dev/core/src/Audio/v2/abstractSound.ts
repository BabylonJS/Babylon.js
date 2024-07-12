/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { AbstractAudioEngine, IAudioEngine } from "./abstractAudioEngine";
import type { IAudioStaticBuffer } from "./abstractAudioPhysicalEngine";
import { getCurrentAudioEngine } from "./audioEngine";
import type { IVirtualVoice } from "./virtualVoice";
import type { Nullable } from "../../types";

export enum SoundPriority {
    Optional,
    Important,
    Critical,
    Count,
}

export interface ISoundOptions {
    name?: string;

    sourceUrl?: string;
    sourceUrls?: string[];

    loop?: boolean;
    maxVoices?: number;
    priority?: SoundPriority;
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

    play(): IVirtualVoice;
    stop(): void;

    pause(): void;
    resume(): void;
}

export class AbstractSound {
    public readonly audioEngine: AbstractAudioEngine;
    public readonly options?: ISoundOptions;

    protected _sourceId: number;

    private _paused: boolean = false;

    private _voices: Array<Nullable<IVirtualVoice>>;
    private _voiceIndex: number = 0;

    public constructor(options?: ISoundOptions, audioEngine?: IAudioEngine) {
        this.audioEngine = (audioEngine ?? getCurrentAudioEngine()) as AbstractAudioEngine;
        this.options = options;

        this._voices = new Array<IVirtualVoice>(Math.max(options?.maxVoices ?? 1, 1));
        this._voices.fill(null);
    }

    public get paused(): boolean {
        return this._paused;
    }

    public play(): IVirtualVoice {
        this.resume();

        this._removeVoice(this._voices[this._voiceIndex]);

        const voice = this._createVoice();

        voice.onDeactivatedObservable.addOnce((voice) => {
            this._removeVoice(voice);
        });

        this.audioEngine.addVoice(voice);

        this._voices[this._voiceIndex] = voice;

        this._voiceIndex++;
        this._voiceIndex %= this._voices.length;

        return voice;
    }

    public stop(): void {
        for (const voice of this._voices) {
            voice?.stop();
        }

        this._voices.fill(null);
    }

    public pause(): void {
        if (this.paused) {
            return;
        }

        for (const voice of this._voices) {
            voice?.pause();
        }

        this._paused = true;
    }

    public resume(): void {
        if (!this.paused) {
            return;
        }

        for (const voice of this._voices) {
            voice?.resume();
        }

        this._paused = false;
    }

    protected _createVoice(): IVirtualVoice {
        throw new Error("Not implemented");
    }

    private _removeVoice(voice: Nullable<IVirtualVoice>): void {
        if (!voice) {
            return;
        }

        voice.stop();

        this.audioEngine.removeVoice(voice);
        this._voices[this._voices.indexOf(voice)] = null;
    }
}
