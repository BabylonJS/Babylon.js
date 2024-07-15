/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { IAudioStream } from "./abstractAudioPhysicalEngine";
import type { IStreamedSoundOptions } from "./abstractSound";

export class WebAudioStream implements IAudioStream {
    public readonly id: number;
    public readonly node: AudioNode;

    public constructor(audioContext: AudioContext, id: number, options?: IStreamedSoundOptions) {
        this.id = id;

        this.node = this._createNode(audioContext, options);
    }

    private _createNode(_audioContext: AudioContext, _options?: IStreamedSoundOptions): AudioNode {
        return new AudioNode();
    }
}
