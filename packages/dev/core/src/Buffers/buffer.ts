import type { Nullable, DataArray, FloatArray } from "../types";
import type { AbstractEngine } from "../Engines/abstractEngine";
import { DataBuffer } from "./dataBuffer";
import type { Mesh } from "../Meshes/mesh";
import { Logger } from "../Misc/logger";
import { Constants } from "../Engines/constants";
import { EnumerateFloatValues, GetFloatData, GetTypeByteLength } from "./bufferUtils";

/**
 * Class used to store data that will be store in GPU memory
 */
export class Buffer {
    private _engine: AbstractEngine;
    private _buffer: Nullable<DataBuffer>;
    /** @internal */
    public _data: Nullable<DataArray>;
    private _updatable: boolean;
    private _instanced: boolean;
    private _divisor: number;
    private _isAlreadyOwned = false;
    private _isDisposed = false;
    private _label?: string;

    /**
     * Gets a boolean indicating if the Buffer is disposed
     */
    public get isDisposed(): boolean {
        return this._isDisposed;
    }

    /**
     * Gets the byte stride.
     */
    public readonly byteStride: number;

    /**
     * Constructor
     * @param engine the engine
     * @param data the data to use for this buffer
     * @param updatable whether the data is updatable
     * @param stride the stride (optional)
     * @param postponeInternalCreation whether to postpone creating the internal WebGL buffer (optional)
     * @param instanced whether the buffer is instanced (optional)
     * @param useBytes set to true if the stride in in bytes (optional)
     * @param divisor sets an optional divisor for instances (1 by default)
     * @param label defines the label of the buffer (for debug purpose)
     */
    constructor(
        engine: AbstractEngine,
        data: DataArray | DataBuffer,
        updatable: boolean,
        stride = 0,
        postponeInternalCreation = false,
        instanced = false,
        useBytes = false,
        divisor?: number,
        label?: string
    ) {
        if (engine && (engine as unknown as Mesh).getScene) {
            // old versions of VertexBuffer accepted 'mesh' instead of 'engine'
            this._engine = (engine as unknown as Mesh).getScene().getEngine();
        } else {
            this._engine = engine;
        }

        this._updatable = updatable;
        this._instanced = instanced;
        this._divisor = divisor || 1;
        this._label = label;

        if (data instanceof DataBuffer) {
            this._data = null;
            this._buffer = data;
        } else {
            this._data = data;
            this._buffer = null;
        }

        this.byteStride = useBytes ? stride : stride * Float32Array.BYTES_PER_ELEMENT;

        if (!postponeInternalCreation) {
            // by default
            this.create();
        }
    }

    /**
     * Create a new VertexBuffer based on the current buffer
     * @param kind defines the vertex buffer kind (position, normal, etc.)
     * @param offset defines offset in the buffer (0 by default)
     * @param size defines the size in floats of attributes (position is 3 for instance)
     * @param stride defines the stride size in floats in the buffer (the offset to apply to reach next value when data is interleaved)
     * @param instanced defines if the vertex buffer contains indexed data
     * @param useBytes defines if the offset and stride are in bytes     *
     * @param divisor sets an optional divisor for instances (1 by default)
     * @returns the new vertex buffer
     */
    public createVertexBuffer(kind: string, offset: number, size: number, stride?: number, instanced?: boolean, useBytes = false, divisor?: number): VertexBuffer {
        const byteOffset = useBytes ? offset : offset * Float32Array.BYTES_PER_ELEMENT;
        const byteStride = stride ? (useBytes ? stride : stride * Float32Array.BYTES_PER_ELEMENT) : this.byteStride;

        // a lot of these parameters are ignored as they are overridden by the buffer
        return new VertexBuffer(
            this._engine,
            this,
            kind,
            this._updatable,
            true,
            byteStride,
            instanced === undefined ? this._instanced : instanced,
            byteOffset,
            size,
            undefined,
            undefined,
            true,
            this._divisor || divisor
        );
    }

