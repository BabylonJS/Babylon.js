/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import { AbstractAudioStreamedSource } from "./abstractAudioPhysicalEngine";
import { type SoundOptions } from "./sound";

export class WebAudioStream extends AbstractAudioStreamedSource {
    public readonly node: AudioNode;

    public constructor(audioContext: AudioContext, id: number, options?: SoundOptions) {
        super(id);

        this.node = this._createNode(audioContext, options);
    }

    private _createNode(_audioContext: AudioContext, _options?: SoundOptions): AudioNode {
        // TODO: Implement.
        return new AudioNode();
    }
}
