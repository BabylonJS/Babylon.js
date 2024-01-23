import { Logger } from "../Misc/logger";
import type { Nullable, FloatArray } from "../types";
import type { IMatrixLike, IVector3Like, IVector4Like, IColor3Like, IColor4Like } from "../Maths/math.like";
import type { Effect } from "./effect";
import type { ThinTexture } from "../Materials/Textures/thinTexture";
import type { DataBuffer } from "../Buffers/dataBuffer";
import type { ThinEngine } from "../Engines/thinEngine";
import type { InternalTexture } from "./Textures/internalTexture";
import { Tools } from "../Misc/tools";

import "../Engines/Extensions/engine.uniformBuffer";

/**
 * Uniform buffer objects.
 *
 * Handles blocks of uniform on the GPU.
 *
 * If WebGL 2 is not available, this class falls back on traditional setUniformXXX calls.
 *
 * For more information, please refer to :
 * https://www.khronos.org/opengl/wiki/Uniform_Buffer_Object
 */
export class UniformBuffer {
    /** @internal */
    public static _UpdatedUbosInFrame: { [name: string]: number } = {};

    private _engine: ThinEngine;
    private _buffer: Nullable<DataBuffer>;
    private _buffers: Array<[DataBuffer, Float32Array | undefined]>;
    private _bufferIndex: number;
    private _createBufferOnWrite: boolean;
    private _data: number[];
    private _bufferData: Float32Array;
    private _dynamic?: boolean;
    private _uniformLocations: { [key: string]: number };
    private _uniformSizes: { [key: string]: number };
    private _uniformArraySizes: { [key: string]: { strideSize: number; arraySize: number } };
    private _uniformLocationPointer: number;
    private _needSync: boolean;
    private _noUBO: boolean;
    private _currentEffect: Effect;
    private _currentEffectName: string;
    private _name: string;
    private _currentFrameId: number;

    // Pool for avoiding memory leaks
    private static _MAX_UNIFORM_SIZE = 256;
    private static _TempBuffer = new Float32Array(UniformBuffer._MAX_UNIFORM_SIZE);
    private static _TempBufferInt32View = new Int32Array(UniformBuffer._TempBuffer.buffer);
    private static _TempBufferUInt32View = new Uint32Array(UniformBuffer._TempBuffer.buffer);

    /**
     * Lambda to Update a 3x3 Matrix in a uniform buffer.
     * This is dynamic to allow compat with webgl 1 and 2.
     * You will need to pass the name of the uniform as well as the value.
     */
    public updateMatrix3x3: (name: string, matrix: Float32Array) => void;

    /**
     * Lambda to Update a 2x2 Matrix in a uniform buffer.
     * This is dynamic to allow compat with webgl 1 and 2.
     * You will need to pass the name of the uniform as well as the value.
     */
    public updateMatrix2x2: (name: string, matrix: Float32Array) => void;

    /**
     * Lambda to Update a single float in a uniform buffer.
     * This is dynamic to allow compat with webgl 1 and 2.
     * You will need to pass the name of the uniform as well as the value.
     */
    public updateFloat: (name: string, x: number) => void;

    /**
     * Lambda to Update a vec2 of float in a uniform buffer.
     * This is dynamic to allow compat with webgl 1 and 2.
     * You will need to pass the name of the uniform as well as the value.
     */
    public updateFloat2: (name: string, x: number, y: number, suffix?: string) => void;

    /**
     * Lambda to Update a vec3 of float in a uniform buffer.
     * This is dynamic to allow compat with webgl 1 and 2.
     * You will need to pass the name of the uniform as well as the value.
     */
    public updateFloat3: (name: string, x: number, y: number, z: number, suffix?: string) => void;

    /**
     * Lambda to Update a vec4 of float in a uniform buffer.
     * This is dynamic to allow compat with webgl 1 and 2.
     * You will need to pass the name of the uniform as well as the value.
     */
    public updateFloat4: (name: string, x: number, y: number, z: number, w: number, suffix?: string) => void;

    /**
     * Lambda to Update an array of float in a uniform buffer.
     * This is dynamic to allow compat with webgl 1 and 2.
     * You will need to pass the name of the uniform as well as the value.
     */
    public updateFloatArray: (name: string, array: Float32Array) => void;

    /**
     * Lambda to Update an array of number in a uniform buffer.
     * This is dynamic to allow compat with webgl 1 and 2.
     * You will need to pass the name of the uniform as well as the value.
     */
    public updateArray: (name: string, array: number[]) => void;

    /**
     * Lambda to Update an array of number in a uniform buffer.
     * This is dynamic to allow compat with webgl 1 and 2.
     * You will need to pass the name of the uniform as well as the value.
     */
    public updateIntArray: (name: string, array: Int32Array) => void;

    /**
     * Lambda to Update an array of number in a uniform buffer.
     * This is dynamic to allow compat with webgl 1 and 2.
     * You will need to pass the name of the uniform as well as the value.
     */
    public updateUIntArray: (name: string, array: Uint32Array) => void;

    /**
     * Lambda to Update a 4x4 Matrix in a uniform buffer.
     * This is dynamic to allow compat with webgl 1 and 2.
     * You will need to pass the name of the uniform as well as the value.
     */
    public updateMatrix: (name: string, mat: IMatrixLike) => void;

    /**
     * Lambda to Update an array of 4x4 Matrix in a uniform buffer.
     * This is dynamic to allow compat with webgl 1 and 2.
     * You will need to pass the name of the uniform as well as the value.
     */
    public updateMatrices: (name: string, mat: Float32Array) => void;