    // Properties

    /**
     * Gets a boolean indicating if the Buffer is updatable?
     * @returns true if the buffer is updatable
     */
    public isUpdatable(): boolean {
        return this._updatable;
    }

    /**
     * Gets current buffer's data
     * @returns a DataArray or null
     */
    public getData(): Nullable<DataArray> {
        return this._data;
    }

    /**
     * Gets underlying native buffer
     * @returns underlying native buffer
     */
    public getBuffer(): Nullable<DataBuffer> {
        return this._buffer;
    }

    /**
     * Gets the stride in float32 units (i.e. byte stride / 4).
     * May not be an integer if the byte stride is not divisible by 4.
     * @returns the stride in float32 units
     * @deprecated Please use byteStride instead.
     */
    public getStrideSize(): number {
        return this.byteStride / Float32Array.BYTES_PER_ELEMENT;
    }

    // Methods

    /**
     * Store data into the buffer. Creates the buffer if not used already.
     * If the buffer was already used, it will be updated only if it is updatable, otherwise it will do nothing.
     * @param data defines the data to store
     */
    public create(data: Nullable<DataArray> = null): void {
        if (!data && this._buffer) {
            return; // nothing to do
        }

        data = data || this._data;

        if (!data) {
            return;
        }

        if (!this._buffer) {
            // create buffer
            if (this._updatable) {
                this._buffer = this._engine.createDynamicVertexBuffer(data, this._label);
                this._data = data;
            } else {
                this._buffer = this._engine.createVertexBuffer(data, undefined, this._label);
            }
        } else if (this._updatable) {
            // update buffer
            this._engine.updateDynamicVertexBuffer(this._buffer, data);
            this._data = data;
        }
    }

    /** @internal */
    public _rebuild(): void {
        if (!this._data) {
            if (!this._buffer) {
                // Buffer was not yet created, nothing to do
                return;
            }
            if (this._buffer.capacity > 0) {
                // We can at least recreate the buffer with the right size, even if we don't have the data
                if (this._updatable) {
                    this._buffer = this._engine.createDynamicVertexBuffer(this._buffer.capacity, this._label);
                } else {
                    this._buffer = this._engine.createVertexBuffer(this._buffer.capacity, undefined, this._label);
                }
                return;
            }
            Logger.Warn(`Missing data for buffer "${this._label}" ${this._buffer ? "(uniqueId: " + this._buffer.uniqueId + ")" : ""}. Buffer reconstruction failed.`);
            this._buffer = null;
        } else {
            this._buffer = null;
            this.create(this._data);
        }
    }

    /**
     * Update current buffer data
     * @param data defines the data to store
     */
    public update(data: DataArray): void {
        this.create(data);
    }

    /**
     * Updates the data directly.
     * @param data the new data
     * @param offset the new offset
     * @param vertexCount the vertex count (optional)
     * @param useBytes set to true if the offset is in bytes
     */
    public updateDirectly(data: DataArray, offset: number, vertexCount?: number, useBytes: boolean = false): void {
        if (!this._buffer) {
            return;
        }

        if (this._updatable) {
            // update buffer
            this._engine.updateDynamicVertexBuffer(
                this._buffer,
                data,
                useBytes ? offset : offset * Float32Array.BYTES_PER_ELEMENT,
                vertexCount ? vertexCount * this.byteStride : undefined
            );
            if (offset === 0 && vertexCount === undefined) {
                // Keep the data if we easily can
                this._data = data;
            } else {
                this._data = null;
            }
        }
    }

    /** @internal */
    public _increaseReferences() {
        if (!this._buffer) {
            return;
        }

        if (!this._isAlreadyOwned) {
            this._isAlreadyOwned = true;
            return;
        }

        this._buffer.references++;
    }

