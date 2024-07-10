/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { IAudioBuffer, IAudioPhysicalEngine, IAudioSpatializer, IAudioStream, ISpatialSoundOptions, IStaticSoundOptions, IStreamingSoundOptions } from "./audioEngine";
import { AbstractPhysicalAudioEngine } from "./audioEngine";
import type { IWebAudioEngineOptions } from "./webAudioEngine";
import { WebAudioBuffer } from "./webAudioBuffer";
import { WebAudioSpatializer } from "./webAudioSpatializer";
import { WebAudioStream } from "./webAudioStream";
// import type { WebAudioSpatialVoice } from "./webAudioSpatialVoice";
// import type { WebAudioStaticVoice } from "./webAudioStaticVoice";
// import type { WebAudioStreamingVoice } from "./webAudioStreamingVoice";

export class WebAudioPhysicalEngine extends AbstractPhysicalAudioEngine implements IAudioPhysicalEngine {
    private _audioContext: AudioContext;
    private _lastUpdateTime: number = 0;
    private _startTime: number = 0;

    // private readonly _spatialVoices: Array<WebAudioSpatialVoice>;
    // private readonly _staticVoices: Array<WebAudioStaticVoice>;
    // private readonly _streamingVoices: Array<WebAudioStreamingVoice>;

    // private readonly _audioBuffers: Nullable<Array<WebAudioBuffer>> = null;

    public constructor(options?: IWebAudioEngineOptions) {
        super();

        this._audioContext = options?.audioContext ?? new AudioContext();

        if (!this.unlocked) {
            this._startTime = performance.now();

            if (options?.autoUnlock === undefined || options.autoUnlock) {
                const onWindowClick = () => {
                    this.unlock();
                    window.removeEventListener("click", onWindowClick);
                };
                window.addEventListener("click", onWindowClick);
            }

            const onAudioContextStateChange = () => {
                if (this.unlocked) {
                    this._startTime = (performance.now() - this._startTime) / 1000;
                    this._audioContext.removeEventListener("statechange", onAudioContextStateChange);
                }
            };
            this._audioContext.addEventListener("statechange", onAudioContextStateChange);
        }

        // this._spatialVoices = new Array<WebAudioSpatialVoice>(options?.maxSpatialVoices ?? 64);
        // this._staticVoices = new Array<WebAudioStaticVoice>(options?.maxStaticVoices ?? 128);
        // this._streamingVoices = new Array<WebAudioStreamingVoice>(options?.maxStreamingVoices ?? 8);
    }

    public get currentTime(): number {
        return this.unlocked ? this._startTime + this._audioContext.currentTime : (performance.now() - this._startTime) / 1000;
    }

    /**
     * Returns `true` if the audio context is unlocked; otherwise returns `false`.
     */
    public get unlocked(): boolean {
        return this._audioContext.state !== "suspended";
    }

    /**
     * Sends an audio context unlock request. Called automatically on user interaction when the `autoLock` option is `true`.
     *
     * Note that the audio context cannot be locked again after it is unlocked.
     */
    public unlock(): void {
        this._audioContext.resume();
    }

    public createSpatializer(options: ISpatialSoundOptions): IAudioSpatializer {
        return new WebAudioSpatializer(this._audioContext, this._nextSpatializerId, options);
    }

    public createBuffer(options: IStaticSoundOptions): IAudioBuffer {
        return new WebAudioBuffer(this._audioContext, this._nextBufferId, options);
    }

    public createStream(options: IStreamingSoundOptions): IAudioStream {
        return new WebAudioStream(this._audioContext, this._nextStreamId, options);
    }

    public update(): void {
        const currentTime = this.currentTime;
        if (this._lastUpdateTime == currentTime) {
            return;
        }
        this._lastUpdateTime = currentTime;

        // console.debug(`WebAudioPhysicalEngine.update: currentTime: ${currentTime.toFixed(3)}, unlocked: ${this.unlocked}`);
    }
}
