import type { AudioEngineV2 } from "../audioEngineV2";
import { _AbstractAudioSubNode } from "../subNodes/abstractAudioSubNode";
import { _AudioSubNode } from "../subNodes/audioSubNode";

/** @internal */
export class _VolumeAudioDefaults {
    /** @internal */
    public static readonly Volume = 1;
}

/**
 * Volume options.
 */
export interface IVolumeAudioOptions {
    /**
     * The volume/gain. Defaults to 1.
     */
    volume: number;
}

/** @internal */
export abstract class _VolumeAudioSubNode extends _AbstractAudioSubNode {
    protected constructor(engine: AudioEngineV2) {
        super(_AudioSubNode.VOLUME, engine);
    }

    public abstract get volume(): number;
    public abstract set volume(value: number);

    /** @internal */
    public setOptions(options: Partial<IVolumeAudioOptions>): void {
        this.volume = options.volume ?? _VolumeAudioDefaults.Volume;
    }
}
