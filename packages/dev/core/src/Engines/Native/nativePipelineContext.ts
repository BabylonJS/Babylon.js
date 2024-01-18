import type { Nullable } from "../../types";
import type { Effect } from "../../Materials/effect";
import type { IMatrixLike, IVector2Like, IVector3Like, IVector4Like, IColor3Like, IColor4Like, IQuaternionLike } from "../../Maths/math.like";
import type { IPipelineContext } from "../IPipelineContext";
import type { NativeEngine } from "../nativeEngine";
import type { NativeProgram } from "./nativeInterfaces";

export class NativePipelineContext implements IPipelineContext {
    public isCompiled: boolean = false;
    public compilationError?: Error;

    public readonly isAsync: boolean;

    public program: NativeProgram;

    public get isReady(): boolean {
        if (this.compilationError) {
            const message = this.compilationError.message;
            throw new Error("SHADER ERROR" + (typeof message === "string" ? "\n" + message : ""));
        }
        return this.isCompiled;
    }

    public onCompiled?: () => void;

    public _getVertexShaderCode(): string | null {
        return null;
    }

    public _getFragmentShaderCode(): string | null {
        return null;
    }

    private _engine: NativeEngine;
    private _valueCache: { [key: string]: any } = {};
    private _uniforms: { [key: string]: Nullable<WebGLUniformLocation> };

    constructor(engine: NativeEngine, isAsync: boolean) {
        this._engine = engine;
        this.isAsync = isAsync;
    }

    public _fillEffectInformation(
        effect: Effect,
        uniformBuffersNames: { [key: string]: number },
        uniformsNames: string[],
        uniforms: { [key: string]: Nullable<WebGLUniformLocation> },
        samplerList: string[],
        samplers: { [key: string]: number },
        attributesNames: string[],
        attributes: number[]
    ) {
        const engine = this._engine;
        if (engine.supportsUniformBuffers) {
            for (const name in uniformBuffersNames) {
                effect.bindUniformBlock(name, uniformBuffersNames[name]);
            }
        }

        const effectAvailableUniforms = this._engine.getUniforms(this, uniformsNames);
        effectAvailableUniforms.forEach((uniform, index) => {
            uniforms[uniformsNames[index]] = uniform;
        });
        this._uniforms = uniforms;

        let index: number;
        for (index = 0; index < samplerList.length; index++) {
            const sampler = effect.getUniform(samplerList[index]);
            if (sampler == null) {
                samplerList.splice(index, 1);
                index--;
            }
        }

        samplerList.forEach((name, index) => {
            samplers[name] = index;
        });

        attributes.push(...engine.getAttributes(this, attributesNames));
    }

    /**
     * Release all associated resources.
     **/
    public dispose() {
        this._uniforms = {};
    }

    /**
     * @internal
     */
    public _cacheMatrix(uniformName: string, matrix: IMatrixLike): boolean {
        const cache = this._valueCache[uniformName];
        const flag = matrix.updateFlag;
        if (cache !== undefined && cache === flag) {
            return false;
        }

        this._valueCache[uniformName] = flag;

        return true;
    }

    /**
     * @internal
     */
    public _cacheFloat2(uniformName: string, x: number, y: number): boolean {
        let cache = this._valueCache[uniformName];
        if (!cache) {
            cache = [x, y];
            this._valueCache[uniformName] = cache;
            return true;
        }

        let changed = false;
        if (cache[0] !== x) {
            cache[0] = x;
            changed = true;
        }
        if (cache[1] !== y) {
            cache[1] = y;
            changed = true;
        }

        return changed;
    }

    /**
     * @internal
     */
    public _cacheFloat3(uniformName: string, x: number, y: number, z: number): boolean {
        let cache = this._valueCache[uniformName];
        if (!cache) {
            cache = [x, y, z];
            this._valueCache[uniformName] = cache;
            return true;
        }

        let changed = false;
        if (cache[0] !== x) {
            cache[0] = x;
            changed = true;
        }
        if (cache[1] !== y) {
            cache[1] = y;
            changed = true;
        }
        if (cache[2] !== z) {
            cache[2] = z;
            changed = true;
        }

        return changed;
    }

