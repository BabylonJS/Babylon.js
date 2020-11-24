import { Vector3 } from "babylonjs/Maths/math.vector";
import { Mesh } from "babylonjs/Meshes/mesh";
import { LinesMesh } from "babylonjs/Meshes/linesMesh";
import { TransformNode } from "babylonjs/Meshes/transformNode";
import { Scene } from "babylonjs/scene";

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
    protected _collidableFront: Vector3;

    /**
     * Creates a new button
     * @param collisionMesh mesh to track collisions with
     * @param name defines the control name
     */
    constructor(collisionMesh: Mesh, name?: string) {
        super(name);

        this._buttonState = ButtonState.None;
        this._collisionMesh = collisionMesh;
        this._collidableFront = collisionMesh.forward;
    }

    public set collidableFront(front: Vector3)
    {
        this._collidableFront = front;
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

                const dummyPosition = Vector3.Zero();
                const dummyPointerId = 0;
                const buttonIndex = 0; // Left click

                const touchDepth = 0.5;
                const hoverDepth = 0.8;
                const flickerDelta = 0.05; // A delta to avoid state flickering when on the threshold

                debugColour = Color3.Red();

                // Update button state and fire events
                switch(_this._buttonState)
                {
                    case ButtonState.None:
                        if (distance < hoverDepth - flickerDelta)
                        {
                            console.log("Now hovering");
                            _this._buttonState = ButtonState.Hover;
                            _this._onPointerEnter(_this);// call Control3D._processObservables instead?
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
                            _this._onPointerDown(_this, dummyPosition, dummyPointerId, buttonIndex);
                        }
                        else
                        {
                            _this._onPointerMove(_this, dummyPosition);
                        }

                        break;
                    case ButtonState.Press:
                        debugColour = Color3.Green();
                        if (distance > touchDepth + flickerDelta)
                        {
                            console.log("no longer pressing");
                            _this._buttonState = ButtonState.Hover;
                            _this._onPointerUp(_this, dummyPosition, dummyPointerId, buttonIndex, false /*notifyClick*/);
                        }
                        else
                        {
                            _this._onPointerMove(_this, dummyPosition);
                        }

                        break;
                }

                // Debug line mesh
                debugLineMesh.dispose();
                debugLineMesh = Mesh.CreateLines("debug_line", [
                    _this._collisionMesh.getAbsolutePosition(),
                    indexMesh.getAbsolutePosition()
                ], scene);
                debugLineMesh.color = debugColour;
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