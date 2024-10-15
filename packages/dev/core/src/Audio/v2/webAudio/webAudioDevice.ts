import { AbstractAudioDevice } from "../abstractAudioDevice";
import type { AbstractAudioEngine } from "../abstractAudioEngine";

/**
 * WebAudio implementation of AbstractAudioDevice.
 */
export class WebAudioDevice extends AbstractAudioDevice {
    public constructor(name: string, engine: AbstractAudioEngine) {
        super(name, engine);
    }
}
