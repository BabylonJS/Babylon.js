import { Scene } from "babylonjs/scene";
import { TransformNode } from "babylonjs/Meshes/transformNode";
import { Nullable } from "babylonjs/types";
import { Mesh } from "babylonjs/Meshes/mesh";
import { TouchHolographicMenu } from "./touchHolographicMenu";
import { HandConstraintBehavior } from "babylonjs/Behaviors/Meshes/handConstraintBehavior";
import { WebXRExperienceHelper } from "babylonjs/XR/webXRExperienceHelper";

/**
 * Hand menu that displays buttons and floats around the hand.
 * @since 5.0.0
 */
export class HandMenu extends TouchHolographicMenu {
    private _handConstraintBehavior: HandConstraintBehavior;

    /**
     * The hand constraint behavior setting the transformation of this node
     */
    public get handConstraintBehavior() {
        return this._handConstraintBehavior;
    }

    protected _createNode(scene: Scene): Nullable<TransformNode> {
        const node = super._createNode(scene)! as Mesh;

        this._handConstraintBehavior.attach(node);

        return node;
    }

    /**
     * Creates a hand menu GUI 3D control
     * @param xr the WebXRExperienceHelper used to link this control to the enabled WebXRHandTracking feature
     * @param name name of the hand menu
     */
    constructor(xr: WebXRExperienceHelper, name?: string) {
        super(name);

        this._handConstraintBehavior = new HandConstraintBehavior();
        this._handConstraintBehavior.linkToXRExperience(xr);
        this.backPlateMargin = 0.15;
        this.rows = 3;
    }

    /**
     * Disposes the hand menu
     */
    public dispose() {
        super.dispose();

        this._handConstraintBehavior.detach();
    }
}
