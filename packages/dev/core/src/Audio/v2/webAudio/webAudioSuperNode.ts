import type { Nullable } from "../../../types";
import type { AbstractAudioSuperNode } from "../abstractAudioSuperNode";
import type { AbstractAudioSubNode } from "../subNodes/abstractAudioSubNode";

/** @internal */
export interface IWebAudioSuperNode extends AbstractAudioSuperNode {
    /** @internal */
    audioContext: AudioContext | OfflineAudioContext;

    /** @internal */
    addComponent(component: AbstractAudioSubNode): void;

    /** @internal */
    getComponent(componentClassName: string): Nullable<AbstractAudioSubNode>;
}
