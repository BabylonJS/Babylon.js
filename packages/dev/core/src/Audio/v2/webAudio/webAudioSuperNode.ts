import type { Nullable } from "../../../types";
import type { AbstractAudioSubNode } from "../abstractAudioSubNode";
import type { AbstractAudioSuperNode } from "../abstractAudioSuperNode";

/** @internal */
export interface IWebAudioSuperNode extends AbstractAudioSuperNode {
    /** @internal */
    audioContext: AudioContext | OfflineAudioContext;

    /** @internal */
    addSubNode(subNode: AbstractAudioSubNode): void;

    /** @internal */
    disconnectSubNodes(): void;

    /** @internal */
    getSubNode(subNodeClassName: string): Nullable<AbstractAudioSubNode>;

    /** @internal */
    hasSubNode(name: string): boolean;
}
