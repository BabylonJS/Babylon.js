/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { IAudioStream } from "./abstractAudioPhysicalEngine";
import type { ISoundOptions } from "./sound";

export class WebAudioStream implements IAudioStream {
    public readonly id: number;
    public readonly node: AudioNode;

    public constructor(audioContext: AudioContext, id: number, options?: ISoundOptions) {
        this.id = id;

        this.node = this._createNode(audioContext, options);
    }

    private _createNode(_audioContext: AudioContext, _options?: ISoundOptions): AudioNode {
        // TODO: Implement.
        return new AudioNode();
    }
}
