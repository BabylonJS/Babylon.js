import type { AbstractAudioNode } from "./abstractAudioNode";

/** @internal */
export interface IAudioParentNode extends AbstractAudioNode {
    /** @internal */
    get children(): Map<string, Set<AbstractAudioNode>>;

    /** @internal */
    beforeInputNodeChanged(): void;

    /** @internal */
    afterInputNodeChanged(): void;

    /** @internal */
    beforeOutputNodeChanged(): void;

    /** @internal */
    afterOutputNodeChanged(): void;
}
