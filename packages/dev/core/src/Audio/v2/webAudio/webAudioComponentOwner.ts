import type { Nullable } from "../../../types";
import type { AbstractAudioComponentOwner } from "../abstractAudioComponentOwner";
import type { AbstractAudioComponent } from "../components/abstractAudioComponent";

/** @internal */
export interface IWebAudioComponentOwner extends AbstractAudioComponentOwner {
    /** @internal */
    audioContext: AudioContext | OfflineAudioContext;

    /** @internal */
    addComponent(component: AbstractAudioComponent): void;

    /** @internal */
    getComponent(componentClassName: string): Nullable<AbstractAudioComponent>;
}
