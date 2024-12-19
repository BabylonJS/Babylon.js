import type { AbstractAudioNode } from "./abstractAudioNode";
import type { AbstractAudioSubGraph } from "./abstractAudioSubGraph";

/** @internal */
export interface IAudioParentNode extends AbstractAudioNode {
    /** @internal */
    get children(): Map<string, Set<AbstractAudioNode>>;

    /** @internal */
    get subGraph(): AbstractAudioSubGraph;

    /** @internal */
    beforeInputNodeChanged(): void;

    /** @internal */
    afterInputNodeChanged(): void;

    /** @internal */
    beforeOutputNodeChanged(): void;

    /** @internal */
    afterOutputNodeChanged(): void;
}
