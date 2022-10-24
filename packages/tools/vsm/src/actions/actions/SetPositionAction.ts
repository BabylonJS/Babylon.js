import type { Vector3 } from "core/Maths/math";
import type { TransformNode } from "core/Meshes/transformNode";
import { BaseAction } from "./BaseAction";

export class SetPositionAction extends BaseAction {
    private _targetPosition: Vector3;
    private _targetNode: TransformNode;

    set targetPosition(value: Vector3) {
        this._targetPosition = value;
    }

    get targetPosition() {
        return this._targetPosition;
    }

    set targetNode(value: TransformNode) {
        this._targetNode = value;
    }

    public execute(): void {
        if (this._targetNode) {
            this._targetNode.position = this._targetPosition;
        }
    }
}
