import type { Nullable } from "../../../types";
import type { AbstractAudioSubNode } from "../abstractAudioSubNode";
import type { AbstractAudioSuperNode } from "../abstractAudioSuperNode";

/** @internal */
export interface IWebAudioSuperNode extends AbstractAudioSuperNode {
    /** @internal */
    audioContext: AudioContext | OfflineAudioContext;

    /** @internal */
    addComponent(component: AbstractAudioSubNode): void;

    /** @internal */
    getComponent(componentClassName: string): Nullable<AbstractAudioSubNode>;
}
