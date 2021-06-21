import { Nullable, IndicesArray, DataArray } from "../types";
import { Engine } from "../Engines/engine";
import { VertexBuffer } from "../Buffers/buffer";
import { InternalTexture, InternalTextureSource } from "../Materials/Textures/internalTexture";
import { IInternalTextureLoader } from "../Materials/Textures/internalTextureLoader";
import { Texture } from "../Materials/Textures/texture";
import { BaseTexture } from "../Materials/Textures/baseTexture";
import { VideoTexture } from "../Materials/Textures/videoTexture";
import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import { Effect } from "../Materials/effect";
import { DataBuffer } from '../Buffers/dataBuffer';
import { Tools } from "../Misc/tools";
import { Observer } from "../Misc/observable";
import { EnvironmentTextureTools, EnvironmentTextureSpecularInfoV1 } from "../Misc/environmentTextureTools";
import { Scene } from "../scene";
import { RenderTargetCreationOptions } from "../Materials/Textures/renderTargetCreationOptions";
import { IPipelineContext } from './IPipelineContext';
import { IMatrixLike, IVector2Like, IVector3Like, IVector4Like, IColor3Like, IColor4Like, IViewportLike } from '../Maths/math.like';
import { Logger } from "../Misc/logger";
import { Constants } from './constants';
import { ThinEngine, ISceneLike } from './thinEngine';
import { IWebRequest } from '../Misc/interfaces/iWebRequest';
import { EngineStore } from './engineStore';
import { ShaderCodeInliner } from "./Processors/shaderCodeInliner";
import { RenderTargetTextureSize } from '../Engines/Extensions/engine.renderTarget';
import { WebGL2ShaderProcessor } from '../Engines/WebGL/webGL2ShaderProcessors';
import { DepthTextureCreationOptions } from '../Engines/depthTextureCreationOptions';
import { IMaterialContext } from "./IMaterialContext";
import { IDrawContext } from "./IDrawContext";
import { ICanvas } from "./ICanvas";
import { IStencilState } from "../States/IStencilState";

interface INativeCamera {
    createVideo(constraints: MediaTrackConstraints): any;
    updateVideoTexture(texture: Nullable<InternalTexture>, video: HTMLVideoElement, invertY: boolean): void;
}

interface INativeEngine {

    readonly TEXTURE_NEAREST_NEAREST: number;
    readonly TEXTURE_LINEAR_LINEAR: number;
    readonly TEXTURE_LINEAR_LINEAR_MIPLINEAR: number;
    readonly TEXTURE_NEAREST_NEAREST_MIPNEAREST: number;
    readonly TEXTURE_NEAREST_LINEAR_MIPNEAREST: number;
    readonly TEXTURE_NEAREST_LINEAR_MIPLINEAR: number;
    readonly TEXTURE_NEAREST_LINEAR: number;
    readonly TEXTURE_NEAREST_NEAREST_MIPLINEAR: number;
    readonly TEXTURE_LINEAR_NEAREST_MIPNEAREST: number;
    readonly TEXTURE_LINEAR_NEAREST_MIPLINEAR: number;
    readonly TEXTURE_LINEAR_LINEAR_MIPNEAREST: number;
    readonly TEXTURE_LINEAR_NEAREST: number;

    readonly DEPTH_TEST_LESS: number;
    readonly DEPTH_TEST_LEQUAL: number;
    readonly DEPTH_TEST_EQUAL: number;
    readonly DEPTH_TEST_GEQUAL: number;
    readonly DEPTH_TEST_GREATER: number;
    readonly DEPTH_TEST_NOTEQUAL: number;
    readonly DEPTH_TEST_NEVER: number;
    readonly DEPTH_TEST_ALWAYS: number;

    readonly ADDRESS_MODE_WRAP: number;
    readonly ADDRESS_MODE_MIRROR: number;
    readonly ADDRESS_MODE_CLAMP: number;
    readonly ADDRESS_MODE_BORDER: number;
    readonly ADDRESS_MODE_MIRROR_ONCE: number;

    readonly TEXTURE_FORMAT_RGB8: number;
    readonly TEXTURE_FORMAT_RGBA8: number;
    readonly TEXTURE_FORMAT_RGBA32F: number;

    readonly ATTRIB_TYPE_INT8: number;
    readonly ATTRIB_TYPE_UINT8: number;
    readonly ATTRIB_TYPE_INT16: number;
    readonly ATTRIB_TYPE_UINT16: number;
    readonly ATTRIB_TYPE_FLOAT: number;

    readonly ALPHA_DISABLE: number;
    readonly ALPHA_ADD: number;
    readonly ALPHA_COMBINE: number;
    readonly ALPHA_SUBTRACT: number;
    readonly ALPHA_MULTIPLY: number;
    readonly ALPHA_MAXIMIZED: number;
    readonly ALPHA_ONEONE: number;
    readonly ALPHA_PREMULTIPLIED: number;
    readonly ALPHA_PREMULTIPLIED_PORTERDUFF: number;
    readonly ALPHA_INTERPOLATE: number;
    readonly ALPHA_SCREENMODE: number;

    readonly STENCIL_TEST_LESS: number;
    readonly STENCIL_TEST_LEQUAL: number;
    readonly STENCIL_TEST_EQUAL: number;
    readonly STENCIL_TEST_GEQUAL: number;
    readonly STENCIL_TEST_GREATER: number;
    readonly STENCIL_TEST_NOTEQUAL: number;
    readonly STENCIL_TEST_NEVER: number;
    readonly STENCIL_TEST_ALWAYS: number;

    readonly STENCIL_OP_FAIL_S_ZERO: number;
    readonly STENCIL_OP_FAIL_S_KEEP: number;
    readonly STENCIL_OP_FAIL_S_REPLACE: number;
    readonly STENCIL_OP_FAIL_S_INCR: number;
    readonly STENCIL_OP_FAIL_S_INCRSAT: number;
    readonly STENCIL_OP_FAIL_S_DECR: number;
    readonly STENCIL_OP_FAIL_S_DECRSAT: number;
    readonly STENCIL_OP_FAIL_S_INVERT: number;

    readonly STENCIL_OP_FAIL_Z_ZERO: number;
    readonly STENCIL_OP_FAIL_Z_KEEP: number;
    readonly STENCIL_OP_FAIL_Z_REPLACE: number;
    readonly STENCIL_OP_FAIL_Z_INCR: number;
    readonly STENCIL_OP_FAIL_Z_INCRSAT: number;
    readonly STENCIL_OP_FAIL_Z_DECR: number;
    readonly STENCIL_OP_FAIL_Z_DECRSAT: number;
    readonly STENCIL_OP_FAIL_Z_INVERT: number;

    readonly STENCIL_OP_PASS_Z_ZERO: number;
    readonly STENCIL_OP_PASS_Z_KEEP: number;
    readonly STENCIL_OP_PASS_Z_REPLACE: number;
    readonly STENCIL_OP_PASS_Z_INCR: number;
    readonly STENCIL_OP_PASS_Z_INCRSAT: number;
    readonly STENCIL_OP_PASS_Z_DECR: number;
    readonly STENCIL_OP_PASS_Z_DECRSAT: number;
    readonly STENCIL_OP_PASS_Z_INVERT: number;

    dispose(): void;

    requestAnimationFrame(callback: () => void): void;

    createVertexArray(): any;
    deleteVertexArray(vertexArray: any): void;
    bindVertexArray(vertexArray: any): void;

    createIndexBuffer(data: ArrayBufferView, dynamic: boolean): any;
    deleteIndexBuffer(buffer: any): void;
    recordIndexBuffer(vertexArray: any, buffer: any): void;
    updateDynamicIndexBuffer(buffer: any, data: ArrayBufferView, startingIndex: number): void;

    createVertexBuffer(data: ArrayBufferView, dynamic: boolean): any;
    deleteVertexBuffer(buffer: any): void;
    recordVertexBuffer(vertexArray: any, buffer: any, location: number, byteOffset: number, byteStride: number, numElements: number, type: number, normalized: boolean): void;
    updateDynamicVertexBuffer(buffer: any, data: ArrayBufferView, byteOffset: number, byteLength: number): void;

    createProgram(vertexShader: string, fragmentShader: string): any;
    getUniforms(shaderProgram: any, uniformsNames: string[]): WebGLUniformLocation[];
    getAttributes(shaderProgram: any, attributeNames: string[]): number[];
    setProgram(program: any): void;

    setState(culling: boolean, zOffset: number, cullBackFaces: boolean, reverseSide: boolean): void;
    setZOffset(zOffset: number): void;
    getZOffset(): number;
    setDepthTest(enable: number): void;
    getDepthWrite(): boolean;
    setDepthWrite(enable: boolean): void;
    setColorWrite(enable: boolean): void;
    setBlendMode(blendMode: number): void;

    setMatrix(uniform: WebGLUniformLocation, matrix: Float32Array): void;
    setInt(uniform: WebGLUniformLocation, int: number): void;
    setInt2(uniform: WebGLUniformLocation, int1: number, int2: number): void;
    setInt3(uniform: WebGLUniformLocation, int1: number, int2: number, int3: number): void;
    setInt4(uniform: WebGLUniformLocation, int1: number, int2: number, int3: number, int4: number): void;
    setIntArray(uniform: WebGLUniformLocation, array: Int32Array): void;
    setIntArray2(uniform: WebGLUniformLocation, array: Int32Array): void;
    setIntArray3(uniform: WebGLUniformLocation, array: Int32Array): void;
    setIntArray4(uniform: WebGLUniformLocation, array: Int32Array): void;
    setFloatArray(uniform: WebGLUniformLocation, array: Float32Array | number[]): void;
    setFloatArray2(uniform: WebGLUniformLocation, array: Float32Array | number[]): void;
    setFloatArray3(uniform: WebGLUniformLocation, array: Float32Array | number[]): void;
    setFloatArray4(uniform: WebGLUniformLocation, array: Float32Array | number[]): void;
    setMatrices(uniform: WebGLUniformLocation, matrices: Float32Array): void;
    setMatrix3x3(uniform: WebGLUniformLocation, matrix: Float32Array): void;
    setMatrix2x2(uniform: WebGLUniformLocation, matrix: Float32Array): void;
    setFloat(uniform: WebGLUniformLocation, value: number): void;
    setFloat2(uniform: WebGLUniformLocation, x: number, y: number): void;
    setFloat3(uniform: WebGLUniformLocation, x: number, y: number, z: number): void;
    setFloat4(uniform: WebGLUniformLocation, x: number, y: number, z: number, w: number): void;

    createTexture(): WebGLTexture;
    loadTexture(texture: WebGLTexture, data: ArrayBufferView, generateMips: boolean, invertY: boolean, onSuccess: () => void, onError: () => void): void;
    loadRawTexture(texture: WebGLTexture, data: ArrayBufferView, width: number, height: number, format: number, generateMips: boolean, invertY: boolean): void;
    loadCubeTexture(texture: WebGLTexture, data: Array<ArrayBufferView>, generateMips: boolean, onSuccess: () => void, onError: () => void): void;
    loadCubeTextureWithMips(texture: WebGLTexture, data: Array<Array<ArrayBufferView>>, onSuccess: () => void, onError: () => void): void;
    getTextureWidth(texture: WebGLTexture): number;
    getTextureHeight(texture: WebGLTexture): number;
    setTextureSampling(texture: WebGLTexture, filter: number): void; // filter is a NativeFilter.XXXX value.
    setTextureWrapMode(texture: WebGLTexture, addressModeU: number, addressModeV: number, addressModeW: number): void; // addressModes are NativeAddressMode.XXXX values.
    setTextureAnisotropicLevel(texture: WebGLTexture, value: number): void;
    setTexture(uniform: WebGLUniformLocation, texture: Nullable<WebGLTexture>): void;
    copyTexture(desination: Nullable<WebGLTexture>, source: Nullable<WebGLTexture>): void;
    deleteTexture(texture: Nullable<WebGLTexture>): void;
    createImageBitmap(data: ArrayBufferView): ImageBitmap;
    resizeImageBitmap(image: ImageBitmap, bufferWidth: number, bufferHeight: number) : Uint8Array;

