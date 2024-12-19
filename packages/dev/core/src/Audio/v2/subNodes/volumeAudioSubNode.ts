import type { Nullable } from "../../../types";
import { _AbstractAudioSubNode } from "../abstractAudioSubNode";
import type { AudioEngineV2 } from "../audioEngineV2";
import { _AudioSubNode } from "./audioSubNode";

/** @internal */
export class _VolumeAudio {
    /** @internal */
    public static readonly DefaultVolume = 1;
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
export function _hasVolumeAudioOptions(options: IVolumeAudioOptions): boolean {
    return options.volume !== undefined;
}

/** @internal */
export abstract class _VolumeAudioSubNode extends _AbstractAudioSubNode {
    protected constructor(engine: AudioEngineV2) {
        super(_AudioSubNode.Volume, engine);
    }

    public abstract get volume(): number;
    public abstract set volume(value: number);

    /** @internal */
    public setOptions(options: Nullable<IVolumeAudioOptions>): void {
        if (!options) {
            return;
        }

        this.volume = options.volume !== undefined ? options.volume : _VolumeAudio.DefaultVolume;
    }
}
