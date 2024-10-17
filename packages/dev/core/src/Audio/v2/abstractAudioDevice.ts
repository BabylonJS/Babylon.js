import type { AbstractAudioEngine } from "./abstractAudioEngine";
import { AbstractNamedAudioNode, AudioNodeType } from "./abstractAudioNode";

/**
 * Options for creating a new audio device.
 */
export interface IAudioDeviceOptions {}

/**
 * Abstract base class for audio devices in the audio engine.
 */
export abstract class AbstractAudioDevice extends AbstractNamedAudioNode {
    /** @internal */
    constructor(name: string, engine: AbstractAudioEngine) {
        super(name, engine, AudioNodeType.Input);
    }
}
