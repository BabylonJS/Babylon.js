import { Logger } from "../Misc/logger";
import { Nullable, FloatArray } from "../types";
import { Matrix, Vector3, Vector4 } from "../Maths/math.vector";
import { Engine } from "../Engines/engine";
import { Effect } from "./effect";
import { BaseTexture } from "../Materials/Textures/baseTexture";
import { DataBuffer } from '../Meshes/dataBuffer';
import { Color3 } from '../Maths/math.color';
import { IMatrixLike } from '../Maths/math.like';
import { ThinEngine } from '../Engines/thinEngine';

import "../Engines/Extensions/engine.uniformBuffer";

/**
 * Uniform buffer objects.
 *
 * Handles blocks of uniform on the GPU.
 *
 * If WebGL 2 is not available, this class falls back on traditionnal setUniformXXX calls.
 *
 * For more information, please refer to :
 * https://www.khronos.org/opengl/wiki/Uniform_Buffer_Object
 */
export class UniformBuffer {
    /** @hidden */
    public static _updatedUbosInFrame: { [name: string]: number } = {};

    private _engine: Engine;
    private _buffer: Nullable<DataBuffer>;
    private _buffers : Array<[Nullable<DataBuffer>, Float32Array, { [name: string]: number }]>;
    private _bufferIndex: number;
    private _createBufferOnWrite: boolean;
    private _data: number[];
    private _bufferData: Float32Array;
    private _dynamic?: boolean;
    private _uniformLocations: { [key: string]: number };
    private _uniformSizes: { [key: string]: number };
    private _uniformArraySizes: { [key: string]: { strideSize: number, arraySize: number } };
    private _uniformLocationPointer: number;
    private _needSync: boolean;
    private _noUBO: boolean;
    private _currentEffect: Effect;
    private _currentEffectName: string;
    private _name: string;
    private _currentFrameId: number;
    private _updateList: Array<[number, number, string?]>;

    /** @hidden */
    public _alreadyBound = false;

    // Pool for avoiding memory leaks
    private static _MAX_UNIFORM_SIZE = 256;
    private static _tempBuffer = new Float32Array(UniformBuffer._MAX_UNIFORM_SIZE);
    private static _tempBufferInt32View = new Uint32Array(UniformBuffer._tempBuffer.buffer);

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
    public updateMatrices:  (name: string, mat: Float32Array) => void;

    /**
     * Lambda to Update vec3 of float from a Vector in a uniform buffer.
     * This is dynamic to allow compat with webgl 1 and 2.
     * You will need to pass the name of the uniform as well as the value.
     */
    public updateVector3: (name: string, vector: Vector3) => void;

    /**
     * Lambda to Update vec4 of float from a Vector in a uniform buffer.
     * This is dynamic to allow compat with webgl 1 and 2.
     * You will need to pass the name of the uniform as well as the value.
     */
    public updateVector4: (name: string, vector: Vector4) => void;

    /**
     * Lambda to Update vec3 of float from a Color in a uniform buffer.
     * This is dynamic to allow compat with webgl 1 and 2.
     * You will need to pass the name of the uniform as well as the value.
     */
    public updateColor3: (name: string, color: Color3, suffix?: string) => void;

