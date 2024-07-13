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

        for (let i = 0; i < this._spatialVoices.length; i++) {
            this._spatialVoices[i] = new WebAudioSpatialVoice();
        }
        for (let i = 0; i < this._staticVoices.length; i++) {
            this._staticVoices[i] = new WebAudioStaticVoice();
        }
        for (let i = 0; i < this._streamingVoices.length; i++) {
            this._streamingVoices[i] = new WebAudioStreamingVoice();
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

    /**
     *
     * @param virtualVoices - The given virtual voices pre-sorted by state and priority.
     *
     */
    public update(virtualVoices: Array<VirtualVoice>): void {
        const currentTime = this.currentTime;
        if (this._lastUpdateTime == currentTime) {
            return;
        }
        this._lastUpdateTime = currentTime;

        // Update virtual voice states according to the number of physical voices available.
        let spatialCount = 0;
        let staticCount = 0;
        let streamingCount = 0;
        let spatialMaxed = false;
        let staticMaxed = false;
        let streamingMaxed = false;
        let allMaxed = false;

        for (let i = 0; i < virtualVoices.length; i++) {
            const virtualVoice = virtualVoices[i];

            if (!virtualVoice.active) {
                break;
            }

            if (allMaxed || (virtualVoice.spatial && spatialMaxed)) {
                virtualVoice.mute();
                return;
            }

            if (virtualVoice.static) {
                if (staticMaxed) {
                    virtualVoice.mute();
                    return;
                }
                virtualVoice.start();

                staticCount++;
                if (staticCount >= this._staticVoices.length) {
                    staticMaxed = true;
                }
            }

            if (virtualVoice.streaming) {
                if (streamingMaxed) {
                    virtualVoice.mute();
                    return;
                }
                virtualVoice.start();

                streamingCount++;
                if (streamingCount >= this._streamingVoices.length) {
                    streamingMaxed = true;
                }
            }

            if (virtualVoice.spatial) {
                spatialCount++;
                if (spatialCount >= this._spatialVoices.length) {
                    spatialMaxed = true;
                }
            }

            if (spatialMaxed && staticMaxed && streamingMaxed) {
                allMaxed = true;
            }
        }

        // Sort active, unmuted voices to the top of the physical voice array while muting, pausing, or stopping
        //  virtual voices that can be physically ignored.
        //
        // When complete, `pastLastActiveIndex` is set to one past the last active and unmuted voice. Voices from this
        //  index on are available for virtual voices waiting to start.
        let pastLastActiveIndex = 0;
        for (let i = 0; i < this._staticVoices.length; i++) {
            const voice = this._staticVoices[i];
            const virtualVoice = voice.virtualVoice;

            if (!virtualVoice) {
                break;
            }

            if (virtualVoice.active && !virtualVoice.muted) {
                if (pastLastActiveIndex < i) {
                    this._staticVoices[pastLastActiveIndex].copyFrom(voice);
                }
                pastLastActiveIndex++;
            } else if (virtualVoice.muting) {
                voice.mute();
            } else if (virtualVoice.pausing) {
                voice.pause();
            } else if (virtualVoice.stopping) {
                voice.stop();
            }
        }

        // Physically start virtual voices waiting to start.
        let virtualVoiceIndex = virtualVoices.findIndex((virtualVoice) => virtualVoice.waitingToStart);
        for (let i = pastLastActiveIndex; i < this._staticVoices.length; i++) {
            const voice = this._staticVoices[i];
            voice.virtualVoice = virtualVoices[virtualVoiceIndex];
            voice.start();

            // Set `virtualVoiceIndex` to the next virtual voice waiting to start.
            let done = false;
            do {
                virtualVoiceIndex++;
                done = virtualVoiceIndex >= virtualVoices.length;
            } while (!done && !virtualVoices[virtualVoiceIndex].waitingToStart);

            // Exit the loop if there are no more virtual voices waiting to start.
            if (done) {
                break;
            }
        }

        // console.log(this._staticVoices);

        // TODO: Implement spatial and streaming voice updates.
    }
}
