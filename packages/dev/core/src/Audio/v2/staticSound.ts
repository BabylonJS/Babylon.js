/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { IAudioEngine, IStaticSoundOptions } from "./audioEngine";
import { AbstractSound } from "./sound";
import type { ISound } from "./sound";
import type { IVirtualVoice } from "./virtualVoice";
import { VirtualVoice, VirtualVoiceType } from "./virtualVoice";

export class StaticSound extends AbstractSound implements ISound {
    public constructor(audioEngine: IAudioEngine, options: IStaticSoundOptions) {
        super(audioEngine, options);

        this._sourceId = this.audioEngine.physicalEngine.createBuffer(options);
    }

    protected override _createVoice(): IVirtualVoice {
        return new VirtualVoice(VirtualVoiceType.Static, this.audioEngine.getNextVoiceId(), this._sourceId, this.options);
    }
}
