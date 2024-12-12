import { AbstractAudioSubNode } from "../abstractAudioSubNode";
import type { AbstractAudioSuperNode } from "../abstractAudioSuperNode";

/**
 *
 */
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
 * @returns `true` if the stereo audio options are defined, otherwise `false`.
 */
export function stereoAudioOptionsAreDefined(options: IStereoAudioOptions): boolean {
    return options.stereoEnabled || options.stereoPan !== undefined;
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
