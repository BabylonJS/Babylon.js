import { AbstractAudioSubNode } from "../abstractAudioSubNode";
import type { AbstractAudioSuperNode } from "../abstractAudioSuperNode";
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
    protected constructor(owner: AbstractAudioSuperNode) {
        super(AudioSubNode.Volume, owner);
    }

    public abstract get volume(): number;
    public abstract set volume(value: number);
}
