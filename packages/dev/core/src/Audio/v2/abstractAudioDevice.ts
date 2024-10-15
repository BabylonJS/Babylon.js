import type { AbstractAudioEngine } from "./abstractAudioEngine";
import { AbstractNamedAudioNode, AudioNodeType } from "./abstractAudioNode";

export interface IAudioDeviceOptions {}

export abstract class AbstractAudioDevice extends AbstractNamedAudioNode {
    public constructor(name: string, engine: AbstractAudioEngine) {
        super(name, engine, AudioNodeType.Input);
    }
}