    /**
     * Lambda to Update vec3 of float from a Vector in a uniform buffer.
     * This is dynamic to allow compat with webgl 1 and 2.
     * You will need to pass the name of the uniform as well as the value.
     */
    public updateVector3: (name: string, vector: IVector3Like) => void;

    /**
     * Lambda to Update vec4 of float from a Vector in a uniform buffer.
     * This is dynamic to allow compat with webgl 1 and 2.
     * You will need to pass the name of the uniform as well as the value.
     */
    public updateVector4: (name: string, vector: IVector4Like) => void;

    /**
     * Lambda to Update vec3 of float from a Color in a uniform buffer.
     * This is dynamic to allow compat with webgl 1 and 2.
     * You will need to pass the name of the uniform as well as the value.
     */
    public updateColor3: (name: string, color: IColor3Like, suffix?: string) => void;

    /**
     * Lambda to Update vec4 of float from a Color in a uniform buffer.
     * This is dynamic to allow compat with webgl 1 and 2.
     * You will need to pass the name of the uniform as well as the value.
     */
    public updateColor4: (name: string, color: IColor3Like, alpha: number, suffix?: string) => void;

    /**
     * Lambda to Update vec4 of float from a Color in a uniform buffer.
     * This is dynamic to allow compat with webgl 1 and 2.
     * You will need to pass the name of the uniform as well as the value.
     */
    public updateDirectColor4: (name: string, color: IColor4Like, suffix?: string) => void;

    /**
     * Lambda to Update a int a uniform buffer.
     * This is dynamic to allow compat with webgl 1 and 2.
     * You will need to pass the name of the uniform as well as the value.
     */
    public updateInt: (name: string, x: number, suffix?: string) => void;

    /**
     * Lambda to Update a vec2 of int in a uniform buffer.
     * This is dynamic to allow compat with webgl 1 and 2.
     * You will need to pass the name of the uniform as well as the value.
     */
    public updateInt2: (name: string, x: number, y: number, suffix?: string) => void;

    /**
     * Lambda to Update a vec3 of int in a uniform buffer.
     * This is dynamic to allow compat with webgl 1 and 2.
     * You will need to pass the name of the uniform as well as the value.
     */
    public updateInt3: (name: string, x: number, y: number, z: number, suffix?: string) => void;

    /**
     * Lambda to Update a vec4 of int in a uniform buffer.
     * This is dynamic to allow compat with webgl 1 and 2.
     * You will need to pass the name of the uniform as well as the value.
     */
    public updateInt4: (name: string, x: number, y: number, z: number, w: number, suffix?: string) => void;

    /**
     * Lambda to Update a unsigned int a uniform buffer.
     * This is dynamic to allow compat with webgl 1 and 2.
     * You will need to pass the name of the uniform as well as the value.
     */
    public updateUInt: (name: string, x: number, suffix?: string) => void;

    /**
     * Lambda to Update a vec2 of unsigned int in a uniform buffer.
     * This is dynamic to allow compat with webgl 1 and 2.
     * You will need to pass the name of the uniform as well as the value.
     */
    public updateUInt2: (name: string, x: number, y: number, suffix?: string) => void;

    /**
     * Lambda to Update a vec3 of unsigned int in a uniform buffer.
     * This is dynamic to allow compat with webgl 1 and 2.
     * You will need to pass the name of the uniform as well as the value.
     */
    public updateUInt3: (name: string, x: number, y: number, z: number, suffix?: string) => void;

    /**
     * Lambda to Update a vec4 of unsigned int in a uniform buffer.
     * This is dynamic to allow compat with webgl 1 and 2.
     * You will need to pass the name of the uniform as well as the value.
     */
    public updateUInt4: (name: string, x: number, y: number, z: number, w: number, suffix?: string) => void;