    /**
     * Release all resources
     */
    public dispose(): void {
        if (!this._buffer) {
            return;
        }

        // The data buffer has an internal counter as this buffer can be used by several VertexBuffer objects
        // This means that we only flag it as disposed when all references are released (when _releaseBuffer will return true)
        if (this._engine._releaseBuffer(this._buffer)) {
            this._isDisposed = true;
            this._data = null;
            this._buffer = null;
        }
    }
}

/**
 * Options to be used when creating a vertex buffer
 */
export interface IVertexBufferOptions {
    /**
     * whether the data is updatable (default: false)
     */
    updatable?: boolean;
    /**
     * whether to postpone creating the internal WebGL buffer (default: false)
     */
    postponeInternalCreation?: boolean;
    /**
     * the stride (will be automatically computed from the kind parameter if not specified)
     */
    stride?: number;
    /**
     * whether the buffer is instanced (default: false)
     */
    instanced?: boolean;
    /**
     * the offset of the data (default: 0)
     */
    offset?: number;
    /**
     * the number of components (will be automatically computed from the kind parameter if not specified)
     */
    size?: number;
    /**
     * the type of the component (will be deduce from the data parameter if not specified)
     */
    type?: number;
    /**
     * whether the data contains normalized data (default: false)
     */
    normalized?: boolean;
    /**
     * set to true if stride and offset are in bytes (default: false)
     */
    useBytes?: boolean;
    /**
     * defines the instance divisor to use (default: 1, only used if instanced is true)
     */
    divisor?: number;
    /**
     * defines if the buffer should be released when the vertex buffer is disposed (default: false)
     */
    takeBufferOwnership?: boolean;
    /**
     * label to use for this vertex buffer (debugging purpose)
     */
    label?: string;
}

/**
 * Specialized buffer used to store vertex data
 */
export class VertexBuffer {
    private static _Counter = 0;

    /** @internal */
    public _buffer: Buffer;
    /** @internal */
    public _validOffsetRange: boolean; // used internally by the engine
    private _kind: string;
    private _size: number;
    /** @internal */
    public _ownsBuffer: boolean;
    private _instanced: boolean;
    private _instanceDivisor: number;
    /** @internal */
    public _isDisposed = false;
    /** @internal */
    public _label?: string;

    /**
     * The byte type.
     */
    public static readonly BYTE = Constants.BYTE;

    /**
     * The unsigned byte type.
     */
    public static readonly UNSIGNED_BYTE = Constants.UNSIGNED_BYTE;

    /**
     * The short type.
     */
    public static readonly SHORT = Constants.SHORT;

    /**
     * The unsigned short type.
     */
    public static readonly UNSIGNED_SHORT = Constants.UNSIGNED_SHORT;

    /**
     * The integer type.
     */
    public static readonly INT = Constants.INT;

    /**
     * The unsigned integer type.
     */
    public static readonly UNSIGNED_INT = Constants.UNSIGNED_INT;

    /**
     * The float type.
     */
    public static readonly FLOAT = Constants.FLOAT;

    /**
     * Gets a boolean indicating if the Buffer is disposed
     */
    public get isDisposed(): boolean {
        return this._isDisposed;
    }

    /**
     * Gets or sets the instance divisor when in instanced mode
     */
    public get instanceDivisor(): number {
        return this._instanceDivisor;
    }

    public set instanceDivisor(value: number) {
        const isInstanced = value != 0;
        this._instanceDivisor = value;

        if (isInstanced !== this._instanced) {
            this._instanced = isInstanced;
            this._computeHashCode();
        }
    }

    /**
     * Gets the byte stride.
     */
    public readonly byteStride: number;

    /**
     * Gets the byte offset.
     */
    public readonly byteOffset: number;

    /**
     * Gets whether integer data values should be normalized into a certain range when being casted to a float.
     */
    public readonly normalized: boolean;

    /**
     * Gets the data type of each component in the array.
     */
    public readonly type: number;

    /**
     * Gets the unique id of this vertex buffer
     */
    public readonly uniqueId: number;

    /**
     * Gets a hash code representing the format (type, normalized, size, instanced, stride) of this buffer
     * All buffers with the same format will have the same hash code
     */
    public readonly hashCode: number;

