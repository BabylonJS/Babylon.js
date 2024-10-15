import { AbstractAudioEngine } from "../abstractAudioEngine";
import { AbstractAudioDevice } from "../abstractAudioDevice";

/**
 * WebAudio implementation of AbstractAudioDevice.
 */
export class WebAudioDevice extends AbstractAudioDevice {
    public constructor(name: string, engine: AbstractAudioEngine) {
        super(name, engine);
    }
}