    /**
     * Instantiates a new Uniform buffer objects.
     *
     * Handles blocks of uniform on the GPU.
     *
     * If WebGL 2 is not available, this class falls back on traditional setUniformXXX calls.
     *
     * For more information, please refer to :
     * @see https://www.khronos.org/opengl/wiki/Uniform_Buffer_Object
     * @param engine Define the engine the buffer is associated with
     * @param data Define the data contained in the buffer
     * @param dynamic Define if the buffer is updatable
     * @param name to assign to the buffer (debugging purpose)
     * @param forceNoUniformBuffer define that this object must not rely on UBO objects
     */
    constructor(engine: ThinEngine, data?: number[], dynamic?: boolean, name?: string, forceNoUniformBuffer = false) {
        this._engine = engine;
        this._noUBO = !engine.supportsUniformBuffers || forceNoUniformBuffer;
        this._dynamic = dynamic;
        this._name = name ?? "no-name";

        this._data = data || [];

        this._uniformLocations = {};
        this._uniformSizes = {};
        this._uniformArraySizes = {};
        this._uniformLocationPointer = 0;
        this._needSync = false;

        if (this._engine._features.trackUbosInFrame) {
            this._buffers = [];
            this._bufferIndex = -1;
            this._createBufferOnWrite = false;
            this._currentFrameId = 0;
        }

        if (this._noUBO) {
            this.updateMatrix3x3 = this._updateMatrix3x3ForEffect;
            this.updateMatrix2x2 = this._updateMatrix2x2ForEffect;
            this.updateFloat = this._updateFloatForEffect;
            this.updateFloat2 = this._updateFloat2ForEffect;
            this.updateFloat3 = this._updateFloat3ForEffect;
            this.updateFloat4 = this._updateFloat4ForEffect;
            this.updateFloatArray = this._updateFloatArrayForEffect;
            this.updateArray = this._updateArrayForEffect;
            this.updateIntArray = this._updateIntArrayForEffect;
            this.updateUIntArray = this._updateUIntArrayForEffect;
            this.updateMatrix = this._updateMatrixForEffect;
            this.updateMatrices = this._updateMatricesForEffect;
            this.updateVector3 = this._updateVector3ForEffect;
            this.updateVector4 = this._updateVector4ForEffect;
            this.updateColor3 = this._updateColor3ForEffect;
            this.updateColor4 = this._updateColor4ForEffect;
            this.updateDirectColor4 = this._updateDirectColor4ForEffect;
            this.updateInt = this._updateIntForEffect;
            this.updateInt2 = this._updateInt2ForEffect;
            this.updateInt3 = this._updateInt3ForEffect;
            this.updateInt4 = this._updateInt4ForEffect;
            this.updateUInt = this._updateUIntForEffect;
            this.updateUInt2 = this._updateUInt2ForEffect;
            this.updateUInt3 = this._updateUInt3ForEffect;
            this.updateUInt4 = this._updateUInt4ForEffect;
        } else {
            this._engine._uniformBuffers.push(this);

            this.updateMatrix3x3 = this._updateMatrix3x3ForUniform;
            this.updateMatrix2x2 = this._updateMatrix2x2ForUniform;
            this.updateFloat = this._updateFloatForUniform;
            this.updateFloat2 = this._updateFloat2ForUniform;
            this.updateFloat3 = this._updateFloat3ForUniform;
            this.updateFloat4 = this._updateFloat4ForUniform;
            this.updateFloatArray = this._updateFloatArrayForUniform;
            this.updateArray = this._updateArrayForUniform;
            this.updateIntArray = this._updateIntArrayForUniform;
            this.updateUIntArray = this._updateUIntArrayForUniform;
            this.updateMatrix = this._updateMatrixForUniform;
            this.updateMatrices = this._updateMatricesForUniform;
            this.updateVector3 = this._updateVector3ForUniform;
            this.updateVector4 = this._updateVector4ForUniform;
            this.updateColor3 = this._updateColor3ForUniform;
            this.updateColor4 = this._updateColor4ForUniform;
            this.updateDirectColor4 = this._updateDirectColor4ForUniform;
            this.updateInt = this._updateIntForUniform;
            this.updateInt2 = this._updateInt2ForUniform;
            this.updateInt3 = this._updateInt3ForUniform;
            this.updateInt4 = this._updateInt4ForUniform;
            this.updateUInt = this._updateUIntForUniform;
            this.updateUInt2 = this._updateUInt2ForUniform;
            this.updateUInt3 = this._updateUInt3ForUniform;
            this.updateUInt4 = this._updateUInt4ForUniform;
        }
    }

    /**
     * Indicates if the buffer is using the WebGL2 UBO implementation,
     * or just falling back on setUniformXXX calls.
     */
    public get useUbo(): boolean {
        return !this._noUBO;
    }

    /**
     * Indicates if the WebGL underlying uniform buffer is in sync
     * with the javascript cache data.
     */
    public get isSync(): boolean {
        return !this._needSync;
    }

    /**
     * Indicates if the WebGL underlying uniform buffer is dynamic.
     * Also, a dynamic UniformBuffer will disable cache verification and always
     * update the underlying WebGL uniform buffer to the GPU.
     * @returns if Dynamic, otherwise false
     */
    public isDynamic(): boolean {
        return this._dynamic !== undefined;
    }

    /**
     * The data cache on JS side.
     * @returns the underlying data as a float array
     */
    public getData(): Float32Array {
        return this._bufferData;
    }

    /**
     * The underlying WebGL Uniform buffer.
     * @returns the webgl buffer
     */
    public getBuffer(): Nullable<DataBuffer> {
        return this._buffer;
    }

    /**
     * std140 layout specifies how to align data within an UBO structure.
     * See https://khronos.org/registry/OpenGL/specs/gl/glspec45.core.pdf#page=159
     * for specs.
     * @param size
     */
    private _fillAlignment(size: number) {
        // This code has been simplified because we only use floats, vectors of 1, 2, 3, 4 components
        // and 4x4 matrices
        // TODO : change if other types are used

        let alignment;
        if (size <= 2) {
            alignment = size;
        } else {
            alignment = 4;
        }

        if (this._uniformLocationPointer % alignment !== 0) {
            const oldPointer = this._uniformLocationPointer;
            this._uniformLocationPointer += alignment - (this._uniformLocationPointer % alignment);
            const diff = this._uniformLocationPointer - oldPointer;

            for (let i = 0; i < diff; i++) {
                this._data.push(0);
            }
        }
    }

