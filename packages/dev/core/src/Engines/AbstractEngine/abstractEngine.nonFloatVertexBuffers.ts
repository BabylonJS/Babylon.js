import type { Nullable } from "../../types";
import type { ShaderProcessingContext } from "../Processors/shaderProcessingOptions";
import type { Effect } from "../../Materials/effect";
import { AbstractEngine } from "../abstractEngine";
import { VertexBuffer } from "../../Meshes/buffer";

declare module "../../Engines/abstractEngine" {
    export interface AbstractEngine {
        /**
         * Checks whether some vertex buffers that should be of type float are of a different type (int, byte...).
         * If so, trigger a shader recompilation to give the shader processor the opportunity to update the code accordingly.
         * @param vertexBuffers List of vertex buffers to check
         * @param effect The effect (shaders) that should be recompiled if needed
         */
        checkNonFloatVertexBuffers(vertexBuffers: { [key: string]: Nullable<VertexBuffer> }, effect: Effect): void;
    }
}

const vertexBufferKindForNonFloatProcessing: { [kind: string]: boolean } = {
    [VertexBuffer.PositionKind]: true,
    [VertexBuffer.NormalKind]: true,
    [VertexBuffer.TangentKind]: true,
    [VertexBuffer.UVKind]: true,
    [VertexBuffer.UV2Kind]: true,
    [VertexBuffer.UV3Kind]: true,
    [VertexBuffer.UV4Kind]: true,
    [VertexBuffer.UV5Kind]: true,
    [VertexBuffer.UV6Kind]: true,
    [VertexBuffer.ColorKind]: true,
    [VertexBuffer.ColorInstanceKind]: true,
    [VertexBuffer.MatricesIndicesKind]: true,
    [VertexBuffer.MatricesWeightsKind]: true,
    [VertexBuffer.MatricesIndicesExtraKind]: true,
    [VertexBuffer.MatricesWeightsExtraKind]: true,
};

AbstractEngine.prototype.checkNonFloatVertexBuffers = function (vertexBuffers: { [key: string]: Nullable<VertexBuffer> }, effect: Effect): void {
    const pipelineContext = effect._pipelineContext;

    if (!pipelineContext?.vertexBufferKindToType) {
        return;
    }

    let shaderProcessingContext: Nullable<ShaderProcessingContext> = null;

    for (const kind in vertexBuffers) {
        const currentVertexBuffer = vertexBuffers[kind];

        if (!currentVertexBuffer || !vertexBufferKindForNonFloatProcessing[kind]) {
            continue;
        }

        const currentVertexBufferType = currentVertexBuffer.normalized ? VertexBuffer.FLOAT : currentVertexBuffer.type;
        const vertexBufferType = pipelineContext.vertexBufferKindToType[kind];

        if (
            (currentVertexBufferType !== VertexBuffer.FLOAT && vertexBufferType === undefined) ||
            (vertexBufferType !== undefined && vertexBufferType !== currentVertexBufferType)
        ) {
            if (!shaderProcessingContext) {
                shaderProcessingContext = this._getShaderProcessingContext(effect.shaderLanguage)!;
            }
            pipelineContext.vertexBufferKindToType[kind] = currentVertexBufferType;
            if (currentVertexBufferType !== VertexBuffer.FLOAT) {
                shaderProcessingContext.vertexBufferKindToNumberOfComponents![kind] = VertexBuffer.DeduceStride(kind);
                if (VertexBuffer.IsSignedType(currentVertexBufferType)) {
                    shaderProcessingContext.vertexBufferKindToNumberOfComponents![kind] *= -1;
                }
            }
        }
    }

    if (shaderProcessingContext) {
        // We temporarily disable parallel compilation of shaders because we want new shaders to be compiled after the _processShaderCode call, so that they are in effect for the rest of the frame.
        const parallelShaderCompile = this._caps.parallelShaderCompile;
        this._caps.parallelShaderCompile = undefined;

        effect._processShaderCode(null, this._features.checkNonFloatVertexBuffersDontRecreatePipelineContext, shaderProcessingContext);

        this._caps.parallelShaderCompile = parallelShaderCompile;
    }
};
