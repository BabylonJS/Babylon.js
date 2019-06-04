import { Nullable, IndicesArray, DataArray } from "../types";
import { Engine, EngineCapabilities } from "../Engines/engine";
import { VertexBuffer } from "../Meshes/buffer";
import { InternalTexture } from "../Materials/Textures/internalTexture";
import { IInternalTextureLoader } from "../Materials/Textures/internalTextureLoader";
import { Texture } from "../Materials/Textures/texture";
import { BaseTexture } from "../Materials/Textures/baseTexture";
import { VideoTexture } from "../Materials/Textures/videoTexture";
import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import { Effect, EffectCreationOptions, EffectFallbacks } from "../Materials/effect";
import { DataBuffer } from '../Meshes/dataBuffer';
import { Tools } from "../Misc/tools";
import { Observer } from "../Misc/observable";
import { EnvironmentTextureTools, EnvironmentTextureSpecularInfoV1 } from "../Misc/environmentTextureTools";
import { Color4, Matrix, Viewport, Color3 } from "../Maths/math";
import { Scene } from "../scene";
import { RenderTargetCreationOptions } from "../Materials/Textures/renderTargetCreationOptions";
import { IPipelineContext } from './IPipelineContext';
import { WebRequest } from '../Misc/webRequest';
import { NativeShaderProcessor } from './Native/nativeShaderProcessor';

interface INativeEngine {
    requestAnimationFrame(callback: () => void): void;

    createVertexArray(): any;
    deleteVertexArray(vertexArray: any): void;
    bindVertexArray(vertexArray: any): void;

    createIndexBuffer(data: ArrayBufferView): any;
    deleteIndexBuffer(buffer: any): void;
    recordIndexBuffer(vertexArray: any, buffer: any): void;

    createVertexBuffer(data: ArrayBufferView, byteStride: number, infos: Array<{ location: number, numElements: number, type: number, normalized: boolean, byteOffset: number }>): any;
    deleteVertexBuffer(buffer: any): void;
    recordVertexBuffer(vertexArray: any, buffer: any): void;

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
    setBool(uniform: WebGLUniformLocation, bool: number): void;
    setFloat4(uniform: WebGLUniformLocation, x: number, y: number, z: number, w: number): void;

    createTexture(): WebGLTexture;
    loadTexture(texture: WebGLTexture, buffer: ArrayBuffer | Blob, mipMap: boolean): void;
    loadCubeTexture(texture: WebGLTexture, data: Array<Array<ArrayBufferView>>, flipY : boolean): void;
    getTextureWidth(texture: WebGLTexture): number;
    getTextureHeight(texture: WebGLTexture): number;
    setTextureSampling(texture: WebGLTexture, filter: number): void; // filter is a NativeFilter.XXXX value.
    setTextureWrapMode(texture: WebGLTexture, addressModeU: number, addressModeV: number, addressModeW: number): void; // addressModes are NativeAddressMode.XXXX values.
    setTextureAnisotropicLevel(texture: WebGLTexture, value: number): void;
    setTexture(uniform: WebGLUniformLocation, texture: Nullable<WebGLTexture>): void;
    deleteTexture(texture: Nullable<WebGLTexture>): void;

    drawIndexed(fillMode: number, indexStart: number, indexCount: number): void;
    draw(fillMode: number, vertexStart: number, vertexCount: number): void;

    clear(r: number, g: number, b: number, a: number, backBuffer: boolean, depth: boolean, stencil: boolean): void;

    getRenderWidth(): number;
    getRenderHeight(): number;
}

class NativePipelineContext implements IPipelineContext {
    // TODO: async should be true?
    public isAsync = false;
    public isReady = false;

    // TODO: what should this do?
    public _handlesSpectorRebuildCallback(onCompiled: (compiledObject: any) => void): void {
        throw new Error("Not implemented");
    }

    public nativeProgram: any;
}

class NativeDataBuffer extends DataBuffer {
    constructor(id: number, data: DataArray) {
        super();
        this.id = id;
        this.data = data;
    }

    public readonly id: number;
    public readonly data: DataArray;
    public nativeIndexBuffer?: any;
    public nativeVertexBuffer?: any;
}

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

