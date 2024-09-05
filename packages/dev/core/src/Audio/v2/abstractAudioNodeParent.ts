/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { AbstractAudioNode } from "./abstractAudioNode";
import type { Nullable } from "../../types";
import type { IDisposable } from "../../scene";

export class AbstractAudioNodeParent implements IDisposable {
    private _children: Nullable<Set<AbstractAudioNode>>;

    public dispose(): void {
        if (this._children) {
            for (const node of this._children) {
                node.dispose();
            }
            this._children.clear();
        }
    }

    public get children(): Set<AbstractAudioNode> {
        if (!this._children) {
            this._children = new Set();
        }
        return this._children;
    }
}
