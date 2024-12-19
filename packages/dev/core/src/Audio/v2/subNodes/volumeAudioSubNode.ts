import type { AbstractAudioNode } from "../abstractAudioNode";
import { AbstractAudioSubNode } from "../abstractAudioSubNode";
import { AudioSubNode } from "./audioSubNode";

export enum VolumeAudio {
    DefaultVolume = 1,
}

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
 * @param options The stereo audio options to check.
 * @returns `true` if the stereo audio options are defined, otherwise `false`.
 */
export function hasVolumeAudioOptions(options: IVolumeAudioOptions): boolean {
    return options.volume !== undefined;
}

/**
 *
 */
export abstract class VolumeAudioSubNode extends AbstractAudioSubNode {
    protected constructor(owner: AbstractAudioNode) {
        super(AudioSubNode.Volume, owner);
    }

    public abstract get volume(): number;
    public abstract set volume(value: number);
}
