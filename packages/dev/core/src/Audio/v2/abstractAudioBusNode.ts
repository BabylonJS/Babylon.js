import type { Nullable } from "../../types";
import type { AbstractAudioEngine } from "./abstractAudioEngine";
import { AbstractNamedAudioNode, AudioNodeType } from "./abstractAudioNode";

export interface IAudioBusNodeOptions {
    volume?: number;
}

export abstract class AbstractAudioBusNode extends AbstractNamedAudioNode {
    public volume: number;

    public constructor(name: string, engine: AbstractAudioEngine, options: Nullable<IAudioBusNodeOptions> = null) {
        super(name, engine, AudioNodeType.InputOutput);

        this.volume = options?.volume ?? 1;
    }
}
