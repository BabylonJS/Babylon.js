import { AbstractAudioSubNode } from "../abstractAudioSubNode";
import type { IAudioParentNode } from "../audioParentNode";
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
    protected constructor(owner: IAudioParentNode) {
        super(AudioSubNode.Volume, owner);
    }

    public abstract get volume(): number;
    public abstract set volume(value: number);
}
