import type { Nullable } from "../../../types";
import type { AudioEngineV2 } from "../audioEngineV2";
import { _AbstractAudioSubNode } from "../subNodes/abstractAudioSubNode";
import { AudioSubNode } from "../subNodes/audioSubNode";
import type { _AbstractAudioSubGraph } from "./abstractAudioSubGraph";

/** @internal */
export const _VolumeAudioDefaults = {
    volume: 1 as number,
} as const;

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
        super(AudioSubNode.VOLUME, engine);
    }

    public abstract volume: number;

    /** @internal */
    public setOptions(options: Partial<IVolumeAudioOptions>): void {
        this.volume = options.volume ?? _VolumeAudioDefaults.volume;
    }
}

/** @internal */
export function _GetVolumeAudioSubNode(subGraph: _AbstractAudioSubGraph): Nullable<_VolumeAudioSubNode> {
    return subGraph.getSubNode<_VolumeAudioSubNode>(AudioSubNode.VOLUME);
}

/** @internal */
export function _GetVolumeAudioProperty<K extends keyof typeof _VolumeAudioDefaults>(subGraph: _AbstractAudioSubGraph, property: K): (typeof _VolumeAudioDefaults)[K] {
    return _GetVolumeAudioSubNode(subGraph)?.[property] ?? _VolumeAudioDefaults[property];
}
