import type { Nullable } from "../../../types";
import type { AbstractAudioSuperNode } from "../abstractAudioComponentOwner";
import type { AbstractAudioSubNode } from "../components/abstractAudioComponent";

/** @internal */
export interface IWebAudioSuperNode extends AbstractAudioSuperNode {
    /** @internal */
    audioContext: AudioContext | OfflineAudioContext;

    /** @internal */
    addComponent(component: AbstractAudioSubNode): void;

    /** @internal */
    getComponent(componentClassName: string): Nullable<AbstractAudioSubNode>;
}
