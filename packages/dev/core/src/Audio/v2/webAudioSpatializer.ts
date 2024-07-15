/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { IAudioSpatializer } from "./abstractAudioPhysicalEngine";
import type { ISoundOptions, Sound } from "./sound";

export class WebAudioSpatializer implements IAudioSpatializer {
    public readonly id: number;
    public readonly sounds: Array<Sound> = new Array<Sound>();
    public readonly node: PannerNode;

    public constructor(audioContext: AudioContext, id: number, options?: ISoundOptions) {
        this.id = id;

        this.node = this._createNode(audioContext, options);
    }

    private _createNode(audioContext: AudioContext, _options?: ISoundOptions): PannerNode {
        return new PannerNode(audioContext, {});
    }
}
