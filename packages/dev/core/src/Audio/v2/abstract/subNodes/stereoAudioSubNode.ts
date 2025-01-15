import type { AudioEngineV2 } from "../audioEngineV2";
import type { IStereoAudioOptions } from "../subProperties/abstractStereoAudio";
import { _StereoAudioDefaults } from "../subProperties/abstractStereoAudio";
import { _AbstractAudioSubNode } from "./abstractAudioSubNode";
import { _AudioSubNode } from "./audioSubNode";

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