    /**
     * Adds an uniform in the buffer.
     * Warning : the subsequents calls of this function must be in the same order as declared in the shader
     * for the layout to be correct ! The addUniform function only handles types like float, vec2, vec3, vec4, mat4,
     * meaning size=1,2,3,4 or 16. It does not handle struct types.
     * @param name Name of the uniform, as used in the uniform block in the shader.
     * @param size Data size, or data directly.
     * @param arraySize The number of elements in the array, 0 if not an array.
     */
    public addUniform(name: string, size: number | number[], arraySize = 0) {
        if (this._noUBO) {
            return;
        }

        if (this._uniformLocations[name] !== undefined) {
            // Already existing uniform
            return;
        }
        // This function must be called in the order of the shader layout !
        // size can be the size of the uniform, or data directly
        let data;

        // std140 FTW...
        if (arraySize > 0) {
            if (size instanceof Array) {
                // eslint-disable-next-line no-throw-literal
                throw "addUniform should not be use with Array in UBO: " + name;
            }

            this._fillAlignment(4);

            this._uniformArraySizes[name] = { strideSize: size, arraySize };
            if (size == 16) {
                size = size * arraySize;
            } else {
                const perElementPadding = 4 - size;
                const totalPadding = perElementPadding * arraySize;
                size = size * arraySize + totalPadding;
            }

            data = [];
            // Fill with zeros
            for (let i = 0; i < size; i++) {
                data.push(0);
            }
        } else {
            if (size instanceof Array) {
                data = size;
                size = data.length;
            } else {
                size = <number>size;
                data = [];

                // Fill with zeros
                for (let i = 0; i < size; i++) {
                    data.push(0);
                }
            }
            this._fillAlignment(<number>size);
        }

        this._uniformSizes[name] = <number>size;
        this._uniformLocations[name] = this._uniformLocationPointer;
        this._uniformLocationPointer += <number>size;

        for (let i = 0; i < size; i++) {
            this._data.push(data[i]);
        }

        this._needSync = true;
    }

    /**
     * Adds a Matrix 4x4 to the uniform buffer.
     * @param name Name of the uniform, as used in the uniform block in the shader.
     * @param mat A 4x4 matrix.
     */
    public addMatrix(name: string, mat: IMatrixLike) {
        this.addUniform(name, Array.prototype.slice.call(mat.toArray()));
    }

    /**
     * Adds a vec2 to the uniform buffer.
     * @param name Name of the uniform, as used in the uniform block in the shader.
     * @param x Define the x component value of the vec2
     * @param y Define the y component value of the vec2
     */
    public addFloat2(name: string, x: number, y: number) {
        const temp = [x, y];
        this.addUniform(name, temp);
    }

    /**
     * Adds a vec3 to the uniform buffer.
     * @param name Name of the uniform, as used in the uniform block in the shader.
     * @param x Define the x component value of the vec3
     * @param y Define the y component value of the vec3
     * @param z Define the z component value of the vec3
     */
    public addFloat3(name: string, x: number, y: number, z: number) {
        const temp = [x, y, z];
        this.addUniform(name, temp);
    }

    /**
     * Adds a vec3 to the uniform buffer.
     * @param name Name of the uniform, as used in the uniform block in the shader.
     * @param color Define the vec3 from a Color
     */
    public addColor3(name: string, color: IColor3Like) {
        const temp = [color.r, color.g, color.b];
        this.addUniform(name, temp);
    }

    /**
     * Adds a vec4 to the uniform buffer.
     * @param name Name of the uniform, as used in the uniform block in the shader.
     * @param color Define the rgb components from a Color
     * @param alpha Define the a component of the vec4
     */
    public addColor4(name: string, color: IColor3Like, alpha: number) {
        const temp = [color.r, color.g, color.b, alpha];
        this.addUniform(name, temp);
    }

    /**
     * Adds a vec3 to the uniform buffer.
     * @param name Name of the uniform, as used in the uniform block in the shader.
     * @param vector Define the vec3 components from a Vector
     */
    public addVector3(name: string, vector: IVector3Like) {
        const temp = [vector.x, vector.y, vector.z];
        this.addUniform(name, temp);
    }

    /**
     * Adds a Matrix 3x3 to the uniform buffer.
     * @param name Name of the uniform, as used in the uniform block in the shader.
     */
    public addMatrix3x3(name: string) {
        this.addUniform(name, 12);
    }

    /**
     * Adds a Matrix 2x2 to the uniform buffer.
     * @param name Name of the uniform, as used in the uniform block in the shader.
     */
    public addMatrix2x2(name: string) {
        this.addUniform(name, 8);
    }

    /**
     * Effectively creates the WebGL Uniform Buffer, once layout is completed with `addUniform`.
     */
    public create(): void {
        if (this._noUBO) {
            return;
        }
        if (this._buffer) {
            return; // nothing to do
        }

        // See spec, alignment must be filled as a vec4
        this._fillAlignment(4);
        this._bufferData = new Float32Array(this._data);

        this._rebuild();

        this._needSync = true;
    }

    // The result of this method is used for debugging purpose, as part of the buffer name
    // It is meant to more easily know what this buffer is about when debugging
    // Some buffers can have a lot of uniforms (several dozens), so the method only returns the first 10 of them
    // (should be enough to understand what the buffer is for)
    private _getNames() {
        const names = [];
        let i = 0;
        for (const name in this._uniformLocations) {
            names.push(name);
            if (++i === 10) {
                break;
            }
        }
        return names.join(",");
    }

    /** @internal */
    public _rebuild(): void {
        if (this._noUBO || !this._bufferData) {
            return;
        }

        if (this._dynamic) {
            this._buffer = this._engine.createDynamicUniformBuffer(this._bufferData, this._name + "_UniformList:" + this._getNames());
        } else {
            this._buffer = this._engine.createUniformBuffer(this._bufferData, this._name + "_UniformList:" + this._getNames());
        }

        if (this._engine._features.trackUbosInFrame) {
            this._buffers.push([this._buffer, this._engine._features.checkUbosContentBeforeUpload ? this._bufferData.slice() : undefined]);
            this._bufferIndex = this._buffers.length - 1;
            this._createBufferOnWrite = false;
        }
    }

