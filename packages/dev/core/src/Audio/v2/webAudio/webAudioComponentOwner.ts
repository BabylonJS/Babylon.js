import type { AbstractAudioComponentOwner } from "../abstractAudioComponentOwner";
import type { AbstractAudioNode } from "../abstractAudioNode";

/** @internal */
export interface IWebAudioComponentOwner extends AbstractAudioComponentOwner {
    /** @internal */
    audioContext: AudioContext | OfflineAudioContext;

    /** @internal */
    get downstreamNodes(): Set<AbstractAudioNode> | undefined;

    /** @internal */
    get upstreamNodes(): Set<AbstractAudioNode> | undefined;
}