    /**
     * @internal
     */
    public _cacheFloat4(uniformName: string, x: number, y: number, z: number, w: number): boolean {
        let cache = this._valueCache[uniformName];
        if (!cache) {
            cache = [x, y, z, w];
            this._valueCache[uniformName] = cache;
            return true;
        }

        let changed = false;
        if (cache[0] !== x) {
            cache[0] = x;
            changed = true;
        }
        if (cache[1] !== y) {
            cache[1] = y;
            changed = true;
        }
        if (cache[2] !== z) {
            cache[2] = z;
            changed = true;
        }
        if (cache[3] !== w) {
            cache[3] = w;
            changed = true;
        }

        return changed;
    }

    /**
     * Sets an integer value on a uniform variable.
     * @param uniformName Name of the variable.
     * @param value Value to be set.
     */
    public setInt(uniformName: string, value: number): void {
        const cache = this._valueCache[uniformName];
        if (cache !== undefined && cache === value) {
            return;
        }

        if (this._engine.setInt(this._uniforms[uniformName]!, value)) {
            this._valueCache[uniformName] = value;
        }
    }

    /**
     * Sets a int2 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First int in int2.
     * @param y Second int in int2.
     */
    public setInt2(uniformName: string, x: number, y: number): void {
        if (this._cacheFloat2(uniformName, x, y)) {
            if (!this._engine.setInt2(this._uniforms[uniformName], x, y)) {
                this._valueCache[uniformName] = null;
            }
        }
    }

    /**
     * Sets a int3 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First int in int3.
     * @param y Second int in int3.
     * @param z Third int in int3.
     */
    public setInt3(uniformName: string, x: number, y: number, z: number): void {
        if (this._cacheFloat3(uniformName, x, y, z)) {
            if (!this._engine.setInt3(this._uniforms[uniformName], x, y, z)) {
                this._valueCache[uniformName] = null;
            }
        }
    }

    /**
     * Sets a int4 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First int in int4.
     * @param y Second int in int4.
     * @param z Third int in int4.
     * @param w Fourth int in int4.
     */
    public setInt4(uniformName: string, x: number, y: number, z: number, w: number): void {
        if (this._cacheFloat4(uniformName, x, y, z, w)) {
            if (!this._engine.setInt4(this._uniforms[uniformName], x, y, z, w)) {
                this._valueCache[uniformName] = null;
            }
        }
    }

    /**
     * Sets an int array on a uniform variable.
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    public setIntArray(uniformName: string, array: Int32Array): void {
        this._valueCache[uniformName] = null;
        this._engine.setIntArray(this._uniforms[uniformName]!, array);
    }

    /**
     * Sets an int array 2 on a uniform variable. (Array is specified as single array eg. [1,2,3,4] will result in [[1,2],[3,4]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    public setIntArray2(uniformName: string, array: Int32Array): void {
        this._valueCache[uniformName] = null;
        this._engine.setIntArray2(this._uniforms[uniformName]!, array);
    }

    /**
     * Sets an int array 3 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6] will result in [[1,2,3],[4,5,6]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    public setIntArray3(uniformName: string, array: Int32Array): void {
        this._valueCache[uniformName] = null;
        this._engine.setIntArray3(this._uniforms[uniformName]!, array);
    }

    /**
     * Sets an int array 4 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6,7,8] will result in [[1,2,3,4],[5,6,7,8]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    public setIntArray4(uniformName: string, array: Int32Array): void {
        this._valueCache[uniformName] = null;
        this._engine.setIntArray4(this._uniforms[uniformName]!, array);
    }

    /**
     * Sets an unsigned integer value on a uniform variable.
     * @param uniformName Name of the variable.
     * @param value Value to be set.
     */
    public setUInt(uniformName: string, value: number): void {
        const cache = this._valueCache[uniformName];
        if (cache !== undefined && cache === value) {
            return;
        }

        if (this._engine.setUInt(this._uniforms[uniformName]!, value)) {
            this._valueCache[uniformName] = value;
        }
    }

