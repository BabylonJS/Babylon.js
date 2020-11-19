import { TransformNode } from "babylonjs/Meshes/transformNode";
import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
import { Mesh } from "babylonjs/Meshes/mesh";
import { Scene } from "babylonjs/scene";

import { MeshButton3D } from "./meshButton3D";

/**
 * Class used to create an interactable object. It's a 3D button using a mesh coming from the current scene
 */
export class TouchMeshButton3D extends MeshButton3D {
    /** @hidden */
    protected _currentMesh: Mesh;

    /**
     * Creates a new 3D button based on a mesh
     * @param mesh mesh to become a 3D button
     * @param name defines the control name
     */
    constructor(mesh: Mesh, name?: string) {
        super(mesh, name);
        this._currentMesh = mesh;
    }

    protected _getTypeName(): string {
        return "TouchMeshButton3D";
    }

    // Mesh association
    protected _createNode(scene: Scene): TransformNode {
        this._currentMesh.getChildMeshes().forEach((mesh) => {
            mesh.metadata = this;
        });

// this._currentMesh is the collidable mesh
// this._currentMesh.forward() returns the forward vector
        var _this = this;
        scene.registerBeforeRender(function () {
            //Check for collision with haaaaand
            const thumbTipMeshes = scene.getMeshesByTags("indexTip");
            thumbTipMeshes.forEach(function (thumbMesh: Mesh) {
                const distance = _this._currentMesh.getAbsolutePosition().subtract(thumbMesh.getAbsolutePosition()).length();

                if (distance < 1)
                {
                    _this._onPointerEnter(_this);// call Control3D._processObservables instead?
                }
            });
        });

        return this._currentMesh;
    }

    protected _affectMaterial(mesh: AbstractMesh) {
    }
}