    /**
     * Gets the engine associated with the buffer
     */
    public readonly engine: AbstractEngine;

    /**
     * Gets the max possible amount of vertices stored within the current vertex buffer.
     * We do not have the end offset or count so this will be too big for concatenated vertex buffers.
     * @internal
     */
    public get _maxVerticesCount() {
        const data = this.getData();
        if (!data) {
            return 0;
        }

        if (Array.isArray(data)) {
            // data is a regular number[] with float values
            return data.length / (this.byteStride / 4) - this.byteOffset / 4;
        }

        return (data.byteLength - this.byteOffset) / this.byteStride;
    }

    /**
     * Constructor
     * @param engine the engine
     * @param data the data to use for this vertex buffer
     * @param kind the vertex buffer kind
     * @param updatable whether the data is updatable
     * @param postponeInternalCreation whether to postpone creating the internal WebGL buffer (optional)
     * @param stride the stride (optional)
     * @param instanced whether the buffer is instanced (optional)
     * @param offset the offset of the data (optional)
     * @param size the number of components (optional)
     * @param type the type of the component (optional)
     * @param normalized whether the data contains normalized data (optional)
     * @param useBytes set to true if stride and offset are in bytes (optional)
     * @param divisor defines the instance divisor to use (1 by default)
     * @param takeBufferOwnership defines if the buffer should be released when the vertex buffer is disposed
     */
    constructor(
        engine: AbstractEngine,
        data: DataArray | Buffer | DataBuffer,
        kind: string,
        updatable: boolean,
        postponeInternalCreation?: boolean,
        stride?: number,
        instanced?: boolean,
        offset?: number,
        size?: number,
        type?: number,
        normalized?: boolean,
        useBytes?: boolean,
        divisor?: number,
        takeBufferOwnership?: boolean
    );

    /**
     * Constructor
     * @param engine the engine
     * @param data the data to use for this vertex buffer
     * @param kind the vertex buffer kind
     * @param options defines the rest of the options used to create the buffer
     */
    constructor(engine: AbstractEngine, data: DataArray | Buffer | DataBuffer, kind: string, options?: IVertexBufferOptions);

    /** @internal */
    constructor(
        engine: AbstractEngine,
        data: DataArray | Buffer | DataBuffer,
        kind: string,
        updatableOrOptions?: boolean | IVertexBufferOptions,
        postponeInternalCreation?: boolean,
        stride?: number,
        instanced?: boolean,
        offset?: number,
        size?: number,
        type?: number,
        normalized = false,
        useBytes = false,
        divisor = 1,
        takeBufferOwnership = false
    ) {
        let updatable = false;

        this.engine = engine;

        if (typeof updatableOrOptions === "object" && updatableOrOptions !== null) {
            updatable = updatableOrOptions.updatable ?? false;
            postponeInternalCreation = updatableOrOptions.postponeInternalCreation;
            stride = updatableOrOptions.stride;
            instanced = updatableOrOptions.instanced;
            offset = updatableOrOptions.offset;
            size = updatableOrOptions.size;
            type = updatableOrOptions.type;
            normalized = updatableOrOptions.normalized ?? false;
            useBytes = updatableOrOptions.useBytes ?? false;
            divisor = updatableOrOptions.divisor ?? 1;
            takeBufferOwnership = updatableOrOptions.takeBufferOwnership ?? false;
            this._label = updatableOrOptions.label;
        } else {
            updatable = !!updatableOrOptions;
        }

        if (data instanceof Buffer) {
            this._buffer = data;
            this._ownsBuffer = takeBufferOwnership;
        } else {
            this._buffer = new Buffer(engine, data, updatable, stride, postponeInternalCreation, instanced, useBytes, divisor, this._label);
            this._ownsBuffer = true;
        }

        this.uniqueId = VertexBuffer._Counter++;
        this._kind = kind;

        if (type === undefined) {
            const vertexData = this.getData();
            this.type = vertexData ? VertexBuffer.GetDataType(vertexData) : VertexBuffer.FLOAT;
        } else {
            this.type = type;
        }

        const typeByteLength = GetTypeByteLength(this.type);

        if (useBytes) {
            this._size = size || (stride ? stride / typeByteLength : VertexBuffer.DeduceStride(kind));
            this.byteStride = stride || this._buffer.byteStride || this._size * typeByteLength;
            this.byteOffset = offset || 0;
        } else {
            this._size = size || stride || VertexBuffer.DeduceStride(kind);
            this.byteStride = stride ? stride * typeByteLength : this._buffer.byteStride || this._size * typeByteLength;
            this.byteOffset = (offset || 0) * typeByteLength;
        }

        this.normalized = normalized;

        this._instanced = instanced !== undefined ? instanced : false;
        this._instanceDivisor = instanced ? divisor : 0;

        this._alignBuffer();
        this._computeHashCode();
    }

