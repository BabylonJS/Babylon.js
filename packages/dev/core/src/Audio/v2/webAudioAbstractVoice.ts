/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */
/* eslint-disable no-console */

import { VirtualVoiceState, type VirtualVoice } from "./virtualVoice";
import { type Nullable } from "../../types";

export class WebAudioAbstractVoice {
    public virtualVoice: Nullable<VirtualVoice> = null;

    public constructor() {
        // ...
    }

    public copyFrom(voice: WebAudioAbstractVoice): void {
        this.virtualVoice = voice.virtualVoice;
    }

    start(): void {
        if (!this.virtualVoice || this.virtualVoice?.updated) {
            return;
        }
        this.virtualVoice?.setState(VirtualVoiceState.Started);
        console.log("WebAudioAbstractVoice.start()");
    }

    mute(): void {
        if (!this.virtualVoice || this.virtualVoice?.updated) {
            return;
        }
        this.virtualVoice?.setState(VirtualVoiceState.Muted);
        console.log("WebAudioAbstractVoice.mute()");
    }

    pause(): void {
        if (!this.virtualVoice || this.virtualVoice?.updated) {
            return;
        }
        this.virtualVoice?.setState(VirtualVoiceState.Paused);
        console.log("WebAudioAbstractVoice.pause()");
    }

    stop(): void {
        if (!this.virtualVoice || this.virtualVoice?.updated) {
            return;
        }
        this.virtualVoice?.setState(VirtualVoiceState.Stopped);
        console.log("WebAudioAbstractVoice.stop()");
    }
}
