import { Nullable } from "babylonjs/types";
import { Vector3 } from "babylonjs/Maths/math.vector";
import { Mesh } from "babylonjs/Meshes/mesh";
import { LinesMesh } from "babylonjs/Meshes/linesMesh";
import { TransformNode } from "babylonjs/Meshes/transformNode";
import { Scene } from "babylonjs/scene";
import { Ray } from "babylonjs/Culling/ray";

import { Button3D } from "./button3D";
import { Color3 } from 'babylonjs/Maths/math.color';

/**
 * Enum for Button States
 */
export enum ButtonState {
    /** None */
    None = 0,
    /** Pointer Entered */
    Hover = 1,
    /** Pointer Down */
    Press = 2
}

/**
 * Class used to create a touchable button in 3D
 */
export class TouchButton3D extends Button3D {
    /** @hidden */
    protected _buttonState: ButtonState;
    protected _collisionMesh: Mesh;
    protected _collidableFrontDirection: Vector3;

    protected _drawDebugData = true;

    /**
     * Creates a new button
     * @param collisionMesh mesh to track collisions with
     * @param name defines the control name
     */
    constructor(collisionMesh: Mesh, name?: string) {
        super(name);

        this._buttonState = ButtonState.None;
        this._collisionMesh = collisionMesh;
        this._collidableFrontDirection = collisionMesh.forward;
    }

    // Returns whether the collidable is in front of the button,
    // as determined by this._collidableFrontDirection.
    private _getTouchPoint(collidable: Vector3, maxDist: number): Nullable<Vector3> {
        const frontToButton = this._collidableFrontDirection.negate();
        const collidableToButton = _this._collisionMesh.getAbsolutePosition() - collidable;

        const projectionScalar = collidableToButton.dot(frontToButton);
        if (projectionScalar <= 0)
        {
            // Collidable is behind the button
            return false;
        }

        const projection = projectionScalar * frontToButton;
        const rejection = collidableToButton - projection;

        const rejectionLength = rejection.length();

        // On a circular button, we can just check the rejectionLength
        // For all other buttons, we should do a proper collision check
        const ray = new Ray(collidable, frontToButton, maxDist);
        const pickingInfo = this._collisionMesh.intersects(ray);

        if (pickingInfo.hit && (pickingInfo.pickedMesh == this._collisionMesh))
        {
            return pickingInfo.pickedPoint;
        }

        return null;
    }

    public set collidableFront(front: Vector3)
    {
        this._collidableFrontDirection = front.normalize();
    }

    protected _getTypeName(): string {
        return "TouchButton3D";
    }

    protected _enableCollisions(scene: Scene) {
        var _this = this;
        var debugLineMesh: LinesMesh;
        var debugColour: Color3;
        scene.registerBeforeRender(function () {
            //Check for collision with haaaaand
            const indexTipMeshes = scene.getMeshesByTags("indexTip");
            indexTipMeshes.forEach(function (indexMesh: Mesh) {
                const distance = _this._collisionMesh.getAbsolutePosition().subtract(indexMesh.getAbsolutePosition()).length();
                console.log(distance);

                const dummyPointerId = 0;
                const buttonIndex = 0; // Left click

                const scale = 0.4;
                const touchDepth = scale * 0.5;
                const hoverDepth = scale * 0.8;

                // A delta to avoid state flickering when on the threshold
                const flickerDelta = scale * 0.05;

                const touchPoint = _getTouchPoint(indexMesh.getAbsolutePosition(), hoverDepth);

                if (touchPoint)
                {
                    debugColour = Color3.Red();

                    // Update button state and fire events
                    switch(_this._buttonState)
                    {
                        case ButtonState.None:
                            if (distance < hoverDepth - flickerDelta)
                            {
                                console.log("Now hovering");
                                _this._buttonState = ButtonState.Hover;
                                _this._onPointerEnter(_this);
                            }

                            break;
                        case ButtonState.Hover:
                            debugColour = Color3.Yellow();
                            if (distance > hoverDepth + flickerDelta)
                            {
                                console.log("Out of range");
                                _this._buttonState = ButtonState.None;
                                _this._onPointerOut(_this);
                            }
                            else if (distance < touchDepth - flickerDelta)
                            {
                                console.log("now pressing");
                                _this._buttonState = ButtonState.Press;
                                _this._onPointerDown(_this, touchPoint, dummyPointerId, buttonIndex);
                            }
                            else
                            {
                                _this._onPointerMove(_this, touchPoint);
                            }

                            break;
                        case ButtonState.Press:
                            debugColour = Color3.Green();
                            if (distance > touchDepth + flickerDelta)
                            {
                                console.log("no longer pressing");
                                _this._buttonState = ButtonState.Hover;
                                _this._onPointerUp(_this, touchPoint, dummyPointerId, buttonIndex, false /*notifyClick*/);
                            }
                            else
                            {
                                _this._onPointerMove(_this, touchPoint);
                            }

                            break;
                    }
                }

                if (_this._drawDebugData)
                {
                    // Debug line mesh
                    if (debugLineMesh)
                    {
                        // remove the previous line before drawing the new one
                        // Commented out as it causes memory crashes
                   //     debugLineMesh.dispose();
                    }
                    
                    // Draw a line from the button front to the button to the hand
                    debugLineMesh = Mesh.CreateLines("debug_line", [
                        _this._collisionMesh.getAbsolutePosition().add(_this._collidableFrontDirection).scale(scale),
                        _this._collisionMesh.getAbsolutePosition(),
                        indexMesh.getAbsolutePosition()
                    ], scene);
                    debugLineMesh.color = debugColour;
                }
                else if (debugLineMesh) {
                    debugLineMesh.dispose();
                }
            });
        });
    }

    // Mesh association
    protected _createNode(scene: Scene): TransformNode {
        this._enableCollisions(scene);

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