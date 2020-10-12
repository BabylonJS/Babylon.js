import { Nullable } from '../types';
import { Effect } from '../Materials/effect';
import { IMatrixLike, IVector2Like, IVector3Like, IVector4Like, IColor3Like, IColor4Like } from '../Maths/math.like';

/**
 * Class used to store and describe the pipeline context associated with an effect
 */
export interface IPipelineContext {
    /**
     * Gets a boolean indicating that this pipeline context is supporting asynchronous creating
     */
    isAsync: boolean;
    /**
     * Gets a boolean indicating that the context is ready to be used (like shaders / pipelines are compiled and ready for instance)
     */
    isReady: boolean;

    /** @hidden */
    _getVertexShaderCode(): string | null;

    /** @hidden */
    _getFragmentShaderCode(): string | null;

    /** @hidden */
    _handlesSpectorRebuildCallback(onCompiled: (compiledObject: any) => void): void;

    /** @hidden */
    _fillEffectInformation(effect: Effect, uniformBuffersNames: { [key: string]: number }, uniformsNames: string[], uniforms: { [key: string]: Nullable<WebGLUniformLocation> }, samplerList: string[], samplers: { [key: string]: number }, attributesNames: string[], attributes: number[]): void;

    /** Releases the resources associated with the pipeline. */
    dispose(): void;

    /**
     * Sets an interger value on a uniform variable.
     * @param uniformName Name of the variable.
     * @param value Value to be set.
     */
    setInt(uniformName: string, value: number): void;

    /**
     * Sets an int array on a uniform variable.
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    setIntArray(uniformName: string, array: Int32Array): void;

    /**
     * Sets an int array 2 on a uniform variable. (Array is specified as single array eg. [1,2,3,4] will result in [[1,2],[3,4]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    setIntArray2(uniformName: string, array: Int32Array): void;

    /**
     * Sets an int array 3 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6] will result in [[1,2,3],[4,5,6]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    setIntArray3(uniformName: string, array: Int32Array): void;

    /**
     * Sets an int array 4 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6,7,8] will result in [[1,2,3,4],[5,6,7,8]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    setIntArray4(uniformName: string, array: Int32Array): void;

    /**
     * Sets an array on a uniform variable.
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    setArray(uniformName: string, array: number[] | Float32Array): void;

    /**
     * Sets an array 2 on a uniform variable. (Array is specified as single array eg. [1,2,3,4] will result in [[1,2],[3,4]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    setArray2(uniformName: string, array: number[] | Float32Array): void;

    /**
     * Sets an array 3 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6] will result in [[1,2,3],[4,5,6]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    setArray3(uniformName: string, array: number[] | Float32Array): void;

    /**
     * Sets an array 4 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6,7,8] will result in [[1,2,3,4],[5,6,7,8]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    setArray4(uniformName: string, array: number[] | Float32Array): void;

    /**
     * Sets matrices on a uniform variable.
     * @param uniformName Name of the variable.
     * @param matrices matrices to be set.
     */
    setMatrices(uniformName: string, matrices: Float32Array): void;

    /**
     * Sets matrix on a uniform variable.
     * @param uniformName Name of the variable.
     * @param matrix matrix to be set.
     */
    setMatrix(uniformName: string, matrix: IMatrixLike): void;

    /**
     * Sets a 3x3 matrix on a uniform variable. (Speicified as [1,2,3,4,5,6,7,8,9] will result in [1,2,3][4,5,6][7,8,9] matrix)
     * @param uniformName Name of the variable.
     * @param matrix matrix to be set.
     */
    setMatrix3x3(uniformName: string, matrix: Float32Array): void;

    /**
     * Sets a 2x2 matrix on a uniform variable. (Speicified as [1,2,3,4] will result in [1,2][3,4] matrix)
     * @param uniformName Name of the variable.
     * @param matrix matrix to be set.
     */
    setMatrix2x2(uniformName: string, matrix: Float32Array): void;

    /**
     * Sets a float on a uniform variable.
     * @param uniformName Name of the variable.
     * @param value value to be set.
     */
    setFloat(uniformName: string, value: number): void;

    /**
     * Sets a Vector2 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param vector2 vector2 to be set.
     */
    setVector2(uniformName: string, vector2: IVector2Like): void;

    /**
     * Sets a float2 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First float in float2.
     * @param y Second float in float2.
     */
    setFloat2(uniformName: string, x: number, y: number): void;

    /**
     * Sets a Vector3 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param vector3 Value to be set.
     */
    setVector3(uniformName: string, vector3: IVector3Like): void;

    /**
     * Sets a float3 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First float in float3.
     * @param y Second float in float3.
     * @param z Third float in float3.
     */
    setFloat3(uniformName: string, x: number, y: number, z: number): void;

    /**
     * Sets a Vector4 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param vector4 Value to be set.
     */
    setVector4(uniformName: string, vector4: IVector4Like): void;

    /**
     * Sets a float4 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First float in float4.
     * @param y Second float in float4.
     * @param z Third float in float4.
     * @param w Fourth float in float4.
     */
    setFloat4(uniformName: string, x: number, y: number, z: number, w: number): void;

    /**
     * Sets a Color3 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param color3 Value to be set.
     */
    setColor3(uniformName: string, color3: IColor3Like): void;

    /**
     * Sets a Color4 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param color3 Value to be set.
     * @param alpha Alpha value to be set.
     */
    setColor4(uniformName: string, color3: IColor3Like, alpha: number): void;

    /**
     * Sets a Color4 on a uniform variable
     * @param uniformName defines the name of the variable
     * @param color4 defines the value to be set
     */
    setDirectColor4(uniformName: string, color4: IColor4Like): void;
}