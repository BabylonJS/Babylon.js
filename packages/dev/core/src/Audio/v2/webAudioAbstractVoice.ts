/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */
/* eslint-disable no-console */

import { VirtualVoiceState, type VirtualVoice } from "./virtualVoice";
import { type Nullable } from "../../types";

export abstract class WebAudioAbstractVoice {
    private _virtualVoice: Nullable<VirtualVoice> = null;

    public constructor() {
        // ...
    }

    public init(virtualVoice: VirtualVoice): void {
        if (!this.available) {
            throw new Error("WebAudioAbstractVoice is not available.");
            return;
        }
        this._virtualVoice = virtualVoice;
    }

    public copyFrom(voice: WebAudioAbstractVoice): void {
        this._virtualVoice = voice.virtualVoice;
    }

    public clear(): void {
        this._virtualVoice = null;
    }

    public get available(): boolean {
        return this._virtualVoice === null;
    }

    public get virtualVoice(): Nullable<VirtualVoice> {
        return this._virtualVoice;
    }

    start(): void {
        if (!this._virtualVoice || this._virtualVoice?.updated) {
            return;
        }
        this._virtualVoice?.setState(VirtualVoiceState.Started);
        console.log("WebAudioAbstractVoice.start()");
    }

    mute(): void {
        if (!this._virtualVoice || this._virtualVoice?.updated) {
            return;
        }
        this._virtualVoice?.setState(VirtualVoiceState.Muted);
        console.log("WebAudioAbstractVoice.mute()");
    }

    pause(): void {
        if (!this._virtualVoice || this._virtualVoice?.updated) {
            return;
        }
        this._virtualVoice?.setState(VirtualVoiceState.Paused);
        console.log("WebAudioAbstractVoice.pause()");
    }

    stop(): void {
        if (!this._virtualVoice || this._virtualVoice?.updated) {
            return;
        }
        this._virtualVoice?.setState(VirtualVoiceState.Stopped);
        console.log("WebAudioAbstractVoice.stop()");
    }
}
