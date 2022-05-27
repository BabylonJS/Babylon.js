import { Space } from "../../../Maths/math.axis";
import { Vector3 } from "../../../Maths/math.vector";
import { TransformNode } from "../../../Meshes/transformNode";
import { BaseAction } from "./BaseAction";

export interface ISpinActionOptions {
    subject: TransformNode;
    direction?: Vector3;
    space?: Space;
    duration?: number;
    amount?: number;
    delay?: number;
    // easing - TODO
    repeat?: number;
    // pingPong - what's a good way of implementing that?
}

export class SpinAction extends BaseAction<ISpinActionOptions> {
    protected async _execute(): Promise<void> {
        
    }

    protected _stop(): void {
        // no-op
    }
}
