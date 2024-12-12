import { AbstractAudioSubNode } from "../abstractAudioSubNode";
import type { AbstractAudioSuperNode } from "../abstractAudioSuperNode";

/**
 *
 */
export interface IVolumeAudioOptions {
    /**
     * The volume/gain. Defaults to 1.
     */
    volume?: number;
}

/**
 *
 */
export abstract class VolumeAudioSubNode extends AbstractAudioSubNode {
    protected constructor(owner: AbstractAudioSuperNode) {
        super("Volume", owner);
    }

    abstract get volume(): number;
    abstract set volume(value: number);
}
