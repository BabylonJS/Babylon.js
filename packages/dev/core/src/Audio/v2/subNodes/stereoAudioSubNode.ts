import type { Nullable } from "../../../types";
import { _AbstractAudioSubNode } from "../abstractAudioSubNode";
import type { AudioEngineV2 } from "../audioEngineV2";
import { _AudioSubNode } from "./audioSubNode";

/** @internal */
export class _StereoAudioDefault {
    /** @internal */
    public static readonly Pan = 0;
}

/** */
export interface IStereoAudioOptions {
    /**
     * Enable stereo. Default is false.
     */
    stereoEnabled?: boolean;
    /**
     * The stereo pan from -1 (left) to 1 (right). Default is 0.
     */
    stereoPan?: number;
}

/**
 * @param options The stereo audio options to check.
 * @returns `true` if stereo audio options are defined, otherwise `false`.
 */
export function _HasStereoAudioOptions(options: IStereoAudioOptions): boolean {
    return options.stereoEnabled || options.stereoPan !== undefined;
}

/**
 *
 */
export abstract class _StereoAudioSubNode extends _AbstractAudioSubNode {
    protected constructor(engine: AudioEngineV2) {
        super(_AudioSubNode.Stereo, engine);
    }

    abstract get pan(): number;
    abstract set pan(value: number);

    /** @internal */
    public setOptions(options: Nullable<IStereoAudioOptions>): void {
        if (!options) {
            return;
        }

        this.pan = options.stereoPan !== undefined ? options.stereoPan : _StereoAudioDefault.Pan;
    }
}
