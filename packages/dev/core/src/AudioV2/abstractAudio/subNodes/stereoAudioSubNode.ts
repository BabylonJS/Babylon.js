import type { AudioEngineV2 } from "../../abstractAudio/audioEngineV2";
import { _AbstractAudioSubNode } from "../../abstractAudio/subNodes/abstractAudioSubNode";
import { _AudioSubNode } from "../../abstractAudio/subNodes/audioSubNode";
import type { IStereoAudioOptions } from "../../abstractAudio/subProperties/abstractStereoAudio";
import { _StereoAudioDefaults } from "../../abstractAudio/subProperties/abstractStereoAudio";

/** @internal */
export abstract class _StereoAudioSubNode extends _AbstractAudioSubNode {
    protected constructor(engine: AudioEngineV2) {
        super(_AudioSubNode.STEREO, engine);
    }

    abstract pan: number;

    /** @internal */
    public setOptions(options: Partial<IStereoAudioOptions>): void {
        this.pan = options.stereoPan ?? _StereoAudioDefaults.PAN;
    }
}
