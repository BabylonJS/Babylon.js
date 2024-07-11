/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { IAudioBuffer, IStaticSoundOptions } from "./audioEngine";
import type { Nullable } from "core/types";
import { Observable } from "../../Misc/observable";

export class WebAudioBuffer implements IAudioBuffer {
    public readonly id: number;
    public readonly onLoadObservable = new Observable<IAudioBuffer>();

    private _buffer: Nullable<AudioBuffer> = null;
    private _loaded: boolean = false;

    public constructor(audioContext: AudioContext, id: number, options: IStaticSoundOptions) {
        this.id = id;
        this._createBuffer(audioContext, options);
    }

    public get buffer(): Nullable<AudioBuffer> {
        return this._buffer;
    }

    public get loaded(): boolean {
        return this._loaded;
    }

    public get duration(): number {
        if (!this._buffer) {
            return 0;
        }
        return this._buffer.duration;
    }

    private async _createBuffer(audioContext: AudioContext, options: IStaticSoundOptions): Promise<void> {
        if (options.sourceUrl) {
            await this._createBufferFromUrl(audioContext, options.sourceUrl);
        }
    }

    private async _createBufferFromUrl(audioContext: AudioContext, url: string): Promise<void> {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();

        this._buffer = await audioContext.decodeAudioData(arrayBuffer);
        this._loaded = true;

        this.onLoadObservable.notifyObservers(this);
    }
}
