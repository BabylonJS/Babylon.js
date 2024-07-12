/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { IAudioEngine } from "./abstractAudioEngine";
import type { ISound, IStaticSoundOptions } from "./abstractSound";
import { AbstractSound } from "./abstractSound";
import type { IVirtualVoice } from "./virtualVoice";
import { VirtualVoice, VirtualVoiceType } from "./virtualVoice";

export class StaticSound extends AbstractSound implements ISound {
    public constructor(options?: IStaticSoundOptions, audioEngine?: IAudioEngine) {
        super(options, audioEngine);

        this._sourceId = this.audioEngine.physicalEngine.createBuffer(options);
    }

    protected override _createVoice(): IVirtualVoice {
        return new VirtualVoice(VirtualVoiceType.Static, this.audioEngine.getNextVoiceId(), this._sourceId, this.options);
    }
}
