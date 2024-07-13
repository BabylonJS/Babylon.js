/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { IAudioEngine } from "./abstractAudioEngine";
import type { ISound, IStreamingSoundOptions } from "./abstractSound";
import { AbstractSound } from "./abstractSound";
import { getCurrentAudioEngine } from "./audioEngine";
import { VirtualVoiceType } from "./virtualVoice";

export class StreamingSound extends AbstractSound implements ISound {
    public constructor(options?: IStreamingSoundOptions, audioEngine?: IAudioEngine) {
        super(VirtualVoiceType.Streaming, (audioEngine ?? getCurrentAudioEngine()).createStream(options), options, audioEngine);
    }
}
