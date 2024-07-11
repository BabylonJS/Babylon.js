/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { AbstractAudioEngine, IAudioEngine } from "./audioEngine";
import type { IVirtualVoice } from "./virtualVoice";

export interface ISound {
    audioEngine: IAudioEngine;

    play(): IVirtualVoice;
    stop(): void;

    pause(): void;
    resume(): void;
}

export class AbstractSound {
    public readonly audioEngine: AbstractAudioEngine;

    private _paused: boolean = false;
    private _virtualVoices: Array<IVirtualVoice> = new Array<IVirtualVoice>();

    public constructor(audioEngine: IAudioEngine) {
        this.audioEngine = audioEngine as AbstractAudioEngine;
    }

    public get paused(): boolean {
        return this._paused;
    }

    public play(): IVirtualVoice {
        this.resume();

        const virtualVoice = this._createVirtualVoice();
        this._virtualVoices.push(virtualVoice);

        this.audioEngine.addVirtualVoice(virtualVoice);

        virtualVoice.play();

        return virtualVoice;
    }

    public stop(): void {
        for (const virtualVoice of this._virtualVoices) {
            virtualVoice.stop();
        }

        this._virtualVoices.length = 0;
    }

    public pause(): void {
        if (this.paused) {
            return;
        }

        for (const virtualVoice of this._virtualVoices) {
            virtualVoice.pause();
        }
    }

    public resume(): void {
        if (!this.paused) {
            return;
        }

        for (const virtualVoice of this._virtualVoices) {
            virtualVoice.resume();
        }
    }

    protected _createVirtualVoice(): IVirtualVoice {
        throw new Error("Not implemented");
    }
}
