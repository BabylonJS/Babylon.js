import type { AudioEngineV2 } from "../audioEngineV2";
import { _AbstractAudioSubNode } from "./abstractAudioSubNode";
import { _AudioSubNode } from "./audioSubNode";

/** @internal */
export class _StereoAudioDefaults {
    /** @internal */
    public static readonly Pan = 0;
}

/** */
export interface IStereoAudioOptions {
    /**
     * Enable stereo. Default is false.
     *
     * When set to `true`, the audio node's stereo properties will be initialized on creation and there will be no
     * delay when setting the first stereo value.
     *
     * When not specified, or set to `false`, the audio node's stereo properties will not be initialized on creation
     * and there will be a small delay when setting the first stereo value.
     *
     * - This option is ignored if any other stereo options are set.
     */
    stereoEnabled: boolean;
    /**
     * The stereo pan from -1 (left) to 1 (right). Default is 0.
     */
    stereoPan: number;
}

/**
 * @param options The stereo audio options to check.
 * @returns `true` if stereo audio options are defined, otherwise `false`.
 */
export function _HasStereoAudioOptions(options: Partial<IStereoAudioOptions>): boolean {
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
    public setOptions(options: Partial<IStereoAudioOptions>): void {
        this.pan = options.stereoPan ?? _StereoAudioDefaults.Pan;
    }
}
