import { Vector3 } from "babylonjs/Maths/math.vector";
import { Mesh } from "babylonjs/Meshes/mesh";
import { TransformNode } from "babylonjs/Meshes/transformNode";
import { Scene } from "babylonjs/scene";

import { Button3D } from "./button3D";

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

    /**
     * Creates a new button
     * @param name defines the control name
     */
    constructor(collisionMesh: Mesh, name?: string) {
        super(name);

        this._buttonState = ButtonState.None;
        this._collisionMesh = collisionMesh;
    }

    protected _getTypeName(): string {
        return "TouchButton3D";
    }

    protected _enableCollisions(scene: Scene) {
        var _this = this;
        scene.registerBeforeRender(function () {
            //Check for collision with haaaaand
            const indexTipMeshes = scene.getMeshesByTags("indexTip");
            indexTipMeshes.forEach(function (indexMesh: Mesh) {
                const distance = _this._collisionMesh.getAbsolutePosition().subtract(indexMesh.getAbsolutePosition()).length();
                console.log(distance);

                // for some reason the absolute positions don't line up? I'll have to ask about that.

                const dummyPosition = Vector3.Zero();
                const dummyPointerId = 0;
                const dummyButtonIndex = 0;// left click;

                // Update button state and fire events
                switch(_this._buttonState)
                {
                    case ButtonState.None:
                        if (distance < 1)
                        {
                            console.log("Now hovering");
                            _this._buttonState = ButtonState.Hover;
                            _this._onPointerEnter(_this);// call Control3D._processObservables instead?
                        }

                        break;
                    case ButtonState.Hover:
                        if (distance > 1.1)
                        {
                            console.log("Out of range");
                            _this._buttonState = ButtonState.None;
                            _this._onPointerOut(_this);
                        }
                        else if (distance < 0.4)
                        {
                            console.log("now pressing");
                            _this._buttonState = ButtonState.Press;
                            _this._onPointerDown(_this, dummyPosition, dummyPointerId, dummyButtonIndex);
                        }
                        else
                        {
                            _this._onPointerMove(_this, dummyPosition);
                        }

                        break;
                    case ButtonState.Press:
                        if (distance > 0.5)
                        {
                            console.log("no longer pressing");
                            _this._buttonState = ButtonState.Hover;                            _this._onPointerUp(_this, dummyPosition, dummyPointerId, dummyButtonIndex, false /*notifyClick*/);
                        }
                        else
                        {
                            _this._onPointerMove(_this, dummyPosition);
                        }

                        break;
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