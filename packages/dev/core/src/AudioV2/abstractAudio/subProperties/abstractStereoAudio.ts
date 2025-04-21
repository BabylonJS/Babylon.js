export const _StereoAudioDefaults = {
    pan: 0 as number,
} as const;

/** */
export interface IStereoAudioOptions {
    /**
     * Enable stereo. Defaults to false.
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
     * The stereo pan from -1 (left) to 1 (right). Defaults to 0.
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
 * Abstract class representing the `stereo` audio property on a sound or audio bus.
 *
 * @see {@link AudioEngineV2.listener}
 */
export abstract class AbstractStereoAudio {
    /**
     * The stereo pan from -1 (left) to 1 (right). Defaults to 0.
     */
    public abstract pan: number;
}