    /**
     * Sets a unsigned int2 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First unsigned int in uint2.
     * @param y Second unsigned int in uint2.
     */
    public setUInt2(uniformName: string, x: number, y: number): void {
        if (this._cacheFloat2(uniformName, x, y)) {
            if (!this._engine.setUInt2(this._uniforms[uniformName], x, y)) {
                this._valueCache[uniformName] = null;
            }
        }
    }

    /**
     * Sets a unsigned int3 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First unsigned int in uint3.
     * @param y Second unsigned int in uint3.
     * @param z Third unsigned int in uint3.
     */
    public setUInt3(uniformName: string, x: number, y: number, z: number): void {
        if (this._cacheFloat3(uniformName, x, y, z)) {
            if (!this._engine.setUInt3(this._uniforms[uniformName], x, y, z)) {
                this._valueCache[uniformName] = null;
            }
        }
    }

    /**
     * Sets a unsigned int4 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First unsigned int in uint4.
     * @param y Second unsigned int in uint4.
     * @param z Third unsigned int in uint4.
     * @param w Fourth unsigned int in uint4.
     */
    public setUInt4(uniformName: string, x: number, y: number, z: number, w: number): void {
        if (this._cacheFloat4(uniformName, x, y, z, w)) {
            if (!this._engine.setUInt4(this._uniforms[uniformName], x, y, z, w)) {
                this._valueCache[uniformName] = null;
            }
        }
    }

    /**
     * Sets an unsigned int array on a uniform variable.
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    public setUIntArray(uniformName: string, array: Uint32Array): void {
        this._valueCache[uniformName] = null;
        this._engine.setUIntArray(this._uniforms[uniformName]!, array);
    }

    /**
     * Sets an unsigned int array 2 on a uniform variable. (Array is specified as single array eg. [1,2,3,4] will result in [[1,2],[3,4]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    public setUIntArray2(uniformName: string, array: Uint32Array): void {
        this._valueCache[uniformName] = null;
        this._engine.setUIntArray2(this._uniforms[uniformName]!, array);
    }

    /**
     * Sets an unsigned int array 3 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6] will result in [[1,2,3],[4,5,6]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    public setUIntArray3(uniformName: string, array: Uint32Array): void {
        this._valueCache[uniformName] = null;
        this._engine.setUIntArray3(this._uniforms[uniformName]!, array);
    }

    /**
     * Sets an unsigned int array 4 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6,7,8] will result in [[1,2,3,4],[5,6,7,8]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    public setUIntArray4(uniformName: string, array: Uint32Array): void {
        this._valueCache[uniformName] = null;
        this._engine.setUIntArray4(this._uniforms[uniformName]!, array);
    }

    /**
     * Sets an float array on a uniform variable.
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    public setFloatArray(uniformName: string, array: Float32Array): void {
        this._valueCache[uniformName] = null;
        this._engine.setFloatArray(this._uniforms[uniformName]!, array);
    }

    /**
     * Sets an float array 2 on a uniform variable. (Array is specified as single array eg. [1,2,3,4] will result in [[1,2],[3,4]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    public setFloatArray2(uniformName: string, array: Float32Array): void {
        this._valueCache[uniformName] = null;
        this._engine.setFloatArray2(this._uniforms[uniformName]!, array);
    }

    /**
     * Sets an float array 3 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6] will result in [[1,2,3],[4,5,6]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    public setFloatArray3(uniformName: string, array: Float32Array): void {
        this._valueCache[uniformName] = null;
        this._engine.setFloatArray3(this._uniforms[uniformName]!, array);
    }

    /**
     * Sets an float array 4 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6,7,8] will result in [[1,2,3,4],[5,6,7,8]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    public setFloatArray4(uniformName: string, array: Float32Array): void {
        this._valueCache[uniformName] = null;
        this._engine.setFloatArray4(this._uniforms[uniformName]!, array);
    }

    /**
     * Sets an array on a uniform variable.
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    public setArray(uniformName: string, array: number[]): void {
        this._valueCache[uniformName] = null;
        this._engine.setArray(this._uniforms[uniformName]!, array);
    }

    /**
     * Sets an array 2 on a uniform variable. (Array is specified as single array eg. [1,2,3,4] will result in [[1,2],[3,4]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    public setArray2(uniformName: string, array: number[]): void {
        this._valueCache[uniformName] = null;
        this._engine.setArray2(this._uniforms[uniformName]!, array);
    }

    /**
     * Sets an array 3 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6] will result in [[1,2,3],[4,5,6]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    public setArray3(uniformName: string, array: number[]): void {
        this._valueCache[uniformName] = null;
        this._engine.setArray3(this._uniforms[uniformName]!, array);
    }

    /**
     * Sets an array 4 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6,7,8] will result in [[1,2,3,4],[5,6,7,8]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    public setArray4(uniformName: string, array: number[]): void {
        this._valueCache[uniformName] = null;
        this._engine.setArray4(this._uniforms[uniformName]!, array);
    }

    /**
     * Sets matrices on a uniform variable.
     * @param uniformName Name of the variable.
     * @param matrices matrices to be set.
     */
    public setMatrices(uniformName: string, matrices: Float32Array): void {
        if (!matrices) {
            return;
        }

        this._valueCache[uniformName] = null;
        this._engine.setMatrices(this._uniforms[uniformName]!, matrices);
    }

