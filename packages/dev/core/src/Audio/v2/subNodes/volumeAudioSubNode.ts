import type { Nullable } from "../../../types";
import { AbstractAudioSubNode } from "../abstractAudioSubNode";
import type { AudioEngineV2 } from "../audioEngineV2";
import { AudioSubNode } from "./audioSubNode";

export enum VolumeAudio {
    DefaultVolume = 1,
}

/**
 * Volume options.
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

/** @internal */
export abstract class VolumeAudioSubNode extends AbstractAudioSubNode {
    protected constructor(engine: AudioEngineV2) {
        super(AudioSubNode.Volume, engine);
    }

    public abstract get volume(): number;
    public abstract set volume(value: number);

    /** @internal */
    public setOptions(options: Nullable<IVolumeAudioOptions>): void {
        if (!options) {
            return;
        }

        this.volume = options.volume !== undefined ? options.volume : VolumeAudio.DefaultVolume;
    }
}
