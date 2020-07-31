import { IPipelineContext } from '../IPipelineContext';
import { Nullable } from '../../types';
import { Effect } from '../../Materials/effect';
import { IMatrixLike, IVector2Like, IVector3Like, IVector4Like, IColor3Like, IColor4Like } from '../../Maths/math.like';
import { ThinEngine } from "../thinEngine";

/** @hidden */
export class WebGLPipelineContext implements IPipelineContext {
    private _valueCache: { [key: string]: any } = {};
    private _uniforms: { [key: string]: Nullable<WebGLUniformLocation> };

    public engine: ThinEngine;
    public program: Nullable<WebGLProgram>;
    public context?: WebGLRenderingContext;
    public vertexShader?: WebGLShader;
    public fragmentShader?: WebGLShader;
    public isParallelCompiled: boolean;
    public onCompiled?: () => void;
    public transformFeedback?: WebGLTransformFeedback | null;

    public vertexCompilationError: Nullable<string> = null;
    public fragmentCompilationError: Nullable<string> = null;
    public programLinkError: Nullable<string> = null;
    public programValidationError: Nullable<string> = null;

    public get isAsync() {
        return this.isParallelCompiled;
    }

    public get isReady(): boolean {
        if (this.program) {
            if (this.isParallelCompiled) {
                return this.engine._isRenderingStateCompiled(this);
            }
            return true;
        }

        return false;
    }

    public _handlesSpectorRebuildCallback(onCompiled: (program: WebGLProgram) => void): void {
        if (onCompiled && this.program) {
            onCompiled(this.program);
        }
    }

    public _fillEffectInformation(effect: Effect, uniformBuffersNames: { [key: string]: number }, uniformsNames: string[], uniforms: { [key: string]: Nullable<WebGLUniformLocation> }, samplerList: string[], samplers: { [key: string]: number }, attributesNames: string[], attributes: number[]) {
        const engine = this.engine;
        if (engine.supportsUniformBuffers) {
            for (var name in uniformBuffersNames) {
                effect.bindUniformBlock(name, uniformBuffersNames[name]);
            }
        }

        const effectAvailableUniforms = this.engine.getUniforms(this, uniformsNames);
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

        for (let attr of engine.getAttributes(this, attributesNames)) {
            attributes.push(attr);
        }
    }

    /**
     * Release all associated resources.
     **/
    public dispose() {
        this._uniforms = { };
    }

    /** @hidden */
    public _cacheMatrix(uniformName: string, matrix: IMatrixLike): boolean {
        var cache = this._valueCache[uniformName];
        var flag = matrix.updateFlag;
        if (cache !== undefined && cache === flag) {
            return false;
        }

        this._valueCache[uniformName] = flag;

        return true;
    }