// Must match AddressMode enum in SpectreEngine.h.
class NativeAddressMode {
    public static readonly WRAP = 0;
    public static readonly MIRROR = 1;
    public static readonly CLAMP = 2;
    public static readonly BORDER = 3;
    public static readonly MIRROR_ONCE = 4;
}

// Must match BlendMode in SpectreEngine.h.
class NativeBlendMode {
    public static readonly REPLACE = 0;
    public static readonly OVER = 1;
    public static readonly UNDER = 2;
    public static readonly INSIDE = 3;
    public static readonly ERASE = 4;
    public static readonly NULL = 5;
    public static readonly CLEAR = 6;
    public static readonly STRAIGHT_REPLACE = 7;
    public static readonly STRAIGHT_OVER = 8;
    public static readonly STRAIGHT_ADD = 9;
    public static readonly ADD = 10;
    public static readonly SCREEN = 11;
    public static readonly MULTIPLY = 12;
    public static readonly MULTIPLY2X = 13;
    public static readonly INTERPOLATE = 14;
    public static readonly MINIMUM = 15;
    public static readonly MAXIMUM = 16;
    public static readonly MAXIMUM_ALPHA = 17;
    public static readonly ADD_ALPHA = 18;
    public static readonly BLACK_REPLACE = 19;
    public static readonly BLACK_OVER = 20;
    public static readonly BLACK_UNDER = 21;
    public static readonly BLACK_INSIDE = 22;
    public static readonly ALPHA_COVERAGE_MASK = 23;
    public static readonly DUAL_COLOR_MULTIPLY_ADD = 24;
    public static readonly COMBINE = 25;
    public static readonly BLEND_OPAQUE = NativeBlendMode.REPLACE;
    public static readonly BLEND_ALPHA_PREMULTIPLIED = NativeBlendMode.OVER;
    public static readonly BLEND_ALPHA_STRAIGHT = NativeBlendMode.STRAIGHT_OVER;
}

/** @hidden */
declare var nativeEngine: INativeEngine;

/** @hidden */
export class NativeEngineOptions {
    public textureSize = 512;

    public deterministicLockstep = false;
    public lockstepMaxSteps = 4;
}

/** @hidden */
export class NativeEngine extends Engine {
    private readonly _native: INativeEngine = nativeEngine;
    private readonly _options: NativeEngineOptions;

    private _nextBufferId = 0;

    public isDeterministicLockStep(): boolean {
        return this._options.deterministicLockstep;
    }

    public getLockstepMaxSteps(): number {
        return this._options.lockstepMaxSteps;
    }

    public getHardwareScalingLevel(): number {
        return 1.0;
    }

    public constructor(options: NativeEngineOptions = new NativeEngineOptions()) {
        super(null);

        if (options.deterministicLockstep === undefined) {
            options.deterministicLockstep = false;
        }

        if (options.lockstepMaxSteps === undefined) {
            options.lockstepMaxSteps = 4;
        }

        this._options = options;

        this._webGLVersion = 2;
        this.disableUniformBuffers = true;

        // TODO: Initialize this more correctly based on the hardware capabilities.
        // Init caps

        this._caps = new EngineCapabilities();
        this._caps.maxTexturesImageUnits = 16;
        this._caps.maxVertexTextureImageUnits = 16;
        this._caps.maxTextureSize = 512;
        this._caps.maxCubemapTextureSize = 512;
        this._caps.maxRenderTextureSize = 512;
        this._caps.maxVertexAttribs = 16;
        this._caps.maxVaryingVectors = 16;
        this._caps.maxFragmentUniformVectors = 16;
        this._caps.maxVertexUniformVectors = 16;

        // Extensions
        this._caps.standardDerivatives = true;

        this._caps.astc = null;
        this._caps.s3tc = null;
        this._caps.pvrtc = null;
        this._caps.etc1 = null;
        this._caps.etc2 = null;

        this._caps.maxAnisotropy = 16;  // TODO: Retrieve this smartly. Currently set to D3D11 maximum allowable value.
        this._caps.uintIndices = false;
        this._caps.fragmentDepthSupported = false;
        this._caps.highPrecisionShaderSupported = true;

        this._caps.colorBufferFloat = false;
        this._caps.textureFloat = false;
        this._caps.textureFloatLinearFiltering = false;
        this._caps.textureFloatRender = false;

        this._caps.textureHalfFloat = false;
        this._caps.textureHalfFloatLinearFiltering = false;
        this._caps.textureHalfFloatRender = false;

        this._caps.textureLOD = true;
        this._caps.drawBuffersExtension = false;

        this._caps.depthTextureExtension = false;
        this._caps.vertexArrayObject = true;
        this._caps.instancedArrays = false;

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
        this._shaderProcessor = new NativeShaderProcessor();
    }

