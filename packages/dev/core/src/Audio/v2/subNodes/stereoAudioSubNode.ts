import type { Nullable } from "../../../types";
import { AbstractAudioSubNode } from "../abstractAudioSubNode";
import type { AudioEngineV2 } from "../audioEngineV2";
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
 * @returns `true` if stereo audio options are defined, otherwise `false`.
 */
export function hasStereoAudioOptions(options: IStereoAudioOptions): boolean {
    return options.stereoEnabled || options.stereoPan !== undefined;
}

/**
 *
 */
export abstract class StereoAudioSubNode extends AbstractAudioSubNode {
    protected constructor(engine: AudioEngineV2) {
        super(AudioSubNode.Stereo, engine);
    }

    abstract get pan(): number;
    abstract set pan(value: number);

    /** @internal */
    public setOptions(options: Nullable<IStereoAudioOptions>): void {
        if (!options) {
            return;
        }

        this.pan = options.stereoPan !== undefined ? options.stereoPan : StereoAudio.DefaultPan;
    }
}
