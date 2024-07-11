/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { IAudioEngine, IStreamingSoundOptions } from "./audioEngine";
import type { ISound } from "./sound";
import { AbstractSound } from "./sound";
import type { IVirtualVoice } from "./virtualVoice";
import { VirtualVoice, VirtualVoiceType } from "./virtualVoice";

export class StreamingSound extends AbstractSound implements ISound {
    public constructor(audioEngine: IAudioEngine, options: IStreamingSoundOptions) {
        super(audioEngine, options);

        this._sourceId = this.audioEngine.physicalEngine.createStream(options);
    }

    protected override _createVoice(): IVirtualVoice {
        return new VirtualVoice(VirtualVoiceType.Streaming, this.audioEngine.getNextVoiceId(), this._sourceId, this.options);
    }
}
