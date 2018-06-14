/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    /**
     * Class used to create a container panel deployed on the surface of a plane
     */
    export class PlanePanel extends VolumeBasedPanel {    
        protected _mapGridNode(control: Control3D, nodePosition: Vector3) {            
            let mesh = control.mesh;

            if (!mesh) {
                return;
            }

            control.position = nodePosition.clone();

            switch (this.orientation) {
                case Container3D.FACEORIGIN_ORIENTATION:
                case Container3D.FACEFORWARD_ORIENTATION:
                    mesh.lookAt(new BABYLON.Vector3(0, 0, -1));
                    break;
                case Container3D.FACEFORWARDREVERSED_ORIENTATION:
                case Container3D.FACEORIGINREVERSED_ORIENTATION:
                    mesh.lookAt(new BABYLON.Vector3(0, 0, 1));
                    break;
            }
            
        }
    }
}