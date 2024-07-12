/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { IAudioEngine } from "./abstractAudioEngine";
import type { ISound, IStreamingSoundOptions } from "./abstractSound";
import { AbstractSound } from "./abstractSound";
import type { IVirtualVoice } from "./virtualVoice";
import { VirtualVoice, VirtualVoiceType } from "./virtualVoice";

export class StreamingSound extends AbstractSound implements ISound {
    public constructor(options?: IStreamingSoundOptions, audioEngine?: IAudioEngine) {
        super(options, audioEngine);

        this._sourceId = this.audioEngine.physicalEngine.createStream(options);
    }

    protected override _createVoice(): IVirtualVoice {
        return new VirtualVoice(VirtualVoiceType.Streaming, this.audioEngine.getNextVoiceId(), this._sourceId, this.options);
    }
}
