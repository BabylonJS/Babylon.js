import { Constants } from "../../constants";
import { ThinWebGPUEngine } from "core/Engines/thinWebGPUEngine";
import { AbstractEngine } from "core/Engines/abstractEngine.pure";
/** This file must only contain pure code and pure imports */

let _registered = false;
export function registerEnginesWebGPUExtensionsEngineAlpha(): void {
    if (_registered) {
        return;
    }
    _registered = true;

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
}
