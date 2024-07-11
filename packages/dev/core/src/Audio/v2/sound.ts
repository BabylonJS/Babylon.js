/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { AbstractAudioEngine, IAudioEngine, ISoundOptions } from "./audioEngine";
import type { IVirtualVoice } from "./virtualVoice";
import type { Nullable } from "../../types";

export interface ISound {
    audioEngine: IAudioEngine;

    play(): IVirtualVoice;
    stop(): void;

    pause(): void;
    resume(): void;
}

export class AbstractSound {
    public readonly audioEngine: AbstractAudioEngine;
    public readonly options: ISoundOptions;

    protected _sourceId: number;

    private _paused: boolean = false;

    private _voices: Array<Nullable<IVirtualVoice>>;
    private _voiceIndex: number = 0;

    public constructor(audioEngine: IAudioEngine, options: ISoundOptions) {
        this.audioEngine = audioEngine as AbstractAudioEngine;
        this.options = options;

        this._voices = new Array<IVirtualVoice>(Math.max(options.maxVoices ?? 1, 1));
        this._voices.fill(null);
    }

    public get paused(): boolean {
        return this._paused;
    }

    public play(): IVirtualVoice {
        this.resume();

        const voice = this._createVoice();
        voice.play();
        this.audioEngine.addVoice(voice);

        this._voices[this._voiceIndex]?.stop();
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
}