    private _computeHashCode(): void {
        // note: cast to any because the property is declared readonly
        (this.hashCode as any) =
            ((this.type - 5120) << 0) +
            ((this.normalized ? 1 : 0) << 3) +
            (this._size << 4) +
            ((this._instanced ? 1 : 0) << 6) +
            /* keep 5 bits free */
            (this.byteStride << 12);
    }

    /** @internal */
    public _rebuild(): void {
        this._buffer?._rebuild();
    }

    /**
     * Returns the kind of the VertexBuffer (string)
     * @returns a string
     */
    public getKind(): string {
        return this._kind;
    }

    // Properties

    /**
     * Gets a boolean indicating if the VertexBuffer is updatable?
     * @returns true if the buffer is updatable
     */
    public isUpdatable(): boolean {
        return this._buffer.isUpdatable();
    }

    /**
     * Gets current buffer's data
     * @returns a DataArray or null
     */
    public getData(): Nullable<DataArray> {
        return this._buffer.getData();
    }

    /**
     * Gets current buffer's data as a float array. Float data is constructed if the vertex buffer data cannot be returned directly.
     * @param totalVertices number of vertices in the buffer to take into account
     * @param forceCopy defines a boolean indicating that the returned array must be cloned upon returning it
     * @returns a float array containing vertex data
     */
    public getFloatData(totalVertices: number, forceCopy?: boolean): Nullable<FloatArray> {
        const data = this.getData();
        if (!data) {
            return null;
        }

        return GetFloatData(data, this._size, this.type, this.byteOffset, this.byteStride, this.normalized, totalVertices, forceCopy);
    }

    /**
     * Gets underlying native buffer
     * @returns underlying native buffer
     */
    public getBuffer(): Nullable<DataBuffer> {
        return this._buffer.getBuffer();
    }

    /**
     * Gets the Buffer instance that wraps the native GPU buffer
     * @returns the wrapper buffer
     */
    public getWrapperBuffer(): Buffer {
        return this._buffer;
    }

    /**
     * Gets the stride in float32 units (i.e. byte stride / 4).
     * May not be an integer if the byte stride is not divisible by 4.
     * @returns the stride in float32 units
     * @deprecated Please use byteStride instead.
     */
    public getStrideSize(): number {
        return this.byteStride / GetTypeByteLength(this.type);
    }

    /**
     * Returns the offset as a multiple of the type byte length.
     * @returns the offset in bytes
     * @deprecated Please use byteOffset instead.
     */
    public getOffset(): number {
        return this.byteOffset / GetTypeByteLength(this.type);
    }

    /**
     * Returns the number of components or the byte size per vertex attribute
     * @param sizeInBytes If true, returns the size in bytes or else the size in number of components of the vertex attribute (default: false)
     * @returns the number of components
     */
    public getSize(sizeInBytes = false): number {
        return sizeInBytes ? this._size * GetTypeByteLength(this.type) : this._size;
    }

