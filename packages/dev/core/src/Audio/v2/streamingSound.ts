/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { AbstractAudioEngine, IAudioEngine, IAudioStream, IStaticSoundOptions } from "./audioEngine";
import type { ISound } from "./sound";
import { AbstractSound } from "./sound";
import type { IVirtualVoice } from "./virtualVoice";
import { StreamingVirtualVoice } from "./virtualVoice";

export class StreamingSound extends AbstractSound implements ISound {
    private _audioStream: IAudioStream;

    public constructor(audioEngine: IAudioEngine, options: IStaticSoundOptions) {
        super(audioEngine);

        this._audioStream = (this.audioEngine as AbstractAudioEngine).physicalEngine.createStream(options);
    }

    protected override _createVirtualVoice(): IVirtualVoice {
        return new StreamingVirtualVoice(this.audioEngine.nextVirtualVoiceId, {}, this._audioStream);
    }
}