    createFrameBuffer(texture: WebGLTexture, width: number, height: number, format: number, generateStencilBuffer: boolean, generateDepthBuffer: boolean, generateMips: boolean): WebGLFramebuffer;
    deleteFrameBuffer(framebuffer: WebGLFramebuffer): void;
    bindFrameBuffer(framebuffer: WebGLFramebuffer): void;
    unbindFrameBuffer(framebuffer: WebGLFramebuffer): void;

    drawIndexed(fillMode: number, indexStart: number, indexCount: number): void;
    draw(fillMode: number, vertexStart: number, vertexCount: number): void;

    clear(color: IColor4Like | undefined, depth: number | undefined, stencil: number | undefined): void;

    getRenderWidth(): number;
    getRenderHeight(): number;
    getHardwareScalingLevel(): number;
    setHardwareScalingLevel(level: number): void;

    setViewPort(x: number, y: number, width: number, height: number): void;
    setStencil(mask: number, stencilOpFail: number, depthOpFail: number, depthOpPass: number, func: number, ref: number): void;
}

class NativePipelineContext implements IPipelineContext {
    // TODO: async should be true?
    public isAsync = false;
    public isReady = false;

    public _getVertexShaderCode(): string | null {
        return null;
    }

    public _getFragmentShaderCode(): string | null {
        return null;
    }

    // TODO: what should this do?
    public _handlesSpectorRebuildCallback(onCompiled: (compiledObject: any) => void): void {
        throw new Error("Not implemented");
    }

    public nativeProgram: any;

    private _valueCache: { [key: string]: any } = {};
    private _uniforms: { [key: string]: Nullable<WebGLUniformLocation> };

    public engine: NativeEngine;
    public context?: WebGLRenderingContext;
    public vertexShader?: WebGLShader;
    public fragmentShader?: WebGLShader;
    public isParallelCompiled: boolean;
    public onCompiled?: () => void;
    public transformFeedback?: WebGLTransformFeedback | null;