    /** @hidden */
    public _cacheFloat2(uniformName: string, x: number, y: number): boolean {
        var cache = this._valueCache[uniformName];
        if (!cache || cache.length !== 2) {
            cache = [x, y];
            this._valueCache[uniformName] = cache;
            return true;
        }

        var changed = false;
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

    /** @hidden */
    public _cacheFloat3(uniformName: string, x: number, y: number, z: number): boolean {
        var cache = this._valueCache[uniformName];
        if (!cache || cache.length !== 3) {
            cache = [x, y, z];
            this._valueCache[uniformName] = cache;
            return true;
        }

        var changed = false;
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

    /** @hidden */
    public _cacheFloat4(uniformName: string, x: number, y: number, z: number, w: number): boolean {
        var cache = this._valueCache[uniformName];
        if (!cache || cache.length !== 4) {
            cache = [x, y, z, w];
            this._valueCache[uniformName] = cache;
            return true;
        }

        var changed = false;
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
     * Sets an interger value on a uniform variable.
     * @param uniformName Name of the variable.
     * @param value Value to be set.
     */
    public setInt(uniformName: string, value: number): void {
        var cache = this._valueCache[uniformName];
        if (cache !== undefined && cache === value) {
            return;
        }

        this._valueCache[uniformName] = value;

        this.engine.setInt(this._uniforms[uniformName], value);
    }

    /**
     * Sets an int array on a uniform variable.
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    public setIntArray(uniformName: string, array: Int32Array): void {
        this._valueCache[uniformName] = null;
        this.engine.setIntArray(this._uniforms[uniformName], array);
    }

    /**
     * Sets an int array 2 on a uniform variable. (Array is specified as single array eg. [1,2,3,4] will result in [[1,2],[3,4]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    public setIntArray2(uniformName: string, array: Int32Array): void {
        this._valueCache[uniformName] = null;
        this.engine.setIntArray2(this._uniforms[uniformName], array);
    }

    /**
     * Sets an int array 3 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6] will result in [[1,2,3],[4,5,6]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    public setIntArray3(uniformName: string, array: Int32Array): void {
        this._valueCache[uniformName] = null;
        this.engine.setIntArray3(this._uniforms[uniformName], array);
    }

    /**
     * Sets an int array 4 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6,7,8] will result in [[1,2,3,4],[5,6,7,8]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    public setIntArray4(uniformName: string, array: Int32Array): void {
        this._valueCache[uniformName] = null;
        this.engine.setIntArray4(this._uniforms[uniformName], array);
    }

    /**
     * Sets an array on a uniform variable.
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    public setArray(uniformName: string, array: number[]): void {
        this._valueCache[uniformName] = null;
        this.engine.setArray(this._uniforms[uniformName], array);
    }

    /**
     * Sets an array 2 on a uniform variable. (Array is specified as single array eg. [1,2,3,4] will result in [[1,2],[3,4]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    public setArray2(uniformName: string, array: number[]): void {
        this._valueCache[uniformName] = null;
        this.engine.setArray2(this._uniforms[uniformName], array);
    }

    /**
     * Sets an array 3 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6] will result in [[1,2,3],[4,5,6]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     * @returns this effect.
     */
    public setArray3(uniformName: string, array: number[]): void {
        this._valueCache[uniformName] = null;
        this.engine.setArray3(this._uniforms[uniformName], array);
    }

    /**
     * Sets an array 4 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6,7,8] will result in [[1,2,3,4],[5,6,7,8]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    public setArray4(uniformName: string, array: number[]): void {
        this._valueCache[uniformName] = null;
        this.engine.setArray4(this._uniforms[uniformName], array);
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
        this.engine.setMatrices(this._uniforms[uniformName], matrices);
    }

    /**
     * Sets matrix on a uniform variable.
     * @param uniformName Name of the variable.
     * @param matrix matrix to be set.
     */
    public setMatrix(uniformName: string, matrix: IMatrixLike): void {
        if (this._cacheMatrix(uniformName, matrix)) {
            this.engine.setMatrices(this._uniforms[uniformName], matrix.toArray() as Float32Array);
        }
    }

    /**
     * Sets a 3x3 matrix on a uniform variable. (Speicified as [1,2,3,4,5,6,7,8,9] will result in [1,2,3][4,5,6][7,8,9] matrix)
     * @param uniformName Name of the variable.
     * @param matrix matrix to be set.
     */
    public setMatrix3x3(uniformName: string, matrix: Float32Array): void {
        this._valueCache[uniformName] = null;
        this.engine.setMatrix3x3(this._uniforms[uniformName], matrix);
    }

    /**
     * Sets a 2x2 matrix on a uniform variable. (Speicified as [1,2,3,4] will result in [1,2][3,4] matrix)
     * @param uniformName Name of the variable.
     * @param matrix matrix to be set.
     */
    public setMatrix2x2(uniformName: string, matrix: Float32Array): void {
        this._valueCache[uniformName] = null;
        this.engine.setMatrix2x2(this._uniforms[uniformName], matrix);
    }

    /**
     * Sets a float on a uniform variable.
     * @param uniformName Name of the variable.
     * @param value value to be set.
     * @returns this effect.
     */
    public setFloat(uniformName: string, value: number): void {
        var cache = this._valueCache[uniformName];
        if (cache !== undefined && cache === value) {
            return;
        }

        this._valueCache[uniformName] = value;

        this.engine.setFloat(this._uniforms[uniformName], value);
    }

    /**
     * Sets a Vector2 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param vector2 vector2 to be set.
     */
    public setVector2(uniformName: string, vector2: IVector2Like): void {
        if (this._cacheFloat2(uniformName, vector2.x, vector2.y)) {
            this.engine.setFloat2(this._uniforms[uniformName], vector2.x, vector2.y);
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
            this.engine.setFloat2(this._uniforms[uniformName], x, y);
        }
    }

    /**
     * Sets a Vector3 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param vector3 Value to be set.
     */
    public setVector3(uniformName: string, vector3: IVector3Like): void {
        if (this._cacheFloat3(uniformName, vector3.x, vector3.y, vector3.z)) {
            this.engine.setFloat3(this._uniforms[uniformName], vector3.x, vector3.y, vector3.z);
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
            this.engine.setFloat3(this._uniforms[uniformName], x, y, z);
        }
    }

    /**
     * Sets a Vector4 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param vector4 Value to be set.
     */
    public setVector4(uniformName: string, vector4: IVector4Like): void {
        if (this._cacheFloat4(uniformName, vector4.x, vector4.y, vector4.z, vector4.w)) {
            this.engine.setFloat4(this._uniforms[uniformName], vector4.x, vector4.y, vector4.z, vector4.w);
        }
    }

    /**
     * Sets a float4 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First float in float4.
     * @param y Second float in float4.
     * @param z Third float in float4.
     * @param w Fourth float in float4.
     * @returns this effect.
     */
    public setFloat4(uniformName: string, x: number, y: number, z: number, w: number): void {
        if (this._cacheFloat4(uniformName, x, y, z, w)) {
            this.engine.setFloat4(this._uniforms[uniformName], x, y, z, w);
        }
    }

    /**
     * Sets a Color3 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param color3 Value to be set.
     */
    public setColor3(uniformName: string, color3: IColor3Like): void {
        if (this._cacheFloat3(uniformName, color3.r, color3.g, color3.b)) {
            this.engine.setFloat3(this._uniforms[uniformName], color3.r, color3.g, color3.b);
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
            this.engine.setFloat4(this._uniforms[uniformName], color3.r, color3.g, color3.b, alpha);
        }
    }

    /**
     * Sets a Color4 on a uniform variable
     * @param uniformName defines the name of the variable
     * @param color4 defines the value to be set
     */
    public setDirectColor4(uniformName: string, color4: IColor4Like): void {
        if (this._cacheFloat4(uniformName, color4.r, color4.g, color4.b, color4.a)) {
            this.engine.setFloat4(this._uniforms[uniformName], color4.r, color4.g, color4.b, color4.a);
        }
    }

    public _getVertexShaderCode(): string | null {
        return this.vertexShader ? this.engine._getShaderSource(this.vertexShader) : null;
    }

    public _getFragmentShaderCode(): string | null {
        return this.fragmentShader ? this.engine._getShaderSource(this.fragmentShader) : null;
    }
}