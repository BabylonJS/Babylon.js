/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import { type IVirtualVoice } from "./virtualVoice";
import { type Nullable } from "../../types";

export class WebAudioAbstractVoice {
    public active: boolean = false;
    public virtualVoice: Nullable<IVirtualVoice> = null;

    public constructor() {
        // ...
    }

    public copyFrom(_voice: WebAudioAbstractVoice): void {
        // ...
    }
}