    /** @internal */
    public _rebuildAfterContextLost(): void {
        if (this._engine._features.trackUbosInFrame) {
            this._buffers = [];
            this._currentFrameId = 0;
        }
        this._rebuild();
    }

    /** @internal */
    public get _numBuffers(): number {
        return this._buffers.length;
    }

    /** @internal */
    public get _indexBuffer(): number {
        return this._bufferIndex;
    }

    /** Gets the name of this buffer */
    public get name(): string {
        return this._name;
    }

    /** Gets the current effect */
    public get currentEffect(): Nullable<Effect> {
        return this._currentEffect;
    }

    private _buffersEqual(buf1: Float32Array, buf2: Float32Array): boolean {
        for (let i = 0; i < buf1.length; ++i) {
            if (buf1[i] !== buf2[i]) {
                return false;
            }
        }
        return true;
    }

    private _copyBuffer(src: Float32Array, dst: Float32Array): void {
        for (let i = 0; i < src.length; ++i) {
            dst[i] = src[i];
        }
    }

    /**
     * Updates the WebGL Uniform Buffer on the GPU.
     * If the `dynamic` flag is set to true, no cache comparison is done.
     * Otherwise, the buffer will be updated only if the cache differs.
     */
    public update(): void {
        if (this._noUBO) {
            return;
        }

        this.bindUniformBuffer();

        if (!this._buffer) {
            this.create();
            return;
        }

        if (!this._dynamic && !this._needSync) {
            this._createBufferOnWrite = this._engine._features.trackUbosInFrame;
            return;
        }

        if (this._buffers && this._buffers.length > 1 && this._buffers[this._bufferIndex][1]) {
            if (this._buffersEqual(this._bufferData, this._buffers[this._bufferIndex][1]!)) {
                this._needSync = false;
                this._createBufferOnWrite = this._engine._features.trackUbosInFrame;
                return;
            } else {
                this._copyBuffer(this._bufferData, this._buffers[this._bufferIndex][1]!);
            }
        }

        this._engine.updateUniformBuffer(this._buffer, this._bufferData);

        if (this._engine._features._collectUbosUpdatedInFrame) {
            if (!UniformBuffer._UpdatedUbosInFrame[this._name]) {
                UniformBuffer._UpdatedUbosInFrame[this._name] = 0;
            }
            UniformBuffer._UpdatedUbosInFrame[this._name]++;
        }

        this._needSync = false;
        this._createBufferOnWrite = this._engine._features.trackUbosInFrame;
    }

    private _createNewBuffer() {
        if (this._bufferIndex + 1 < this._buffers.length) {
            this._bufferIndex++;
            this._buffer = this._buffers[this._bufferIndex][0];
            this._createBufferOnWrite = false;
            this._needSync = true;
        } else {
            this._rebuild();
        }
    }

    private _checkNewFrame(): void {
        if (this._engine._features.trackUbosInFrame && this._currentFrameId !== this._engine.frameId) {
            this._currentFrameId = this._engine.frameId;
            this._createBufferOnWrite = false;
            if (this._buffers && this._buffers.length > 0) {
                this._needSync = this._bufferIndex !== 0;
                this._bufferIndex = 0;
                this._buffer = this._buffers[this._bufferIndex][0];
            } else {
                this._bufferIndex = -1;
            }
        }
    }

    /**
     * Updates the value of an uniform. The `update` method must be called afterwards to make it effective in the GPU.
     * @param uniformName Define the name of the uniform, as used in the uniform block in the shader.
     * @param data Define the flattened data
     * @param size Define the size of the data.
     */
    public updateUniform(uniformName: string, data: FloatArray, size: number) {
        this._checkNewFrame();

        let location = this._uniformLocations[uniformName];
        if (location === undefined) {
            if (this._buffer) {
                // Cannot add an uniform if the buffer is already created
                Logger.Error("Cannot add an uniform after UBO has been created. uniformName=" + uniformName);
                return;
            }
            this.addUniform(uniformName, size);
            location = this._uniformLocations[uniformName];
        }

        if (!this._buffer) {
            this.create();
        }

        if (!this._dynamic) {
            // Cache for static uniform buffers
            let changed = false;

            for (let i = 0; i < size; i++) {
                // We are checking the matrix cache before calling updateUniform so we do not need to check it here
                // Hence the test for size === 16 to simply commit the matrix values
                if ((size === 16 && !this._engine._features.uniformBufferHardCheckMatrix) || this._bufferData[location + i] !== Math.fround(data[i])) {
                    changed = true;
                    if (this._createBufferOnWrite) {
                        this._createNewBuffer();
                    }
                    this._bufferData[location + i] = data[i];
                }
            }

            this._needSync = this._needSync || changed;
        } else {
            // No cache for dynamic
            for (let i = 0; i < size; i++) {
                this._bufferData[location + i] = data[i];
            }
        }
    }

