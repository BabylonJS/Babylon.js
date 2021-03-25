import { TransformNode } from "babylonjs/Meshes/transformNode";
import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
import { Mesh } from "babylonjs/Meshes/mesh";
import { Scene } from "babylonjs/scene";

import { TouchButton3D } from "./touchButton3D";

/**
 * Class used to create an interactable object. It's a touchable 3D button using a mesh coming from the current scene
 */
export class TouchMeshButton3D extends TouchButton3D {
    /** @hidden */
    protected _currentMesh: Mesh;

    /**
     * Creates a new 3D button based on a mesh
     * @param mesh mesh to become a 3D button
     * @param collisionMesh mesh to track collisions with
     * @param name defines the control name
     */
    constructor(mesh: Mesh, options: {collisionMesh: Mesh, useDynamicMesh?: boolean}, name?: string) {
        if (options.useDynamicMesh) {
            super(name, options.collisionMesh);
        }
        else {
            let newCollisionMesh = options.collisionMesh.clone("", options.collisionMesh.parent);
            newCollisionMesh.isVisible = false;
            super(name, newCollisionMesh);
        }

        this._currentMesh = mesh;

        /**
         * Provides a default behavior on hover/out & up/down
         * Override those function to create your own desired behavior specific to your mesh
         */
        this.pointerEnterAnimation = () => {
            if (!this.mesh) {
                return;
            }
            this.mesh.scaling.scaleInPlace(1.1);
        };

        this.pointerOutAnimation = () => {
            if (!this.mesh) {
                return;
            }
            this.mesh.scaling.scaleInPlace(1.0 / 1.1);
        };

        this.pointerDownAnimation = () => {
            if (!this.mesh) {
                return;
            }
            this.mesh.scaling.scaleInPlace(0.95);
        };

        this.pointerUpAnimation = () => {
            if (!this.mesh) {
                return;
            }
            this.mesh.scaling.scaleInPlace(1.0 / 0.95);
        };
    }

    protected _getTypeName(): string {
        return "TouchMeshButton3D";
    }

    // Mesh association
    protected _createNode(scene: Scene): TransformNode {
        this._currentMesh.getChildMeshes().forEach((mesh) => {
            this._injectGUI3DReservedDataStore(mesh).control = this;
        });

        return this._currentMesh;
    }

    protected _affectMaterial(mesh: AbstractMesh) {
    }
}