import type { TransformNode } from "core/Meshes/transformNode";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import type { Mesh } from "core/Meshes/mesh";
import type { Scene } from "core/scene";

import { Button3D } from "./button3D";

/**
 * Class used to create an interactable object. It's a 3D button using a mesh coming from the current scene
 */
export class MeshButton3D extends Button3D {
    /** @internal */
    protected _currentMesh: Mesh;

    /**
     * Creates a new 3D button based on a mesh
     * @param mesh mesh to become a 3D button
     * @param name defines the control name
     */
    constructor(mesh: Mesh, name?: string) {
        super(name);
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

    protected override _getTypeName(): string {
        return "MeshButton3D";
    }

    // Mesh association
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected override _createNode(scene: Scene): TransformNode {
        const meshes = this._currentMesh.getChildMeshes();

        for (const mesh of meshes) {
            this._injectGUI3DReservedDataStore(mesh).control = this;
        }
        return this._currentMesh;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected override _affectMaterial(mesh: AbstractMesh) {}
}
