/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import { type AbstractAudioEngine } from "./abstractAudioEngine";
import { getCurrentAudioEngine } from "./audioEngine";

export interface AudioBusSendOptions {
    busId: number;
    volume?: number;
}

export interface AudioBusOptions {
    channelCount?: number;
    channelVolumes?: Array<number>;
    pan?: number;
    volume?: number;

    outputBusId?: number;
    sends?: Array<AudioBusSendOptions>;
}

export class AudioBus {
    private _audioEngine: AbstractAudioEngine;
    private _options: AudioBusOptions;

    public readonly physicalBusId: number;

    public constructor(options?: AudioBusOptions, audioEngine?: AbstractAudioEngine) {
        this._audioEngine = audioEngine ?? getCurrentAudioEngine();
        this._options = options ?? {};

        this.physicalBusId = this._audioEngine.createPhysicalBus(this._options);

        if (this._options.volume === undefined) {
            this._options.volume = 1.0;
        }
    }
}
