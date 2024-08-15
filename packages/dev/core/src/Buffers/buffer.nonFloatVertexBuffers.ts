import type { Nullable } from "../types";
import type { ShaderProcessingContext } from "../Engines/Processors/shaderProcessingOptions";
import type { Effect } from "../Materials/effect";
import { VertexBuffer } from "../Meshes/buffer";

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

/**
 * Indicates if the type is a signed or unsigned type
 * @param type Type to check
 * @returns True if it is a signed type
 */
function isSignedType(type: number): boolean {
    switch (type) {
        case VertexBuffer.BYTE:
        case VertexBuffer.SHORT:
        case VertexBuffer.INT:
        case VertexBuffer.FLOAT:
            return true;
        case VertexBuffer.UNSIGNED_BYTE:
        case VertexBuffer.UNSIGNED_SHORT:
        case VertexBuffer.UNSIGNED_INT:
            return false;
        default:
            throw new Error(`Invalid type '${type}'`);
    }
}

/**
 * Checks whether some vertex buffers that should be of type float are of a different type (int, byte...).
 * If so, trigger a shader recompilation to give the shader processor the opportunity to update the code accordingly.
 * @param vertexBuffers List of vertex buffers to check
 * @param effect The effect (shaders) that should be recompiled if needed
 */
export function checkNonFloatVertexBuffers(vertexBuffers: { [key: string]: Nullable<VertexBuffer> }, effect: Effect): void {
    const engine = effect.getEngine();
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
                shaderProcessingContext = engine._getShaderProcessingContext(effect.shaderLanguage, false)!;
            }
            pipelineContext.vertexBufferKindToType[kind] = currentVertexBufferType;
            if (currentVertexBufferType !== VertexBuffer.FLOAT) {
                shaderProcessingContext.vertexBufferKindToNumberOfComponents![kind] = VertexBuffer.DeduceStride(kind);
                if (isSignedType(currentVertexBufferType)) {
                    shaderProcessingContext.vertexBufferKindToNumberOfComponents![kind] *= -1;
                }
            }
        }
    }

    if (shaderProcessingContext) {
        // We temporarily disable parallel compilation of shaders because we want new shaders to be compiled after the _processShaderCode call, so that they are in effect for the rest of the frame.
        // There is no additional call to async so the _processShaderCodeAsync will execute synchronously.
        const parallelShaderCompile = engine._caps.parallelShaderCompile;
        engine._caps.parallelShaderCompile = undefined;

        effect._processShaderCodeAsync(null, engine._features._checkNonFloatVertexBuffersDontRecreatePipelineContext, shaderProcessingContext);

        engine._caps.parallelShaderCompile = parallelShaderCompile;
    }
}