    /**
     * Can be used to override the current requestAnimationFrame requester.
     * @hidden
     */
    protected _queueNewFrame(bindedRenderFunction: any, requester: any): number {
        this._native.requestAnimationFrame(bindedRenderFunction);
        return 0;
    }

    public clear(color: Color4, backBuffer: boolean, depth: boolean, stencil: boolean = false): void {
        this._native.clear(color.r, color.g, color.b, color.a, backBuffer, depth, stencil);
    }

    public createIndexBuffer(indices: IndicesArray): NativeDataBuffer {
        const data = this._normalizeIndexData(indices);
        const buffer = new NativeDataBuffer(this._nextBufferId++, data);
        buffer.references = 1;
        buffer.is32Bits = (data.BYTES_PER_ELEMENT === 4);
        return buffer;
    }

    public createVertexBuffer(data: DataArray): NativeDataBuffer {
        const buffer = new NativeDataBuffer(this._nextBufferId++, data);
        buffer.references = 1;
        return buffer;
    }

    public recordVertexArrayObject(vertexBuffers: { [key: string]: VertexBuffer; }, indexBuffer: Nullable<NativeDataBuffer>, effect: Effect): WebGLVertexArrayObject {
        const vertexArray = this._native.createVertexArray();

        // Index
        if (indexBuffer) {
            if (!indexBuffer.nativeIndexBuffer) {
                indexBuffer.nativeIndexBuffer = this._native.createIndexBuffer(indexBuffer.data as ArrayBufferView);
            }

            this._native.recordIndexBuffer(vertexArray, indexBuffer.nativeIndexBuffer);
        }

        // Vertex

        // Map the vertex buffers that point to the same underlying buffer.
        const map: { [id: number]: { buffer: NativeDataBuffer, byteStride: number, infos: Array<{ location: number, numElements: number, type: number, normalized: boolean, byteOffset: number }> } } = {};
        const attributes = effect.getAttributesNames();
        for (let index = 0; index < attributes.length; index++) {
            const location = effect.getAttributeLocation(index);
            if (location >= 0) {
                const kind = attributes[index];
                const vertexBuffer = vertexBuffers[kind];
                if (vertexBuffer) {
                    const buffer = vertexBuffer.getBuffer() as Nullable<NativeDataBuffer>;
                    if (buffer) {
                        let entry = map[buffer.id];
                        if (!entry) {
                            entry = { buffer: buffer, byteStride: vertexBuffer.byteStride, infos: [] };
                            map[buffer.id] = entry;
                        }

                        // TODO: check if byteStride matches for all vertex buffers??

                        entry.infos.push({
                            location: location,
                            numElements: vertexBuffer.getSize(),
                            type: vertexBuffer.type,
                            normalized: vertexBuffer.normalized,
                            byteOffset: vertexBuffer.byteOffset
                        });
                    }
                }
            }
        }

        // Record vertex buffer for each unique buffer.
        for (const id in map) {
            const entry = map[id];
            const buffer = entry.buffer;
            if (!buffer.nativeVertexBuffer) {
                // TODO: handle non-normalized non-float data (shader always expects float data)

                const data = ArrayBuffer.isView(buffer.data) ? buffer.data : new Float32Array(buffer.data);
                buffer.nativeVertexBuffer = this._native.createVertexBuffer(data, entry.byteStride, entry.infos);
            }
            this._native.recordVertexBuffer(vertexArray, buffer.nativeVertexBuffer);
        }

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

    /**
     * Create a new effect (used to store vertex/fragment shaders)
     * @param baseName defines the base name of the effect (The name of file without .fragment.fx or .vertex.fx)
     * @param attributesNamesOrOptions defines either a list of attribute names or an EffectCreationOptions object
     * @param uniformsNamesOrEngine defines either a list of uniform names or the engine to use
     * @param samplers defines an array of string used to represent textures
     * @param defines defines the string containing the defines to use to compile the shaders
     * @param fallbacks defines the list of potential fallbacks to use if shader conmpilation fails
     * @param onCompiled defines a function to call when the effect creation is successful
     * @param onError defines a function to call when the effect creation has failed
     * @param indexParameters defines an object containing the index values to use to compile shaders (like the maximum number of simultaneous lights)
     * @returns the new Effect
     */
    public createEffect(baseName: any, attributesNamesOrOptions: string[] | EffectCreationOptions, uniformsNamesOrEngine: string[] | Engine, samplers?: string[], defines?: string, fallbacks?: EffectFallbacks,
        onCompiled?: (effect: Effect) => void, onError?: (effect: Effect, errors: string) => void, indexParameters?: any): Effect {
        var vertex = baseName.vertexElement || baseName.vertex || baseName;
        var fragment = baseName.fragmentElement || baseName.fragment || baseName;

        var name = vertex + "+" + fragment + "@" + (defines ? defines : (<EffectCreationOptions>attributesNamesOrOptions).defines);
        if (this._compiledEffects[name]) {
            var compiledEffect = <Effect>this._compiledEffects[name];
            if (onCompiled && compiledEffect.isReady()) {
                onCompiled(compiledEffect);
            }

            return compiledEffect;
        }
        var effect = new Effect(baseName, attributesNamesOrOptions, uniformsNamesOrEngine, samplers, this, defines, fallbacks, onCompiled, onError, indexParameters, false);
        effect._key = name;
        this._compiledEffects[name] = effect;

        return effect;
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
        // TODO: Implement.
        this._cachedViewport = viewport;
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
     * @param mode defines the mode to use (one of the BABYLON.Engine.ALPHA_XXX)
     * @param noDepthWriteChange defines if depth writing state should remains unchanged (false by default)
     * @see http://doc.babylonjs.com/resources/transparency_and_how_meshes_are_rendered
     */
    public setAlphaMode(mode: number, noDepthWriteChange: boolean = false): void {
        if (this._alphaMode === mode) {
            return;
        }

        this._native.setBlendMode(this._getBlendMode(mode));

        if (!noDepthWriteChange) {
            this.setDepthWrite(mode === Engine.ALPHA_DISABLE);
        }

        this._alphaMode = mode;
    }

    // Returns a NativeBlendMode.XXXX value.
    // Note: Many blend modes intentionally not implemented. If more are needed, they should be added.
    private _getBlendMode(mode: number): number {
        switch (mode) {
            case Engine.ALPHA_DISABLE:
                return NativeBlendMode.REPLACE;
            case Engine.ALPHA_PREMULTIPLIED_PORTERDUFF:
                return NativeBlendMode.OVER;
            case Engine.ALPHA_COMBINE:
                return NativeBlendMode.COMBINE;
            case Engine.ALPHA_SCREENMODE:
                return NativeBlendMode.SCREEN;
            default:
                throw new Error("Unexpected alpha mode: " + mode + ".");
        }
    }

    /**
     * Gets the current alpha mode
     * @see http://doc.babylonjs.com/resources/transparency_and_how_meshes_are_rendered
     * @returns the current alpha mode
     */
    public getAlphaMode(): number {
        return this._alphaMode;
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

    public setBool(uniform: WebGLUniformLocation, bool: number): void {
        if (!uniform) {
            return;
        }

        this._native.setBool(uniform, bool);
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
     * Usually called from BABYLON.Texture.ts.
     * Passed information to create a WebGLTexture
     * @param urlArg defines a value which contains one of the following:
     * * A conventional http URL, e.g. 'http://...' or 'file://...'
     * * A base64 string of in-line texture data, e.g. 'data:image/jpg;base64,/...'
     * * An indicator that data being passed using the buffer parameter, e.g. 'data:mytexture.jpg'
     * @param noMipmap defines a boolean indicating that no mipmaps shall be generated.  Ignored for compressed textures.  They must be in the file
     * @param invertY when true, image is flipped when loaded.  You probably want true. Ignored for compressed textures.  Must be flipped in the file
     * @param scene needed for loading to the correct scene
     * @param samplingMode mode with should be used sample / access the texture (Default: BABYLON.Texture.TRILINEAR_SAMPLINGMODE)
     * @param onLoad optional callback to be called upon successful completion
     * @param onError optional callback to be called upon failure
     * @param buffer a source of a file previously fetched as either a base64 string, an ArrayBuffer (compressed or image format), or a Blob
     * @param fallback an internal argument in case the function must be called again, due to etc1 not having alpha capabilities
     * @param format internal format.  Default: RGB when extension is '.jpg' else RGBA.  Ignored for compressed textures
     * @param forcedExtension defines the extension to use to pick the right loader
     * @returns a InternalTexture for assignment back into BABYLON.Texture
     */
    public createTexture(
        urlArg: Nullable<string>,
        noMipmap: boolean,
        invertY: boolean,
        scene: Nullable<Scene>,
        samplingMode: number = Engine.TEXTURE_TRILINEAR_SAMPLINGMODE,
        onLoad: Nullable<() => void> = null,
        onError: Nullable<(message: string, exception: any) => void> = null,
        buffer: Nullable<string | ArrayBuffer | Blob> = null,
        fallback: Nullable<InternalTexture> = null,
        format: Nullable<number> = null,
        forcedExtension: Nullable<string> = null): InternalTexture {
        var url = String(urlArg); // assign a new string, so that the original is still available in case of fallback
        var fromData = url.substr(0, 5) === "data:";
        var fromBlob = url.substr(0, 5) === "blob:";
        var isBase64 = fromData && url.indexOf("base64") !== -1;

        let texture = fallback ? fallback : new InternalTexture(this, InternalTexture.DATASOURCE_URL);

        // establish the file extension, if possible
        var lastDot = url.lastIndexOf('.');
        var extension = forcedExtension ? forcedExtension : (lastDot > -1 ? url.substring(lastDot).toLowerCase() : "");

        // TODO: Add support for compressed texture formats.
        var textureFormatInUse: Nullable<string> = null;

        let loader: Nullable<IInternalTextureLoader> = null;
        for (let availableLoader of Engine._TextureLoaders) {
            if (availableLoader.canLoad(extension, textureFormatInUse, fallback, isBase64, buffer ? true : false)) {
                loader = availableLoader;
                break;
            }
        }

        if (loader) {
            url = loader.transformUrl(url, textureFormatInUse);
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

            let customFallback = false;
            if (loader) {
                const fallbackUrl = loader.getFallbackTextureUrl(url, textureFormatInUse);
                if (fallbackUrl) {
                    // Add Back
                    customFallback = true;
                    this.createTexture(urlArg, noMipmap, invertY, scene, samplingMode, null, onError, buffer, texture);
                }
            }

            if (!customFallback) {
                if (onLoadObserver) {
                    texture.onLoadedObservable.remove(onLoadObserver);
                }
                if (Tools.UseFallbackTexture) {
                    this.createTexture(Tools.fallbackTexture, noMipmap, invertY, scene, samplingMode, null, onError, buffer, texture);
                }
            }

            if (onError) {
                onError(message || "Unknown error", exception);
            }
        };

        // processing for non-image formats
        if (loader) {
            throw new Error("Loading textures from IInternalTextureLoader not yet implemented.");
            // var callback = (data: string | ArrayBuffer) => {
            //     loader!.loadData(data as ArrayBuffer, texture, (width: number, height: number, loadMipmap: boolean, isCompressed: boolean, done: () => void) => {
            //         this._prepareWebGLTexture(texture, scene, width, height, invertY, !loadMipmap, isCompressed, () => {
            //                 done();
            //                 return false;
            //             },
            //             samplingMode);
            //     });
            // }

            // if (!buffer) {
            //     this._loadFile(url, callback, undefined, scene ? scene.database : undefined, true, (request?: XMLHttpRequest, exception?: any) => {
            //         onInternalError("Unable to load " + (request ? request.responseURL : url, exception));
            //     });
            // } else {
            //     callback(buffer as ArrayBuffer);
            // }
        } else {
            var onload = (data: string | ArrayBuffer | Blob, responseURL?: string) => {
                if (typeof (data) === "string") {
                    throw new Error("Loading textures from string data not yet implemented.");
                }

                if (fromBlob && !this.doNotHandleContextLost) {
                    // We need to store the image if we need to rebuild the texture
                    // in case of a webgl context lost
                    texture._buffer = data;
                }

                let webGLTexture = texture._webGLTexture;

                if (!webGLTexture) {
                    //  this.resetTextureCache();
                    if (scene) {
                        scene._removePendingData(texture);
                    }

                    return;
                }

                this._native.loadTexture(webGLTexture, data, !noMipmap);

                if (invertY) {
                    throw new Error("Support for textures with inverted Y coordinates not yet implemented.");
                }
                //this._unpackFlipY(invertY === undefined ? true : (invertY ? true : false));

                texture.baseWidth = this._native.getTextureWidth(webGLTexture);
                texture.baseHeight = this._native.getTextureHeight(webGLTexture);
                texture.width = texture.baseWidth;
                texture.height = texture.baseHeight;
                texture.isReady = true;

                var filter = this._getSamplingFilter(samplingMode);

                this._native.setTextureSampling(webGLTexture, filter);

                // this.resetTextureCache();
                if (scene) {
                    scene._removePendingData(texture);
                }

                texture.onLoadedObservable.notifyObservers(texture);
                texture.onLoadedObservable.clear();
            };

            if (buffer instanceof ArrayBuffer) {
                onload(buffer);
            } else if (buffer instanceof Blob) {
                throw new Error("Loading texture from Blob not yet implemented.");
            } else if (!fromData) {
                let onLoadFileError = (request?: WebRequest, exception?: any) => {
                    onInternalError("Failed to retrieve " + url + ".", exception);
                };
                Tools.LoadFile(url, onload, undefined, undefined, /*useArrayBuffer*/true, onLoadFileError);
            } else {
                onload(Tools.DecodeBase64(buffer as string));
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
        var texture = fallback ? fallback : new InternalTexture(this, InternalTexture.DATASOURCE_CUBE);
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

        if (extension === ".env") {
            const onloaddata = (data: any) => {
                data = data as ArrayBuffer;

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

                texture.format = Engine.TEXTUREFORMAT_RGBA;
                texture.type = Engine.TEXTURETYPE_UNSIGNED_INT;
                texture.generateMipMaps = true;
                texture.getEngine().updateTextureSamplingMode(Texture.TRILINEAR_SAMPLINGMODE, texture);
                texture._isRGBD = true;
                texture.invertY = true;
                this._native.loadCubeTexture(texture._webGLTexture!, imageData, true);

                texture.isReady = true;
                if (onLoad) {
                    onLoad();
                }
            };
            if (files && files.length === 6) {
                throw new Error(`Multi-file loading not yet supported.`);
            }
            else {
                let onInternalError = (request?: WebRequest, exception?: any) => {
                    if (onError && request) {
                        onError(request.status + " " + request.statusText, exception);
                    }
                };

                this._loadFile(rootUrl, onloaddata, undefined, undefined, true, onInternalError);
            }
        }
        else {
            throw new Error("Cannot load cubemap: non-ENV format not supported.");
        }

        this._internalTexturesCache.push(texture);

        return texture;
    }

    // Returns a NativeFilter.XXXX value.
    private _getSamplingFilter(samplingMode: number): number {
        switch (samplingMode) {
            case Engine.TEXTURE_BILINEAR_SAMPLINGMODE:
                return NativeFilter.MINLINEAR_MAGLINEAR_MIPPOINT;
            case Engine.TEXTURE_TRILINEAR_SAMPLINGMODE:
                return NativeFilter.MINLINEAR_MAGLINEAR_MIPLINEAR;
            case Engine.TEXTURE_NEAREST_SAMPLINGMODE:
                return NativeFilter.MINPOINT_MAGPOINT_MIPLINEAR;
            case Engine.TEXTURE_NEAREST_NEAREST_MIPNEAREST:
                return NativeFilter.MINPOINT_MAGPOINT_MIPPOINT;
            case Engine.TEXTURE_NEAREST_LINEAR_MIPNEAREST:
                return NativeFilter.MINLINEAR_MAGPOINT_MIPPOINT;
            case Engine.TEXTURE_NEAREST_LINEAR_MIPLINEAR:
                return NativeFilter.MINLINEAR_MAGPOINT_MIPLINEAR;
            case Engine.TEXTURE_NEAREST_LINEAR:
                return NativeFilter.MINLINEAR_MAGPOINT_MIPLINEAR;
            case Engine.TEXTURE_NEAREST_NEAREST:
                return NativeFilter.MINPOINT_MAGPOINT_MIPPOINT;
            case Engine.TEXTURE_LINEAR_NEAREST_MIPNEAREST:
                return NativeFilter.MINPOINT_MAGLINEAR_MIPPOINT;
            case Engine.TEXTURE_LINEAR_NEAREST_MIPLINEAR:
                return NativeFilter.MINPOINT_MAGLINEAR_MIPLINEAR;
            case Engine.TEXTURE_LINEAR_LINEAR:
                return NativeFilter.MINLINEAR_MAGLINEAR_MIPLINEAR;
            case Engine.TEXTURE_LINEAR_NEAREST:
                return NativeFilter.MINPOINT_MAGLINEAR_MIPLINEAR;
            default:
                throw new Error("Unexpected sampling mode: " + samplingMode + ".");
        }
    }

    public createRenderTargetTexture(size: any, options: boolean | RenderTargetCreationOptions): InternalTexture {
        let fullOptions = new RenderTargetCreationOptions();

        if (options !== undefined && typeof options === "object") {
            fullOptions.generateMipMaps = options.generateMipMaps;
            fullOptions.generateDepthBuffer = options.generateDepthBuffer === undefined ? true : options.generateDepthBuffer;
            fullOptions.generateStencilBuffer = fullOptions.generateDepthBuffer && options.generateStencilBuffer;
            fullOptions.type = options.type === undefined ? Engine.TEXTURETYPE_UNSIGNED_INT : options.type;
            fullOptions.samplingMode = options.samplingMode === undefined ? Texture.TRILINEAR_SAMPLINGMODE : options.samplingMode;
        } else {
            fullOptions.generateMipMaps = <boolean>options;
            fullOptions.generateDepthBuffer = true;
            fullOptions.generateStencilBuffer = false;
            fullOptions.type = Engine.TEXTURETYPE_UNSIGNED_INT;
            fullOptions.samplingMode = Texture.TRILINEAR_SAMPLINGMODE;
        }
        var texture = new InternalTexture(this, InternalTexture.DATASOURCE_RENDERTARGET);

        var width = size.width || size;
        var height = size.height || size;

        texture._depthStencilBuffer = {};
        texture._framebuffer = {};
        texture.baseWidth = width;
        texture.baseHeight = height;
        texture.width = width;
        texture.height = height;
        texture.isReady = true;
        texture.samples = 1;
        texture.generateMipMaps = fullOptions.generateMipMaps ? true : false;
        texture.samplingMode = fullOptions.samplingMode;
        texture.type = fullOptions.type;
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
        throw new Error("bindFramebuffer not yet implemented.");
    }

    public unBindFramebuffer(texture: InternalTexture, disableGenerateMipMaps = false, onBeforeUnbind?: () => void): void {
        throw new Error("unBindFramebuffer not yet implemented.");
    }

    public createDynamicVertexBuffer(data: DataArray): DataBuffer {
        throw new Error("createDynamicVertexBuffer not yet implemented.");
    }

    public updateDynamicIndexBuffer(indexBuffer: DataBuffer, indices: IndicesArray, offset: number = 0): void {
        throw new Error("updateDynamicIndexBuffer not yet implemented.");
    }

    /**
     * Updates a dynamic vertex buffer.
     * @param vertexBuffer the vertex buffer to update
     * @param data the data used to update the vertex buffer
     * @param byteOffset the byte offset of the data (optional)
     * @param byteLength the byte length of the data (optional)
     */
    public updateDynamicVertexBuffer(vertexBuffer: DataBuffer, data: DataArray, byteOffset?: number, byteLength?: number): void {
        throw new Error("updateDynamicVertexBuffer not yet implemented.");
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
        } else if (texture.delayLoadState === Engine.DELAYLOADSTATE_NOTLOADED) { // Delay loading
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
            case Engine.TEXTURE_WRAP_ADDRESSMODE:
                return NativeAddressMode.WRAP;
            case Engine.TEXTURE_CLAMP_ADDRESSMODE:
                return NativeAddressMode.CLAMP;
            case Engine.TEXTURE_MIRROR_ADDRESSMODE:
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
