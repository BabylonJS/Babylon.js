/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { VirtualVoicesByPriority } from "./abstractAudioEngine";
import type { IAudioPhysicalEngine } from "./abstractAudioPhysicalEngine";
import { AbstractPhysicalAudioEngine } from "./abstractAudioPhysicalEngine";
import type { ISoundOptions, IStaticSoundOptions, IStreamingSoundOptions } from "./abstractSound";
import type { IWebAudioEngineOptions } from "./webAudioEngine";
import { WebAudioSpatializer } from "./webAudioSpatializer";
import { WebAudioStaticBuffer } from "./webAudioStaticBuffer";
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

    private readonly _spatializers = new Map<number, WebAudioSpatializer>();
    private readonly _audioBuffers = new Map<number, WebAudioStaticBuffer>();
    private readonly _streams = new Map<number, WebAudioStream>();

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

    public createSpatializer(options?: ISoundOptions): number {
        const spatializer = new WebAudioSpatializer(this._audioContext, this._getNextSpatializerId(), options);
        this._spatializers.set(spatializer.id, spatializer);
        return spatializer.id;
    }

    public createBuffer(options?: IStaticSoundOptions): number {
        const buffer = new WebAudioStaticBuffer(this._audioContext, this._getNextSourceId(), options);
        this._audioBuffers.set(buffer.id, buffer);
        return buffer.id;
    }

    public createStream(options?: IStreamingSoundOptions): number {
        const stream = new WebAudioStream(this._audioContext, this._getNextSourceId(), options);
        this._streams.set(stream.id, stream);
        return stream.id;
    }

    public update(_virtualVoicesByPriority: VirtualVoicesByPriority, _fullUpdate?: boolean): void {
        const currentTime = this.currentTime;
        if (this._lastUpdateTime == currentTime) {
            return;
        }
        this._lastUpdateTime = currentTime;
    }
}
