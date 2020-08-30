import { Nullable, IndicesArray, DataArray } from "../types";
import { Engine } from "../Engines/engine";
import { VertexBuffer } from "../Meshes/buffer";
import { InternalTexture, InternalTextureSource } from "../Materials/Textures/internalTexture";
import { IInternalTextureLoader } from "../Materials/Textures/internalTextureLoader";
import { Texture } from "../Materials/Textures/texture";
import { BaseTexture } from "../Materials/Textures/baseTexture";
import { VideoTexture } from "../Materials/Textures/videoTexture";
import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import { Effect } from "../Materials/effect";
import { DataBuffer } from '../Meshes/dataBuffer';
import { Tools } from "../Misc/tools";
import { Observer } from "../Misc/observable";
import { EnvironmentTextureTools, EnvironmentTextureSpecularInfoV1 } from "../Misc/environmentTextureTools";
import { Matrix, Viewport, Color3 } from "../Maths/math";
import { IColor4Like } from '../Maths/math.like';
import { Scene } from "../scene";
import { RenderTargetCreationOptions } from "../Materials/Textures/renderTargetCreationOptions";
import { IPipelineContext } from './IPipelineContext';
import { Logger } from "../Misc/logger";
import { Constants } from './constants';
import { ThinEngine, ISceneLike } from './thinEngine';
import { IWebRequest } from '../Misc/interfaces/iWebRequest';
import { EngineStore } from './engineStore';
import { ShaderCodeInliner } from "./Processors/shaderCodeInliner";
import { WebGL2ShaderProcessor } from '../Engines/WebGL/webGL2ShaderProcessors';

interface INativeEngine {
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

    setState(culling: boolean, zOffset: number, reverseSide: boolean): void;
    setZOffset(zOffset: number): void;
    getZOffset(): number;
    setDepthTest(enable: boolean): void;
    getDepthWrite(): boolean;
    setDepthWrite(enable: boolean): void;
    setColorWrite(enable: boolean): void;
    setBlendMode(blendMode: number): void;

    setMatrix(uniform: WebGLUniformLocation, matrix: Float32Array): void;
    setInt(uniform: WebGLUniformLocation, int: number): void;
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
    loadCubeTexture(texture: WebGLTexture, data: Array<ArrayBufferView>, generateMips: boolean, onSuccess: () => void, onError: () => void): void;
    loadCubeTextureWithMips(texture: WebGLTexture, data: Array<Array<ArrayBufferView>>, onSuccess: () => void, onError: () => void): void;
    getTextureWidth(texture: WebGLTexture): number;
    getTextureHeight(texture: WebGLTexture): number;
    setTextureSampling(texture: WebGLTexture, filter: number): void; // filter is a NativeFilter.XXXX value.
    setTextureWrapMode(texture: WebGLTexture, addressModeU: number, addressModeV: number, addressModeW: number): void; // addressModes are NativeAddressMode.XXXX values.
    setTextureAnisotropicLevel(texture: WebGLTexture, value: number): void;
    setTexture(uniform: WebGLUniformLocation, texture: Nullable<WebGLTexture>): void;
    deleteTexture(texture: Nullable<WebGLTexture>): void;

    createFramebuffer(texture: WebGLTexture, width: number, height: number, format: number, samplingMode: number, generateStencilBuffer: boolean, generateDepthBuffer: boolean, generateMips: boolean): WebGLFramebuffer;
    deleteFramebuffer(framebuffer: WebGLFramebuffer): void;
    bindFramebuffer(framebuffer: WebGLFramebuffer): void;
    unbindFramebuffer(framebuffer: WebGLFramebuffer): void;

    drawIndexed(fillMode: number, indexStart: number, indexCount: number): void;
    draw(fillMode: number, vertexStart: number, vertexCount: number): void;

    clear(flags: number): void;
    clearColor(r: number, g: number, b: number, a: number): void;
    clearDepth(depth: number): void;
    clearStencil(stencil: number): void;

    getRenderWidth(): number;
    getRenderHeight(): number;