    /**
     * Updates the value of an uniform. The `update` method must be called afterwards to make it effective in the GPU.
     * @param uniformName Define the name of the uniform, as used in the uniform block in the shader.
     * @param data Define the flattened data
     * @param size Define the size of the data.
     */
    public updateUniformArray(uniformName: string, data: FloatArray, size: number) {
        this._checkNewFrame();

        const location = this._uniformLocations[uniformName];
        if (location === undefined) {
            Logger.Error("Cannot add an uniform Array dynamically. Please, add it using addUniform and make sure that uniform buffers are supported by the current engine.");
            return;
        }

        if (!this._buffer) {
            this.create();
        }

        const arraySizes = this._uniformArraySizes[uniformName];

        if (!this._dynamic) {
            // Cache for static uniform buffers
            let changed = false;
            let countToFour = 0;
            let baseStride = 0;
            for (let i = 0; i < size; i++) {
                if (this._bufferData[location + baseStride * 4 + countToFour] !== Tools.FloatRound(data[i])) {
                    changed = true;
                    if (this._createBufferOnWrite) {
                        this._createNewBuffer();
                    }
                    this._bufferData[location + baseStride * 4 + countToFour] = data[i];
                }
                countToFour++;
                if (countToFour === arraySizes.strideSize) {
                    for (; countToFour < 4; countToFour++) {
                        this._bufferData[location + baseStride * 4 + countToFour] = 0;
                    }
                    countToFour = 0;
                    baseStride++;
                }
            }

            this._needSync = this._needSync || changed;
        } else {
            // No cache for dynamic
            for (let i = 0; i < size; i++) {
                this._bufferData[location + i] = data[i];
            }
        }
    }

    // Matrix cache
    private _valueCache: { [key: string]: number } = {};
    private _cacheMatrix(name: string, matrix: IMatrixLike): boolean {
        this._checkNewFrame();

        const cache = this._valueCache[name];
        const flag = matrix.updateFlag;
        if (cache !== undefined && cache === flag) {
            return false;
        }

        this._valueCache[name] = flag;
        return true;
    }

    // Update methods

    private _updateMatrix3x3ForUniform(name: string, matrix: Float32Array): void {
        // To match std140, matrix must be realigned
        for (let i = 0; i < 3; i++) {
            UniformBuffer._TempBuffer[i * 4] = matrix[i * 3];
            UniformBuffer._TempBuffer[i * 4 + 1] = matrix[i * 3 + 1];
            UniformBuffer._TempBuffer[i * 4 + 2] = matrix[i * 3 + 2];
            UniformBuffer._TempBuffer[i * 4 + 3] = 0.0;
        }

        this.updateUniform(name, UniformBuffer._TempBuffer, 12);
    }

    private _updateMatrix3x3ForEffect(name: string, matrix: Float32Array): void {
        this._currentEffect.setMatrix3x3(name, matrix);
    }

    private _updateMatrix2x2ForEffect(name: string, matrix: Float32Array): void {
        this._currentEffect.setMatrix2x2(name, matrix);
    }

    private _updateMatrix2x2ForUniform(name: string, matrix: Float32Array): void {
        // To match std140, matrix must be realigned
        for (let i = 0; i < 2; i++) {
            UniformBuffer._TempBuffer[i * 4] = matrix[i * 2];
            UniformBuffer._TempBuffer[i * 4 + 1] = matrix[i * 2 + 1];
            UniformBuffer._TempBuffer[i * 4 + 2] = 0.0;
            UniformBuffer._TempBuffer[i * 4 + 3] = 0.0;
        }

        this.updateUniform(name, UniformBuffer._TempBuffer, 8);
    }

    private _updateFloatForEffect(name: string, x: number) {
        this._currentEffect.setFloat(name, x);
    }

    private _updateFloatForUniform(name: string, x: number) {
        UniformBuffer._TempBuffer[0] = x;
        this.updateUniform(name, UniformBuffer._TempBuffer, 1);
    }

    private _updateFloat2ForEffect(name: string, x: number, y: number, suffix = "") {
        this._currentEffect.setFloat2(name + suffix, x, y);
    }

    private _updateFloat2ForUniform(name: string, x: number, y: number) {
        UniformBuffer._TempBuffer[0] = x;
        UniformBuffer._TempBuffer[1] = y;
        this.updateUniform(name, UniformBuffer._TempBuffer, 2);
    }

    private _updateFloat3ForEffect(name: string, x: number, y: number, z: number, suffix = "") {
        this._currentEffect.setFloat3(name + suffix, x, y, z);
    }

    private _updateFloat3ForUniform(name: string, x: number, y: number, z: number) {
        UniformBuffer._TempBuffer[0] = x;
        UniformBuffer._TempBuffer[1] = y;
        UniformBuffer._TempBuffer[2] = z;
        this.updateUniform(name, UniformBuffer._TempBuffer, 3);
    }

    private _updateFloat4ForEffect(name: string, x: number, y: number, z: number, w: number, suffix = "") {
        this._currentEffect.setFloat4(name + suffix, x, y, z, w);
    }

    private _updateFloat4ForUniform(name: string, x: number, y: number, z: number, w: number) {
        UniformBuffer._TempBuffer[0] = x;
        UniformBuffer._TempBuffer[1] = y;
        UniformBuffer._TempBuffer[2] = z;
        UniformBuffer._TempBuffer[3] = w;
        this.updateUniform(name, UniformBuffer._TempBuffer, 4);
    }

    private _updateFloatArrayForEffect(name: string, array: Float32Array) {
        this._currentEffect.setFloatArray(name, array);
    }

    private _updateFloatArrayForUniform(name: string, array: Float32Array) {
        this.updateUniformArray(name, array, array.length);
    }

    private _updateArrayForEffect(name: string, array: number[]) {
        this._currentEffect.setArray(name, array);
    }

    private _updateArrayForUniform(name: string, array: number[]) {
        this.updateUniformArray(name, array, array.length);
    }

    private _updateIntArrayForEffect(name: string, array: Int32Array) {
        this._currentEffect.setIntArray(name, array);
    }

