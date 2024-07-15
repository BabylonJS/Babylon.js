/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { IAudioEngine } from "./abstractAudioEngine";
import type { ISound, ISoundOptions } from "./abstractSound";
import { AbstractSound } from "./abstractSound";
import { getCurrentAudioEngine } from "./audioEngine";
import { VirtualVoiceType } from "./virtualVoice";

export class Sound extends AbstractSound implements ISound {
    public constructor(options?: ISoundOptions, audioEngine?: IAudioEngine) {
        super(VirtualVoiceType.Static, (audioEngine ?? getCurrentAudioEngine()).createBuffer(options), options, audioEngine);
    }
}
