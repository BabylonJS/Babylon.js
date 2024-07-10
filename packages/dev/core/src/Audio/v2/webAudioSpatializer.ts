/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { IAudioSpatializer, ISound, ISpatialSoundOptions } from "./audioEngine";

export class WebAudioSpatializer implements IAudioSpatializer {
    public readonly id: number;
    public readonly sounds: Array<ISound> = new Array<ISound>();
    public readonly node: PannerNode;

    public constructor(audioContext: AudioContext, id: number, options: ISpatialSoundOptions) {
        this.id = id;

        this.node = this._createNode(audioContext, options);
    }

    private _createNode(audioContext: AudioContext, _options: ISpatialSoundOptions): PannerNode {
        return new PannerNode(audioContext, {});
    }
}
