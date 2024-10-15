import type { IDisposable } from "../../scene";
import type { AbstractAudioNode } from "./abstractAudioNode";

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
