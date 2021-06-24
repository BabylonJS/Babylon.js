// Assumptions: absolute position of button mesh is inside the mesh

import { Vector3 } from "babylonjs/Maths/math.vector";
import { Mesh } from "babylonjs/Meshes/mesh";
import { PointerEventTypes } from "babylonjs/Events/pointerEvents";
import { TransformNode } from "babylonjs/Meshes/transformNode";
import { Scene } from "babylonjs/scene";

import { Button3D } from "./button3D";

/**
 * Class used to create a touchable button in 3D
 */
export class TouchButton3D extends Button3D {
    private _collisionMesh: Mesh;
    private _collidableFrontDirection: Vector3;

    private _collidableInitialized = false;

    /**
     * Creates a new touchable button
     * @param name defines the control name
     * @param collisionMesh mesh to track collisions with
     */
    constructor(name?: string, collisionMesh?: Mesh) {
        super(name);

        if (collisionMesh) {
            this.collisionMesh = collisionMesh;
        }
    }

    /**
     * Sets the front-facing direction of the button
     * @param frontDir the forward direction of the button
     */
    public set collidableFrontDirection(frontWorldDir: Vector3) {
        this._collidableFrontDirection = frontWorldDir.normalize();
    }

    /**
     * Sets the mesh used for testing input collision
     * @param collisionMesh the new collision mesh for the button
     */
    public set collisionMesh(collisionMesh: Mesh) {
        if (this._collisionMesh) {
            this._collisionMesh.dispose();
        }

        // parent the mesh to sync transforms
        if (!collisionMesh.parent && this.mesh) {
            collisionMesh.setParent(this.mesh);
        }

        this._collisionMesh = collisionMesh;
        this._injectGUI3DReservedDataStore(this._collisionMesh).control = this;
        this._collisionMesh.isNearPickable = true;

        this.collidableFrontDirection = collisionMesh.forward;

        this._collidableInitialized = true;
    }

    // Returns the distance in front of the center of the button
    // Returned value is negative when collidable is past the center
    private _getHeightFromButtonCenter(collidablePos: Vector3) {
        const d = Vector3.Dot(this._collisionMesh.getAbsolutePosition(), this._collidableFrontDirection);
        const abc = Vector3.Dot(collidablePos, this._collidableFrontDirection);

        return abc - d;
    }

    /** hidden */
    public _generatePointerEventType(providedType: number, nearMeshPosition: Vector3, activeInteractionCount: number): number {
        if (this._collidableInitialized) {
            if (providedType == PointerEventTypes.POINTERDOWN) {
                if (this._getHeightFromButtonCenter(nearMeshPosition) < 0) {
                    // Near interaction mesh is behind the button, don't send a pointer down
                    return PointerEventTypes.POINTERMOVE;
                }
            }
            if (providedType == PointerEventTypes.POINTERUP) {
                if (activeInteractionCount == 0) {
                    // We get the release for the down we swallowed earlier, swallow as well
                    return PointerEventTypes.POINTERMOVE;
                }
            }
        }

        return providedType;
    }

    protected _getTypeName(): string {
        return "TouchButton3D";
    }

    // Mesh association
    protected _createNode(scene: Scene): TransformNode {
        return super._createNode(scene);
    }

    /**
     * Releases all associated resources
     */
    public dispose() {
        super.dispose();

        if (this._collisionMesh) {
            this._collisionMesh.dispose();
        }
    }
}