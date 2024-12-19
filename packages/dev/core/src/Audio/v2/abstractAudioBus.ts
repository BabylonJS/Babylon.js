import type { Nullable } from "../../types";
import { AbstractAudioNode, AudioNodeType } from "./abstractAudioNode";
import type { AudioEngineV2 } from "./audioEngineV2";
/**
 * Options for creating a new audio bus node.
 */
export interface IAbstractAudioBusOptions {}

/**
 * Abstract class representing an audio bus node with a volume control.
 */
export abstract class AbstractAudioBus extends AbstractAudioNode {
    /** @internal */
    constructor(name: string, engine: AudioEngineV2, options: Nullable<IAbstractAudioBusOptions> = null) {
        super(engine, AudioNodeType.InputOutput, null, name);
    }
}
