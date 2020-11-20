import { TransformNode } from "babylonjs/Meshes/transformNode";
import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
import { Mesh } from "babylonjs/Meshes/mesh";
import { Vector3 } from "babylonjs/Maths/math.vector";
import { Scene } from "babylonjs/scene";

import { MeshButton3D } from "./meshButton3D";

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
 * Class used to create an interactable object. It's a 3D button using a mesh coming from the current scene
 */
export class TouchMeshButton3D extends MeshButton3D {
    /** @hidden */
    protected _currentMesh: Mesh;
    protected _buttonState: ButtonState;

    /**
     * Creates a new 3D button based on a mesh
     * @param mesh mesh to become a 3D button
     * @param name defines the control name
     */
    constructor(mesh: Mesh, name?: string) {
        super(mesh, name);
        this._currentMesh = mesh;
        this._buttonState = ButtonState.None;
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
            const indexTipMeshes = scene.getMeshesByTags("indexTip");
            indexTipMeshes.forEach(function (indexMesh: Mesh) {
                const distance = _this._currentMesh.getAbsolutePosition().subtract(indexMesh.getAbsolutePosition()).length();
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

        return this._currentMesh;
    }

    protected _affectMaterial(mesh: AbstractMesh) {
    }
}