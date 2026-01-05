import { AudioNodeType } from "./abstractAudioNode";
import type { IAbstractAudioOutNodeOptions } from "./abstractAudioOutNode";
import { AbstractAudioOutNode } from "./abstractAudioOutNode";
import type { AudioEngineV2 } from "./audioEngineV2";

/** @internal */
export interface IAbstractAudioBusOptions extends IAbstractAudioOutNodeOptions {}

/**
 * Abstract class representing an audio bus with volume control.
 *
 * An audio bus is a node in the audio graph that can have multiple inputs and outputs. It is typically used to group
 * sounds together and apply effects to them.
 */
export abstract class AbstractAudioBus extends AbstractAudioOutNode {
    protected constructor(name: string, engine: AudioEngineV2) {
        super(name, engine, AudioNodeType.HAS_INPUTS_AND_OUTPUTS);
    }
}
