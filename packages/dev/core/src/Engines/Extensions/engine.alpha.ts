import { ThinEngine } from "../../Engines/thinEngine";
import { Constants } from "../constants";

declare module "../abstractEngine" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractEngine {
        /**
         * Sets the current alpha mode
         * @param mode defines the mode to use (one of the Engine.ALPHA_XXX)
         * @param noDepthWriteChange defines if depth writing state should remains unchanged (false by default)
         * @param targetIndex defines the index of the target to set the alpha mode for (default is 0)
         * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/advanced/transparent_rendering
         */
        setAlphaMode(mode: number, noDepthWriteChange?: boolean, targetIndex?: number): void;
    }
}

ThinEngine.prototype.setAlphaMode = function (mode: number, noDepthWriteChange: boolean = false, targetIndex: number = 0): void {
    if (this._alphaMode[targetIndex] === mode) {
        if (!noDepthWriteChange) {
            // Make sure we still have the correct depth mask according to the alpha mode (a transparent material could have forced writting to the depth buffer, for instance)
            const depthMask = mode === Constants.ALPHA_DISABLE;
            if (this.depthCullingState.depthMask !== depthMask) {
                this.depthCullingState.depthMask = depthMask;
            }
        }
        return;
    }

    const alphaBlendDisabled = mode === Constants.ALPHA_DISABLE;

    this._alphaState.setAlphaBlend(!alphaBlendDisabled, targetIndex);
    this._alphaState.setAlphaMode(mode, targetIndex);

    if (!noDepthWriteChange) {
        this.depthCullingState.depthMask = alphaBlendDisabled;
    }
    this._alphaMode[targetIndex] = mode;
};
