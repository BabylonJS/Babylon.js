import type { AbstractAudioSuperNode } from "../abstractAudioSuperNode";
import { AbstractAudioSubNode } from "./abstractAudioSubNode";

/**
 *
 */
export interface IStereoAudioOptions {
    /**
     * The stereo pan from -1 (left) to 1 (right). Default is 0.
     */
    stereoPan?: number;
}

/**
 *
 */
export abstract class StereoAudioSubNode extends AbstractAudioSubNode {
    protected constructor(owner: AbstractAudioSuperNode) {
        super("Stereo", owner);
    }

    abstract get pan(): number;
    abstract set pan(value: number);
}
