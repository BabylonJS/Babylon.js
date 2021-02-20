import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
import { Mesh } from "babylonjs/Meshes/mesh";
import { Observable } from "babylonjs/Misc/observable";
import { Scene } from "babylonjs/scene";
import { TransformNode } from "babylonjs/Meshes/transformNode";
import { Vector3 } from "babylonjs/Maths/math.vector";
import { Vector3WithInfo } from "../vector3WithInfo";

import { TouchButton3D, ButtonState } from "./touchButton3D";

export class TouchToggleButton3D extends TouchButton3D {
    private _isPressed = false;

    /** Callback used to start toggle on animation */
    public toggleOnAnimation: () => void;
    /** Callback used to start toggle off animation */
    public toggleOffAnimation: () => void;

    /**
     * An event triggered when the button is toggled on
     */
    public onToggleOnObservable = new Observable<Vector3WithInfo>();

    /**
     * An event triggered when the button is toggled off
     */
    public onToggleOffObservable = new Observable<Vector3WithInfo>();

    /**
     * Creates a new button
     * @param name defines the control name
     * @param collisionMesh defines the mesh to track near interactions with
     */
    constructor(name?: string, collisionMesh?: Mesh) {
        super(name, collisionMesh);
    }

    protected _firePointerEvents(newButtonState: ButtonState, previousButtonState: ButtonState, pointOnButton: Vector3) {
        super._firePointerEvents(newButtonState, previousButtonState, pointOnButton);

        // Remove the chance for strangeness by firing whenever we transition away from a press
        if (previousButtonState == ButtonState.Press && newButtonState != ButtonState.Press) {
            this._onToggle(new Vector3WithInfo(pointOnButton, 0));
        }
    }

    private _onToggle(position: Vector3WithInfo) {
        this._isPressed = !this._isPressed;

        if (this._isPressed) {
            this.onToggleOnObservable.notifyObservers(position);
            if (this.toggleOnAnimation) {
                this.toggleOnAnimation();
            }
        }
        else {
            this.onToggleOffObservable.notifyObservers(position);
            if (this.toggleOffAnimation) {
                this.toggleOffAnimation();
            }
        }
    }

    protected _getTypeName(): string {
        return "TouchToggleButton3D";
    }

    // Mesh association
    protected _createNode(scene: Scene): TransformNode {
        return super._createNode(scene);
    }

    protected _affectMaterial(mesh: AbstractMesh) {
        super._affectMaterial(mesh);
    }
}