import type { IDisposable } from "../../scene";
import type { AbstractAudioNode } from "./abstractAudioNode";

/**
 * Abstract base class for audio node parents.
 */
export class AbstractAudioNodeParent implements IDisposable {
    /**
     * The children audio nodes.
     */
    public readonly children = new Set<AbstractAudioNode>();

    /**
     * Releases associated resources.
     */
    public dispose(): void {
        if (this.children) {
            for (const node of Array.from(this.children)) {
                node.dispose();
            }
            this.children.clear();
        }
    }
}
