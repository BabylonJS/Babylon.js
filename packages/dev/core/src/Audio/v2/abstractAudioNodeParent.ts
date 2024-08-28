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
            this._childNodes.length = 0;
        }
    }

    private _childNodes: Nullable<Array<AbstractAudioNode>>;

    protected _addChildNode(node: AbstractAudioNode): void {
        if (!this._childNodes) {
            this._childNodes = new Array<AbstractAudioNode>();
        } else if (this._childNodes.includes(node)) {
            return;
        }

        this._childNodes.push(node);
    }

    protected _removeChildNode(node: AbstractAudioNode): void {
        if (!this._childNodes) {
            return;
        }

        const index = this._childNodes.indexOf(node);
        if (index < 0) {
            return;
        }

        this._childNodes.splice(index, 1);
    }

    protected static _AddChildNode(parent: Nullable<AbstractAudioNodeParent>, node: AbstractAudioNode): void {
        parent?._addChildNode(node);
    }

    protected static _RemoveChildNode(parent: Nullable<AbstractAudioNodeParent>, node: AbstractAudioNode): void {
        parent?._removeChildNode(node);
    }
}
