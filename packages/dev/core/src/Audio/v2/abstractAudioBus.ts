import type { Nullable } from "../../types";
import type { AudioEngineV2 } from "./audioEngineV2";
import { AbstractNamedAudioNode, AudioNodeType } from "./abstractAudioNode";

/**
 * Options for creating a new audio bus node.
 */
export interface IAbstractAudioBusOptions {
    /**
     * The volume of the audio bus.
     */
    volume?: number;
}

/**
 * Abstract class representing an audio bus node with a volume control.
 */
export abstract class AbstractAudioBus extends AbstractNamedAudioNode {
    /**
     * The volume of the audio bus.
     */
    public volume: number;

    /** @internal */
    constructor(name: string, engine: AudioEngineV2, options: Nullable<IAbstractAudioBusOptions> = null) {
        super(name, engine, AudioNodeType.InputOutput);

        this.volume = options?.volume ?? 1;
    }
}