    /**
     * Gets a boolean indicating is the internal buffer of the VertexBuffer is instanced
     * @returns true if this buffer is instanced
     */
    public getIsInstanced(): boolean {
        return this._instanced;
    }

    /**
     * Returns the instancing divisor, zero for non-instanced (integer).
     * @returns a number
     */
    public getInstanceDivisor(): number {
        return this._instanceDivisor;
    }

    // Methods

    /**
     * Store data into the buffer. If the buffer was already used it will be either recreated or updated depending on isUpdatable property
     * @param data defines the data to store
     */
    public create(data?: DataArray): void {
        this._buffer.create(data);
        this._alignBuffer();
    }

    /**
     * Updates the underlying buffer according to the passed numeric array or Float32Array.
     * This function will create a new buffer if the current one is not updatable
     * @param data defines the data to store
     */
    public update(data: DataArray): void {
        this._buffer.update(data);
        this._alignBuffer();
    }

    /**
     * Updates directly the underlying WebGLBuffer according to the passed numeric array or Float32Array.
     * Returns the directly updated WebGLBuffer.
     * @param data the new data
     * @param offset the new offset
     * @param useBytes set to true if the offset is in bytes
     */
    public updateDirectly(data: DataArray, offset: number, useBytes: boolean = false): void {
        this._buffer.updateDirectly(data, offset, undefined, useBytes);
        this._alignBuffer();
    }

    /**
     * Disposes the VertexBuffer and the underlying WebGLBuffer.
     */
    public dispose(): void {
        if (this._ownsBuffer) {
            this._buffer.dispose();
        }

        this._isDisposed = true;
    }

    /**
     * Enumerates each value of this vertex buffer as numbers.
     * @param count the number of values to enumerate
     * @param callback the callback function called for each value
     */
    public forEach(count: number, callback: (value: number, index: number) => void): void {
        EnumerateFloatValues(this._buffer.getData()!, this.byteOffset, this.byteStride, this._size, this.type, count, this.normalized, (values, index) => {
            for (let i = 0; i < this._size; i++) {
                callback(values[i], index + i);
            }
        });
    }

    /** @internal */
    public _alignBuffer() {}

    // Enums
    /**
     * Positions
     */
    public static readonly PositionKind = Constants.PositionKind;
    /**
     * Normals
     */
    public static readonly NormalKind = Constants.NormalKind;
    /**
     * Tangents
     */
    public static readonly TangentKind = Constants.TangentKind;
    /**
     * Texture coordinates
     */
    public static readonly UVKind = Constants.UVKind;
    /**
     * Texture coordinates 2
     */
    public static readonly UV2Kind = Constants.UV2Kind;
    /**
     * Texture coordinates 3
     */
    public static readonly UV3Kind = Constants.UV3Kind;
    /**
     * Texture coordinates 4
     */
    public static readonly UV4Kind = Constants.UV4Kind;
    /**
     * Texture coordinates 5
     */
    public static readonly UV5Kind = Constants.UV5Kind;
    /**
     * Texture coordinates 6
     */
    public static readonly UV6Kind = Constants.UV6Kind;
    /**
     * Colors
     */
    public static readonly ColorKind = Constants.ColorKind;
    /**
     * Instance Colors
     */
    public static readonly ColorInstanceKind = Constants.ColorInstanceKind;
    /**
     * Matrix indices (for bones)
     */
    public static readonly MatricesIndicesKind = Constants.MatricesIndicesKind;
    /**
     * Matrix weights (for bones)
     */
    public static readonly MatricesWeightsKind = Constants.MatricesWeightsKind;
    /**
     * Additional matrix indices (for bones)
     */
    public static readonly MatricesIndicesExtraKind = Constants.MatricesIndicesExtraKind;
    /**
     * Additional matrix weights (for bones)
     */
    public static readonly MatricesWeightsExtraKind = Constants.MatricesWeightsExtraKind;

