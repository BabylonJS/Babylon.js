import { TransformNode } from "../../Meshes/transformNode";
import { Nullable } from "../../types";
import { WebXRFeatureName } from "../../XR/webXRFeaturesManager";
import { WebXRHandTracking } from "../../XR/features/WebXRHandTracking";
import { WebXRExperienceHelper } from "../../XR/webXRExperienceHelper";
import { Behavior } from "../behavior";

export class HandConstraintBehavior implements Behavior<TransformNode> {
    private _xr: Nullable<WebXRExperienceHelper>;
    private _handTracking: WebXRHandTracking;

    /** gets or sets behavior's name */
    public get name() {
        return "HandConstraint";
    }

    /**
     * Initializes the hand constraint behavior
     */
    public init() {}

    /**
     * Attaches the hand constraint to a `TransformNode`
     * @param target defines the target where the behavior is attached to
     */
    public attach(node: TransformNode): void {}

    /**
     * Detaches the behavior from the `TransformNode`
     */
    public detach(): void {}

    public linkToXRExperience(xr: WebXRExperienceHelper) {
        this._xr = xr;
        this._handTracking = xr.featuresManager.getEnabledFeature(WebXRFeatureName.HAND_TRACKING) as WebXRHandTracking;
        // const hand = this._handTracking.getHandByControllerId("1");
        // hand?.handMesh?.position
        console.log(this._handTracking);
    }
}