    private _updateIntArrayForUniform(name: string, array: Int32Array) {
        UniformBuffer._TempBufferInt32View.set(array);
        this.updateUniformArray(name, UniformBuffer._TempBuffer, array.length);
    }

    private _updateUIntArrayForEffect(name: string, array: Uint32Array) {
        this._currentEffect.setUIntArray(name, array);
    }

    private _updateUIntArrayForUniform(name: string, array: Uint32Array) {
        UniformBuffer._TempBufferUInt32View.set(array);
        this.updateUniformArray(name, UniformBuffer._TempBuffer, array.length);
    }

    private _updateMatrixForEffect(name: string, mat: IMatrixLike) {
        this._currentEffect.setMatrix(name, mat);
    }

    private _updateMatrixForUniform(name: string, mat: IMatrixLike) {
        if (this._cacheMatrix(name, mat)) {
            this.updateUniform(name, <any>mat.toArray(), 16);
        }
    }

    private _updateMatricesForEffect(name: string, mat: Float32Array) {
        this._currentEffect.setMatrices(name, mat);
    }

    private _updateMatricesForUniform(name: string, mat: Float32Array) {
        this.updateUniform(name, mat, mat.length);
    }

    private _updateVector3ForEffect(name: string, vector: IVector3Like) {
        this._currentEffect.setVector3(name, vector);
    }

    private _updateVector3ForUniform(name: string, vector: IVector3Like) {
        UniformBuffer._TempBuffer[0] = vector.x;
        UniformBuffer._TempBuffer[1] = vector.y;
        UniformBuffer._TempBuffer[2] = vector.z;
        this.updateUniform(name, UniformBuffer._TempBuffer, 3);
    }

    private _updateVector4ForEffect(name: string, vector: IVector4Like) {
        this._currentEffect.setVector4(name, vector);
    }

    private _updateVector4ForUniform(name: string, vector: IVector4Like) {
        UniformBuffer._TempBuffer[0] = vector.x;
        UniformBuffer._TempBuffer[1] = vector.y;
        UniformBuffer._TempBuffer[2] = vector.z;
        UniformBuffer._TempBuffer[3] = vector.w;
        this.updateUniform(name, UniformBuffer._TempBuffer, 4);
    }

    private _updateColor3ForEffect(name: string, color: IColor3Like, suffix = "") {
        this._currentEffect.setColor3(name + suffix, color);
    }

    private _updateColor3ForUniform(name: string, color: IColor3Like) {
        UniformBuffer._TempBuffer[0] = color.r;
        UniformBuffer._TempBuffer[1] = color.g;
        UniformBuffer._TempBuffer[2] = color.b;
        this.updateUniform(name, UniformBuffer._TempBuffer, 3);
    }

    private _updateColor4ForEffect(name: string, color: IColor3Like, alpha: number, suffix = "") {
        this._currentEffect.setColor4(name + suffix, color, alpha);
    }

    private _updateDirectColor4ForEffect(name: string, color: IColor4Like, suffix = "") {
        this._currentEffect.setDirectColor4(name + suffix, color);
    }

    private _updateColor4ForUniform(name: string, color: IColor3Like, alpha: number) {
        UniformBuffer._TempBuffer[0] = color.r;
        UniformBuffer._TempBuffer[1] = color.g;
        UniformBuffer._TempBuffer[2] = color.b;
        UniformBuffer._TempBuffer[3] = alpha;
        this.updateUniform(name, UniformBuffer._TempBuffer, 4);
    }

    private _updateDirectColor4ForUniform(name: string, color: IColor4Like) {
        UniformBuffer._TempBuffer[0] = color.r;
        UniformBuffer._TempBuffer[1] = color.g;
        UniformBuffer._TempBuffer[2] = color.b;
        UniformBuffer._TempBuffer[3] = color.a;
        this.updateUniform(name, UniformBuffer._TempBuffer, 4);
    }

    private _updateIntForEffect(name: string, x: number, suffix = "") {
        this._currentEffect.setInt(name + suffix, x);
    }

    private _updateIntForUniform(name: string, x: number) {
        UniformBuffer._TempBufferInt32View[0] = x;
        this.updateUniform(name, UniformBuffer._TempBuffer, 1);
    }

    private _updateInt2ForEffect(name: string, x: number, y: number, suffix = "") {
        this._currentEffect.setInt2(name + suffix, x, y);
    }

    private _updateInt2ForUniform(name: string, x: number, y: number) {
        UniformBuffer._TempBufferInt32View[0] = x;
        UniformBuffer._TempBufferInt32View[1] = y;
        this.updateUniform(name, UniformBuffer._TempBuffer, 2);
    }

    private _updateInt3ForEffect(name: string, x: number, y: number, z: number, suffix = "") {
        this._currentEffect.setInt3(name + suffix, x, y, z);
    }

    private _updateInt3ForUniform(name: string, x: number, y: number, z: number) {
        UniformBuffer._TempBufferInt32View[0] = x;
        UniformBuffer._TempBufferInt32View[1] = y;
        UniformBuffer._TempBufferInt32View[2] = z;
        this.updateUniform(name, UniformBuffer._TempBuffer, 3);
    }

    private _updateInt4ForEffect(name: string, x: number, y: number, z: number, w: number, suffix = "") {
        this._currentEffect.setInt4(name + suffix, x, y, z, w);
    }

    private _updateInt4ForUniform(name: string, x: number, y: number, z: number, w: number) {
        UniformBuffer._TempBufferInt32View[0] = x;
        UniformBuffer._TempBufferInt32View[1] = y;
        UniformBuffer._TempBufferInt32View[2] = z;
        UniformBuffer._TempBufferInt32View[3] = w;
        this.updateUniform(name, UniformBuffer._TempBuffer, 4);
    }