    /**
     * Deduces the stride given a kind.
     * @param kind The kind string to deduce
     * @returns The deduced stride
     */
    public static DeduceStride(kind: string): number {
        switch (kind) {
            case VertexBuffer.UVKind:
            case VertexBuffer.UV2Kind:
            case VertexBuffer.UV3Kind:
            case VertexBuffer.UV4Kind:
            case VertexBuffer.UV5Kind:
            case VertexBuffer.UV6Kind:
                return 2;
            case VertexBuffer.NormalKind:
            case VertexBuffer.PositionKind:
                return 3;
            case VertexBuffer.ColorKind:
            case VertexBuffer.ColorInstanceKind:
            case VertexBuffer.MatricesIndicesKind:
            case VertexBuffer.MatricesIndicesExtraKind:
            case VertexBuffer.MatricesWeightsKind:
            case VertexBuffer.MatricesWeightsExtraKind:
            case VertexBuffer.TangentKind:
                return 4;
            default:
                throw new Error("Invalid kind '" + kind + "'");
        }
    }

    /**
     * Gets the vertex buffer type of the given data array.
     * @param data the data array
     * @returns the vertex buffer type
     */
    public static GetDataType(data: DataArray): number {
        if (data instanceof Int8Array) {
            return VertexBuffer.BYTE;
        } else if (data instanceof Uint8Array) {
            return VertexBuffer.UNSIGNED_BYTE;
        } else if (data instanceof Int16Array) {
            return VertexBuffer.SHORT;
        } else if (data instanceof Uint16Array) {
            return VertexBuffer.UNSIGNED_SHORT;
        } else if (data instanceof Int32Array) {
            return VertexBuffer.INT;
        } else if (data instanceof Uint32Array) {
            return VertexBuffer.UNSIGNED_INT;
        } else {
            return VertexBuffer.FLOAT;
        }
    }

    /**
     * Gets the byte length of the given type.
     * @param type the type
     * @returns the number of bytes
     * @deprecated Use `getTypeByteLength` from `bufferUtils` instead
     */
    public static GetTypeByteLength(type: number): number {
        return GetTypeByteLength(type);
    }

    /**
     * Enumerates each value of the given parameters as numbers.
     * @param data the data to enumerate
     * @param byteOffset the byte offset of the data
     * @param byteStride the byte stride of the data
     * @param componentCount the number of components per element
     * @param componentType the type of the component
     * @param count the number of values to enumerate
     * @param normalized whether the data is normalized
     * @param callback the callback function called for each value
     * @deprecated Use `EnumerateFloatValues` from `bufferUtils` instead
     */
    public static ForEach(
        data: DataArray,
        byteOffset: number,
        byteStride: number,
        componentCount: number,
        componentType: number,
        count: number,
        normalized: boolean,
        callback: (value: number, index: number) => void
    ): void {
        EnumerateFloatValues(data, byteOffset, byteStride, componentCount, componentType, count, normalized, (values, index) => {
            for (let componentIndex = 0; componentIndex < componentCount; componentIndex++) {
                callback(values[componentIndex], index + componentIndex);
            }
        });
    }

    /**
     * Gets the given data array as a float array. Float data is constructed if the data array cannot be returned directly.
     * @param data the input data array
     * @param size the number of components
     * @param type the component type
     * @param byteOffset the byte offset of the data
     * @param byteStride the byte stride of the data
     * @param normalized whether the data is normalized
     * @param totalVertices number of vertices in the buffer to take into account
     * @param forceCopy defines a boolean indicating that the returned array must be cloned upon returning it
     * @returns a float array containing vertex data
     * @deprecated Use `GetFloatData` from `bufferUtils` instead
     */
    public static GetFloatData(
        data: DataArray,
        size: number,
        type: number,
        byteOffset: number,
        byteStride: number,
        normalized: boolean,
        totalVertices: number,
        forceCopy?: boolean
    ): FloatArray {
        return GetFloatData(data, size, type, byteOffset, byteStride, normalized, totalVertices, forceCopy);
    }
}
