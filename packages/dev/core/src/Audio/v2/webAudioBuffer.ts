/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { IAudioBuffer, IStaticSoundOptions } from "./audioEngine";

export class WebAudioBuffer implements IAudioBuffer {
    public readonly id: number;
    public readonly buffer: AudioBuffer;

    public constructor(audioContext: AudioContext, id: number, options: IStaticSoundOptions) {
        this.id = id;
        this.buffer = this._createBuffer(audioContext, options);
    }

    private _createBuffer(_audioContext: AudioContext, _options: IStaticSoundOptions): AudioBuffer {
        return new AudioBuffer({
            length: 1,
            sampleRate: 48000,
        });
    }
}
