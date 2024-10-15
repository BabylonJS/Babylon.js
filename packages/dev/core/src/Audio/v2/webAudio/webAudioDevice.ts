import type { Nullable } from "../../../types";
import { AbstractAudioDevice } from "../abstractAudioDevice";
import type { AbstractAudioEngine } from "../abstractAudioEngine";
import type { IWebAudioDeviceOptions } from "./webAudioEngine";

/** @internal */
export class WebAudioDevice extends AbstractAudioDevice {
    public audioContext: AudioContext;

    public get webAudioInputNode(): AudioNode {
        return this.audioContext.destination;
    }

    public constructor(name: string, engine: AbstractAudioEngine, options: Nullable<IWebAudioDeviceOptions> = null) {
        super(name, engine);

        this.audioContext = options?.audioContext ?? new AudioContext();

        document.addEventListener(
            "click",
            async () => {
                this.audioContext.resume();
            },
            { once: true }
        );
    }
}
