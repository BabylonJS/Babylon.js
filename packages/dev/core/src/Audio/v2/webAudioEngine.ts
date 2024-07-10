/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { IAudioEngineOptions } from "./audioEngine";
import { AbstractAudioEngine } from "./audioEngine";
import { WebAudioPhysicalEngine } from "./webAudioPhysicalEngine";
import type { Nullable } from "core/types";

export interface IWebAudioEngineOptions extends IAudioEngineOptions {
    /**
     * An existing audio context to use. Defaults to a new `AudioContext`.
     */
    audioContext?: AudioContext;

    /**
     * Whether to automatically unlock the audio context on user interaction, or not. Defaults to `true`.
     */
    autoUnlock?: boolean;
}

/**
 * An audio engine based on the WebAudio API.
 */
export class WebAudioEngine extends AbstractAudioEngine {
    private _autoUpdate: boolean = false;
    private _autoUpdateHandle: Nullable<number>;
    private _lastAutoUpdateTime: number = 0;

    /**
     * The automatic update rate in milliseconds. Ignored if `autoUpdate` is `false`.
     */
    public autoUpdateRate: number;

    public constructor(options?: IWebAudioEngineOptions) {
        super(new WebAudioPhysicalEngine(options));

        this.autoUpdateRate = options?.autoUpdateRate !== undefined ? options.autoUpdateRate : 50;
        this.autoUpdate = options?.autoUpdate !== undefined ? options.autoUpdate : true;
    }

    /**
     * Returns `true` if the automatic update loop is running; otherwise returns `false`.
     */
    public get autoUpdate(): boolean {
        return this._autoUpdate;
    }

    /**
     * Sets the autoUpdate property, starting or stopping the automatic update loop if needed.
     */
    public set autoUpdate(value: boolean) {
        if (this._autoUpdate === value) {
            return;
        }

        this._autoUpdate = value;

        if (this._autoUpdate) {
            this._startAutoUpdate();
        } else {
            this._stopAutoUpdate();
        }
    }

    /**
     * Sends an audio context unlock request. Called automatically on user interaction when the `autoLock` option is `true`.
     *
     * Note that the audio context cannot be locked again after it is unlocked.
     */
    public unlock(): void {
        (this.physicalEngine as WebAudioPhysicalEngine).unlock();
    }

    /**
     * Updates audio engine control rate (k-rate) settings. Called automatically if `autoUpdate` is `true`.
     */
    public override update(): void {
        super.update();
    }

    private _onRequestedAnimationFrame = (time: number): void => {
        if (time - this._lastAutoUpdateTime > this.autoUpdateRate) {
            this.update();
            this._lastAutoUpdateTime = time;
        }
        this._startAutoUpdate();
    };

    private _startAutoUpdate(): void {
        this._autoUpdateHandle = requestAnimationFrame(this._onRequestedAnimationFrame);
    }

    private _stopAutoUpdate(): void {
        if (this._autoUpdateHandle !== null) {
            cancelAnimationFrame(this._autoUpdateHandle);
            this._autoUpdateHandle = null;
        }
    }
}
