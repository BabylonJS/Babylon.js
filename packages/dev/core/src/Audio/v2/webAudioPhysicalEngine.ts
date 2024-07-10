import type { IAudioPhysicalEngine } from "./audioEngine";
import type { IWebAudioEngineOptions } from "./webAudioEngine";
import type { WebAudioSpatialVoice } from "./webAudioSpatialVoice";
import type { WebAudioStaticVoice } from "./webAudioStaticVoice";
import type { WebAudioStreamingVoice } from "./webAudioStreamingVoice";

/**
 *
 */
export class WebAudioPhysicalEngine implements IAudioPhysicalEngine {
    private _audioContext: AudioContext;
    private _lastUpdateTime: number = 0;
    private _startTime: number = 0;

    /** */
    public readonly spatialVoices: Array<WebAudioSpatialVoice>;
    /** */
    public readonly staticVoices: Array<AudioBufferSourceNode>;
    /** */
    public readonly streamingVoices: Array<MediaElementAudioSourceNode>;

    /**
     * @param options
     */
    public constructor(options?: IWebAudioEngineOptions) {
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

        this.spatialVoices = new Array<WebAudioSpatialVoice>(options?.maxSpatialVoices ?? 64);
        this.staticVoices = new Array<WebAudioStaticVoice>(options?.maxStaticVoices ?? 128);
        this.streamingVoices = new Array<WebAudioStreamingVoice>(options?.maxStreamingVoices ?? 8);
    }

    /**
     * {@inheritdoc IAudioPhysicalEngine.currentTime}
     */
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

    /**
     * {@inheritdoc IAudioPhysicalEngine.update}
     */
    public update(): void {
        const currentTime = this.currentTime;
        if (this._lastUpdateTime == currentTime) {
            return;
        }
        this._lastUpdateTime = currentTime;

        // console.debug(`WebAudioPhysicalEngine.update: currentTime: ${currentTime.toFixed(3)}, unlocked: ${this.unlocked}`);
    }
}
