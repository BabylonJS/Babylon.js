/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { IAudioEngine } from "./abstractAudioEngine";
import type { ISound, IStaticSoundOptions } from "./abstractSound";
import { AbstractSound } from "./abstractSound";
import { VirtualVoiceType } from "./virtualVoice";

export class StaticSound extends AbstractSound implements ISound {
    public constructor(options?: IStaticSoundOptions, audioEngine?: IAudioEngine) {
        super(VirtualVoiceType.Static, options, audioEngine);
        this._sourceId = this.audioEngine.physicalEngine.createBuffer(options);
    }
}