    /**
     * Lambda to Update vec4 of float from a Color in a uniform buffer.
     * This is dynamic to allow compat with webgl 1 and 2.
     * You will need to pass the name of the uniform as well as the value.
     */
    public updateColor4: (name: string, color: Color3, alpha: number, suffix?: string) => void;

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
     * Instantiates a new Uniform buffer objects.
     *
     * Handles blocks of uniform on the GPU.
     *
     * If WebGL 2 is not available, this class falls back on traditionnal setUniformXXX calls.
     *
     * For more information, please refer to :
     * @see https://www.khronos.org/opengl/wiki/Uniform_Buffer_Object
     * @param engine Define the engine the buffer is associated with
     * @param data Define the data contained in the buffer
     * @param dynamic Define if the buffer is updatable
     */
    constructor(engine: Engine, data?: number[], dynamic?: boolean, name?: string) {
        this._engine = engine;
        this._noUBO = !engine.supportsUniformBuffers;
        this._dynamic = dynamic;
        this._name = name ?? "no-name";

        this._data = data || [];

        this._uniformLocations = {};
        this._uniformSizes = {};
        this._uniformArraySizes = {};
        this._uniformLocationPointer = 0;
        this._needSync = false;

        if (ThinEngine.Features.trackUbosInFrame) {
            this._buffers = [];
            this._bufferIndex = -1;
            this._createBufferOnWrite = false;
            this._currentFrameId = 0;
            this._updateList = [];
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
            this.updateMatrix = this._updateMatrixForEffect;
            this.updateMatrices = this._updateMatricesForEffect;
            this.updateVector3 = this._updateVector3ForEffect;
            this.updateVector4 = this._updateVector4ForEffect;
            this.updateColor3 = this._updateColor3ForEffect;
            this.updateColor4 = this._updateColor4ForEffect;
            this.updateInt = this._updateIntForEffect;
            this.updateInt2 = this._updateInt2ForEffect;
            this.updateInt3 = this._updateInt3ForEffect;
            this.updateInt4 = this._updateInt4ForEffect;
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
            this.updateMatrix = this._updateMatrixForUniform;
            this.updateMatrices = this._updateMatricesForUniform;
            this.updateVector3 = this._updateVector3ForUniform;
            this.updateVector4 = this._updateVector4ForUniform;
            this.updateColor3 = this._updateColor3ForUniform;
            this.updateColor4 = this._updateColor4ForUniform;
            this.updateInt = this._updateIntForUniform;
            this.updateInt2 = this._updateInt2ForUniform;
            this.updateInt3 = this._updateInt3ForUniform;
            this.updateInt4 = this._updateInt4ForUniform;
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
     */
    private _fillAlignment(size: number) {
        // This code has been simplified because we only use floats, vectors of 1, 2, 3, 4 components
        // and 4x4 matrices
        // TODO : change if other types are used

        var alignment;
        if (size <= 2) {
            alignment = size;
        } else {
            alignment = 4;
        }

        if ((this._uniformLocationPointer % alignment) !== 0) {
            var oldPointer = this._uniformLocationPointer;
            this._uniformLocationPointer += alignment - (this._uniformLocationPointer % alignment);
            var diff = this._uniformLocationPointer - oldPointer;

            for (var i = 0; i < diff; i++) {
                this._data.push(0);
            }
        }
    }

    /**
     * Adds an uniform in the buffer.
     * Warning : the subsequents calls of this function must be in the same order as declared in the shader
     * for the layout to be correct !
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
        var data;

        // std140 FTW...
        if (arraySize > 0) {
            if (size instanceof Array) {
                throw "addUniform should not be use with Array in UBO: " + name;
            }

            this._fillAlignment(4);

            this._uniformArraySizes[name] = { strideSize: size, arraySize };
            if (size == 16) {
                size = size * arraySize;
            }
            else {
                const perElementPadding =  4 - size;
                const totalPadding =  perElementPadding * arraySize;
                size = size * arraySize + totalPadding;
            }

            data = [];
            // Fill with zeros
            for (var i = 0; i < size; i++) {
                data.push(0);
            }
        }
        else {
            if (size instanceof Array) {
                data = size;
                size = data.length;
            } else {
                size = <number>size;
                data = [];

                // Fill with zeros
                for (var i = 0; i < size; i++) {
                    data.push(0);
                }
            }
            this._fillAlignment(<number>size);
        }

        this._uniformSizes[name] = <number>size;
        this._uniformLocations[name] = this._uniformLocationPointer;
        this._uniformLocationPointer += <number>size;

        for (var i = 0; i < size; i++) {
            this._data.push(data[i]);
        }

        this._needSync = true;
    }

    /**
     * Adds a Matrix 4x4 to the uniform buffer.
     * @param name Name of the uniform, as used in the uniform block in the shader.
     * @param mat A 4x4 matrix.
     */
    public addMatrix(name: string, mat: Matrix) {
        this.addUniform(name, Array.prototype.slice.call(mat.toArray()));
    }

    /**
     * Adds a vec2 to the uniform buffer.
     * @param name Name of the uniform, as used in the uniform block in the shader.
     * @param x Define the x component value of the vec2
     * @param y Define the y component value of the vec2
     */
    public addFloat2(name: string, x: number, y: number) {
        var temp = [x, y];
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
        var temp = [x, y, z];
        this.addUniform(name, temp);
    }

    /**
     * Adds a vec3 to the uniform buffer.
     * @param name Name of the uniform, as used in the uniform block in the shader.
     * @param color Define the vec3 from a Color
     */
    public addColor3(name: string, color: Color3) {
        var temp = new Array<number>();
        color.toArray(temp);
        this.addUniform(name, temp);
    }

    /**
     * Adds a vec4 to the uniform buffer.
     * @param name Name of the uniform, as used in the uniform block in the shader.
     * @param color Define the rgb components from a Color
     * @param alpha Define the a component of the vec4
     */
    public addColor4(name: string, color: Color3, alpha: number) {
        var temp = new Array<number>();
        color.toArray(temp);
        temp.push(alpha);
        this.addUniform(name, temp);
    }

    /**
     * Adds a vec3 to the uniform buffer.
     * @param name Name of the uniform, as used in the uniform block in the shader.
     * @param vector Define the vec3 components from a Vector
     */
    public addVector3(name: string, vector: Vector3) {
        var temp = new Array<number>();
        vector.toArray(temp);
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

    /** @hidden */
    public _rebuild(): void {
        if (this._noUBO || !this._bufferData) {
            return;
        }

        if (this._dynamic) {
            this._buffer = this._engine.createDynamicUniformBuffer(this._bufferData);
        } else {
            this._buffer = this._engine.createUniformBuffer(this._bufferData);
        }

        if (ThinEngine.Features.trackUbosInFrame) {
            this._buffers.push([this._buffer, this._bufferData, this._valueCache]);
            this._bufferIndex = this._buffers.length - 1;
            this._createBufferOnWrite = false;
        }
    }

    /** @hidden */
    public get _numBuffers(): number {
        return this._buffers.length;
    }

    /** @hidden */
    public get _indexBuffer(): number {
        return this._bufferIndex;
    }

    public get name(): string {
        return this._name;
    }

    /**
     * Updates the WebGL Uniform Buffer on the GPU.
     * If the `dynamic` flag is set to true, no cache comparison is done.
     * Otherwise, the buffer will be updated only if the cache differs.
     */
    public update(): void {
        if (!this._buffer) {
            this.create();
            return;
        }

        if (!this._dynamic && !this._needSync) {
            this._createBufferOnWrite = ThinEngine.Features.trackUbosInFrame;
            return;
        }

        this._engine.updateUniformBuffer(this._buffer, this._bufferData);

        if (ThinEngine.Features._collectUbosUpdatedInFrame) {
            if (!UniformBuffer._updatedUbosInFrame[this._name]) {
                UniformBuffer._updatedUbosInFrame[this._name] = 0;
            }
            UniformBuffer._updatedUbosInFrame[this._name]++;
        }

        this._needSync = false;
        this._createBufferOnWrite = ThinEngine.Features.trackUbosInFrame;
    }

    private _createNewBuffer(excludedLocation: number): boolean {
        if (this._bufferIndex + 1 < this._buffers.length) {
            const currentBufferData = this._bufferData;
            this._bufferIndex++;
            this._buffer = this._buffers[this._bufferIndex][0];
            this._bufferData = this._buffers[this._bufferIndex][1];
            this._valueCache = this._buffers[this._bufferIndex][2];
            this._createBufferOnWrite = false;
            for (let i = 0; i < this._updateList.length; ++i) {
                let [location, size, name] = this._updateList[i];
                if (location === excludedLocation) {
                    continue;
                } else if (location < 0) {
                    this._valueCache[name!] = size;
                } else {
                    while (size--) {
                        if (this._bufferData[location + size] !== currentBufferData[location + size]) {
                            this._bufferData[location + size] = currentBufferData[location + size];
                            this._needSync = true;
                        }
                    }
                }
            }
            if (this._currentEffect && this._buffer) {
                this._currentEffect.bindUniformBuffer(this._buffer, this._currentEffectName);
            }
            return false;
        } else {
            this._bufferData = this._bufferData.slice();
            this._valueCache = { ...this._valueCache }; // clone
            this._rebuild();
            if (this._currentEffect && this._buffer) {
                this._currentEffect.bindUniformBuffer(this._buffer, this._currentEffectName);
            }
            return true;
        }
    }

    private _checkNewFrame(): void {
        if (ThinEngine.Features.trackUbosInFrame && this._currentFrameId !== this._engine.frameId) {
            this._currentFrameId = this._engine.frameId;
            this._createBufferOnWrite = false;
            this._updateList.length = 0;
            if (this._buffers && this._buffers.length > 0) {
                this._bufferIndex = 0;
                this._buffer = this._buffers[this._bufferIndex][0];
                this._bufferData = this._buffers[this._bufferIndex][1];
                this._valueCache = this._buffers[this._bufferIndex][2];
                if (this._currentEffect && this._buffer) {
                    this._currentEffect.bindUniformBuffer(this._buffer, this._currentEffectName);
                }
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

        var location = this._uniformLocations[uniformName];
        if (location === undefined) {
            if (this._buffer) {
                // Cannot add an uniform if the buffer is already created
                Logger.Error("Cannot add an uniform after UBO has been created.");
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
            var changed = false;

            for (var i = 0; i < size; i++) {
                if ((size === 16 && !ThinEngine.Features.uniformBufferHardCheckMatrix) || this._bufferData[location + i] !== data[i]) {
                    changed = true;
                    if (this._createBufferOnWrite) {
                        if (!this._createNewBuffer(location)) {
                            // we didn't create a new buffer but advanced to the next one: retry the update, chances are that the new buffer already has the right data for uniformName so we won't set needSync to true
                            this.updateUniform(uniformName, data, size);
                            return;
                        }
                    }
                    this._bufferData[location + i] = data[i];
                }
            }

            if (changed && ThinEngine.Features.trackUbosInFrame) {
                this._updateList[this._updateList.length] = [location, size];
            }

            this._needSync = this._needSync || changed;
        } else {
            // No cache for dynamic
            if (this._createBufferOnWrite) {
                this._createNewBuffer(-1);
            }
            for (var i = 0; i < size; i++) {
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

        var location = this._uniformLocations[uniformName];
        if (location === undefined) {
            Logger.Error("Cannot add an uniform Array dynamically. Please, add it using addUniform.");
            return;
        }

        if (!this._buffer) {
            this.create();
        }

        const arraySizes = this._uniformArraySizes[uniformName];

        if (!this._dynamic) {
            // Cache for static uniform buffers
            var changed = false;
            let countToFour = 0;
            let baseStride = 0;
            for (var i = 0; i < size; i++) {
                if (this._bufferData[location + baseStride * 4 + countToFour] !== data[i]) {
                    changed = true;
                    if (this._createBufferOnWrite) {
                        if (!this._createNewBuffer(location)) {
                            // we didn't create a new buffer but advanced to the next one: retry the update, chances are that the new buffer already has the right data for uniformName so we won't set needSync to true
                            this.updateUniformArray(uniformName, data, size);
                            return;
                        }
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

            if (changed && ThinEngine.Features.trackUbosInFrame) {
                this._updateList[this._updateList.length] = [location, baseStride * 4];
            }

            this._needSync = this._needSync || changed;
        } else {
            // No cache for dynamic
            if (this._createBufferOnWrite) {
                this._createNewBuffer(-1);
            }
            for (var i = 0; i < size; i++) {
                this._bufferData[location + i] = data[i];
            }
        }
    }

    // Matrix cache
    private _valueCache: { [key: string]: number } = {};
    private _cacheMatrix(name: string, matrix: IMatrixLike): boolean {
        this._checkNewFrame();

        var cache = this._valueCache[name];
        var flag = matrix.updateFlag;
        if (cache !== undefined && cache === flag) {
            return false;
        }

        if (!this._createBufferOnWrite) {
            this._valueCache[name] = flag;
            if (ThinEngine.Features.trackUbosInFrame) {
                this._updateList[this._updateList.length] = [-1, flag, name];
            }
        }

        return true;
    }

    /** @hidden */
    public _getMatrixUpdateFlagFromCache(matrixName: string): number | undefined {
        this._checkNewFrame();

        return this._valueCache[matrixName];
    }

    // Update methods

    private _updateMatrix3x3ForUniform(name: string, matrix: Float32Array): void {
        // To match std140, matrix must be realigned
        for (var i = 0; i < 3; i++) {
            UniformBuffer._tempBuffer[i * 4] = matrix[i * 3];
            UniformBuffer._tempBuffer[i * 4 + 1] = matrix[i * 3 + 1];
            UniformBuffer._tempBuffer[i * 4 + 2] = matrix[i * 3 + 2];
            UniformBuffer._tempBuffer[i * 4 + 3] = 0.0;
        }

        this.updateUniform(name, UniformBuffer._tempBuffer, 12);
    }

    private _updateMatrix3x3ForEffect(name: string, matrix: Float32Array): void {
        this._currentEffect.setMatrix3x3(name, matrix);
    }

    private _updateMatrix2x2ForEffect(name: string, matrix: Float32Array): void {
        this._currentEffect.setMatrix2x2(name, matrix);
    }

    private _updateMatrix2x2ForUniform(name: string, matrix: Float32Array): void {
        // To match std140, matrix must be realigned
        for (var i = 0; i < 2; i++) {
            UniformBuffer._tempBuffer[i * 4] = matrix[i * 2];
            UniformBuffer._tempBuffer[i * 4 + 1] = matrix[i * 2 + 1];
            UniformBuffer._tempBuffer[i * 4 + 2] = 0.0;
            UniformBuffer._tempBuffer[i * 4 + 3] = 0.0;
        }

        this.updateUniform(name, UniformBuffer._tempBuffer, 8);
    }

    private _updateFloatForEffect(name: string, x: number) {
        this._currentEffect.setFloat(name, x);
    }

    private _updateFloatForUniform(name: string, x: number) {
        UniformBuffer._tempBuffer[0] = x;
        this.updateUniform(name, UniformBuffer._tempBuffer, 1);
    }

    private _updateFloat2ForEffect(name: string, x: number, y: number, suffix = "") {
        this._currentEffect.setFloat2(name + suffix, x, y);
    }

    private _updateFloat2ForUniform(name: string, x: number, y: number) {
        UniformBuffer._tempBuffer[0] = x;
        UniformBuffer._tempBuffer[1] = y;
        this.updateUniform(name, UniformBuffer._tempBuffer, 2);
    }

    private _updateFloat3ForEffect(name: string, x: number, y: number, z: number, suffix = "") {
        this._currentEffect.setFloat3(name + suffix, x, y, z);
    }

    private _updateFloat3ForUniform(name: string, x: number, y: number, z: number) {
        UniformBuffer._tempBuffer[0] = x;
        UniformBuffer._tempBuffer[1] = y;
        UniformBuffer._tempBuffer[2] = z;
        this.updateUniform(name, UniformBuffer._tempBuffer, 3);

    }

    private _updateFloat4ForEffect(name: string, x: number, y: number, z: number, w: number, suffix = "") {
        this._currentEffect.setFloat4(name + suffix, x, y, z, w);
    }

    private _updateFloat4ForUniform(name: string, x: number, y: number, z: number, w: number) {
        UniformBuffer._tempBuffer[0] = x;
        UniformBuffer._tempBuffer[1] = y;
        UniformBuffer._tempBuffer[2] = z;
        UniformBuffer._tempBuffer[3] = w;
        this.updateUniform(name, UniformBuffer._tempBuffer, 4);
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
        UniformBuffer._tempBufferInt32View.set(array);
        this.updateUniformArray(name, UniformBuffer._tempBuffer, array.length);
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

    private _updateVector3ForEffect(name: string, vector: Vector3) {
        this._currentEffect.setVector3(name, vector);
    }

    private _updateVector3ForUniform(name: string, vector: Vector3) {
        vector.toArray(UniformBuffer._tempBuffer);
        this.updateUniform(name, UniformBuffer._tempBuffer, 3);
    }

    private _updateVector4ForEffect(name: string, vector: Vector4) {
        this._currentEffect.setVector4(name, vector);
    }

    private _updateVector4ForUniform(name: string, vector: Vector4) {
        vector.toArray(UniformBuffer._tempBuffer);
        this.updateUniform(name, UniformBuffer._tempBuffer, 4);
    }

    private _updateColor3ForEffect(name: string, color: Color3, suffix = "") {
        this._currentEffect.setColor3(name + suffix, color);
    }

    private _updateColor3ForUniform(name: string, color: Color3) {
        color.toArray(UniformBuffer._tempBuffer);
        this.updateUniform(name, UniformBuffer._tempBuffer, 3);
    }

    private _updateColor4ForEffect(name: string, color: Color3, alpha: number, suffix = "") {
        this._currentEffect.setColor4(name + suffix, color, alpha);
    }

    private _updateColor4ForUniform(name: string, color: Color3, alpha: number) {
        color.toArray(UniformBuffer._tempBuffer);
        UniformBuffer._tempBuffer[3] = alpha;
        this.updateUniform(name, UniformBuffer._tempBuffer, 4);
    }

    private _updateIntForEffect(name: string, x: number, suffix = "") {
        this._currentEffect.setInt(name + suffix, x);
    }

    private _updateIntForUniform(name: string, x: number) {
        UniformBuffer._tempBufferInt32View[0] = x;
        this.updateUniform(name, UniformBuffer._tempBuffer, 1);
    }

    private _updateInt2ForEffect(name: string, x: number, y: number, suffix = "") {
        this._currentEffect.setInt2(name + suffix, x, y);
    }

    private _updateInt2ForUniform(name: string, x: number, y: number) {
        UniformBuffer._tempBufferInt32View[0] = x;
        UniformBuffer._tempBufferInt32View[1] = y;
        this.updateUniform(name, UniformBuffer._tempBuffer, 2);
    }

    private _updateInt3ForEffect(name: string, x: number, y: number, z: number, suffix = "") {
        this._currentEffect.setInt3(name + suffix, x, y, z);
    }

    private _updateInt3ForUniform(name: string, x: number, y: number, z: number) {
        UniformBuffer._tempBufferInt32View[0] = x;
        UniformBuffer._tempBufferInt32View[1] = y;
        UniformBuffer._tempBufferInt32View[2] = z;
        this.updateUniform(name, UniformBuffer._tempBuffer, 3);
    }

    private _updateInt4ForEffect(name: string, x: number, y: number, z: number, w: number, suffix = "") {
        this._currentEffect.setInt4(name + suffix, x, y, z, w);
    }

    private _updateInt4ForUniform(name: string, x: number, y: number, z: number, w: number) {
        UniformBuffer._tempBufferInt32View[0] = x;
        UniformBuffer._tempBufferInt32View[1] = y;
        UniformBuffer._tempBufferInt32View[2] = z;
        UniformBuffer._tempBufferInt32View[3] = w;
        this.updateUniform(name, UniformBuffer._tempBuffer, 4);
    }

    /**
     * Sets a sampler uniform on the effect.
     * @param name Define the name of the sampler.
     * @param texture Define the texture to set in the sampler
     */
    public setTexture(name: string, texture: Nullable<BaseTexture>) {
        this._currentEffect.setTexture(name, texture);
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
     * Binds this uniform buffer to an effect.
     * @param effect Define the effect to bind the buffer to
     * @param name Name of the uniform block in the shader.
     */
    public bindToEffect(effect: Effect, name: string): void {
        this._currentEffect = effect;
        this._currentEffectName = name;

        if (this._noUBO || !this._buffer) {
            return;
        }

        this._alreadyBound = true;
        effect.bindUniformBuffer(this._buffer, name);
    }

    /**
     * Disposes the uniform buffer.
     */
    public dispose(): void {
        if (this._noUBO) {
            return;
        }

        const uniformBuffers = this._engine._uniformBuffers;
        let index = uniformBuffers.indexOf(this);

        if (index !== -1) {
            uniformBuffers[index] = uniformBuffers[uniformBuffers.length - 1];
            uniformBuffers.pop();
        }

        if (ThinEngine.Features.trackUbosInFrame && this._buffers) {
            for (let i = 0; i < this._buffers.length; ++i) {
                const buffer = this._buffers[i][0];
                this._engine._releaseBuffer(buffer!);
            }
        } else if (this._buffer && this._engine._releaseBuffer(this._buffer)) {
            this._buffer = null;
        }
    }
}
