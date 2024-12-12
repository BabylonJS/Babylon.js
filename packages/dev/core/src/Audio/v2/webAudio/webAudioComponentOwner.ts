import type { AbstractAudioComponentOwner } from "../abstractAudioComponentOwner";

/** @internal */
export interface IWebAudioComponentOwner extends AbstractAudioComponentOwner {
    /** @internal */
    audioContext: AudioContext | OfflineAudioContext;
}