    /**
     * Sets matrix on a uniform variable.
     * @param uniformName Name of the variable.
     * @param matrix matrix to be set.
     */
    public setMatrix(uniformName: string, matrix: IMatrixLike): void {
        if (this._cacheMatrix(uniformName, matrix)) {
            if (!this._engine.setMatrices(this._uniforms[uniformName]!, matrix.toArray() as Float32Array)) {
                this._valueCache[uniformName] = null;
            }
        }
    }

    /**
     * Sets a 3x3 matrix on a uniform variable. (Specified as [1,2,3,4,5,6,7,8,9] will result in [1,2,3][4,5,6][7,8,9] matrix)
     * @param uniformName Name of the variable.
     * @param matrix matrix to be set.
     */
    public setMatrix3x3(uniformName: string, matrix: Float32Array): void {
        this._valueCache[uniformName] = null;
        this._engine.setMatrix3x3(this._uniforms[uniformName]!, matrix);
    }

    /**
     * Sets a 2x2 matrix on a uniform variable. (Specified as [1,2,3,4] will result in [1,2][3,4] matrix)
     * @param uniformName Name of the variable.
     * @param matrix matrix to be set.
     */
    public setMatrix2x2(uniformName: string, matrix: Float32Array): void {
        this._valueCache[uniformName] = null;
        this._engine.setMatrix2x2(this._uniforms[uniformName]!, matrix);
    }

    /**
     * Sets a float on a uniform variable.
     * @param uniformName Name of the variable.
     * @param value value to be set.
     */
    public setFloat(uniformName: string, value: number): void {
        const cache = this._valueCache[uniformName];
        if (cache !== undefined && cache === value) {
            return;
        }

        if (this._engine.setFloat(this._uniforms[uniformName]!, value)) {
            this._valueCache[uniformName] = value;
        }
    }

    /**
     * Sets a boolean on a uniform variable.
     * @param uniformName Name of the variable.
     * @param bool value to be set.
     */
    public setBool(uniformName: string, bool: boolean): void {
        const cache = this._valueCache[uniformName];
        if (cache !== undefined && cache === bool) {
            return;
        }

        if (this._engine.setInt(this._uniforms[uniformName]!, bool ? 1 : 0)) {
            this._valueCache[uniformName] = bool ? 1 : 0;
        }
    }

    /**
     * Sets a Vector2 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param vector2 vector2 to be set.
     */
    public setVector2(uniformName: string, vector2: IVector2Like): void {
        if (this._cacheFloat2(uniformName, vector2.x, vector2.y)) {
            if (!this._engine.setFloat2(this._uniforms[uniformName]!, vector2.x, vector2.y)) {
                this._valueCache[uniformName] = null;
            }
        }
    }

