import { Tools } from "babylonjs/Misc/tools";
import { Matrix, TmpVectors, Vector3 } from "babylonjs/Maths/math.vector";
import { float } from "babylonjs/types";

import { VolumeBasedPanel } from "./volumeBasedPanel";
import { Control3D } from "./control3D";
import { Container3D } from "./container3D";
import { Axis, Space } from 'babylonjs/Maths/math.axis';

/**
 * Class used to create a container panel deployed on the surface of a sphere
 */
export class SpherePanel extends VolumeBasedPanel {
    private _radius = 5.0;

    /**
     * Gets or sets the radius of the sphere where to project controls (5 by default)
     */
    public get radius(): float {
        return this._radius;
    }

    public set radius(value: float) {
        if (this._radius === value) {
            return;
        }

        this._radius = value;

        Tools.SetImmediate(() => {
            this._arrangeChildren();
        });
    }

    protected _mapGridNode(control: Control3D, nodePosition: Vector3) {
        let mesh = control.mesh;

        if (!mesh) {
            return;
        }

        let newPos = this._sphericalMapping(nodePosition);
        control.position = newPos;

        switch (this.orientation) {
            case Container3D.FACEORIGIN_ORIENTATION:
                mesh.lookAt(new Vector3(2 * newPos.x, 2 * newPos.y, 2 * newPos.z));
                break;
            case Container3D.FACEORIGINREVERSED_ORIENTATION:
                mesh.lookAt(new Vector3(-newPos.x, -newPos.y, -newPos.z));
                break;
            case Container3D.FACEFORWARD_ORIENTATION:
                break;
            case Container3D.FACEFORWARDREVERSED_ORIENTATION:
                mesh.rotate(Axis.Y, Math.PI, Space.LOCAL);
                break;
        }
    }

    private _sphericalMapping(source: Vector3) {
        let newPos = new Vector3(0, 0, this._radius);

        let xAngle = (source.y / this._radius);
        let yAngle = -(source.x / this._radius);

        Matrix.RotationYawPitchRollToRef(yAngle, xAngle, 0, TmpVectors.Matrix[0]);

        return Vector3.TransformNormal(newPos, TmpVectors.Matrix[0]);
    }
}
