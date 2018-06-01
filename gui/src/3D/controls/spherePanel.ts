/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    /**
     * Class used to create a container panel deployed on the surface of a sphere
     */
    export class SpherePanel extends VolumeBasedPanel {

        protected _mapGridNode(control: Control3D, nodePosition: Vector3) {            
            let newPos = this._sphericalMapping(nodePosition);
            let mesh = control.mesh;

            if (!mesh) {
                return;
            }

            switch (this.orientation) {
                case Container3D.FACEORIGIN_ORIENTATION:
                    mesh.lookAt(new BABYLON.Vector3(-newPos.x, -newPos.y, -newPos.z));
                    break;
                case Container3D.FACEORIGINREVERSED_ORIENTATION:
                    mesh.lookAt(new BABYLON.Vector3(newPos.x, newPos.y, newPos.z));
                    break;
                case Container3D.FACEFORWARD_ORIENTATION:
                    mesh.lookAt(new BABYLON.Vector3(0, 0, 1));
                    break;
                case Container3D.FACEFORWARDREVERSED_ORIENTATION:
                    mesh.lookAt(new BABYLON.Vector3(0, 0, -1));
                    break;
            }
            
            control.position = newPos;
        }

        private _sphericalMapping(source: Vector3)
        {
            let newPos = new Vector3(0, 0, this.radius);

            let xAngle = (source.y / this.radius);
            let yAngle = -(source.x / this.radius);

            Matrix.RotationYawPitchRollToRef(yAngle, xAngle, 0, Tmp.Matrix[0]);

            return Vector3.TransformNormal(newPos, Tmp.Matrix[0]);
        }
    }
}