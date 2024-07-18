/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */
/* eslint-disable no-console */

import { AbstractAudioBus } from "./abstractAudioPhysicalEngine";
import type { AudioBusOptions } from "./audioBus";

export class WebAudioBus extends AbstractAudioBus {
    public readonly node: GainNode;

    public constructor(audioContext: AudioContext, id: number, options?: AudioBusOptions) {
        super(id);

        this.node = this._createNode(audioContext, options);
    }

    private _createNode(audioContext: AudioContext, options?: AudioBusOptions): GainNode {
        return new GainNode(audioContext, {
            gain: options?.volume !== undefined ? options.volume : 1,
        });
    }
}
