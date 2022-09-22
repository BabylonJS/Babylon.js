import type { IPipelineContext } from "../IPipelineContext";
import type { Nullable } from "../../types";
import type { Effect } from "../../Materials/effect";
import type { IMatrixLike, IVector2Like, IVector3Like, IVector4Like, IColor3Like, IColor4Like, IQuaternionLike } from "../../Maths/math.like";
import type { ThinEngine } from "../thinEngine";

const floatNCache: string[] = [
    "Int2",
    "Int",
    "Int3",
    "Int4",
    "Vector2",
    "Vector3",
    "Vector4",
    "Float2",
    "Float",
    "Float3",
    "Float4",
    "Quaternion",
    "Color3",
    "Color4",
    "DirectColor4",
];

/** @internal */
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

    constructor() {
        const args: any[] = [];
        const prepareArray = function (this: WebGLPipelineContext) {
            args.length = 0;
            Array.prototype.push.apply(args, arguments);
            args[0] = this._uniforms[args[0]];
        };
        const proxyFunction: (functionName: string) => ((/*uniformName: string, ...payload: any[]*/) => void) | undefined = (functionName: string) => {
            const cacheFunction = floatNCache.includes(functionName.substring(3)) && "FloatN";
            if (cacheFunction) {
                const cacheFunc = this[`_cache${cacheFunction}` as Partial<keyof WebGLPipelineContext>];
                return function (this: WebGLPipelineContext /*uniformName: string, ...payload: any[]*/) {
                    const func = this.engine[functionName as keyof ThinEngine];
                    prepareArray.apply(this, arguments);
                    if ((cacheFunc as Function).apply(this, arguments)) {
                        if (!func.apply(this.engine, args)) {
                            this._valueCache[arguments[0]] = null;
                        }
                    }
                };
            } else {
                return function (this: WebGLPipelineContext /*uniformName: string, ...payload: any[]*/) {
                    const func = this.engine[functionName as keyof ThinEngine];
                    prepareArray.apply(this, arguments);
                    if (arguments[1] !== undefined) {
                        this._valueCache[arguments[0]] = null;
                        func.apply(this.engine, args);
                    }
                };
            }
        };
        ["Int?", "IntArray?", "Array?", "Float?", "Matrices", "Matrix3x3", "Matrix2x2"].forEach((functionName) => {
            const name = `set${functionName}`;
            if (this[name as keyof this]) {
                return;
            }
            if (name.endsWith("?")) {
                ["", 2, 3, 4].forEach((n) => {
                    this[(name.slice(0, -1) + n) as keyof this] = this[(name.slice(0, -1) + n) as keyof this] || proxyFunction(name.slice(0, -1) + n)!.bind(this);
                });
            } else {
                this[name as keyof this] = this[name as keyof this] || proxyFunction(name)!.bind(this);
            }
        });
    }

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
        const engine = this.engine;
        if (engine.supportsUniformBuffers) {
            for (const name in uniformBuffersNames) {
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

        for (const attr of engine.getAttributes(this, attributesNames)) {
            attributes.push(attr);
        }
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
    public _cacheFloatN(_uniformName: string, _x: number, _y?: number, _z?: number, _w?: number): boolean {
        /**
         * arguments will be used to abstract the cache function.
         * arguments[0] is the uniform name. the rest are numbers.
         */
        let cache: number[] = this._valueCache[arguments[0]];
        if (!cache || cache.length !== arguments.length - 1) {
            cache = Array.prototype.slice.call(arguments, 1);
            this._valueCache[arguments[0]] = cache;
            return true;
        }

        let changed = false;
        for (let i = 0; i < cache.length; ++i) {
            if (cache[i] !== arguments[i + 1]) {
                cache[i] = arguments[i + 1];
                changed = true;
            }
        }
        return changed;
    }

    /**
     * @internal
     */
    public _cacheFloat2(uniformName: string, x: number, y: number): boolean {
        return this._cacheFloatN(uniformName, x, y);
    }

    /**
     * @internal
     */
    public _cacheFloat3(uniformName: string, x: number, y: number, z: number): boolean {
        return this._cacheFloatN(uniformName, x, y, z);
    }

    /**
     * @internal
     */
    public _cacheFloat4(uniformName: string, x: number, y: number, z: number, w: number): boolean {
        return this._cacheFloatN(uniformName, x, y, z, w);
    }

    /**
     * Sets an integer value on a uniform variable.
     * @param uniformName Name of the variable.
     * @param value Value to be set.
     */
    public setInt: (uniformName: string, value: number) => void;

    /**
     * Sets a int2 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First int in int2.
     * @param y Second int in int2.
     */
    public setInt2: (uniformName: string, x: number, y: number) => void;

    /**
     * Sets a int3 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First int in int3.
     * @param y Second int in int3.
     * @param z Third int in int3.
     */
    public setInt3: (uniformName: string, x: number, y: number, z: number) => void;

    /**
     * Sets a int4 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First int in int4.
     * @param y Second int in int4.
     * @param z Third int in int4.
     * @param w Fourth int in int4.
     */
    public setInt4: (uniformName: string, x: number, y: number, z: number, w: number) => void;

    /**
     * Sets an int array on a uniform variable.
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    public setIntArray: (uniformName: string, array: Int32Array) => void;

    /**
     * Sets an int array 2 on a uniform variable. (Array is specified as single array eg. [1,2,3,4] will result in [[1,2],[3,4]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    public setIntArray2: (uniformName: string, array: Int32Array) => void;

    /**
     * Sets an int array 3 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6] will result in [[1,2,3],[4,5,6]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    public setIntArray3: (uniformName: string, array: Int32Array) => void;

    /**
     * Sets an int array 4 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6,7,8] will result in [[1,2,3,4],[5,6,7,8]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    public setIntArray4: (uniformName: string, array: Int32Array) => void;

    /**
     * Sets an array on a uniform variable.
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    public setArray: (uniformName: string, array: number[]) => void;

    /**
     * Sets an array 2 on a uniform variable. (Array is specified as single array eg. [1,2,3,4] will result in [[1,2],[3,4]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    public setArray2: (uniformName: string, array: number[]) => void;

    /**
     * Sets an array 3 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6] will result in [[1,2,3],[4,5,6]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     * @returns this effect.
     */
    public setArray3: (uniformName: string, array: number[]) => void;

    /**
     * Sets an array 4 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6,7,8] will result in [[1,2,3,4],[5,6,7,8]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    public setArray4: (uniformName: string, array: number[]) => void;

    /**
     * Sets matrices on a uniform variable.
     * @param uniformName Name of the variable.
     * @param matrices matrices to be set.
     */
    public setMatrices: (uniformName: string, matrices: Float32Array) => void;

    /**
     * Sets matrix on a uniform variable.
     * @param uniformName Name of the variable.
     * @param matrix matrix to be set.
     */
    public setMatrix(uniformName: string, matrix: IMatrixLike): void {
        if (this._cacheMatrix(uniformName, matrix)) {
            if (!this.engine.setMatrices(this._uniforms[uniformName], matrix.toArray() as Float32Array)) {
                this._valueCache[uniformName] = null;
            }
        }
    }

    /**
     * Sets a 3x3 matrix on a uniform variable. (Specified as [1,2,3,4,5,6,7,8,9] will result in [1,2,3][4,5,6][7,8,9] matrix)
     * @param uniformName Name of the variable.
     * @param matrix matrix to be set.
     */
    public setMatrix3x3: (uniformName: string, matrix: Float32Array) => void;

    /**
     * Sets a 2x2 matrix on a uniform variable. (Specified as [1,2,3,4] will result in [1,2][3,4] matrix)
     * @param uniformName Name of the variable.
     * @param matrix matrix to be set.
     */
    public setMatrix2x2: (uniformName: string, matrix: Float32Array) => void;

    /**
     * Sets a float on a uniform variable.
     * @param uniformName Name of the variable.
     * @param value value to be set.
     * @returns this effect.
     */
    public setFloat: (uniformName: string, value: number) => void;

    /**
     * Sets a Vector2 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param vector2 vector2 to be set.
     */
    public setVector2(uniformName: string, vector2: IVector2Like): void {
        this.setFloat2(uniformName, vector2.x, vector2.y);
    }

    /**
     * Sets a float2 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First float in float2.
     * @param y Second float in float2.
     */
    public setFloat2: (uniformName: string, x: number, y: number) => void;

    /**
     * Sets a Vector3 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param vector3 Value to be set.
     */
    public setVector3(uniformName: string, vector3: IVector3Like): void {
        this.setFloat3(uniformName, vector3.x, vector3.y, vector3.z);
    }

    /**
     * Sets a float3 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First float in float3.
     * @param y Second float in float3.
     * @param z Third float in float3.
     */
    public setFloat3: (uniformName: string, x: number, y: number, z: number) => void;

    /**
     * Sets a Vector4 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param vector4 Value to be set.
     */
    public setVector4(uniformName: string, vector4: IVector4Like): void {
        this.setFloat4(uniformName, vector4.x, vector4.y, vector4.z, vector4.w);
    }

    /**
     * Sets a Quaternion on a uniform variable.
     * @param uniformName Name of the variable.
     * @param quaternion Value to be set.
     */
    public setQuaternion(uniformName: string, quaternion: IQuaternionLike): void {
        this.setFloat4(uniformName, quaternion.x, quaternion.y, quaternion.z, quaternion.w);
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
    public setFloat4: (uniformName: string, x: number, y: number, z: number, w: number) => void;

    /**
     * Sets a Color3 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param color3 Value to be set.
     */
    public setColor3(uniformName: string, color3: IColor3Like): void {
        this.setFloat3(uniformName, color3.r, color3.g, color3.b);
    }

    /**
     * Sets a Color4 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param color3 Value to be set.
     * @param alpha Alpha value to be set.
     */
    public setColor4(uniformName: string, color3: IColor3Like, alpha: number): void {
        this.setFloat4(uniformName, color3.r, color3.g, color3.b, alpha);
    }

    /**
     * Sets a Color4 on a uniform variable
     * @param uniformName defines the name of the variable
     * @param color4 defines the value to be set
     */
    public setDirectColor4(uniformName: string, color4: IColor4Like): void {
        this.setFloat4(uniformName, color4.r, color4.g, color4.b, color4.a);
    }

    public _getVertexShaderCode(): string | null {
        return this.vertexShader ? this.engine._getShaderSource(this.vertexShader) : null;
    }

    public _getFragmentShaderCode(): string | null {
        return this.fragmentShader ? this.engine._getShaderSource(this.fragmentShader) : null;
    }
}
