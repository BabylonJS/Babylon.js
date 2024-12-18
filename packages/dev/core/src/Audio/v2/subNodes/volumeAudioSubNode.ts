import type { AbstractAudioNode } from "../abstractAudioNode";
import { AbstractAudioSubNode } from "../abstractAudioSubNode";
import { AudioSubNode } from "./audioSubNode";

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
    protected constructor(parent: AbstractAudioNode) {
        super(AudioSubNode.Volume, parent);
    }

    public abstract get volume(): number;
    public abstract set volume(value: number);
}
