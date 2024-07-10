/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { AbstractAudioEngine, IAudioBuffer, IAudioEngine, IStaticSoundOptions } from "./audioEngine";
import { AbstractSound } from "./sound";
import type { ISound } from "./sound";
import type { IVirtualVoice } from "./virtualVoice";
import { StaticVirtualVoice } from "./virtualVoice";

export class StaticSound extends AbstractSound implements ISound {
    private _audioBuffer: IAudioBuffer;

    public constructor(audioEngine: IAudioEngine, options: IStaticSoundOptions) {
        super(audioEngine);

        this._audioBuffer = (this.audioEngine as AbstractAudioEngine).physicalEngine.createBuffer(options);
    }

    public play(): IVirtualVoice {
        return new StaticVirtualVoice({}, this._audioBuffer);
    }

    public pause(): void {
        // ...
    }

    public stop(): void {
        // ...
    }
}
