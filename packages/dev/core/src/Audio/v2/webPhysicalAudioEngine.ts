import type { IPhysicalAudioEngine } from "./audioEngine";
import type { IWebAudioEngineOptions } from "./webAudioEngine";

/**
 *
 */
export class WebPhysicalAudioEngine implements IPhysicalAudioEngine {
    private _audioContext: AudioContext;
    private _startTime: number = 0;

    /**
     * @param options
     */
    public constructor(options?: IWebAudioEngineOptions) {
        this._audioContext = options?.audioContext ?? new AudioContext();

        if (!this.unlocked) {
            this._startTime = performance.now();

            const onWindowClick = () => {
                this.unlock();
            };
            window.addEventListener("click", onWindowClick);

            const onAudioContextStateChange = () => {
                if (this.unlocked) {
                    window.removeEventListener("click", onWindowClick);
                    this._audioContext.removeEventListener("statechange", onAudioContextStateChange);
                    this._startTime = (performance.now() - this._startTime) / 1000;
                }
            };
            this._audioContext.addEventListener("statechange", onAudioContextStateChange);
        }
    }

    /**
     * {@inheritdoc IPhysicalAudioEngine.currentTime}
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
     * Unlocks the audio context.
     */
    public unlock(): void {
        this._audioContext.resume();
    }

    /**
     * {@inheritdoc IPhysicalAudioEngine.update}
     */
    public update(): void {
        console.debug(`WebPhysicalAudioEngine.update: currentTime: ${this.currentTime.toFixed(3)}, unlocked: ${this.unlocked}`);
    }
}
