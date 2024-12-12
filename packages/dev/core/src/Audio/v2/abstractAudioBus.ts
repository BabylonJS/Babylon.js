import type { Nullable } from "../../types";
import { AudioNodeType } from "./abstractAudioNode";
import { AbstractAudioSuperNode } from "./abstractAudioSuperNode";
import type { AudioEngineV2 } from "./audioEngineV2";
/**
 * Options for creating a new audio bus node.
 */
export interface IAbstractAudioBusOptions {}

/**
 * Abstract class representing an audio bus node with a volume control.
 */
export abstract class AbstractAudioBus extends AbstractAudioSuperNode {
    /**
     * The volume of the audio bus.
     */
    public volume: number;

    /** @internal */
    constructor(name: string, engine: AudioEngineV2, options: Nullable<IAbstractAudioBusOptions> = null) {
        super(name, engine, AudioNodeType.InputOutput);
    }
}