    setViewPort(x: number, y: number, width: number, height: number): void;
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

// TODO: change this to match bgfx.
// Must match Filter enum in SpectreEngine.h.
class NativeFilter {
    public static readonly POINT = 0;
    public static readonly MINPOINT_MAGPOINT_MIPPOINT = NativeFilter.POINT;
    public static readonly BILINEAR = 1;
    public static readonly MINLINEAR_MAGLINEAR_MIPPOINT = NativeFilter.BILINEAR;
    public static readonly TRILINEAR = 2;
    public static readonly MINLINEAR_MAGLINEAR_MIPLINEAR = NativeFilter.TRILINEAR;
    public static readonly ANISOTROPIC = 3;
    public static readonly POINT_COMPARE = 4;
    public static readonly TRILINEAR_COMPARE = 5;
    public static readonly MINBILINEAR_MAGPOINT = 6;
    public static readonly MINLINEAR_MAGPOINT_MIPLINEAR = NativeFilter.MINBILINEAR_MAGPOINT;
    public static readonly MINPOINT_MAGPOINT_MIPLINEAR = 7;
    public static readonly MINPOINT_MAGLINEAR_MIPPOINT = 8;
    public static readonly MINPOINT_MAGLINEAR_MIPLINEAR = 9;
    public static readonly MINLINEAR_MAGPOINT_MIPPOINT = 10;
}

// these flags match bgfx.
class NativeClearFlags
{
    public static readonly CLEAR_COLOR = 1;
    public static readonly CLEAR_DEPTH = 2;
    public static readonly CLEAR_STENCIL = 4;
}
// TODO: change this to match bgfx.
// Must match AddressMode enum in SpectreEngine.h.
class NativeAddressMode {
    public static readonly WRAP = 0;
    public static readonly MIRROR = 1;
    public static readonly CLAMP = 2;
    public static readonly BORDER = 3;
    public static readonly MIRROR_ONCE = 4;
}

class NativeTextureFormat {
    public static readonly RGBA8 = 0;
    public static readonly RGBA32F = 1;
}

/** @hidden */
class NativeTexture extends InternalTexture {
    public getInternalTexture(): InternalTexture {
        return this;
    }

    public getViewCount(): number {
        return 1;
    }
}

/** @hidden */
declare var _native: any;

/** @hidden */
export class NativeEngine extends Engine {
    private readonly _native: INativeEngine = new _native.Engine();
    /** Defines the invalid handle returned by bgfx when resource creation goes wrong */
    private readonly INVALID_HANDLE = 65535;
    private _boundBuffersVertexArray: any = null;

    public getHardwareScalingLevel(): number {
        return 1.0;
    }

    public constructor() {
        super(null);

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
            canUseTimestampForTimerQuery: false,
            blendMinMax: false,
            maxMSAASamples: 1
        };

        Tools.Log("Babylon Native (v" + Engine.Version + ") launched");

        // Wrappers
        if (typeof URL === "undefined") {
            (window.URL as any) = {
                createObjectURL: function() { },
                revokeObjectURL: function() { }
            };
        }

        if (typeof Blob === "undefined") {
            (window.Blob as any) = function() { };
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
                this._native.unbindFramebuffer(this._currentFramebuffer!);
            }

            if (framebuffer) {
                this._native.bindFramebuffer(framebuffer);
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
        var mode = 0;
        if (backBuffer && color) {
            this._native.clearColor(color.r, color.g, color.b, color.a !== undefined ? color.a : 1.0);
            mode |= NativeClearFlags.CLEAR_COLOR;
        }
        if (depth) {
            this._native.clearDepth(1.0);
            mode |= NativeClearFlags.CLEAR_DEPTH;
        }
        if (stencil) {
            this._native.clearStencil(0);
            mode |= NativeClearFlags.CLEAR_STENCIL;
        }
        this._native.clear(mode);
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
                            vertexBuffer.type,
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
     * @param instancesCount defines the number of instances to draw (if instanciation is enabled)
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
     * @param instancesCount defines the number of instances to draw (if instanciation is enabled)
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
        return new NativePipelineContext();
    }

