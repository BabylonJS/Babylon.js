import type { Nullable } from "../../types";
import type { AbstractAudioEngine } from "./abstractAudioEngine";
import { AbstractNamedAudioNode, AudioNodeType } from "./abstractAudioNode";

/**
 * Options for creating a new audio bus node.
 */
export interface IAudioBusNodeOptions {
    /**
     * The volume of the audio bus.
     */
    volume?: number;
}

/**
 * Abstract class representing an audio bus node with a volume control.
 */
export abstract class AbstractAudioBusNode extends AbstractNamedAudioNode {
    /**
     * The volume of the audio bus.
     */
    public volume: number;

    /** @internal */
    constructor(name: string, engine: AbstractAudioEngine, options: Nullable<IAudioBusNodeOptions> = null) {
        super(name, engine, AudioNodeType.InputOutput);

        this.volume = options?.volume ?? 1;
    }
}
