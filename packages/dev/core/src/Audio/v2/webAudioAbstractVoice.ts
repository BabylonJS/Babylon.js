/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import { type VirtualVoice } from "./virtualVoice";
import { type Nullable } from "../../types";

export class WebAudioAbstractVoice {
    public active: boolean = false;
    public virtualVoice: Nullable<VirtualVoice> = null;

    public constructor() {
        // ...
    }

    public copyFrom(_voice: WebAudioAbstractVoice): void {
        // ...
    }
}
