/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */
/* eslint-disable no-console */

import { AbstractPhysicalAudioEngine, type IAudioPhysicalEngine } from "./abstractAudioPhysicalEngine";
import { type ISoundOptions, type IStaticSoundOptions, type IStreamingSoundOptions } from "./abstractSound";
import { type VirtualVoice } from "./virtualVoice";
import { type IWebAudioEngineOptions } from "./webAudioEngine";
import { WebAudioSpatializer } from "./webAudioSpatializer";
import { WebAudioStaticBuffer } from "./webAudioStaticBuffer";
import { WebAudioStream } from "./webAudioStream";
import { WebAudioSpatialVoice } from "./webAudioSpatialVoice";
import { WebAudioStaticVoice } from "./webAudioStaticVoice";
import { WebAudioStreamingVoice } from "./webAudioStreamingVoice";

export class WebAudioPhysicalEngine extends AbstractPhysicalAudioEngine implements IAudioPhysicalEngine {
    private _audioContext: AudioContext;
    private _lastUpdateTime: number = 0;
    private _startTime: number = 0;

    private readonly _spatializers = new Map<number, WebAudioSpatializer>();
    private readonly _audioBuffers = new Map<number, WebAudioStaticBuffer>();
    private readonly _streams = new Map<number, WebAudioStream>();

    private _spatialVoices: WebAudioSpatialVoice[] = [];
    private _staticVoices: Array<WebAudioStaticVoice>;
    private _streamingVoices: Array<WebAudioStreamingVoice>;

    private _oldSpatialVoices: WebAudioSpatialVoice[] = [];
    private _oldStaticVoices: Array<WebAudioStaticVoice>;
    private _oldStreamingVoices: Array<WebAudioStreamingVoice>;

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

        // These arrays will always be sorted by priority, high to low.
        this._spatialVoices.length = options?.maxSpatialVoices ?? 64;
        this._staticVoices = new Array<WebAudioStaticVoice>(options?.maxStaticVoices ?? 128);
        this._streamingVoices = new Array<WebAudioStreamingVoice>(options?.maxStreamingVoices ?? 8);
        this._oldSpatialVoices.length = options?.maxSpatialVoices ?? 64;
        this._oldStaticVoices = new Array<WebAudioStaticVoice>(options?.maxStaticVoices ?? 128);
        this._oldStreamingVoices = new Array<WebAudioStreamingVoice>(options?.maxStreamingVoices ?? 8);

        for (let i = 0; i < this._spatialVoices.length; i++) {
            this._spatialVoices[i] = new WebAudioSpatialVoice();
        }
        for (let i = 0; i < this._staticVoices.length; i++) {
            this._staticVoices[i] = new WebAudioStaticVoice();
        }
        for (let i = 0; i < this._streamingVoices.length; i++) {
            this._streamingVoices[i] = new WebAudioStreamingVoice();
        }
        for (let i = 0; i < this._oldSpatialVoices.length; i++) {
            this._oldSpatialVoices[i] = new WebAudioSpatialVoice();
        }
        for (let i = 0; i < this._oldStaticVoices.length; i++) {
            this._oldStaticVoices[i] = new WebAudioStaticVoice();
        }
        for (let i = 0; i < this._oldStreamingVoices.length; i++) {
            this._oldStreamingVoices[i] = new WebAudioStreamingVoice();
        }
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

    public update(_virtualVoices: Array<VirtualVoice>): void {
        const currentTime = this.currentTime;
        if (this._lastUpdateTime == currentTime) {
            return;
        }
        this._lastUpdateTime = currentTime;
    }
}
