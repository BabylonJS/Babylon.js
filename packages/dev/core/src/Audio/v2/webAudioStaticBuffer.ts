/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { IAudioStaticBuffer } from "./abstractAudioPhysicalEngine";
import type { ISoundOptions } from "./abstractSound";
import type { Nullable } from "core/types";
import { Logger } from "../../Misc/logger";
import { Observable } from "../../Misc/observable";

export class WebAudioStaticBuffer implements IAudioStaticBuffer {
    public readonly id: number;
    public readonly onLoadObservable = new Observable<IAudioStaticBuffer>();

    private _buffer: Nullable<AudioBuffer> = null;

    public constructor(audioContext: AudioContext, id: number, options?: ISoundOptions) {
        this.id = id;
        this._createBuffer(audioContext, options);
    }

    public get buffer(): Nullable<AudioBuffer> {
        return this._buffer;
    }

    public get loaded(): boolean {
        return this._buffer !== null;
    }

    public get duration(): number {
        if (!this._buffer) {
            return 0;
        }
        return this._buffer.duration;
    }

    private async _createBuffer(audioContext: AudioContext, options?: ISoundOptions): Promise<void> {
        if (options === undefined) {
            this._buffer = new AudioBuffer({ length: 1, sampleRate: audioContext.sampleRate });
            return Promise.resolve();
        }
        if (options.sourceUrl) {
            if (!(await this._createBufferFromUrl(audioContext, options.sourceUrl))) {
                Logger.Warn(`Decoding audio data failed for URL: ${options.sourceUrl}` + "\n\tThe audio format may not be supported by this browser.");
            }
        } else if (options.sourceUrls) {
            if (!(await this._createBufferFromUrls(audioContext, options.sourceUrls))) {
                Logger.Warn(`Decoding audio data failed for URLs: [ ${options.sourceUrls.join(", ")} ]` + "\n\tThe audio formats may not be supported by this browser.");
            }
        }
    }

    private async _createBufferFromUrl(audioContext: AudioContext, url: string): Promise<boolean> {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();

        return new Promise<boolean>((resolve) => {
            audioContext
                .decodeAudioData(arrayBuffer)
                .then((buffer) => {
                    this._buffer = buffer;
                    this.onLoadObservable.notifyObservers(this);
                    resolve(true);
                })
                .catch(() => {
                    resolve(false);
                });
        });
    }

    private async _createBufferFromUrls(audioContext: AudioContext, urls: string[]): Promise<boolean> {
        for (const url of urls) {
            if (await this._createBufferFromUrl(audioContext, url)) {
                return true;
            }
        }

        return false;
    }
}
