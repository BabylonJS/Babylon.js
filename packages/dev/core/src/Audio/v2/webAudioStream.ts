/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { IAudioStream, IStreamingSoundOptions } from "./audioEngine";

export class WebAudioStream implements IAudioStream {
    public readonly id: number;
    public readonly node: AudioNode;

    public constructor(audioContext: AudioContext, id: number, options: IStreamingSoundOptions) {
        this.id = id;

        this.node = this._createNode(audioContext, options);
    }

    private _createNode(_audioContext: AudioContext, _options: IStreamingSoundOptions): AudioNode {
        return new AudioNode();
    }
}