    constructor(engine: NativeEngine) {
        this.engine = engine;
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

        attributes.push(...engine.getAttributes(this, attributesNames));
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
        if (!cache) {
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
        if (!cache) {
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
        if (!cache) {
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
     * Sets an integer value on a uniform variable.
     * @param uniformName Name of the variable.
     * @param value Value to be set.
     */
    public setInt(uniformName: string, value: number): void {
        var cache = this._valueCache[uniformName];
        if (cache !== undefined && cache === value) {
            return;
        }

        if (this.engine.setInt(this._uniforms[uniformName]!, value)) {
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
            if (!this.engine.setInt2(this._uniforms[uniformName], x, y)) {
                this._valueCache[uniformName] = null;
            }
        }
    }

    /**
     * Sets a int3 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First int in int3.
     * @param y Second int in int3.
     * @param y Third int in int3.
     */
    public setInt3(uniformName: string, x: number, y: number, z: number): void {
        if (this._cacheFloat3(uniformName, x, y, z)) {
            if (!this.engine.setInt3(this._uniforms[uniformName], x, y, z)) {
                this._valueCache[uniformName] = null;
            }
        }
    }

    /**
     * Sets a int4 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First int in int4.
     * @param y Second int in int4.
     * @param y Third int in int4.
     * @param w Fourth int in int4.
     */
    public setInt4(uniformName: string, x: number, y: number, z: number, w: number): void {
        if (this._cacheFloat4(uniformName, x, y, z, w)) {
            if (!this.engine.setInt4(this._uniforms[uniformName], x, y, z, w)) {
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
        this.engine.setIntArray(this._uniforms[uniformName]!, array);
    }

    /**
     * Sets an int array 2 on a uniform variable. (Array is specified as single array eg. [1,2,3,4] will result in [[1,2],[3,4]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    public setIntArray2(uniformName: string, array: Int32Array): void {
        this._valueCache[uniformName] = null;
        this.engine.setIntArray2(this._uniforms[uniformName]!, array);
    }

    /**
     * Sets an int array 3 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6] will result in [[1,2,3],[4,5,6]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    public setIntArray3(uniformName: string, array: Int32Array): void {
        this._valueCache[uniformName] = null;
        this.engine.setIntArray3(this._uniforms[uniformName]!, array);
    }

    /**
     * Sets an int array 4 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6,7,8] will result in [[1,2,3,4],[5,6,7,8]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    public setIntArray4(uniformName: string, array: Int32Array): void {
        this._valueCache[uniformName] = null;
        this.engine.setIntArray4(this._uniforms[uniformName]!, array);
    }

    /**
     * Sets an float array on a uniform variable.
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    public setFloatArray(uniformName: string, array: Float32Array): void {
        this._valueCache[uniformName] = null;
        this.engine.setFloatArray(this._uniforms[uniformName]!, array);
    }

    /**
     * Sets an float array 2 on a uniform variable. (Array is specified as single array eg. [1,2,3,4] will result in [[1,2],[3,4]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    public setFloatArray2(uniformName: string, array: Float32Array): void {
        this._valueCache[uniformName] = null;
        this.engine.setFloatArray2(this._uniforms[uniformName]!, array);
    }

    /**
     * Sets an float array 3 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6] will result in [[1,2,3],[4,5,6]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    public setFloatArray3(uniformName: string, array: Float32Array): void {
        this._valueCache[uniformName] = null;
        this.engine.setFloatArray3(this._uniforms[uniformName]!, array);
    }

    /**
     * Sets an float array 4 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6,7,8] will result in [[1,2,3,4],[5,6,7,8]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    public setFloatArray4(uniformName: string, array: Float32Array): void {
        this._valueCache[uniformName] = null;
        this.engine.setFloatArray4(this._uniforms[uniformName]!, array);
    }

    /**
     * Sets an array on a uniform variable.
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    public setArray(uniformName: string, array: number[]): void {
        this._valueCache[uniformName] = null;
        this.engine.setArray(this._uniforms[uniformName]!, array);
    }

    /**
     * Sets an array 2 on a uniform variable. (Array is specified as single array eg. [1,2,3,4] will result in [[1,2],[3,4]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    public setArray2(uniformName: string, array: number[]): void {
        this._valueCache[uniformName] = null;
        this.engine.setArray2(this._uniforms[uniformName]!, array);
    }

    /**
     * Sets an array 3 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6] will result in [[1,2,3],[4,5,6]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     * @returns this effect.
     */
    public setArray3(uniformName: string, array: number[]): void {
        this._valueCache[uniformName] = null;
        this.engine.setArray3(this._uniforms[uniformName]!, array);
    }

    /**
     * Sets an array 4 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6,7,8] will result in [[1,2,3,4],[5,6,7,8]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    public setArray4(uniformName: string, array: number[]): void {
        this._valueCache[uniformName] = null;
        this.engine.setArray4(this._uniforms[uniformName]!, array);
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
        this.engine.setMatrices(this._uniforms[uniformName]!, matrices);
    }

    /**
     * Sets matrix on a uniform variable.
     * @param uniformName Name of the variable.
     * @param matrix matrix to be set.
     */
    public setMatrix(uniformName: string, matrix: IMatrixLike): void {
        if (this._cacheMatrix(uniformName, matrix)) {
            if (!this.engine.setMatrices(this._uniforms[uniformName]!, matrix.toArray() as Float32Array)) {
                this._valueCache[uniformName] = null;
            }
        }
    }

    /**
     * Sets a 3x3 matrix on a uniform variable. (Speicified as [1,2,3,4,5,6,7,8,9] will result in [1,2,3][4,5,6][7,8,9] matrix)
     * @param uniformName Name of the variable.
     * @param matrix matrix to be set.
     */
    public setMatrix3x3(uniformName: string, matrix: Float32Array): void {
        this._valueCache[uniformName] = null;
        this.engine.setMatrix3x3(this._uniforms[uniformName]!, matrix);
    }

    /**
     * Sets a 2x2 matrix on a uniform variable. (Speicified as [1,2,3,4] will result in [1,2][3,4] matrix)
     * @param uniformName Name of the variable.
     * @param matrix matrix to be set.
     */
    public setMatrix2x2(uniformName: string, matrix: Float32Array): void {
        this._valueCache[uniformName] = null;
        this.engine.setMatrix2x2(this._uniforms[uniformName]!, matrix);
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

        if (this.engine.setFloat(this._uniforms[uniformName]!, value)) {
            this._valueCache[uniformName] = value;
        }
    }

    /**
     * Sets a boolean on a uniform variable.
     * @param uniformName Name of the variable.
     * @param bool value to be set.
     */
    public setBool(uniformName: string, bool: boolean): void {
        var cache = this._valueCache[uniformName];
        if (cache !== undefined && cache === bool) {
            return;
        }

        if (this.engine.setInt(this._uniforms[uniformName]!, bool ? 1 : 0)) {
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
            if (!this.engine.setFloat2(this._uniforms[uniformName]!, vector2.x, vector2.y)) {
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
            if (!this.engine.setFloat2(this._uniforms[uniformName]!, x, y)) {
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
            if (!this.engine.setFloat3(this._uniforms[uniformName]!, vector3.x, vector3.y, vector3.z)) {
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
            if (!this.engine.setFloat3(this._uniforms[uniformName]!, x, y, z)) {
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
            if (!this.engine.setFloat4(this._uniforms[uniformName]!, vector4.x, vector4.y, vector4.z, vector4.w)) {
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
     * @returns this effect.
     */
    public setFloat4(uniformName: string, x: number, y: number, z: number, w: number): void {
        if (this._cacheFloat4(uniformName, x, y, z, w)) {
            if (!this.engine.setFloat4(this._uniforms[uniformName]!, x, y, z, w)) {
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
            if (!this.engine.setFloat3(this._uniforms[uniformName]!, color3.r, color3.g, color3.b)) {
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
            if (!this.engine.setFloat4(this._uniforms[uniformName]!, color3.r, color3.g, color3.b, alpha)) {
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
            if (!this.engine.setFloat4(this._uniforms[uniformName]!, color4.r, color4.g, color4.b, color4.a)) {
                this._valueCache[uniformName] = null;
            }
        }
    }
}

/**
 * Container for accessors for natively-stored mesh data buffers.
 */
class NativeDataBuffer extends DataBuffer {
    /**
     * Accessor value used to identify/retrieve a natively-stored index buffer.
     */
    public nativeIndexBuffer?: any;

    /**
     * Accessor value used to identify/retrieve a natively-stored vertex buffer.
     */
    public nativeVertexBuffer?: any;
}

/** @hidden */
declare var _native: any;

/**
 * Options to create the Native engine
 */
export interface NativeEngineOptions {

    /**
     * defines whether to adapt to the device's viewport characteristics (default: false)
     */
    adaptToDeviceRatio? : boolean;
}

/** @hidden */
export class NativeEngine extends Engine {
    private readonly _native: INativeEngine = new _native.Engine();
    private _nativeCamera: INativeCamera = _native.NativeCamera ? new _native.NativeCamera() : null;

    /** Defines the invalid handle returned by bgfx when resource creation goes wrong */
    private readonly INVALID_HANDLE = 65535;
    private _boundBuffersVertexArray: any = null;
    private _currentDepthTest: number = this._native.DEPTH_TEST_LEQUAL;
    private _stencilTest = false;
    private _stencilMask: number = 255;
    private _stencilFunc: number = Constants.ALWAYS;
    private _stencilFuncRef: number = 0;
    private _stencilFuncMask: number = 255;
    private _stencilOpStencilFail: number = Constants.KEEP;
    private _stencilOpDepthFail: number = Constants.KEEP;
    private _stencilOpStencilDepthPass: number = Constants.REPLACE;

    public getHardwareScalingLevel(): number {
        return this._native.getHardwareScalingLevel();
    }

    public setHardwareScalingLevel(level: number): void {
        this._native.setHardwareScalingLevel(level);
    }

    public constructor(options: NativeEngineOptions = {}) {
        super(null, false, undefined, options.adaptToDeviceRatio);

        this._webGLVersion = 2;
        this.disableUniformBuffers = true;

        // TODO: Initialize this more correctly based on the hardware capabilities.
        // Init caps

        this._caps = {
            maxTexturesImageUnits: 16,
            maxVertexTextureImageUnits: 16,
            maxCombinedTexturesImageUnits: 32,
            maxTextureSize: 512,
            maxCubemapTextureSize: 512,
            maxRenderTextureSize: 512,
            maxVertexAttribs: 16,
            maxVaryingVectors: 16,
            maxFragmentUniformVectors: 16,
            maxVertexUniformVectors: 16,
            standardDerivatives: true,
            astc: null,
            pvrtc: null,
            etc1: null,
            etc2: null,
            bptc: null,
            maxAnisotropy: 16,  // TODO: Retrieve this smartly. Currently set to D3D11 maximum allowable value.
            uintIndices: true,
            fragmentDepthSupported: false,
            highPrecisionShaderSupported: true,
            colorBufferFloat: false,
            textureFloat: false,
            textureFloatLinearFiltering: false,
            textureFloatRender: false,
            textureHalfFloat: false,
            textureHalfFloatLinearFiltering: false,
            textureHalfFloatRender: false,
            textureLOD: true,
            drawBuffersExtension: false,
            depthTextureExtension: false,
            vertexArrayObject: true,
            instancedArrays: false,
            supportOcclusionQuery: false,
            canUseTimestampForTimerQuery: false,
            blendMinMax: false,
            maxMSAASamples: 1,
            canUseGLInstanceID: true,
            canUseGLVertexID: true,
            supportComputeShaders: false,
            supportSRGBBuffers: false,
        };

        this._features = {
            forceBitmapOverHTMLImageElement: false,
            supportRenderAndCopyToLodForFloatTextures: false,
            supportDepthStencilTexture: false,
            supportShadowSamplers: false,
            uniformBufferHardCheckMatrix: false,
            allowTexturePrefiltering: false,
            trackUbosInFrame: false,
            checkUbosContentBeforeUpload: false,
            supportCSM: false,
            basisNeedsPOT: false,
            support3DTextures: false,
            needTypeSuffixInShaderConstants: false,
            supportMSAA: false,
            supportSSAO2: false,
            supportExtendedTextureFormats: false,
            supportSwitchCaseInShader: false,
            supportSyncTextureRead: false,
            needsInvertingBitmap: true,
            useUBOBindingCache: true,
            needShaderCodeInlining: true,
            _collectUbosUpdatedInFrame: false,
        };

        Tools.Log("Babylon Native (v" + Engine.Version + ") launched");

        Tools.LoadScript = function (scriptUrl, onSuccess, onError, scriptId) {
            Tools.LoadFile(scriptUrl, (data) => {
                Function(data as string).apply(null);
                if (onSuccess) {
                    onSuccess();
                }
            }, undefined, undefined, false,
            (request, exception) => {
                if (onError) {
                    onError("LoadScript Error", exception);
                }
            });
        };

        // Wrappers
        if (typeof URL === "undefined") {
            (window.URL as any) = {
                createObjectURL: function() { },
                revokeObjectURL: function() { }
            };
        }

        if (typeof Blob === "undefined") {
            (window.Blob as any) = function(v: any) { return v; };
        }

        // Currently we do not fully configure the ThinEngine on construction of NativeEngine.
        // Setup resolution scaling based on display settings.
        var devicePixelRatio = window ? (window.devicePixelRatio || 1.0) : 1.0;
        this._hardwareScalingLevel = options.adaptToDeviceRatio ? devicePixelRatio : 1.0;
        this.resize();

        const currentDepthFunction = this.getDepthFunction();
        if (currentDepthFunction) {
            this.setDepthFunction(currentDepthFunction);
        }

        // Shader processor
        this._shaderProcessor = new WebGL2ShaderProcessor();
    }

    public dispose(): void {
        super.dispose();
        if (this._boundBuffersVertexArray) {
            this._native.deleteVertexArray(this._boundBuffersVertexArray);
        }
        this._native.dispose();
    }

    /**
     * Can be used to override the current requestAnimationFrame requester.
     * @hidden
     */
    protected _queueNewFrame(bindedRenderFunction: any, requester?: any): number {
        // Use the provided requestAnimationFrame, unless the requester is the window. In that case, we will default to the Babylon Native version of requestAnimationFrame.
        if (requester.requestAnimationFrame && requester !== window) {
            requester.requestAnimationFrame(bindedRenderFunction);
        } else {
            this._native.requestAnimationFrame(bindedRenderFunction);
        }
        return 0;
    }

    /**
     * Override default engine behavior.
     * @param color
     * @param backBuffer
     * @param depth
     * @param stencil
     */
    public _bindUnboundFramebuffer(framebuffer: Nullable<WebGLFramebuffer>) {
        if (this._currentFramebuffer !== framebuffer) {
            if (this._currentFramebuffer) {
                this._native.unbindFrameBuffer(this._currentFramebuffer!);
            }

            if (framebuffer) {
                this._native.bindFrameBuffer(framebuffer);
            }

            this._currentFramebuffer = framebuffer;
        }
    }

    /**
     * Gets host document
     * @returns the host document object
     */
    public getHostDocument(): Nullable<Document> {
        return null;
    }

    public clear(color: Nullable<IColor4Like>, backBuffer: boolean, depth: boolean, stencil: boolean = false): void {
        if (this.useReverseDepthBuffer) {
            throw new Error("reverse depth buffer is not currently implemented");
        }

        this._native.clear(backBuffer && color ? color : undefined, depth ? 1.0 : undefined, stencil ? 0 : undefined);
    }

    public createIndexBuffer(indices: IndicesArray, updateable?: boolean): NativeDataBuffer {
        const data = this._normalizeIndexData(indices);
        const buffer = new NativeDataBuffer();
        buffer.references = 1;
        buffer.is32Bits = (data.BYTES_PER_ELEMENT === 4);
        if (data.length) {
            buffer.nativeIndexBuffer = this._native.createIndexBuffer(data, updateable ?? false);
            if (buffer.nativeVertexBuffer === this.INVALID_HANDLE) {
                throw new Error("Could not create a native index buffer.");
            }
        } else {
            buffer.nativeVertexBuffer = this.INVALID_HANDLE;
        }
        return buffer;
    }

    public createVertexBuffer(data: DataArray, updateable?: boolean): NativeDataBuffer {
        const buffer = new NativeDataBuffer();
        buffer.references = 1;
        buffer.nativeVertexBuffer = this._native.createVertexBuffer(ArrayBuffer.isView(data) ? data : new Float32Array(data), updateable ?? false);
        if (buffer.nativeVertexBuffer === this.INVALID_HANDLE) {
            throw new Error("Could not create a native vertex buffer.");
        }
        return buffer;
    }

    protected _recordVertexArrayObject(vertexArray: any, vertexBuffers: { [key: string]: VertexBuffer; }, indexBuffer: Nullable<NativeDataBuffer>, effect: Effect): void {
        if (indexBuffer) {
            this._native.recordIndexBuffer(vertexArray, indexBuffer.nativeIndexBuffer);
        }

        const attributes = effect.getAttributesNames();
        for (let index = 0; index < attributes.length; index++) {
            const location = effect.getAttributeLocation(index);
            if (location >= 0) {
                const kind = attributes[index];
                const vertexBuffer = vertexBuffers[kind];
                if (vertexBuffer) {
                    const buffer = vertexBuffer.getBuffer() as Nullable<NativeDataBuffer>;
                    if (buffer) {
                        this._native.recordVertexBuffer(
                            vertexArray,
                            buffer.nativeVertexBuffer,
                            location,
                            vertexBuffer.byteOffset,
                            vertexBuffer.byteStride,
                            vertexBuffer.getSize(),
                            this._getNativeAttribType(vertexBuffer.type),
                            vertexBuffer.normalized);
                    }
                }
            }
        }
    }

    public bindBuffers(vertexBuffers: { [key: string]: VertexBuffer; }, indexBuffer: Nullable<NativeDataBuffer>, effect: Effect): void {
        if (this._boundBuffersVertexArray) {
            this._native.deleteVertexArray(this._boundBuffersVertexArray);
        }
        this._boundBuffersVertexArray = this._native.createVertexArray();
        this._recordVertexArrayObject(this._boundBuffersVertexArray, vertexBuffers, indexBuffer, effect);
        this._native.bindVertexArray(this._boundBuffersVertexArray);
    }

    public recordVertexArrayObject(vertexBuffers: { [key: string]: VertexBuffer; }, indexBuffer: Nullable<NativeDataBuffer>, effect: Effect): WebGLVertexArrayObject {
        const vertexArray = this._native.createVertexArray();
        this._recordVertexArrayObject(vertexArray, vertexBuffers, indexBuffer, effect);
        return vertexArray;
    }

    public bindVertexArrayObject(vertexArray: WebGLVertexArrayObject): void {
        this._native.bindVertexArray(vertexArray);
    }

    public releaseVertexArrayObject(vertexArray: WebGLVertexArrayObject) {
        this._native.deleteVertexArray(vertexArray);
    }

    public getAttributes(pipelineContext: IPipelineContext, attributesNames: string[]): number[] {
        const nativePipelineContext = pipelineContext as NativePipelineContext;
        return this._native.getAttributes(nativePipelineContext.nativeProgram, attributesNames);
    }

    /**
     * Draw a list of indexed primitives
     * @param fillMode defines the primitive to use
     * @param indexStart defines the starting index
     * @param indexCount defines the number of index to draw
     * @param instancesCount defines the number of instances to draw (if instantiation is enabled)
     */
    public drawElementsType(fillMode: number, indexStart: number, indexCount: number, instancesCount?: number): void {
        // Apply states
        this._drawCalls.addCount(1, false);

        // TODO: Make this implementation more robust like core Engine version.

        // Render
        //var indexFormat = this._uintIndicesCurrentlySet ? this._gl.UNSIGNED_INT : this._gl.UNSIGNED_SHORT;

        //var mult = this._uintIndicesCurrentlySet ? 4 : 2;
        // if (instancesCount) {
        //     this._gl.drawElementsInstanced(drawMode, indexCount, indexFormat, indexStart * mult, instancesCount);
        // } else {
        this._native.drawIndexed(fillMode, indexStart, indexCount);
        // }
    }

    /**
     * Draw a list of unindexed primitives
     * @param fillMode defines the primitive to use
     * @param verticesStart defines the index of first vertex to draw
     * @param verticesCount defines the count of vertices to draw
     * @param instancesCount defines the number of instances to draw (if instantiation is enabled)
     */
    public drawArraysType(fillMode: number, verticesStart: number, verticesCount: number, instancesCount?: number): void {
        // Apply states
        this._drawCalls.addCount(1, false);

        // TODO: Make this implementation more robust like core Engine version.

        // if (instancesCount) {
        //     this._gl.drawArraysInstanced(drawMode, verticesStart, verticesCount, instancesCount);
        // } else {
        this._native.draw(fillMode, verticesStart, verticesCount);
        // }
    }

    public createPipelineContext(): IPipelineContext {
        return new NativePipelineContext(this);
    }

    public createMaterialContext(): IMaterialContext | undefined {
        return undefined;
    }

    public createDrawContext(): IDrawContext | undefined {
        return undefined;
    }

    public _preparePipelineContext(pipelineContext: IPipelineContext, vertexSourceCode: string, fragmentSourceCode: string, createAsRaw: boolean, rawVertexSourceCode: string, rawFragmentSourceCode: string, rebuildRebind: any, defines: Nullable<string>, transformFeedbackVaryings: Nullable<string[]>) {
        const nativePipelineContext = pipelineContext as NativePipelineContext;

        if (createAsRaw) {
            nativePipelineContext.nativeProgram = this.createRawShaderProgram(pipelineContext, vertexSourceCode, fragmentSourceCode, undefined, transformFeedbackVaryings);
        }
        else {
            nativePipelineContext.nativeProgram = this.createShaderProgram(pipelineContext, vertexSourceCode, fragmentSourceCode, defines, undefined, transformFeedbackVaryings);
        }
    }

    /** @hidden */
    public _isRenderingStateCompiled(pipelineContext: IPipelineContext): boolean {
        // TODO: support async shader compilcation
        return true;
    }

    /** @hidden */
    public _executeWhenRenderingStateIsCompiled(pipelineContext: IPipelineContext, action: () => void) {
        // TODO: support async shader compilcation
        action();
    }

    public createRawShaderProgram(pipelineContext: IPipelineContext, vertexCode: string, fragmentCode: string, context?: WebGLRenderingContext, transformFeedbackVaryings: Nullable<string[]> = null): any {
        throw new Error("Not Supported");
    }

    public createShaderProgram(pipelineContext: IPipelineContext, vertexCode: string, fragmentCode: string, defines: Nullable<string>, context?: WebGLRenderingContext, transformFeedbackVaryings: Nullable<string[]> = null): any {
        this.onBeforeShaderCompilationObservable.notifyObservers(this);

        const vertexInliner = new ShaderCodeInliner(vertexCode);
        vertexInliner.processCode();
        vertexCode = vertexInliner.code;

        const fragmentInliner = new ShaderCodeInliner(fragmentCode);
        fragmentInliner.processCode();
        fragmentCode = fragmentInliner.code;

        vertexCode = ThinEngine._ConcatenateShader(vertexCode, defines);
        fragmentCode = ThinEngine._ConcatenateShader(fragmentCode, defines);

        const program = this._native.createProgram(vertexCode, fragmentCode);
        this.onAfterShaderCompilationObservable.notifyObservers(this);
        return program;
    }

    protected _setProgram(program: WebGLProgram): void {
        if (this._currentProgram !== program) {
            this._native.setProgram(program);
            this._currentProgram = program;
        }
    }

    public _releaseEffect(effect: Effect): void {
        // TODO
    }

    public _deletePipelineContext(pipelineContext: IPipelineContext): void {
        // TODO
    }

    public getUniforms(pipelineContext: IPipelineContext, uniformsNames: string[]): WebGLUniformLocation[] {
        const nativePipelineContext = pipelineContext as NativePipelineContext;
        return this._native.getUniforms(nativePipelineContext.nativeProgram, uniformsNames);
    }

    public bindUniformBlock(pipelineContext: IPipelineContext, blockName: string, index: number): void {
        // TODO
        throw new Error("Not Implemented");
    }

    public bindSamplers(effect: Effect): void {
        const nativePipelineContext = effect.getPipelineContext() as NativePipelineContext;
        this._setProgram(nativePipelineContext.nativeProgram);

        // TODO: share this with engine?
        var samplers = effect.getSamplers();
        for (var index = 0; index < samplers.length; index++) {
            var uniform = effect.getUniform(samplers[index]);

            if (uniform) {
                this._boundUniforms[index] = uniform;
            }
        }
        this._currentEffect = null;
    }

    public setMatrix(uniform: WebGLUniformLocation, matrix: IMatrixLike): void {
        if (!uniform) {
            return;
        }

        this._native.setMatrix(uniform, matrix.toArray() as Float32Array);
    }

    public getRenderWidth(useScreen = false): number {
        if (!useScreen && this._currentRenderTarget) {
            return this._currentRenderTarget.width;
        }

        return this._native.getRenderWidth();
    }

    public getRenderHeight(useScreen = false): number {
        if (!useScreen && this._currentRenderTarget) {
            return this._currentRenderTarget.height;
        }

        return this._native.getRenderHeight();
    }

    public setViewport(viewport: IViewportLike, requiredWidth?: number, requiredHeight?: number): void {
        this._cachedViewport = viewport;
        this._native.setViewPort(viewport.x, viewport.y, viewport.width, viewport.height);
    }

    public setState(culling: boolean, zOffset: number = 0, force?: boolean, reverseSide = false, cullBackFaces?: boolean, stencil?: IStencilState): void {
        this._native.setState(culling, zOffset, this.cullBackFaces ?? cullBackFaces ?? true, reverseSide);
    }

    /**
     * Gets the client rect of native canvas.  Needed for InputManager.
     * @returns a client rectangle
     */
    public getInputElementClientRect(): Nullable<ClientRect> {
        const rect = {
            bottom: this.getRenderHeight(),
            height: this.getRenderHeight(),
            left: 0,
            right: this.getRenderWidth(),
            top: 0,
            width: this.getRenderWidth()
        };
        return rect;
    }

    /**
     * Set the z offset to apply to current rendering
     * @param value defines the offset to apply
     */
    public setZOffset(value: number): void {
        this._native.setZOffset(this.useReverseDepthBuffer ? -value : value);
    }

    /**
     * Gets the current value of the zOffset
     * @returns the current zOffset state
     */
    public getZOffset(): number {
        return this._native.getZOffset();
    }

    /**
     * Enable or disable depth buffering
     * @param enable defines the state to set
     */
    public setDepthBuffer(enable: boolean): void {
        this._native.setDepthTest(enable ? this._currentDepthTest : this._native.DEPTH_TEST_ALWAYS);
    }

    /**
     * Gets a boolean indicating if depth writing is enabled
     * @returns the current depth writing state
     */
    public getDepthWrite(): boolean {
        return this._native.getDepthWrite();
    }

    public getDepthFunction(): Nullable<number> {
        switch (this._currentDepthTest) {
            case this._native.DEPTH_TEST_NEVER:
                return Constants.NEVER;
            case this._native.DEPTH_TEST_ALWAYS:
                return Constants.ALWAYS;
            case this._native.DEPTH_TEST_GREATER:
                return Constants.GREATER;
            case this._native.DEPTH_TEST_GEQUAL:
                return Constants.GEQUAL;
            case this._native.DEPTH_TEST_NOTEQUAL:
                return Constants.NOTEQUAL;
            case this._native.DEPTH_TEST_EQUAL:
                return Constants.EQUAL;
            case this._native.DEPTH_TEST_LESS:
                return Constants.LESS;
            case this._native.DEPTH_TEST_LEQUAL:
                return Constants.LEQUAL;
        }
        return null;
    }

    public setDepthFunction(depthFunc: number) {
        let nativeDepthFunc = 0;
        switch (depthFunc) {
            case Constants.NEVER:
                nativeDepthFunc = this._native.DEPTH_TEST_NEVER;
                break;
            case Constants.ALWAYS:
                nativeDepthFunc = this._native.DEPTH_TEST_ALWAYS;
                break;
            case Constants.GREATER:
                nativeDepthFunc = this._native.DEPTH_TEST_GREATER;
                break;
            case Constants.GEQUAL:
                nativeDepthFunc = this._native.DEPTH_TEST_GEQUAL;
                break;
            case Constants.NOTEQUAL:
                nativeDepthFunc = this._native.DEPTH_TEST_NOTEQUAL;
                break;
            case Constants.EQUAL:
                nativeDepthFunc = this._native.DEPTH_TEST_EQUAL;
                break;
            case Constants.LESS:
                nativeDepthFunc = this._native.DEPTH_TEST_LESS;
                break;
            case Constants.LEQUAL:
                nativeDepthFunc = this._native.DEPTH_TEST_LEQUAL;
                break;
        }

        this._currentDepthTest = nativeDepthFunc;
        this._native.setDepthTest(this._currentDepthTest);
    }

    /**
     * Enable or disable depth writing
     * @param enable defines the state to set
     */
    public setDepthWrite(enable: boolean): void {
        this._native.setDepthWrite(enable);
    }

    /**
     * Enable or disable color writing
     * @param enable defines the state to set
     */
    public setColorWrite(enable: boolean): void {
        this._native.setColorWrite(enable);
        this._colorWrite = enable;
    }

    /**
     * Gets a boolean indicating if color writing is enabled
     * @returns the current color writing state
     */
    public getColorWrite(): boolean {
        return this._colorWrite;
    }

    private applyStencil(): void {
        this._native.setStencil(this._stencilMask,
            this._getStencilOpFail(this._stencilOpStencilFail),
            this._getStencilDepthFail(this._stencilOpDepthFail),
            this._getStencilDepthPass(this._stencilOpStencilDepthPass),
            this._getStencilFunc(this._stencilFunc),
            this._stencilFuncRef);
    }

    /**
     * Enable or disable the stencil buffer
     * @param enable defines if the stencil buffer must be enabled or disabled
     */
    public setStencilBuffer(enable: boolean): void {
        this._stencilTest = enable;
        if (enable) {
            this.applyStencil();
        } else {
            this._native.setStencil(255,
                this._native.STENCIL_OP_FAIL_S_KEEP,
                this._native.STENCIL_OP_FAIL_Z_KEEP,
                this._native.STENCIL_OP_PASS_Z_KEEP,
                this._native.STENCIL_TEST_ALWAYS,
                0);
        }
    }

    /**
     * Gets a boolean indicating if stencil buffer is enabled
     * @returns the current stencil buffer state
     */
    public getStencilBuffer(): boolean {
        return this._stencilTest;
    }

        /**
     * Gets the current stencil operation when stencil passes
     * @returns a number defining stencil operation to use when stencil passes
     */
    public getStencilOperationPass(): number {
        return this._stencilOpStencilDepthPass;
    }

    /**
     * Sets the stencil operation to use when stencil passes
     * @param operation defines the stencil operation to use when stencil passes
     */
    public setStencilOperationPass(operation: number): void {
        this._stencilOpStencilDepthPass = operation;
        this.applyStencil();
    }

    /**
     * Sets the current stencil mask
     * @param mask defines the new stencil mask to use
     */
    public setStencilMask(mask: number): void {
        this._stencilMask = mask;
        this.applyStencil();
    }

    /**
     * Sets the current stencil function
     * @param stencilFunc defines the new stencil function to use
     */
    public setStencilFunction(stencilFunc: number) {
        this._stencilFunc = stencilFunc;
        this.applyStencil();
    }

    /**
     * Sets the current stencil reference
     * @param reference defines the new stencil reference to use
     */
    public setStencilFunctionReference(reference: number) {
        this._stencilFuncRef = reference;
        this.applyStencil();
    }

    /**
     * Sets the current stencil mask
     * @param mask defines the new stencil mask to use
     */
    public setStencilFunctionMask(mask: number) {
        this._stencilFuncMask = mask;
    }

    /**
     * Sets the stencil operation to use when stencil fails
     * @param operation defines the stencil operation to use when stencil fails
     */
    public setStencilOperationFail(operation: number): void {
        this._stencilOpStencilFail = operation;
        this.applyStencil();
    }

    /**
     * Sets the stencil operation to use when depth fails
     * @param operation defines the stencil operation to use when depth fails
     */
    public setStencilOperationDepthFail(operation: number): void {
        this._stencilOpDepthFail = operation;
        this.applyStencil();
    }

    /**
     * Gets the current stencil mask
     * @returns a number defining the new stencil mask to use
     */
    public getStencilMask(): number {
        return this._stencilMask;
    }

    /**
     * Gets the current stencil function
     * @returns a number defining the stencil function to use
     */
    public getStencilFunction(): number {
        return this._stencilFunc;
    }

    /**
     * Gets the current stencil reference value
     * @returns a number defining the stencil reference value to use
     */
    public getStencilFunctionReference(): number {
        return this._stencilFuncRef;
    }

    /**
     * Gets the current stencil mask
     * @returns a number defining the stencil mask to use
     */
    public getStencilFunctionMask(): number {
        return this._stencilFuncMask;
    }

    /**
     * Gets the current stencil operation when stencil fails
     * @returns a number defining stencil operation to use when stencil fails
     */
    public getStencilOperationFail(): number {
        return this._stencilOpStencilFail;
    }

    /**
     * Gets the current stencil operation when depth fails
     * @returns a number defining stencil operation to use when depth fails
     */
    public getStencilOperationDepthFail(): number {
        return this._stencilOpDepthFail;
    }

    /**
     * Sets alpha constants used by some alpha blending modes
     * @param r defines the red component
     * @param g defines the green component
     * @param b defines the blue component
     * @param a defines the alpha component
     */
    public setAlphaConstants(r: number, g: number, b: number, a: number) {
        throw new Error("Setting alpha blend constant color not yet implemented.");
    }

    /**
     * Sets the current alpha mode
     * @param mode defines the mode to use (one of the BABYLON.Constants.ALPHA_XXX)
     * @param noDepthWriteChange defines if depth writing state should remains unchanged (false by default)
     * @see https://doc.babylonjs.com/resources/transparency_and_how_meshes_are_rendered
     */
    public setAlphaMode(mode: number, noDepthWriteChange: boolean = false): void {
        if (this._alphaMode === mode) {
            return;
        }

        mode = this._getNativeAlphaMode(mode);

        this._native.setBlendMode(mode);

        if (!noDepthWriteChange) {
            this.setDepthWrite(mode === Constants.ALPHA_DISABLE);
        }

        this._alphaMode = mode;
    }

    /**
     * Gets the current alpha mode
     * @see https://doc.babylonjs.com/resources/transparency_and_how_meshes_are_rendered
     * @returns the current alpha mode
     */
    public getAlphaMode(): number {
        return this._alphaMode;
    }

    public setInt(uniform: WebGLUniformLocation, int: number): boolean {
        if (!uniform) {
            return false;
        }

        this._native.setInt(uniform, int);
        return true;
    }

    public setIntArray(uniform: WebGLUniformLocation, array: Int32Array): boolean {
        if (!uniform) {
            return false;
        }

        this._native.setIntArray(uniform, array);
        return true;
    }

    public setIntArray2(uniform: WebGLUniformLocation, array: Int32Array): boolean {
        if (!uniform) {
            return false;
        }

        this._native.setIntArray2(uniform, array);
        return true;
    }

    public setIntArray3(uniform: WebGLUniformLocation, array: Int32Array): boolean {
        if (!uniform) {
            return false;
        }

        this._native.setIntArray3(uniform, array);
        return true;
    }

    public setIntArray4(uniform: WebGLUniformLocation, array: Int32Array): boolean {
        if (!uniform) {
            return false;
        }

        this._native.setIntArray4(uniform, array);
        return true;
    }

    public setFloatArray(uniform: WebGLUniformLocation, array: Float32Array): boolean {
        if (!uniform) {
            return false;
        }

        this._native.setFloatArray(uniform, array);
        return true;
    }

    public setFloatArray2(uniform: WebGLUniformLocation, array: Float32Array): boolean {
        if (!uniform) {
            return false;
        }

        this._native.setFloatArray2(uniform, array);
        return true;
    }

    public setFloatArray3(uniform: WebGLUniformLocation, array: Float32Array): boolean {
        if (!uniform) {
            return false;
        }

        this._native.setFloatArray3(uniform, array);
        return true;
    }

    public setFloatArray4(uniform: WebGLUniformLocation, array: Float32Array): boolean {
        if (!uniform) {
            return false;
        }

        this._native.setFloatArray4(uniform, array);
        return true;
    }

    public setArray(uniform: WebGLUniformLocation, array: number[]): boolean {
        if (!uniform) {
            return false;
        }

        this._native.setFloatArray(uniform, array);
        return true;
    }

    public setArray2(uniform: WebGLUniformLocation, array: number[]): boolean {
        if (!uniform) {
            return false;
        }

        this._native.setFloatArray2(uniform, array);
        return true;
    }

    public setArray3(uniform: WebGLUniformLocation, array: number[]): boolean {
        if (!uniform) {
            return false;
        }

        this._native.setFloatArray3(uniform, array);
        return true;
    }

    public setArray4(uniform: WebGLUniformLocation, array: number[]): boolean {
        if (!uniform) {
            return false;
        }

        this._native.setFloatArray4(uniform, array);
        return true;
    }

    public setMatrices(uniform: WebGLUniformLocation, matrices: Float32Array): boolean {
        if (!uniform) {
            return false;
        }

        this._native.setMatrices(uniform, matrices);
        return true;
    }

    public setMatrix3x3(uniform: WebGLUniformLocation, matrix: Float32Array): boolean {
        if (!uniform) {
            return false;
        }

        this._native.setMatrix3x3(uniform, matrix);
        return true;
    }

    public setMatrix2x2(uniform: WebGLUniformLocation, matrix: Float32Array): boolean {
        if (!uniform) {
            return false;
        }

        this._native.setMatrix2x2(uniform, matrix);
        return true;
    }

    public setFloat(uniform: WebGLUniformLocation, value: number): boolean {
        if (!uniform) {
            return false;
        }

        this._native.setFloat(uniform, value);
        return true;
    }

    public setFloat2(uniform: WebGLUniformLocation, x: number, y: number): boolean {
        if (!uniform) {
            return false;
        }

        this._native.setFloat2(uniform, x, y);
        return true;
    }

    public setFloat3(uniform: WebGLUniformLocation, x: number, y: number, z: number): boolean {
        if (!uniform) {
            return false;
        }

        this._native.setFloat3(uniform, x, y, z);
        return true;
    }

    public setFloat4(uniform: WebGLUniformLocation, x: number, y: number, z: number, w: number): boolean {
        if (!uniform) {
            return false;
        }

        this._native.setFloat4(uniform, x, y, z, w);
        return true;
    }

    public setColor3(uniform: WebGLUniformLocation, color3: IColor3Like): boolean {
        if (!uniform) {
            return false;
        }

        this._native.setFloat3(uniform, color3.r, color3.g, color3.b);
        return true;
    }

    public setColor4(uniform: WebGLUniformLocation, color3: IColor3Like, alpha: number): boolean {
        if (!uniform) {
            return false;
        }

        this._native.setFloat4(uniform, color3.r, color3.g, color3.b, alpha);
        return true;
    }

    public wipeCaches(bruteForce?: boolean): void {
        if (this.preventCacheWipeBetweenFrames) {
            return;
        }
        this.resetTextureCache();
        this._currentEffect = null;

        if (bruteForce) {
            this._currentProgram = null;

            this._stencilStateComposer.reset();
            this._depthCullingState.reset();
            this._alphaState.reset();
        }

        this._cachedVertexBuffers = null;
        this._cachedIndexBuffer = null;
        this._cachedEffectForVertexBuffers = null;
    }

    protected _createTexture(): WebGLTexture {
        return this._native.createTexture();
    }

    protected _deleteTexture(texture: Nullable<WebGLTexture>): void {
        if (texture) {
            this._native.deleteTexture(texture);
        }
    }

    /**
     * Update the content of a dynamic texture
     * @param texture defines the texture to update
     * @param canvas defines the canvas containing the source
     * @param invertY defines if data must be stored with Y axis inverted
     * @param premulAlpha defines if alpha is stored as premultiplied
     * @param format defines the format of the data
     * @param forceBindTexture if the texture should be forced to be bound eg. after a graphics context loss (Default: false)
     */
    public updateDynamicTexture(texture: Nullable<InternalTexture>, canvas: any, invertY: boolean, premulAlpha: boolean = false, format?: number): void {
        if (premulAlpha === void 0) {
            premulAlpha = false;
        }

        if (!!texture &&
            !!texture._hardwareTexture) {
            const source = canvas.getCanvasTexture();
            const destination = texture._hardwareTexture.underlyingResource;
            this._native.copyTexture(destination, source);
            texture.isReady = true;
        }
    }

    public createDynamicTexture(width: number, height: number, generateMipMaps: boolean, samplingMode: number): InternalTexture {
        return this.createRawTexture(new Uint8Array(width * height * 4), width, height, Constants.TEXTUREFORMAT_RGBA, false, false, samplingMode);
    }

    public createVideoElement(constraints: MediaTrackConstraints): any {
        // create native object depending on stream. Only NativeCamera is supported for now.
        if (this._nativeCamera) {
            return this._nativeCamera.createVideo(constraints);
        }
        return null;
    }

    public updateVideoTexture(texture: Nullable<InternalTexture>, video: HTMLVideoElement, invertY: boolean): void {
        if (texture && texture._hardwareTexture && this._nativeCamera) {
            var webGLTexture = texture._hardwareTexture.underlyingResource;
            this._nativeCamera.updateVideoTexture(webGLTexture, video, invertY);
        }
    }

    public createRawTexture(data: Nullable<ArrayBufferView>, width: number, height: number, format: number, generateMipMaps: boolean, invertY: boolean, samplingMode: number, compression: Nullable<string> = null, type: number = Constants.TEXTURETYPE_UNSIGNED_INT): InternalTexture {
        let texture = new InternalTexture(this, InternalTextureSource.Raw);

        texture.generateMipMaps = generateMipMaps;
        texture.samplingMode = samplingMode;
        texture.invertY = invertY;
        texture.baseWidth = width;
        texture.baseHeight = height;
        texture.width = texture.baseWidth;
        texture.height = texture.baseHeight;
        texture._compression = compression;
        texture.type = type;

        this.updateRawTexture(texture, data, format, invertY, compression, type);

        if (texture._hardwareTexture) {
            var webGLTexture = texture._hardwareTexture.underlyingResource;
            var filter = this._getNativeSamplingMode(samplingMode);
            this._native.setTextureSampling(webGLTexture, filter);
        }

        this._internalTexturesCache.push(texture);
        return texture;
    }

    public updateRawTexture(texture: Nullable<InternalTexture>, bufferView: Nullable<ArrayBufferView>, format: number, invertY: boolean, compression: Nullable<string> = null, type: number = Constants.TEXTURETYPE_UNSIGNED_INT): void {
        if (!texture) {
            return;
        }

        if (bufferView && texture._hardwareTexture) {
            const webGLTexture = texture._hardwareTexture.underlyingResource;
            this._native.loadRawTexture(webGLTexture, bufferView, texture.width, texture.height, this._getNativeTextureFormat(format, type), texture.generateMipMaps, texture.invertY);
        }

        texture.isReady = true;
    }

    // TODO: Refactor to share more logic with babylon.engine.ts version.
    /**
     * Usually called from Texture.ts.
     * Passed information to create a WebGLTexture
     * @param url defines a value which contains one of the following:
     * * A conventional http URL, e.g. 'http://...' or 'file://...'
     * * A base64 string of in-line texture data, e.g. 'data:image/jpg;base64,/...'
     * * An indicator that data being passed using the buffer parameter, e.g. 'data:mytexture.jpg'
     * @param noMipmap defines a boolean indicating that no mipmaps shall be generated.  Ignored for compressed textures.  They must be in the file
     * @param invertY when true, image is flipped when loaded.  You probably want true. Certain compressed textures may invert this if their default is inverted (eg. ktx)
     * @param scene needed for loading to the correct scene
     * @param samplingMode mode with should be used sample / access the texture (Default: Texture.TRILINEAR_SAMPLINGMODE)
     * @param onLoad optional callback to be called upon successful completion
     * @param onError optional callback to be called upon failure
     * @param buffer a source of a file previously fetched as either a base64 string, an ArrayBuffer (compressed or image format), HTMLImageElement (image format), or a Blob
     * @param fallback an internal argument in case the function must be called again, due to etc1 not having alpha capabilities
     * @param format internal format.  Default: RGB when extension is '.jpg' else RGBA.  Ignored for compressed textures
     * @param forcedExtension defines the extension to use to pick the right loader
     * @param mimeType defines an optional mime type
     * @param loaderOptions options to be passed to the loader
     * @returns a InternalTexture for assignment back into BABYLON.Texture
     */
    public createTexture(url: Nullable<string>, noMipmap: boolean, invertY: boolean, scene: Nullable<ISceneLike>, samplingMode: number = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE,
        onLoad: Nullable<() => void> = null, onError: Nullable<(message: string, exception: any) => void> = null,
        buffer: Nullable<string | ArrayBuffer | ArrayBufferView | HTMLImageElement | Blob | ImageBitmap> = null, fallback: Nullable<InternalTexture> = null, format: Nullable<number> = null,
        forcedExtension: Nullable<string> = null, mimeType?: string, loaderOptions?: any): InternalTexture {
        url = url || "";
        const fromData = url.substr(0, 5) === "data:";
        //const fromBlob = url.substr(0, 5) === "blob:";
        const isBase64 = fromData && url.indexOf(";base64,") !== -1;

        let texture = fallback ? fallback : new InternalTexture(this, InternalTextureSource.Url);

        const originalUrl = url;
        if (this._transformTextureUrl && !isBase64 && !fallback && !buffer) {
            url = this._transformTextureUrl(url);
        }

        // establish the file extension, if possible
        var lastDot = url.lastIndexOf('.');
        var extension = forcedExtension ? forcedExtension : (lastDot > -1 ? url.substring(lastDot).toLowerCase() : "");

        let loader: Nullable<IInternalTextureLoader> = null;
        for (let availableLoader of Engine._TextureLoaders) {
            if (availableLoader.canLoad(extension)) {
                loader = availableLoader;
                break;
            }
        }

        if (scene) {
            scene._addPendingData(texture);
        }
        texture.url = url;
        texture.generateMipMaps = !noMipmap;
        texture.samplingMode = samplingMode;
        texture.invertY = invertY;

        if (!this.doNotHandleContextLost) {
            // Keep a link to the buffer only if we plan to handle context lost
            texture._buffer = buffer;
        }

        let onLoadObserver: Nullable<Observer<InternalTexture>> = null;
        if (onLoad && !fallback) {
            onLoadObserver = texture.onLoadedObservable.add(onLoad);
        }

        if (!fallback) { this._internalTexturesCache.push(texture); }

        let onInternalError = (message?: string, exception?: any) => {
            if (scene) {
                scene._removePendingData(texture);
            }

            if (url === originalUrl) {
                if (onLoadObserver) {
                    texture.onLoadedObservable.remove(onLoadObserver);
                }

                if (EngineStore.UseFallbackTexture) {
                    this.createTexture(EngineStore.FallbackTexture, noMipmap, texture.invertY, scene, samplingMode, null, onError, buffer, texture);
                }

                if (onError) {
                    onError((message || "Unknown error") + (EngineStore.UseFallbackTexture ? " - Fallback texture was used" : ""), exception);
                }
            }
            else {
                // fall back to the original url if the transformed url fails to load
                Logger.Warn(`Failed to load ${url}, falling back to ${originalUrl}`);
                this.createTexture(originalUrl, noMipmap, texture.invertY, scene, samplingMode, onLoad, onError, buffer, texture, format, forcedExtension, mimeType, loaderOptions);
            }
        };

        // processing for non-image formats
        if (loader) {
            throw new Error("Loading textures from IInternalTextureLoader not yet implemented.");
        } else {
            const onload = (data: ArrayBufferView) => {
                if (!texture._hardwareTexture) {
                    if (scene) {
                        scene._removePendingData(texture);
                    }

                    return;
                }

                const webGLTexture = texture._hardwareTexture.underlyingResource;

                this._native.loadTexture(webGLTexture, data, !noMipmap, invertY, () => {
                    texture.baseWidth = this._native.getTextureWidth(webGLTexture);
                    texture.baseHeight = this._native.getTextureHeight(webGLTexture);
                    texture.width = texture.baseWidth;
                    texture.height = texture.baseHeight;
                    texture.isReady = true;

                    var filter = this._getNativeSamplingMode(samplingMode);
                    this._native.setTextureSampling(webGLTexture, filter);

                    if (scene) {
                        scene._removePendingData(texture);
                    }

                    texture.onLoadedObservable.notifyObservers(texture);
                    texture.onLoadedObservable.clear();
                }, () => {
                    throw new Error("Could not load a native texture.");
                });
            };

            if (fromData && buffer) {
                if (buffer instanceof ArrayBuffer) {
                    onload(new Uint8Array(buffer));
                } else if (ArrayBuffer.isView(buffer)) {
                    onload(buffer);
                } else if (typeof buffer === "string") {
                    onload(new Uint8Array(Tools.DecodeBase64(buffer)));
                } else {
                    throw new Error("Unsupported buffer type");
                }
            }
            else {
                if (isBase64) {
                    onload(new Uint8Array(Tools.DecodeBase64(url)));
                }
                else {
                    this._loadFile(url, (data) => onload(new Uint8Array(data as ArrayBuffer)), undefined, undefined, true, (request?: IWebRequest, exception?: any) => {
                        onInternalError("Unable to load " + (request ? request.responseURL : url, exception));
                    });
                }
            }
        }

        return texture;
    }

    public _createDepthStencilTexture(size: RenderTargetTextureSize, options: DepthTextureCreationOptions): InternalTexture {
        const texture = new InternalTexture(this, InternalTextureSource.Depth);

        const width = (<{ width: number, height: number, layers?: number }>size).width || <number>size;
        const height = (<{ width: number, height: number, layers?: number }>size).height || <number>size;

        const framebuffer = this._native.createFrameBuffer(
            texture._hardwareTexture!.underlyingResource,
            width,
            height,
            this._native.TEXTURE_FORMAT_RGBA8,
            false,
            true,
            false);
        texture._framebuffer = framebuffer;
        return texture;
    }

    public _releaseFramebufferObjects(texture: InternalTexture): void {
        if (texture._framebuffer) {
            this._native.deleteFrameBuffer(texture._framebuffer);
            texture._framebuffer = null;
        }
    }

    /**
     * Engine abstraction for createImageBitmap
     * @param image source for image
     * @param options An object that sets options for the image's extraction.
     * @returns ImageBitmap
     */
    public createImageBitmap(image: ImageBitmapSource, options?: ImageBitmapOptions): Promise<ImageBitmap> {
        return new Promise((resolve, reject) => {
            if (Array.isArray(image)) {
                const arr = <Array<ArrayBufferView>>image;
                if (arr.length) {
                    const image = this._native.createImageBitmap(arr[0]);
                    if (image) {
                        resolve(image);
                        return;
                    }
                }
            }
            reject(`Unsupported data for createImageBitmap.`);
        });
    }

    /**
     * Resize an image and returns the image data as an uint8array
     * @param image image to resize
     * @param bufferWidth destination buffer width
     * @param bufferHeight destination buffer height
     * @returns an uint8array containing RGBA values of bufferWidth * bufferHeight size
     */
    public resizeImageBitmap(image: ImageBitmap, bufferWidth: number, bufferHeight: number): Uint8Array {
        return this._native.resizeImageBitmap(image, bufferWidth, bufferHeight);
    }

    /**
     * Creates a cube texture
     * @param rootUrl defines the url where the files to load is located
     * @param scene defines the current scene
     * @param files defines the list of files to load (1 per face)
     * @param noMipmap defines a boolean indicating that no mipmaps shall be generated (false by default)
     * @param onLoad defines an optional callback raised when the texture is loaded
     * @param onError defines an optional callback raised if there is an issue to load the texture
     * @param format defines the format of the data
     * @param forcedExtension defines the extension to use to pick the right loader
     * @param createPolynomials if a polynomial sphere should be created for the cube texture
     * @param lodScale defines the scale applied to environment texture. This manages the range of LOD level used for IBL according to the roughness
     * @param lodOffset defines the offset applied to environment texture. This manages first LOD level used for IBL according to the roughness
     * @param fallback defines texture to use while falling back when (compressed) texture file not found.
     * @returns the cube texture as an InternalTexture
     */
    public createCubeTexture(
        rootUrl: string,
        scene: Nullable<Scene>,
        files: Nullable<string[]>,
        noMipmap?: boolean,
        onLoad: Nullable<(data?: any) => void> = null,
        onError: Nullable<(message?: string, exception?: any) => void> = null,
        format?: number,
        forcedExtension: any = null,
        createPolynomials = false,
        lodScale: number = 0,
        lodOffset: number = 0,
        fallback: Nullable<InternalTexture> = null): InternalTexture
    {
        var texture = fallback ? fallback : new InternalTexture(this, InternalTextureSource.Cube);
        texture.isCube = true;
        texture.url = rootUrl;
        texture.generateMipMaps = !noMipmap;
        texture._lodGenerationScale = lodScale;
        texture._lodGenerationOffset = lodOffset;

        if (!this._doNotHandleContextLost) {
            texture._extension = forcedExtension;
            texture._files = files;
        }

        var lastDot = rootUrl.lastIndexOf('.');
        var extension = forcedExtension ? forcedExtension : (lastDot > -1 ? rootUrl.substring(lastDot).toLowerCase() : "");

        // TODO: use texture loader to load env files?
        if (extension === ".env") {
            const onloaddata = (data: ArrayBufferView) => {
                var info = EnvironmentTextureTools.GetEnvInfo(data)!;
                texture.width = info.width;
                texture.height = info.width;

                EnvironmentTextureTools.UploadEnvSpherical(texture, info);

                if (info.version !== 1) {
                    throw new Error(`Unsupported babylon environment map version "${info.version}"`);
                }

                let specularInfo = info.specular as EnvironmentTextureSpecularInfoV1;
                if (!specularInfo) {
                    throw new Error(`Nothing else parsed so far`);
                }

                texture._lodGenerationScale = specularInfo.lodGenerationScale;
                const imageData = EnvironmentTextureTools.CreateImageDataArrayBufferViews(data, info);

                texture.format = Constants.TEXTUREFORMAT_RGBA;
                texture.type = Constants.TEXTURETYPE_UNSIGNED_INT;
                texture.generateMipMaps = true;
                texture.getEngine().updateTextureSamplingMode(Texture.TRILINEAR_SAMPLINGMODE, texture);
                texture._isRGBD = true;
                texture.invertY = true;

                this._native.loadCubeTextureWithMips(texture._hardwareTexture!.underlyingResource, imageData, () => {
                    texture.isReady = true;
                    if (onLoad) {
                        onLoad();
                    }
                }, () => {
                    throw new Error("Could not load a native cube texture.");
                });
            };

            if (files && files.length === 6) {
                throw new Error(`Multi-file loading not allowed on env files.`);
            }
            else {
                let onInternalError = (request?: IWebRequest, exception?: any) => {
                    if (onError && request) {
                        onError(request.status + " " + request.statusText, exception);
                    }
                };

                this._loadFile(rootUrl, (data) => onloaddata(new Uint8Array(data as ArrayBuffer)), undefined, undefined, true, onInternalError);
            }
        }
        else {
            if (!files || files.length !== 6) {
                throw new Error("Cannot load cubemap because 6 files were not defined");
            }

            // Reorder from [+X, +Y, +Z, -X, -Y, -Z] to [+X, -X, +Y, -Y, +Z, -Z].
            const reorderedFiles = [files[0], files[3], files[1], files[4], files[2], files[5]];
            Promise.all(reorderedFiles.map((file) => Tools.LoadFileAsync(file).then((data) => new Uint8Array(data as ArrayBuffer)))).then((data) => {
                return new Promise<void>((resolve, reject) => {
                    this._native.loadCubeTexture(texture._hardwareTexture!.underlyingResource, data, !noMipmap, resolve, reject);
                });
            }).then(() => {
                texture.isReady = true;
                if (onLoad) {
                    onLoad();
                }
            }, (error) => {
                if (onError) {
                    onError(`Failed to load cubemap: ${error.message}`, error);
                }
            });
        }

        this._internalTexturesCache.push(texture);

        return texture;
    }

    public createRenderTargetTexture(size: number | { width: number, height: number }, options: boolean | RenderTargetCreationOptions): InternalTexture {
        const fullOptions = new RenderTargetCreationOptions();

        if (options !== undefined && typeof options === "object") {
            fullOptions.generateMipMaps = options.generateMipMaps;
            fullOptions.generateDepthBuffer = options.generateDepthBuffer === undefined ? true : options.generateDepthBuffer;
            fullOptions.generateStencilBuffer = fullOptions.generateDepthBuffer && options.generateStencilBuffer;
            fullOptions.type = options.type === undefined ? Constants.TEXTURETYPE_UNSIGNED_INT : options.type;
            fullOptions.samplingMode = options.samplingMode === undefined ? Constants.TEXTURE_TRILINEAR_SAMPLINGMODE : options.samplingMode;
            fullOptions.format = options.format === undefined ? Constants.TEXTUREFORMAT_RGBA : options.format;
        } else {
            fullOptions.generateMipMaps = <boolean>options;
            fullOptions.generateDepthBuffer = true;
            fullOptions.generateStencilBuffer = false;
            fullOptions.type = Constants.TEXTURETYPE_UNSIGNED_INT;
            fullOptions.samplingMode = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE;
            fullOptions.format = Constants.TEXTUREFORMAT_RGBA;
        }

        if (fullOptions.type === Constants.TEXTURETYPE_FLOAT && !this._caps.textureFloatLinearFiltering) {
            // if floating point linear (gl.FLOAT) then force to NEAREST_SAMPLINGMODE
            fullOptions.samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
        }
        else if (fullOptions.type === Constants.TEXTURETYPE_HALF_FLOAT && !this._caps.textureHalfFloatLinearFiltering) {
            // if floating point linear (HALF_FLOAT) then force to NEAREST_SAMPLINGMODE
            fullOptions.samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
        }
        const texture = new InternalTexture(this, InternalTextureSource.RenderTarget);

        const width = (<{ width: number, height: number }>size).width || <number>size;
        const height = (<{ width: number, height: number }>size).height || <number>size;

        if (fullOptions.type === Constants.TEXTURETYPE_FLOAT && !this._caps.textureFloat) {
            fullOptions.type = Constants.TEXTURETYPE_UNSIGNED_INT;
            Logger.Warn("Float textures are not supported. Render target forced to TEXTURETYPE_UNSIGNED_BYTE type");
        }

        const framebuffer = this._native.createFrameBuffer(
            texture._hardwareTexture!.underlyingResource,
            width,
            height,
            this._getNativeTextureFormat(fullOptions.format, fullOptions.type),
            fullOptions.generateStencilBuffer ? true : false,
            fullOptions.generateDepthBuffer,
            fullOptions.generateMipMaps ? true : false);

        texture._framebuffer = framebuffer;
        texture.baseWidth = width;
        texture.baseHeight = height;
        texture.width = width;
        texture.height = height;
        texture.isReady = true;
        texture.samples = 1;
        texture.generateMipMaps = fullOptions.generateMipMaps ? true : false;
        texture.samplingMode = fullOptions.samplingMode;
        texture.type = fullOptions.type;
        texture.format = fullOptions.format;
        texture._generateDepthBuffer = fullOptions.generateDepthBuffer;
        texture._generateStencilBuffer = fullOptions.generateStencilBuffer ? true : false;

        this._internalTexturesCache.push(texture);

        return texture;
    }

    public updateTextureSamplingMode(samplingMode: number, texture: InternalTexture): void {
        if (texture._hardwareTexture) {
            var filter = this._getNativeSamplingMode(samplingMode);
            this._native.setTextureSampling(texture._hardwareTexture.underlyingResource, filter);
        }
        texture.samplingMode = samplingMode;
    }

    public bindFramebuffer(texture: InternalTexture, faceIndex?: number, requiredWidth?: number, requiredHeight?: number, forceFullscreenViewport?: boolean): void {
        if (faceIndex) {
            throw new Error("Cuboid frame buffers are not yet supported in NativeEngine.");
        }

        if (requiredWidth || requiredHeight) {
            throw new Error("Required width/height for frame buffers not yet supported in NativeEngine.");
        }

        if (forceFullscreenViewport) {
            //Not supported yet but don't stop rendering
        }

        if (texture._depthStencilTexture) {
            this._bindUnboundFramebuffer(texture._depthStencilTexture._framebuffer);
        } else {
            this._bindUnboundFramebuffer(texture._framebuffer);
        }
    }

    public unBindFramebuffer(texture: InternalTexture, disableGenerateMipMaps = false, onBeforeUnbind?: () => void): void {
        if (disableGenerateMipMaps) {
            Logger.Warn("Disabling mipmap generation not yet supported in NativeEngine. Ignoring.");
        }

        if (onBeforeUnbind) {
            onBeforeUnbind();
        }

        this._bindUnboundFramebuffer(null);
    }

    public createDynamicVertexBuffer(data: DataArray): DataBuffer {
        return this.createVertexBuffer(data, true);
    }

    public updateDynamicIndexBuffer(indexBuffer: DataBuffer, indices: IndicesArray, offset: number = 0): void {
        const buffer = indexBuffer as NativeDataBuffer;
        const data = this._normalizeIndexData(indices);
        buffer.is32Bits = (data.BYTES_PER_ELEMENT === 4);
        this._native.updateDynamicIndexBuffer(buffer.nativeIndexBuffer, data, offset);
    }

    /**
     * Updates a dynamic vertex buffer.
     * @param vertexBuffer the vertex buffer to update
     * @param data the data used to update the vertex buffer
     * @param byteOffset the byte offset of the data (optional)
     * @param byteLength the byte length of the data (optional)
     */
    public updateDynamicVertexBuffer(vertexBuffer: DataBuffer, data: DataArray, byteOffset?: number, byteLength?: number): void {
        const buffer = vertexBuffer as NativeDataBuffer;
        const dataView = ArrayBuffer.isView(data) ? data : new Float32Array(data);
        this._native.updateDynamicVertexBuffer(
            buffer.nativeVertexBuffer,
            dataView,
            byteOffset ?? 0,
            byteLength ?? dataView.byteLength);
    }

    // TODO: Refactor to share more logic with base Engine implementation.
    protected _setTexture(channel: number, texture: Nullable<BaseTexture>, isPartOfTextureArray = false, depthStencilTexture = false): boolean {
        let uniform = this._boundUniforms[channel];
        if (!uniform) {
            return false;
        }

        // Not ready?
        if (!texture) {
            if (this._boundTexturesCache[channel] != null) {
                this._activeChannel = channel;
                this._native.setTexture(uniform, null);
            }
            return false;
        }

        // Video
        if ((<VideoTexture>texture).video) {
            this._activeChannel = channel;
            (<VideoTexture>texture).update();
        } else if (texture.delayLoadState === Constants.DELAYLOADSTATE_NOTLOADED) { // Delay loading
            texture.delayLoad();
            return false;
        }

        let internalTexture: InternalTexture;
        if (depthStencilTexture) {
            internalTexture = (<RenderTargetTexture>texture).depthStencilTexture!;
        } else if (texture.isReady()) {
            internalTexture = <InternalTexture>texture.getInternalTexture();
        } else if (texture.isCube) {
            internalTexture = this.emptyCubeTexture;
        } else if (texture.is3D) {
            internalTexture = this.emptyTexture3D;
        } else if (texture.is2DArray) {
            internalTexture = this.emptyTexture2DArray;
        } else {
            internalTexture = this.emptyTexture;
        }

        this._activeChannel = channel;

        if (!internalTexture ||
            !internalTexture._hardwareTexture) {
            return false;
        }

        this._native.setTextureWrapMode(
            internalTexture._hardwareTexture.underlyingResource,
            this._getAddressMode(texture.wrapU),
            this._getAddressMode(texture.wrapV),
            this._getAddressMode(texture.wrapR));
        this._updateAnisotropicLevel(texture);

        this._native.setTexture(uniform, internalTexture._hardwareTexture.underlyingResource);

        return true;
    }

    // TODO: Share more of this logic with the base implementation.
    // TODO: Rename to match naming in base implementation once refactoring allows different parameters.
    private _updateAnisotropicLevel(texture: BaseTexture) {
        var internalTexture = texture.getInternalTexture();
        var value = texture.anisotropicFilteringLevel;

        if (!internalTexture || !internalTexture._hardwareTexture) {
            return;
        }

        if (internalTexture._cachedAnisotropicFilteringLevel !== value) {
            this._native.setTextureAnisotropicLevel(internalTexture._hardwareTexture.underlyingResource, value);
            internalTexture._cachedAnisotropicFilteringLevel = value;
        }
    }

    // Returns a NativeAddressMode.XXX value.
    private _getAddressMode(wrapMode: number): number {
        switch (wrapMode) {
            case Constants.TEXTURE_WRAP_ADDRESSMODE:
                return this._native.ADDRESS_MODE_WRAP;
            case Constants.TEXTURE_CLAMP_ADDRESSMODE:
                return this._native.ADDRESS_MODE_CLAMP;
            case Constants.TEXTURE_MIRROR_ADDRESSMODE:
                return this._native.ADDRESS_MODE_MIRROR;
            default:
                throw new Error("Unexpected wrap mode: " + wrapMode + ".");
        }
    }

    /** @hidden */
    public _bindTexture(channel: number, texture: InternalTexture): void {
        let uniform = this._boundUniforms[channel];
        if (!uniform) {
            return ;
        }
        if (texture && texture._hardwareTexture) {
            const webGLTexture = texture._hardwareTexture.underlyingResource;
            this._native.setTexture(uniform, webGLTexture);
        }
    }

    protected _deleteBuffer(buffer: NativeDataBuffer): void {
        if (buffer.nativeIndexBuffer) {
            this._native.deleteIndexBuffer(buffer.nativeIndexBuffer);
            delete buffer.nativeIndexBuffer;
        }

        if (buffer.nativeVertexBuffer) {
            this._native.deleteVertexBuffer(buffer.nativeVertexBuffer);
            delete buffer.nativeVertexBuffer;
        }
    }

    public releaseEffects() {
        // TODO
    }

    /**
     * Create a canvas
     * @param width width
     * @param height height
     * @return ICanvas interface
     */
    public createCanvas(width: number, height: number) : ICanvas {
        if (!_native.NativeCanvas) {
            throw new Error("Native Canvas plugin not available.");
        }
        const canvas = new _native.NativeCanvas();
        canvas.width = width;
        canvas.height = height;
        return canvas;
    }

    /** @hidden */
    public _uploadCompressedDataToTextureDirectly(texture: InternalTexture, internalFormat: number, width: number, height: number, data: ArrayBufferView, faceIndex: number = 0, lod: number = 0) {
        throw new Error("_uploadCompressedDataToTextureDirectly not implemented.");
    }

    /** @hidden */
    public _uploadDataToTextureDirectly(texture: InternalTexture, imageData: ArrayBufferView, faceIndex: number = 0, lod: number = 0): void {
        throw new Error("_uploadDataToTextureDirectly not implemented.");
    }

    /** @hidden */
    public _uploadArrayBufferViewToTexture(texture: InternalTexture, imageData: ArrayBufferView, faceIndex: number = 0, lod: number = 0): void {
        throw new Error("_uploadArrayBufferViewToTexture not implemented.");
    }

    /** @hidden */
    public _uploadImageToTexture(texture: InternalTexture, image: HTMLImageElement, faceIndex: number = 0, lod: number = 0) {
        throw new Error("_uploadArrayBufferViewToTexture not implemented.");
    }

    // JavaScript-to-Native conversion helper functions.

    private _getNativeSamplingMode(samplingMode: number): number {
        switch (samplingMode) {
            case Constants.TEXTURE_NEAREST_NEAREST:
                return this._native.TEXTURE_NEAREST_NEAREST;
            case Constants.TEXTURE_LINEAR_LINEAR:
                return this._native.TEXTURE_LINEAR_LINEAR;
            case Constants.TEXTURE_LINEAR_LINEAR_MIPLINEAR:
                return this._native.TEXTURE_LINEAR_LINEAR_MIPLINEAR;
            case Constants.TEXTURE_NEAREST_NEAREST_MIPNEAREST:
                return this._native.TEXTURE_NEAREST_NEAREST_MIPNEAREST;
            case Constants.TEXTURE_NEAREST_LINEAR_MIPNEAREST:
                return this._native.TEXTURE_NEAREST_LINEAR_MIPNEAREST;
            case Constants.TEXTURE_NEAREST_LINEAR_MIPLINEAR:
                return this._native.TEXTURE_NEAREST_LINEAR_MIPLINEAR;
            case Constants.TEXTURE_NEAREST_LINEAR:
                return this._native.TEXTURE_NEAREST_LINEAR;
            case Constants.TEXTURE_NEAREST_NEAREST_MIPLINEAR:
                return this._native.TEXTURE_NEAREST_NEAREST_MIPLINEAR;
            case Constants.TEXTURE_LINEAR_NEAREST_MIPNEAREST:
                return this._native.TEXTURE_LINEAR_NEAREST_MIPNEAREST;
            case Constants.TEXTURE_LINEAR_NEAREST_MIPLINEAR:
                return this._native.TEXTURE_LINEAR_NEAREST_MIPLINEAR;
            case Constants.TEXTURE_LINEAR_LINEAR_MIPNEAREST:
                return this._native.TEXTURE_LINEAR_LINEAR_MIPNEAREST;
            case Constants.TEXTURE_LINEAR_NEAREST:
                return this._native.TEXTURE_LINEAR_NEAREST;
            default:
                throw new Error(`Unsupported sampling mode: ${samplingMode}.`);
        }
    }

    private _getStencilFunc(func: number): number {
        switch (func)
        {
            case Constants.LESS:
                return this._native.STENCIL_TEST_LESS;
            case Constants.LEQUAL:
                return this._native.STENCIL_TEST_LEQUAL;
            case Constants.EQUAL:
                return this._native.STENCIL_TEST_EQUAL;
            case Constants.GEQUAL:
                return this._native.STENCIL_TEST_GEQUAL;
            case Constants.GREATER:
                return this._native.STENCIL_TEST_GREATER;
            case Constants.NOTEQUAL:
                return this._native.STENCIL_TEST_NOTEQUAL;
            case Constants.NEVER:
                return this._native.STENCIL_TEST_NEVER;
            case Constants.ALWAYS:
                return this._native.STENCIL_TEST_ALWAYS;
            default:
                throw new Error(`Unsupported stencil func mode: ${func}.`);
        }
    }

    private _getStencilOpFail(opFail: number): number {
        switch (opFail)
        {
            case Constants.KEEP:
                return this._native.STENCIL_OP_FAIL_S_KEEP;
            case Constants.ZERO:
                return this._native.STENCIL_OP_FAIL_S_ZERO;
            case Constants.REPLACE:
                return this._native.STENCIL_OP_FAIL_S_REPLACE;
            case Constants.INCR:
                return this._native.STENCIL_OP_FAIL_S_INCR;
            case Constants.DECR:
                return this._native.STENCIL_OP_FAIL_S_DECR;
            case Constants.INVERT:
                return this._native.STENCIL_OP_FAIL_S_INVERT;
            case Constants.INCR_WRAP:
                return this._native.STENCIL_OP_FAIL_S_INCRSAT;
            case Constants.DECR_WRAP:
                return this._native.STENCIL_OP_FAIL_S_DECRSAT;
            default:
                throw new Error(`Unsupported stencil OpFail mode: ${opFail}.`);
        }
    }

    private _getStencilDepthFail(depthFail: number): number {
        switch (depthFail)
        {
            case Constants.KEEP:
                return this._native.STENCIL_OP_FAIL_Z_KEEP;
            case Constants.ZERO:
                return this._native.STENCIL_OP_FAIL_Z_ZERO;
            case Constants.REPLACE:
                return this._native.STENCIL_OP_FAIL_Z_REPLACE;
            case Constants.INCR:
                return this._native.STENCIL_OP_FAIL_Z_INCR;
            case Constants.DECR:
                return this._native.STENCIL_OP_FAIL_Z_DECR;
            case Constants.INVERT:
                return this._native.STENCIL_OP_FAIL_Z_INVERT;
            case Constants.INCR_WRAP:
                return this._native.STENCIL_OP_FAIL_Z_INCRSAT;
            case Constants.DECR_WRAP:
                return this._native.STENCIL_OP_FAIL_Z_DECRSAT;
            default:
                throw new Error(`Unsupported stencil depthFail mode: ${depthFail}.`);
        }
    }

    private _getStencilDepthPass(opPass: number): number {
        switch (opPass)
        {
            case Constants.KEEP:
                return this._native.STENCIL_OP_PASS_Z_KEEP;
            case Constants.ZERO:
                return this._native.STENCIL_OP_PASS_Z_ZERO;
            case Constants.REPLACE:
                return this._native.STENCIL_OP_PASS_Z_REPLACE;
            case Constants.INCR:
                return this._native.STENCIL_OP_PASS_Z_INCR;
            case Constants.DECR:
                return this._native.STENCIL_OP_PASS_Z_DECR;
            case Constants.INVERT:
                return this._native.STENCIL_OP_PASS_Z_INVERT;
            case Constants.INCR_WRAP:
                return this._native.STENCIL_OP_PASS_Z_INCRSAT;
            case Constants.DECR_WRAP:
                return this._native.STENCIL_OP_PASS_Z_DECRSAT;
            default:
                throw new Error(`Unsupported stencil opPass mode: ${opPass}.`);
        }
    }

    private _getNativeTextureFormat(format: number, type: number): number {
        if (format == Constants.TEXTUREFORMAT_RGB && type == Constants.TEXTURETYPE_UNSIGNED_INT) {
            return this._native.TEXTURE_FORMAT_RGB8;
        }
        else if (format == Constants.TEXTUREFORMAT_RGBA && type == Constants.TEXTURETYPE_UNSIGNED_INT) {
            return this._native.TEXTURE_FORMAT_RGBA8;
        }
        else if (format == Constants.TEXTUREFORMAT_RGBA && type == Constants.TEXTURETYPE_FLOAT) {
            return this._native.TEXTURE_FORMAT_RGBA32F;
        }
        else {
            throw new Error(`Unsupported texture format or type: format ${format}, type ${type}.`);
        }
    }

    private _getNativeAlphaMode(mode: number): number {
        switch (mode) {
            case Constants.ALPHA_DISABLE:
                return this._native.ALPHA_DISABLE;
            case Constants.ALPHA_ADD:
                return this._native.ALPHA_ADD;
            case Constants.ALPHA_COMBINE:
                return this._native.ALPHA_COMBINE;
            case Constants.ALPHA_SUBTRACT:
                return this._native.ALPHA_SUBTRACT;
            case Constants.ALPHA_MULTIPLY:
                return this._native.ALPHA_MULTIPLY;
            case Constants.ALPHA_MAXIMIZED:
                return this._native.ALPHA_MAXIMIZED;
            case Constants.ALPHA_ONEONE:
                return this._native.ALPHA_ONEONE;
            case Constants.ALPHA_PREMULTIPLIED:
                return this._native.ALPHA_PREMULTIPLIED;
            case Constants.ALPHA_PREMULTIPLIED_PORTERDUFF:
                return this._native.ALPHA_PREMULTIPLIED_PORTERDUFF;
            case Constants.ALPHA_INTERPOLATE:
                return this._native.ALPHA_INTERPOLATE;
            case Constants.ALPHA_SCREENMODE:
                return this._native.ALPHA_SCREENMODE;
            default:
                throw new Error(`Unsupported alpha mode: ${mode}.`);
        }
    }

    private _getNativeAttribType(type: number): number {
        switch (type) {
            case VertexBuffer.BYTE:
                return this._native.ATTRIB_TYPE_INT8;
            case VertexBuffer.UNSIGNED_BYTE:
                return this._native.ATTRIB_TYPE_UINT8;
            case VertexBuffer.SHORT:
                return this._native.ATTRIB_TYPE_INT16;
            case VertexBuffer.UNSIGNED_SHORT:
                return this._native.ATTRIB_TYPE_UINT16;
            case VertexBuffer.FLOAT:
                return this._native.ATTRIB_TYPE_FLOAT;
            default:
                throw new Error(`Unsupported attribute type: ${type}.`);
        }
    }

    public getFontOffset(font: string): { ascent: number, height: number, descent: number } {
        // TODO
        var result = { ascent: 0, height: 0, descent: 0 };
        return result;
    }
}
