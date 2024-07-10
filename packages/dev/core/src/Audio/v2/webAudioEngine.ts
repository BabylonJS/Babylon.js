import type { IAudioEngineOptions } from "./audioEngine";
import { AbstractAudioEngine } from "./audioEngine";
import { WebPhysicalAudioEngine } from "./webPhysicalAudioEngine";

/**
 *
 */
export interface IWebAudioEngineOptions extends IAudioEngineOptions {
    /**
     * The audio context.
     */
    audioContext?: AudioContext;
}

/**
 * An audio engine based on the WebAudio API.
 */
export class WebAudioEngine extends AbstractAudioEngine {
    /**
     * @param options
     */
    public constructor(options?: IWebAudioEngineOptions) {
        super(new WebPhysicalAudioEngine(options));

        const updateRate = options?.updateRate !== undefined ? options.updateRate : 10;
        let lastUpdateTime = 0;
        const onRequestedAnimationFrame = (time: number) => {
            if (time - lastUpdateTime > updateRate) {
                this.update();
                lastUpdateTime = time;
            }
            requestAnimationFrame(onRequestedAnimationFrame);
        };
        requestAnimationFrame(onRequestedAnimationFrame);
    }

    /**
     * Unlocks the audio engine.
     */
    public unlock(): void {
        (this._physicalAudioEngine as WebPhysicalAudioEngine).unlock();
    }

    /**
     *
     */
    public override update(): void {
        super.update();
    }
}
