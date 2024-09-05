/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { AbstractAudioEngine } from "./abstractAudioEngine";
import { AbstractNamedAudioNode, AudioNodeType } from "./abstractAudioNode";

export interface IAudioBusNodeOptions {
    volume?: number;
}

export abstract class AbstractAudioBusNode extends AbstractNamedAudioNode {
    public volume: number;

    public constructor(name: string, engine: AbstractAudioEngine, options?: IAudioBusNodeOptions) {
        super(name, engine, AudioNodeType.InputOutput);

        this.volume = options?.volume ?? 1;
    }
}