    private _updateUIntForEffect(name: string, x: number, suffix = "") {
        this._currentEffect.setUInt(name + suffix, x);
    }

    private _updateUIntForUniform(name: string, x: number) {
        UniformBuffer._TempBufferUInt32View[0] = x;
        this.updateUniform(name, UniformBuffer._TempBuffer, 1);
    }

    private _updateUInt2ForEffect(name: string, x: number, y: number, suffix = "") {
        this._currentEffect.setUInt2(name + suffix, x, y);
    }

    private _updateUInt2ForUniform(name: string, x: number, y: number) {
        UniformBuffer._TempBufferUInt32View[0] = x;
        UniformBuffer._TempBufferUInt32View[1] = y;
        this.updateUniform(name, UniformBuffer._TempBuffer, 2);
    }

    private _updateUInt3ForEffect(name: string, x: number, y: number, z: number, suffix = "") {
        this._currentEffect.setUInt3(name + suffix, x, y, z);
    }

    private _updateUInt3ForUniform(name: string, x: number, y: number, z: number) {
        UniformBuffer._TempBufferUInt32View[0] = x;
        UniformBuffer._TempBufferUInt32View[1] = y;
        UniformBuffer._TempBufferUInt32View[2] = z;
        this.updateUniform(name, UniformBuffer._TempBuffer, 3);
    }

    private _updateUInt4ForEffect(name: string, x: number, y: number, z: number, w: number, suffix = "") {
        this._currentEffect.setUInt4(name + suffix, x, y, z, w);
    }

    private _updateUInt4ForUniform(name: string, x: number, y: number, z: number, w: number) {
        UniformBuffer._TempBufferUInt32View[0] = x;
        UniformBuffer._TempBufferUInt32View[1] = y;
        UniformBuffer._TempBufferUInt32View[2] = z;
        UniformBuffer._TempBufferUInt32View[3] = w;
        this.updateUniform(name, UniformBuffer._TempBuffer, 4);
    }

    /**
     * Sets a sampler uniform on the effect.
     * @param name Define the name of the sampler.
     * @param texture Define the texture to set in the sampler
     */
    public setTexture(name: string, texture: Nullable<ThinTexture>) {
        this._currentEffect.setTexture(name, texture);
    }

    /**
     * Sets a sampler uniform on the effect.
     * @param name Define the name of the sampler.
     * @param texture Define the (internal) texture to set in the sampler
     */
    public bindTexture(name: string, texture: Nullable<InternalTexture>) {
        this._currentEffect._bindTexture(name, texture);
    }

    /**
     * Directly updates the value of the uniform in the cache AND on the GPU.
     * @param uniformName Define the name of the uniform, as used in the uniform block in the shader.
     * @param data Define the flattened data
     */
    public updateUniformDirectly(uniformName: string, data: FloatArray) {
        this.updateUniform(uniformName, data, data.length);

        this.update();
    }

    /**
     * Associates an effect to this uniform buffer
     * @param effect Define the effect to associate the buffer to
     * @param name Name of the uniform block in the shader.
     */
    public bindToEffect(effect: Effect, name: string): void {
        this._currentEffect = effect;
        this._currentEffectName = name;
    }

    /**
     * Binds the current (GPU) buffer to the effect
     */
    public bindUniformBuffer(): void {
        if (!this._noUBO && this._buffer && this._currentEffect) {
            this._currentEffect.bindUniformBuffer(this._buffer, this._currentEffectName);
        }
    }

    /**
     * Dissociates the current effect from this uniform buffer
     */
    public unbindEffect(): void {
        this._currentEffect = undefined as any;
        this._currentEffectName = undefined as any;
    }

    /**
     * Sets the current state of the class (_bufferIndex, _buffer) to point to the data buffer passed in parameter if this buffer is one of the buffers handled by the class (meaning if it can be found in the _buffers array)
     * This method is meant to be able to update a buffer at any time: just call setDataBuffer to set the class in the right state, call some updateXXX methods and then call udpate() => that will update the GPU buffer on the graphic card
     * @param dataBuffer buffer to look for
     * @returns true if the buffer has been found and the class internal state points to it, else false
     */
    public setDataBuffer(dataBuffer: DataBuffer): boolean {
        if (!this._buffers) {
            return this._buffer === dataBuffer;
        }

        for (let b = 0; b < this._buffers.length; ++b) {
            const buffer = this._buffers[b];
            if (buffer[0] === dataBuffer) {
                this._bufferIndex = b;
                this._buffer = dataBuffer;
                this._createBufferOnWrite = false;
                this._currentEffect = undefined as any;
                return true;
            }
        }

        return false;
    }

    /**
     * Disposes the uniform buffer.
     */
    public dispose(): void {
        if (this._noUBO) {
            return;
        }

        const uniformBuffers = this._engine._uniformBuffers;
        const index = uniformBuffers.indexOf(this);

        if (index !== -1) {
            uniformBuffers[index] = uniformBuffers[uniformBuffers.length - 1];
            uniformBuffers.pop();
        }

        if (this._engine._features.trackUbosInFrame && this._buffers) {
            for (let i = 0; i < this._buffers.length; ++i) {
                const buffer = this._buffers[i][0];
                this._engine._releaseBuffer(buffer!);
            }
        } else if (this._buffer && this._engine._releaseBuffer(this._buffer)) {
            this._buffer = null;
        }
    }
}
