/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */
/* eslint-disable no-console */

import { AbstractAudioBus } from "./abstractAudioPhysicalEngine";
import { type AudioBusOptions } from "./audioBus";

export class WebAudioBus extends AbstractAudioBus {
    public readonly node: GainNode;

    public constructor(audioContext: AudioContext, id: number, options?: AudioBusOptions) {
        super(id);

        this.node = this._createNode(audioContext, options);
    }

    private _createNode(audioContext: AudioContext, options?: AudioBusOptions): GainNode {
        const node = audioContext.createGain();
        node.gain.value = options?.volume ?? 1;
        return node;
    }
}
