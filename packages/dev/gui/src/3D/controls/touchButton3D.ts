// Assumptions: absolute position of button mesh is inside the mesh

import { Vector3, TmpVectors } from "core/Maths/math.vector";
import type { Mesh } from "core/Meshes/mesh";
import { PointerEventTypes } from "core/Events/pointerEvents";
import type { TransformNode } from "core/Meshes/transformNode";
import type { Scene } from "core/scene";

import { Observable } from "core/Misc/observable";

import { Button3D } from "./button3D";

/**
 * Class used to create a touchable button in 3D
 */
export class TouchButton3D extends Button3D {
    private _collisionMesh: Mesh;

    // 'front' direction. If Vector3.Zero, there is no front and all directions of interaction are accepted
    private _collidableFrontDirection: Vector3;
    private _isNearPressed = false;
    private _interactionSurfaceHeight = 0;

    private _isToggleButton = false;
    private _toggleState = false;
    private _toggleButtonCallback = () => {
        this._onToggle(!this._toggleState);
    };

    /**
     * An event triggered when the button is toggled. Only fired if 'isToggleButton' is true
     */
    public onToggleObservable = new Observable<boolean>();

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
     * Whether the current interaction is caused by near interaction or not
     */
    public get isActiveNearInteraction() {
        return this._isNearPressed;
    }

    /**
     * Sets the front-facing direction of the button. Pass in Vector3.Zero to allow interactions from any direction
     * @param frontWorldDir the forward direction of the button
     */
    public set collidableFrontDirection(frontWorldDir: Vector3) {
        this._collidableFrontDirection = frontWorldDir.normalize();

        if (this._collisionMesh) {
            const invert = TmpVectors.Matrix[0];

            invert.copyFrom(this._collisionMesh.getWorldMatrix());
            invert.invert();
            Vector3.TransformNormalToRef(this._collidableFrontDirection, invert, this._collidableFrontDirection);
            this._collidableFrontDirection.normalize();
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

            return transformedDirection.normalize();
        }

        return this._collidableFrontDirection;
    }

    /**
     * Sets the mesh used for testing input collision
     * @param collisionMesh the new collision mesh for the button
     */
    public set collisionMesh(collisionMesh: Mesh) {
        // Remove the GUI3DManager's data from the previous collision mesh's reserved data store, and reset interactability
        if (this._collisionMesh) {
            this._collisionMesh.isNearPickable = false;
            if (this._collisionMesh.reservedDataStore?.GUI3D) {
                this._collisionMesh.reservedDataStore.GUI3D = {};
            }

            const meshes = this._collisionMesh.getChildMeshes();
            for (const mesh of meshes) {
                mesh.isNearPickable = false;
                if (mesh.reservedDataStore?.GUI3D) {
                    mesh.reservedDataStore.GUI3D = {};
                }
            }
        }

        this._collisionMesh = collisionMesh;
        this._injectGUI3DReservedDataStore(this._collisionMesh).control = this;
        this._collisionMesh.isNearPickable = true;

        const meshes = this._collisionMesh.getChildMeshes();
        for (const mesh of meshes) {
            this._injectGUI3DReservedDataStore(mesh).control = this;
            mesh.isNearPickable = true;
        }
        this.collidableFrontDirection = collisionMesh.forward;
    }

    /**
     * Setter for if this TouchButton3D should be treated as a toggle button
     * @param value If this TouchHolographicButton should act like a toggle button
     */
    public set isToggleButton(value: boolean) {
        if (value === this._isToggleButton) {
            return;
        }

        this._isToggleButton = value;

        if (value) {
            this.onPointerUpObservable.add(this._toggleButtonCallback);
        } else {
            this.onPointerUpObservable.removeCallback(this._toggleButtonCallback);

            // Safety check, reset the button if it's toggled on but no longer a toggle button
            if (this._toggleState) {
                this._onToggle(false);
            }
        }
    }
    public get isToggleButton() {
        return this._isToggleButton;
    }

    /**
     * A public entrypoint to set the toggle state of the TouchHolographicButton. Only works if 'isToggleButton' is true
     * @param newState The new state to set the TouchHolographicButton's toggle state to
     */
    public set isToggled(newState: boolean) {
        if (this._isToggleButton && this._toggleState !== newState) {
            this._onToggle(newState);
        }
    }
    public get isToggled() {
        return this._toggleState;
    }

    protected _onToggle(newState: boolean) {
        this._toggleState = newState;
        this.onToggleObservable.notifyObservers(newState);
    }

    // Returns true if the collidable is in front of the button, or if the button has no front direction
    private _isInteractionInFrontOfButton(collidablePos: Vector3) {
        return this._getInteractionHeight(collidablePos, this._collisionMesh.getAbsolutePosition()) > 0;
    }

    /**
     * Get the height of the touchPoint from the collidable part of the button
     * @param touchPoint the point to compare to the button, in absolute position
     * @returns the depth of the touch point into the front of the button
     */
    public getPressDepth(touchPoint: Vector3) {
        if (!this._isNearPressed) {
            return 0;
        }
        const interactionHeight = this._getInteractionHeight(touchPoint, this._collisionMesh.getAbsolutePosition());
        return this._interactionSurfaceHeight - interactionHeight;
    }

    // Returns true if the collidable is in front of the button, or if the button has no front direction
    protected _getInteractionHeight(interactionPos: Vector3, basePos: Vector3) {
        const frontDir = this.collidableFrontDirection;
        if (frontDir.length() === 0) {
            // The button has no front, just return the distance to the base
            return Vector3.Distance(interactionPos, basePos);
        }
        const d = Vector3.Dot(basePos, frontDir);
        const abc = Vector3.Dot(interactionPos, frontDir);

        return abc - d;
    }

    /**
     * @internal
     */
    public _generatePointerEventType(providedType: number, nearMeshPosition: Vector3, activeInteractionCount: number): number {
        if (providedType === PointerEventTypes.POINTERDOWN || providedType === PointerEventTypes.POINTERMOVE) {
            if (!this._isInteractionInFrontOfButton(nearMeshPosition)) {
                // Near interaction mesh is behind the button, don't send a pointer down
                return PointerEventTypes.POINTERMOVE;
            } else {
                this._isNearPressed = true;
                this._interactionSurfaceHeight = this._getInteractionHeight(nearMeshPosition, this._collisionMesh.getAbsolutePosition());
            }
        }
        if (providedType === PointerEventTypes.POINTERUP) {
            if (activeInteractionCount == 0) {
                // We get the release for the down we swallowed earlier, swallow as well
                return PointerEventTypes.POINTERMOVE;
            } else {
                this._isNearPressed = false;
            }
        }

        return providedType;
    }

    protected override _getTypeName(): string {
        return "TouchButton3D";
    }

    // Mesh association
    protected override _createNode(scene: Scene): TransformNode {
        return super._createNode(scene);
    }

    /**
     * Releases all associated resources
     */
    public override dispose() {
        super.dispose();

        // Clean up toggle observables
        this.onPointerUpObservable.removeCallback(this._toggleButtonCallback);
        this.onToggleObservable.clear();

        if (this._collisionMesh) {
            this._collisionMesh.dispose();
        }
    }
}
