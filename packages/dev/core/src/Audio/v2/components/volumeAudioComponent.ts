import type { AbstractAudioComponentOwner } from "../abstractAudioComponentOwner";
import { AbstractAudioComponent } from "./abstractAudioComponent";

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
export abstract class VolumeAudioComponent extends AbstractAudioComponent {
    protected constructor(owner: AbstractAudioComponentOwner) {
        super(owner);
    }

    abstract get volume(): number;
    abstract set volume(value: number);

    public _getComponentTypeName(): string {
        return "Volume";
    }
}
