/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { IAudioEngine } from "./abstractAudioEngine";
import type { ISound, IStreamedSoundOptions } from "./abstractSound";
import { AbstractSound } from "./abstractSound";
import { getCurrentAudioEngine } from "./audioEngine";
import { VirtualVoiceType } from "./virtualVoice";

export class StreamedSound extends AbstractSound implements ISound {
    public constructor(options?: IStreamedSoundOptions, audioEngine?: IAudioEngine) {
        super(VirtualVoiceType.Streamed, (audioEngine ?? getCurrentAudioEngine()).createStream(options), options, audioEngine);
    }
}