    /**
     * Sets a float2 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First float in float2.
     * @param y Second float in float2.
     */
    public setFloat2(uniformName: string, x: number, y: number): void {
        if (this._cacheFloat2(uniformName, x, y)) {
            if (!this._engine.setFloat2(this._uniforms[uniformName]!, x, y)) {
                this._valueCache[uniformName] = null;
            }
        }
    }

    /**
     * Sets a Vector3 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param vector3 Value to be set.
     */
    public setVector3(uniformName: string, vector3: IVector3Like): void {
        if (this._cacheFloat3(uniformName, vector3.x, vector3.y, vector3.z)) {
            if (!this._engine.setFloat3(this._uniforms[uniformName]!, vector3.x, vector3.y, vector3.z)) {
                this._valueCache[uniformName] = null;
            }
        }
    }

    /**
     * Sets a float3 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First float in float3.
     * @param y Second float in float3.
     * @param z Third float in float3.
     */
    public setFloat3(uniformName: string, x: number, y: number, z: number): void {
        if (this._cacheFloat3(uniformName, x, y, z)) {
            if (!this._engine.setFloat3(this._uniforms[uniformName]!, x, y, z)) {
                this._valueCache[uniformName] = null;
            }
        }
    }

    /**
     * Sets a Vector4 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param vector4 Value to be set.
     */
    public setVector4(uniformName: string, vector4: IVector4Like): void {
        if (this._cacheFloat4(uniformName, vector4.x, vector4.y, vector4.z, vector4.w)) {
            if (!this._engine.setFloat4(this._uniforms[uniformName]!, vector4.x, vector4.y, vector4.z, vector4.w)) {
                this._valueCache[uniformName] = null;
            }
        }
    }

    /**
     * Sets a Quaternion on a uniform variable.
     * @param uniformName Name of the variable.
     * @param quaternion Value to be set.
     */
    public setQuaternion(uniformName: string, quaternion: IQuaternionLike): void {
        if (this._cacheFloat4(uniformName, quaternion.x, quaternion.y, quaternion.z, quaternion.w)) {
            if (!this._engine.setFloat4(this._uniforms[uniformName]!, quaternion.x, quaternion.y, quaternion.z, quaternion.w)) {
                this._valueCache[uniformName] = null;
            }
        }
    }

    /**
     * Sets a float4 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First float in float4.
     * @param y Second float in float4.
     * @param z Third float in float4.
     * @param w Fourth float in float4.
     */
    public setFloat4(uniformName: string, x: number, y: number, z: number, w: number): void {
        if (this._cacheFloat4(uniformName, x, y, z, w)) {
            if (!this._engine.setFloat4(this._uniforms[uniformName]!, x, y, z, w)) {
                this._valueCache[uniformName] = null;
            }
        }
    }

    /**
     * Sets a Color3 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param color3 Value to be set.
     */
    public setColor3(uniformName: string, color3: IColor3Like): void {
        if (this._cacheFloat3(uniformName, color3.r, color3.g, color3.b)) {
            if (!this._engine.setFloat3(this._uniforms[uniformName]!, color3.r, color3.g, color3.b)) {
                this._valueCache[uniformName] = null;
            }
        }
    }

    /**
     * Sets a Color4 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param color3 Value to be set.
     * @param alpha Alpha value to be set.
     */
    public setColor4(uniformName: string, color3: IColor3Like, alpha: number): void {
        if (this._cacheFloat4(uniformName, color3.r, color3.g, color3.b, alpha)) {
            if (!this._engine.setFloat4(this._uniforms[uniformName]!, color3.r, color3.g, color3.b, alpha)) {
                this._valueCache[uniformName] = null;
            }
        }
    }

    /**
     * Sets a Color4 on a uniform variable
     * @param uniformName defines the name of the variable
     * @param color4 defines the value to be set
     */
    public setDirectColor4(uniformName: string, color4: IColor4Like): void {
        if (this._cacheFloat4(uniformName, color4.r, color4.g, color4.b, color4.a)) {
            if (!this._engine.setFloat4(this._uniforms[uniformName]!, color4.r, color4.g, color4.b, color4.a)) {
                this._valueCache[uniformName] = null;
            }
        }
    }
}
