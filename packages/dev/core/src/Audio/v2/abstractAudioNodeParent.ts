/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { AbstractAudioNode } from "./abstractAudioNode";
import type { Nullable } from "../../types";
import type { IDisposable } from "../../scene";

export class AbstractAudioNodeParent implements IDisposable {
    public dispose(): void {
        if (this._childNodes) {
            for (const node of this._childNodes) {
                node.dispose();
            }
            this._childNodes.clear();
        }
    }

    private _childNodes: Nullable<Set<AbstractAudioNode>>;

    protected _addChildNode(node: AbstractAudioNode): void {
        if (!this._childNodes) {
            this._childNodes = new Set<AbstractAudioNode>();
        }

        this._childNodes.add(node);
    }

    protected _removeChildNode(node: AbstractAudioNode): void {
        this._childNodes?.delete(node);
    }

    protected static _AddChildNode(parent: Nullable<AbstractAudioNodeParent>, node: AbstractAudioNode): void {
        parent?._addChildNode(node);
    }

    protected static _RemoveChildNode(parent: Nullable<AbstractAudioNodeParent>, node: AbstractAudioNode): void {
        parent?._removeChildNode(node);
    }
}
