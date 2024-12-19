import type { AbstractAudioNode } from "../abstractAudioNode";
import { AbstractAudioSubNode } from "../abstractAudioSubNode";
import { AudioSubNode } from "./audioSubNode";

/** */
export enum StereoAudio {
    DefaultPan = 0,
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
 * @returns `true` if the stereo audio options are defined, otherwise `false`.
 */
export function hasStereoAudioOptions(options: IStereoAudioOptions): boolean {
    return options.stereoEnabled || options.stereoPan !== undefined;
}

/**
 *
 */
export abstract class StereoAudioSubNode extends AbstractAudioSubNode {
    protected constructor(owner: AbstractAudioNode) {
        super(AudioSubNode.Stereo, owner);
    }

    abstract get pan(): number;
    abstract set pan(value: number);
}
