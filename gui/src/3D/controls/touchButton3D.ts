// Assumptions: absolute position of button mesh is inside the mesh

import { Vector3 } from "babylonjs/Maths/math.vector";
import { Mesh } from "babylonjs/Meshes/mesh";
import { PointerEventTypes } from "babylonjs/Events/pointerEvents";
import { TransformNode } from "babylonjs/Meshes/transformNode";
import { Scene } from "babylonjs/scene";
import { TmpVectors } from "babylonjs/Maths/math.vector";

import { Button3D } from "./button3D";

/**
 * Class used to create a touchable button in 3D
 */
export class TouchButton3D extends Button3D {
    private _collisionMesh: Mesh;

    // 'front' direction. If Vector3.Zero, there is no front and all directions of interaction are accepted
    private _collidableFrontDirection: Vector3;

    /**
     * Creates a new touchable button
     * @param name defines the control name
     * @param collisionMesh mesh to track collisions with
     */
    constructor(name?: string, collisionMesh?: Mesh) {
        super(name);

        this.collidableFrontDirection = Vector3.Zero();

        if (collisionMesh) {
            this.collisionMesh = collisionMesh;
        }
    }

    /**
     * Sets the front-facing direction of the button. Pass in Vector3.Zero to allow interactions from any direction
     * @param frontDir the forward direction of the button
     */
    public set collidableFrontDirection(frontWorldDir: Vector3) {
        this._collidableFrontDirection = frontWorldDir.normalize();

        if (this._collisionMesh) {
            const transformedDirection = TmpVectors.Vector3[0];
            const invert = TmpVectors.Matrix[0];

            invert.copyFrom(this._collisionMesh.getWorldMatrix());
            invert.invert();
            Vector3.TransformNormalToRef(this._collidableFrontDirection, invert, transformedDirection);
            this._collidableFrontDirection = transformedDirection;
        }
    }

    /**
     * Returns the front-facing direction of the button, or Vector3.Zero if there is no 'front'
     */
    public get collidableFrontDirection() {
        if (this._collisionMesh) {
            // Update the front direction to reflect any rotations of the collision mesh
            const transformedDirection = TmpVectors.Vector3[0];
            Vector3.TransformNormalToRef(this._collidableFrontDirection, this._collisionMesh.getWorldMatrix(), transformedDirection);

            return transformedDirection;
        }

        return this._collidableFrontDirection;
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
    }

    // Returns true if the collidable is in front of the button, or if the button has no front direction
    private _isInteractionInFrontOfButton(collidablePos: Vector3) {
        const frontDir = this.collidableFrontDirection;
        if (frontDir.length() === 0) {
            // The button has no front, just return the distance to the center
            return true;
        }
        const d = Vector3.Dot(this._collisionMesh.getAbsolutePosition(), frontDir);
        const abc = Vector3.Dot(collidablePos, frontDir);

        return abc > d;
    }

    /** hidden */
    public _generatePointerEventType(providedType: number, nearMeshPosition: Vector3, activeInteractionCount: number): number {
        if (providedType == PointerEventTypes.POINTERDOWN) {
            if (this._isInteractionInFrontOfButton(nearMeshPosition)) {
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