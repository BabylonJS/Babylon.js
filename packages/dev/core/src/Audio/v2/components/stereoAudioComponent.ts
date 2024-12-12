import type { AbstractAudioComponentOwner } from "../abstractAudioComponentOwner";
import { AbstractAudioComponent } from "./abstractAudioComponent";

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
export abstract class StereoAudioComponent extends AbstractAudioComponent {
    protected constructor(owner: AbstractAudioComponentOwner) {
        super("Stereo", owner);
    }

    abstract get pan(): number;
    abstract set pan(value: number);
}
