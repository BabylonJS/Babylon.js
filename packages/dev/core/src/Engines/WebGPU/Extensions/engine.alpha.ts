import { AbstractEngine } from "core/Engines/abstractEngine";
import { Constants } from "../../constants";

import "../../AbstractEngine/abstractEngine.alpha";
import { ThinWebGPUEngine } from "core/Engines/thinWebGPUEngine";

declare module "../../abstractEngine" {
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

ThinWebGPUEngine.prototype.setAlphaMode = function (mode: number, noDepthWriteChange: boolean = false, targetIndex: number = 0): void {
    const alphaBlend = this._alphaState._alphaBlend[targetIndex];

    if (this._alphaMode[targetIndex] === mode && ((mode === Constants.ALPHA_DISABLE && !alphaBlend) || (mode !== Constants.ALPHA_DISABLE && alphaBlend))) {
        if (!noDepthWriteChange) {
            // Make sure we still have the correct depth mask according to the alpha mode (a transparent material could have forced writting to the depth buffer, for instance)
            const depthMask = mode === Constants.ALPHA_DISABLE;
            if (this.depthCullingState.depthMask !== depthMask) {
                this.setDepthWrite(depthMask);
                this._cacheRenderPipeline.setDepthWriteEnabled(depthMask);
            }
        }
        return;
    }

    const alphaBlendDisabled = mode === Constants.ALPHA_DISABLE;

    this._alphaState.setAlphaBlend(!alphaBlendDisabled, targetIndex);
    this._alphaState.setAlphaMode(mode, targetIndex);

    if (!noDepthWriteChange) {
        this.setDepthWrite(alphaBlendDisabled);
        this._cacheRenderPipeline.setDepthWriteEnabled(alphaBlendDisabled);
    }
    this._alphaMode[targetIndex] = mode;
    this._cacheRenderPipeline.setAlphaBlendEnabled(this._alphaState._alphaBlend, this._alphaState._numTargetEnabled);
    this._cacheRenderPipeline.setAlphaBlendFactors(this._alphaState._blendFunctionParameters, this._alphaState._blendEquationParameters);
};

ThinWebGPUEngine.prototype.setAlphaEquation = function (equation: number, targetIndex: number = 0): void {
    AbstractEngine.prototype.setAlphaEquation.call(this, equation, targetIndex);

    this._cacheRenderPipeline.setAlphaBlendFactors(this._alphaState._blendFunctionParameters, this._alphaState._blendEquationParameters);
};
