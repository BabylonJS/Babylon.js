import type { AbstractAudioNode } from "./abstractAudioNode";
import type { IDisposable } from "../../scene";

export class AbstractAudioNodeParent implements IDisposable {
    public readonly children = new Set<AbstractAudioNode>();

    public dispose(): void {
        if (this.children) {
            for (const node of this.children) {
                node.dispose();
            }
            this.children.clear();
        }
    }
}
