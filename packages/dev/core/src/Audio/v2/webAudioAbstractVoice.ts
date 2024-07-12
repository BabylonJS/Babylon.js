/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import { SoundPriority } from "./abstractSound";
import { type VirtualVoice } from "./virtualVoice";

export class WebAudioAbstractVoice {
    public active: boolean = true;
    public priority: SoundPriority = SoundPriority.Optional;
    public virtualVoice: Nullable<VirtualVoice>;

    public constructor() {
        // ...
    }

    public copyFrom(_voice: WebAudioAbstractVoice): void {
        // ...
    }
}
