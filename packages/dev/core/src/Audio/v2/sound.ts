/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { IAudioEngine } from "./audioEngine";
import type { IVirtualVoice } from "./virtualVoice";

export interface ISound {
    audioEngine: IAudioEngine;

    play(): IVirtualVoice;
    pause(): void;
    stop(): void;
}

export class AbstractSound {
    public readonly audioEngine: IAudioEngine;

    public constructor(audioEngine: IAudioEngine) {
        this.audioEngine = audioEngine;
    }
}
