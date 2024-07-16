/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import { AbstractAudioSpatializer } from "./abstractAudioPhysicalEngine";
import { type AudioSpatializerOptions } from "./audioSpatializer";

export class WebAudioSpatializer extends AbstractAudioSpatializer {
    public readonly node: PannerNode;

    public constructor(audioContext: AudioContext, id: number, options?: AudioSpatializerOptions) {
        super(id);

        this.node = this._createNode(audioContext, options);
    }

    private _createNode(audioContext: AudioContext, _options?: AudioSpatializerOptions): PannerNode {
        return new PannerNode(audioContext, {});
    }
}
