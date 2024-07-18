/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import { type AbstractAudioEngine } from "./abstractAudioEngine";
import { getCurrentAudioEngine } from "./audioEngine";

export interface AudioBusSendOptions {
    bus: AudioBus;
    volume: number;
}

export interface AudioBusOptions {
    volume?: number;

    outputBus?: AudioBus;
    sends?: Array<AudioBusSendOptions>;
}

export class AudioBus {
    private _audioEngine: AbstractAudioEngine;
    private _volume: number;

    public readonly physicalId: number;

    public get volume(): number {
        return this._volume;
    }

    public constructor(options?: AudioBusOptions, audioEngine?: AbstractAudioEngine) {
        this._audioEngine = audioEngine ?? getCurrentAudioEngine();
        this._volume = options?.volume !== undefined ? options.volume : 1.0;

        this.physicalId = this._audioEngine.createPhysicalBus(options);
    }
}