    public _preparePipelineContext(pipelineContext: IPipelineContext, vertexSourceCode: string, fragmentSourceCode: string, createAsRaw: boolean, rebuildRebind: any, defines: Nullable<string>, transformFeedbackVaryings: Nullable<string[]>) {
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

    public setMatrix(uniform: WebGLUniformLocation, matrix: Matrix): void {
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

    public setViewport(viewport: Viewport, requiredWidth?: number, requiredHeight?: number): void {
        this._cachedViewport = viewport;
        this._native.setViewPort(viewport.x, viewport.y, viewport.width, viewport.height);
    }

    public setState(culling: boolean, zOffset: number = 0, force?: boolean, reverseSide = false): void {
        this._native.setState(culling, zOffset, reverseSide);
    }

    /**
     * Set the z offset to apply to current rendering
     * @param value defines the offset to apply
     */
    public setZOffset(value: number): void {
        this._native.setZOffset(value);
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
        this._native.setDepthTest(enable);
    }

    /**
     * Gets a boolean indicating if depth writing is enabled
     * @returns the current depth writing state
     */
    public getDepthWrite(): boolean {
        return this._native.getDepthWrite();
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

    public setInt(uniform: WebGLUniformLocation, int: number): void {
        if (!uniform) {
            return;
        }

        this._native.setInt(uniform, int);
    }

    public setIntArray(uniform: WebGLUniformLocation, array: Int32Array): void {
        if (!uniform) {
            return;
        }

        this._native.setIntArray(uniform, array);
    }

    public setIntArray2(uniform: WebGLUniformLocation, array: Int32Array): void {
        if (!uniform) {
            return;
        }

        this._native.setIntArray2(uniform, array);
    }

    public setIntArray3(uniform: WebGLUniformLocation, array: Int32Array): void {
        if (!uniform) {
            return;
        }

        this._native.setIntArray3(uniform, array);
    }

    public setIntArray4(uniform: WebGLUniformLocation, array: Int32Array): void {
        if (!uniform) {
            return;
        }

        this._native.setIntArray4(uniform, array);
    }

    public setFloatArray(uniform: WebGLUniformLocation, array: Float32Array): void {
        if (!uniform) {
            return;
        }

        this._native.setFloatArray(uniform, array);
    }

    public setFloatArray2(uniform: WebGLUniformLocation, array: Float32Array): void {
        if (!uniform) {
            return;
        }

        this._native.setFloatArray2(uniform, array);
    }

    public setFloatArray3(uniform: WebGLUniformLocation, array: Float32Array): void {
        if (!uniform) {
            return;
        }

        this._native.setFloatArray3(uniform, array);
    }

    public setFloatArray4(uniform: WebGLUniformLocation, array: Float32Array): void {
        if (!uniform) {
            return;
        }

        this._native.setFloatArray4(uniform, array);
    }

    public setArray(uniform: WebGLUniformLocation, array: number[]): void {
        if (!uniform) {
            return;
        }

        this._native.setFloatArray(uniform, array);
    }

    public setArray2(uniform: WebGLUniformLocation, array: number[]): void {
        if (!uniform) {
            return;
        }

        this._native.setFloatArray2(uniform, array);
    }

    public setArray3(uniform: WebGLUniformLocation, array: number[]): void {
        if (!uniform) {
            return;
        }

        this._native.setFloatArray3(uniform, array);
    }

    public setArray4(uniform: WebGLUniformLocation, array: number[]): void {
        if (!uniform) {
            return;
        }

        this._native.setFloatArray4(uniform, array);
    }

    public setMatrices(uniform: WebGLUniformLocation, matrices: Float32Array): void {
        if (!uniform) {
            return;
        }

        this._native.setMatrices(uniform, matrices);
    }

    public setMatrix3x3(uniform: WebGLUniformLocation, matrix: Float32Array): void {
        if (!uniform) {
            return;
        }

        this._native.setMatrix3x3(uniform, matrix);
    }

    public setMatrix2x2(uniform: WebGLUniformLocation, matrix: Float32Array): void {
        if (!uniform) {
            return;
        }

        this._native.setMatrix2x2(uniform, matrix);
    }

    public setFloat(uniform: WebGLUniformLocation, value: number): void {
        if (!uniform) {
            return;
        }

        this._native.setFloat(uniform, value);
    }

    public setFloat2(uniform: WebGLUniformLocation, x: number, y: number): void {
        if (!uniform) {
            return;
        }

        this._native.setFloat2(uniform, x, y);
    }

    public setFloat3(uniform: WebGLUniformLocation, x: number, y: number, z: number): void {
        if (!uniform) {
            return;
        }

        this._native.setFloat3(uniform, x, y, z);
    }

    public setFloat4(uniform: WebGLUniformLocation, x: number, y: number, z: number, w: number): void {
        if (!uniform) {
            return;
        }

        this._native.setFloat4(uniform, x, y, z, w);
    }

    public setColor3(uniform: WebGLUniformLocation, color3: Color3): void {
        if (!uniform) {
            return;
        }

        this._native.setFloat3(uniform, color3.r, color3.g, color3.b);
    }

    public setColor4(uniform: WebGLUniformLocation, color3: Color3, alpha: number): void {
        if (!uniform) {
            return;
        }

        this._native.setFloat4(uniform, color3.r, color3.g, color3.b, alpha);
    }

    public wipeCaches(bruteForce?: boolean): void {
        if (this.preventCacheWipeBetweenFrames) {
            return;
        }
        this.resetTextureCache();
        this._currentEffect = null;

        if (bruteForce) {
            this._currentProgram = null;

            this._stencilState.reset();
            this._depthCullingState.reset();
            this._alphaState.reset();
        }

        this._cachedVertexBuffers = null;
        this._cachedIndexBuffer = null;
        this._cachedEffectForVertexBuffers = null;
    }

    public _createTexture(): WebGLTexture {
        return this._native.createTexture();
    }

    protected _deleteTexture(texture: Nullable<WebGLTexture>): void {
        this._native.deleteTexture(texture);
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
     * @returns a InternalTexture for assignment back into BABYLON.Texture
     */
    public createTexture(url: Nullable<string>, noMipmap: boolean, invertY: boolean, scene: Nullable<ISceneLike>, samplingMode: number = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE,
        onLoad: Nullable<() => void> = null, onError: Nullable<(message: string, exception: any) => void> = null,
        buffer: Nullable<string | ArrayBuffer | ArrayBufferView | HTMLImageElement | Blob | ImageBitmap> = null, fallback: Nullable<InternalTexture> = null, format: Nullable<number> = null,
        forcedExtension: Nullable<string> = null, mimeType?: string): InternalTexture {
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
                this.createTexture(originalUrl, noMipmap, texture.invertY, scene, samplingMode, onLoad, onError, buffer, texture, format, forcedExtension, mimeType);
            }
        };

        // processing for non-image formats
        if (loader) {
            throw new Error("Loading textures from IInternalTextureLoader not yet implemented.");
        } else {
            const onload = (data: ArrayBufferView) => {
                const webGLTexture = texture._webGLTexture;
                if (!webGLTexture) {
                    if (scene) {
                        scene._removePendingData(texture);
                    }

                    return;
                }

                this._native.loadTexture(webGLTexture, data, !noMipmap, invertY, () => {
                    texture.baseWidth = this._native.getTextureWidth(webGLTexture);
                    texture.baseHeight = this._native.getTextureHeight(webGLTexture);
                    texture.width = texture.baseWidth;
                    texture.height = texture.baseHeight;
                    texture.isReady = true;

                    var filter = this._getSamplingFilter(samplingMode);
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

            if (fromData) {
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

                this._native.loadCubeTextureWithMips(texture._webGLTexture!, imageData, () => {
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
                return new Promise((resolve, reject) => {
                    this._native.loadCubeTexture(texture._webGLTexture!, data, !noMipmap, resolve, reject);
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

    // Returns a NativeFilter.XXXX value.
    private _getSamplingFilter(samplingMode: number): number {
        switch (samplingMode) {
            case Constants.TEXTURE_BILINEAR_SAMPLINGMODE:
                return NativeFilter.MINLINEAR_MAGLINEAR_MIPPOINT;
            case Constants.TEXTURE_TRILINEAR_SAMPLINGMODE:
                return NativeFilter.MINLINEAR_MAGLINEAR_MIPLINEAR;
            case Constants.TEXTURE_NEAREST_SAMPLINGMODE:
                return NativeFilter.MINPOINT_MAGPOINT_MIPLINEAR;
            case Constants.TEXTURE_NEAREST_NEAREST_MIPNEAREST:
                return NativeFilter.MINPOINT_MAGPOINT_MIPPOINT;
            case Constants.TEXTURE_NEAREST_LINEAR_MIPNEAREST:
                return NativeFilter.MINLINEAR_MAGPOINT_MIPPOINT;
            case Constants.TEXTURE_NEAREST_LINEAR_MIPLINEAR:
                return NativeFilter.MINLINEAR_MAGPOINT_MIPLINEAR;
            case Constants.TEXTURE_NEAREST_LINEAR:
                return NativeFilter.MINLINEAR_MAGPOINT_MIPLINEAR;
            case Constants.TEXTURE_NEAREST_NEAREST:
                return NativeFilter.MINPOINT_MAGPOINT_MIPPOINT;
            case Constants.TEXTURE_LINEAR_NEAREST_MIPNEAREST:
                return NativeFilter.MINPOINT_MAGLINEAR_MIPPOINT;
            case Constants.TEXTURE_LINEAR_NEAREST_MIPLINEAR:
                return NativeFilter.MINPOINT_MAGLINEAR_MIPLINEAR;
            case Constants.TEXTURE_LINEAR_LINEAR:
                return NativeFilter.MINLINEAR_MAGLINEAR_MIPLINEAR;
            case Constants.TEXTURE_LINEAR_NEAREST:
                return NativeFilter.MINPOINT_MAGLINEAR_MIPLINEAR;
            case Constants.TEXTURE_NEAREST_NEAREST_MIPLINEAR:
                return NativeFilter.MINPOINT_MAGPOINT_MIPLINEAR;
            case Constants.TEXTURE_LINEAR_LINEAR_MIPNEAREST:
                return NativeFilter.MINLINEAR_MAGLINEAR_MIPLINEAR;
            default:
                throw new Error("Unexpected sampling mode: " + samplingMode + ".");
        }
    }

    private static _GetNativeTextureFormat(format: number, type: number): number {
        if (format == Constants.TEXTUREFORMAT_RGBA && type == Constants.TEXTURETYPE_UNSIGNED_INT) {
            return NativeTextureFormat.RGBA8;
        }
        else if (format == Constants.TEXTUREFORMAT_RGBA && type == Constants.TEXTURETYPE_FLOAT) {
            return NativeTextureFormat.RGBA32F;
        }
        else {
            throw new Error("Unexpected texture format or type: format " + format + ", type " + type + ".");
        }
    }

    public createRenderTargetTexture(size: number | { width: number, height: number }, options: boolean | RenderTargetCreationOptions): NativeTexture {
        let fullOptions = new RenderTargetCreationOptions();

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
        var texture = new NativeTexture(this, InternalTextureSource.RenderTarget);

        var width = (<{ width: number, height: number }>size).width || <number>size;
        var height = (<{ width: number, height: number }>size).height || <number>size;

        if (fullOptions.type === Constants.TEXTURETYPE_FLOAT && !this._caps.textureFloat) {
            fullOptions.type = Constants.TEXTURETYPE_UNSIGNED_INT;
            Logger.Warn("Float textures are not supported. Render target forced to TEXTURETYPE_UNSIGNED_BYTE type");
        }

        var framebuffer = this._native.createFramebuffer(
            texture._webGLTexture!,
            width,
            height,
            NativeEngine._GetNativeTextureFormat(fullOptions.format, fullOptions.type),
            fullOptions.samplingMode!,
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
        if (texture._webGLTexture) {
            var filter = this._getSamplingFilter(samplingMode);
            this._native.setTextureSampling(texture._webGLTexture, filter);
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
            throw new Error("forceFullscreenViewport for frame buffers not yet supported in NativeEngine.");
        }

        this._bindUnboundFramebuffer(texture._framebuffer);
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
            !internalTexture._webGLTexture) {
            return false;
        }

        this._native.setTextureWrapMode(
            internalTexture._webGLTexture,
            this._getAddressMode(texture.wrapU),
            this._getAddressMode(texture.wrapV),
            this._getAddressMode(texture.wrapR));
        this._updateAnisotropicLevel(texture);

        this._native.setTexture(uniform, internalTexture._webGLTexture);

        return true;
    }

    // TODO: Share more of this logic with the base implementation.
    // TODO: Rename to match naming in base implementation once refactoring allows different parameters.
    private _updateAnisotropicLevel(texture: BaseTexture) {
        var internalTexture = texture.getInternalTexture();
        var value = texture.anisotropicFilteringLevel;

        if (!internalTexture || !internalTexture._webGLTexture) {
            return;
        }

        if (internalTexture._cachedAnisotropicFilteringLevel !== value) {
            this._native.setTextureAnisotropicLevel(internalTexture._webGLTexture, value);
            internalTexture._cachedAnisotropicFilteringLevel = value;
        }
    }

    // Returns a NativeAddressMode.XXX value.
    private _getAddressMode(wrapMode: number): number {
        switch (wrapMode) {
            case Constants.TEXTURE_WRAP_ADDRESSMODE:
                return NativeAddressMode.WRAP;
            case Constants.TEXTURE_CLAMP_ADDRESSMODE:
                return NativeAddressMode.CLAMP;
            case Constants.TEXTURE_MIRROR_ADDRESSMODE:
                return NativeAddressMode.MIRROR;
            default:
                throw new Error("Unexpected wrap mode: " + wrapMode + ".");
        }
    }

    /** @hidden */
    public _bindTexture(channel: number, texture: InternalTexture): void {
        throw new Error("_bindTexture not implemented.");
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
}
