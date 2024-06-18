import type { Effect, IEffectCreationOptions } from "core/Materials/effect";
import type { ThinEngine } from "core/Engines/thinEngine";
import type { Buffer } from "core/Meshes/buffer";
import type { Engine } from "core/Engines/engine";
import { Constants } from "core/Engines/constants";
import { RegisterClass } from "core/Misc/typeStore";
import type { Nullable } from "core/types";

import "../../Shaders/gpuTransform.vertex";
import "../../Shaders/gpuTransform.fragment";

/** @internal */
export class WebGL2BoundingHelper {
    private _engine: Nullable<ThinEngine>;
    private _computeEffect: Nullable<Effect>;
    private _computeEffectOptions: IEffectCreationOptions;

    /**
     * Creates a new WebGL2BoundingHelper
     * @param engine defines the engine to use
     */
    constructor(engine: ThinEngine) {
        this._engine = engine;

        this._computeEffectOptions = {
            attributes: ["position"],
            uniformsNames: [],
            uniformBuffersNames: [],
            samplers: [],
            defines: "",
            fallbacks: null,
            onCompiled: null,
            onError: null,
            indexParameters: null,
            maxSimultaneousLights: 0,
            transformFeedbackVaryings: [],
        };
    }

    /** @internal */
    public createUpdateEffect(attributes: string[], defines: string, uniforms: string[], samplers: string[], numInfluencers: number): Effect {
        this._computeEffectOptions.transformFeedbackVaryings = ["outPosition"];

        this._computeEffectOptions.attributes = attributes;
        this._computeEffectOptions.defines = defines;
        this._computeEffectOptions.uniformsNames = uniforms;
        this._computeEffectOptions.samplers = samplers;
        this._computeEffectOptions.indexParameters = { maxSimultaneousMorphTargets: numInfluencers };
        this._computeEffect = this._engine!.createEffect("gpuTransform", this._computeEffectOptions, this._engine!);

        return this._computeEffect;
    }

    /** @internal */
    public updateBuffer(count: number, targetBuffer: Buffer): void {
        const engine = this._engine as Engine;

        // Update
        engine.bindTransformFeedbackBuffer(targetBuffer.getBuffer());
        engine.setRasterizerState(false);
        engine.beginTransformFeedback(true);
        engine.drawArraysType(Constants.MATERIAL_PointFillMode, 0, count);
        engine.endTransformFeedback();
        engine.setRasterizerState(true);
        engine.readTransformFeedbackBuffer(targetBuffer.getData()! as ArrayBufferView);
        engine.bindTransformFeedbackBuffer(null);
    }

    /** @internal */
    public dispose(): void {
        if (this._computeEffect) {
            this._computeEffect.dispose();
        }
        this._computeEffect = null;
        this._engine = null;
    }
}

RegisterClass("BABYLON.WebGL2BoundingHelper", WebGL2BoundingHelper);
