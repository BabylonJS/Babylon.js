module BABYLON {
    export class VertexBuffer {
        private _buffer: Buffer;
        private _kind: string;
        private _size: number;
        private _ownsBuffer: boolean;
        private _instanced: boolean;
        private _instanceDivisor: number;

        /**
         * The byte type.
         */
        public static readonly BYTE = 5120;

        /**
         * The unsigned byte type.
         */
        public static readonly UNSIGNED_BYTE = 5121;

        /**
         * The short type.
         */
        public static readonly SHORT = 5122;

        /**
         * The unsigned short type.
         */
        public static readonly UNSIGNED_SHORT = 5123;

        /**
         * The integer type.
         */
        public static readonly INT = 5124;

        /**
         * The unsigned integer type.
         */
        public static readonly UNSIGNED_INT = 5125;

        /**
         * The float type.
         */
        public static readonly FLOAT = 5126;

        /**
         * Gets or sets the instance divisor when in instanced mode
         */
        public get instanceDivisor(): number {
            return this._instanceDivisor;
        }

        public set instanceDivisor(value: number) {
            this._instanceDivisor = value;
            if (value == 0) {
                this._instanced = false;
            } else {
                this._instanced = true;
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
         */
        constructor(engine: any, data: DataArray | Buffer, kind: string, updatable: boolean, postponeInternalCreation?: boolean, stride?: number, instanced?: boolean, offset?: number, size?: number, type?: number, normalized = false, useBytes = false) {
            if (data instanceof Buffer) {
                this._buffer = data;
                this._ownsBuffer = false;
            } else {
                this._buffer = new Buffer(engine, data, updatable, stride, postponeInternalCreation, instanced, useBytes);
                this._ownsBuffer = true;
            }

            this._kind = kind;

            if (type == undefined) {
                const data = this.getData();
                this.type = VertexBuffer.FLOAT;
                if (data instanceof Int8Array) this.type = VertexBuffer.BYTE;
                else if (data instanceof Uint8Array) this.type = VertexBuffer.UNSIGNED_BYTE;
                else if (data instanceof Int16Array) this.type = VertexBuffer.SHORT;
                else if (data instanceof Uint16Array) this.type = VertexBuffer.UNSIGNED_SHORT;
                else if (data instanceof Int32Array) this.type = VertexBuffer.INT;
                else if (data instanceof Uint32Array) this.type = VertexBuffer.UNSIGNED_INT;
            }
            else {
                this.type = type;
            }

            const typeByteLength = VertexBuffer.GetTypeByteLength(this.type);

            if (useBytes) {
                this._size = size || (stride ? (stride / typeByteLength) : VertexBuffer.DeduceStride(kind));
                this.byteStride = stride || this._buffer.byteStride || (this._size * typeByteLength);
                this.byteOffset = offset || 0;
            }
            else {
                this._size = size || stride || VertexBuffer.DeduceStride(kind);
                this.byteStride = stride ? (stride * typeByteLength) : (this._buffer.byteStride || (this._size * typeByteLength));
                this.byteOffset = (offset || 0) * typeByteLength;
            }

            this.normalized = normalized;

            this._instanced = instanced !== undefined ? instanced : false;
            this._instanceDivisor = instanced ? 1 : 0;
        }

        public _rebuild(): void {
            if (!this._buffer) {
                return;
            }

            this._buffer._rebuild();
        }

        /**
         * Returns the kind of the VertexBuffer (string).  
         */
        public getKind(): string {
            return this._kind;
        }

        // Properties
        /**
         * Boolean : is the VertexBuffer updatable ?
         */
        public isUpdatable(): boolean {
            return this._buffer.isUpdatable();
        }

        /**
         * Returns an array of numbers or a typed array containing the VertexBuffer data.  
         */
        public getData(): Nullable<DataArray> {
            return this._buffer.getData();
        }

        /**
         * Returns the WebGLBuffer associated to the VertexBuffer.  
         */
        public getBuffer(): Nullable<WebGLBuffer> {
            return this._buffer.getBuffer();
        }

        /**
         * Returns the stride as a multiple of the type byte length.
         * DEPRECATED. Use byteStride instead.
         */
        public getStrideSize(): number {
            return this.byteStride / VertexBuffer.GetTypeByteLength(this.type);
        }

        /**
         * Returns the offset as a multiple of the type byte length.
         * DEPRECATED. Use byteOffset instead.
         */
        public getOffset(): number {
            return this.byteOffset / VertexBuffer.GetTypeByteLength(this.type);
        }

        /**
         * Returns the number of components per vertex attribute (integer).  
         */
        public getSize(): number {
            return this._size;
        }

        /**
         * Boolean : is the WebGLBuffer of the VertexBuffer instanced now ?
         */
        public getIsInstanced(): boolean {
            return this._instanced;
        }

        /**
         * Returns the instancing divisor, zero for non-instanced (integer).  
         */
        public getInstanceDivisor(): number {
            return this._instanceDivisor;
        }

        // Methods

        /**
         * Creates the underlying WebGLBuffer from the passed numeric array or Float32Array.  
         * Returns the created WebGLBuffer.   
         */
        public create(data?: DataArray): void {
            return this._buffer.create(data);
        }

        /**
         * Updates the underlying WebGLBuffer according to the passed numeric array or Float32Array.  
         * This function will create a new buffer if the current one is not updatable
         * Returns the updated WebGLBuffer.  
         */
        public update(data: DataArray): void {
            return this._buffer.update(data);
        }

        /**
         * Updates directly the underlying WebGLBuffer according to the passed numeric array or Float32Array.  
         * Returns the directly updated WebGLBuffer.
         * @param data the new data
         * @param offset the new offset
         * @param useBytes set to true if the offset is in bytes
         */
        public updateDirectly(data: DataArray, offset: number, useBytes: boolean = false): void {
            return this._buffer.updateDirectly(data, offset, undefined, useBytes);
        }

        /** 
         * Disposes the VertexBuffer and the underlying WebGLBuffer.  
         */
        public dispose(): void {
            if (this._ownsBuffer) {
                this._buffer.dispose();
            }
        }

        /**
         * Enumerates each value of this vertex buffer as numbers.
         * @param count the number of values to enumerate
         * @param callback the callback function called for each value
         */
        public forEach(count: number, callback: (value: number, index: number) => void): void {
            VertexBuffer.ForEach(this._buffer.getData()!, this.byteOffset, this.byteStride, this._size, this.type, count, this.normalized, callback);
        }

        // Enums
        private static _PositionKind = "position";
        private static _NormalKind = "normal";
        private static _TangentKind = "tangent";
        private static _UVKind = "uv";
        private static _UV2Kind = "uv2";
        private static _UV3Kind = "uv3";
        private static _UV4Kind = "uv4";
        private static _UV5Kind = "uv5";
        private static _UV6Kind = "uv6";
        private static _ColorKind = "color";
        private static _MatricesIndicesKind = "matricesIndices";
        private static _MatricesWeightsKind = "matricesWeights";
        private static _MatricesIndicesExtraKind = "matricesIndicesExtra";
        private static _MatricesWeightsExtraKind = "matricesWeightsExtra";

        public static get PositionKind(): string {
            return VertexBuffer._PositionKind;
        }

        public static get NormalKind(): string {
            return VertexBuffer._NormalKind;
        }

        public static get TangentKind(): string {
            return VertexBuffer._TangentKind;
        }

        public static get UVKind(): string {
            return VertexBuffer._UVKind;
        }

        public static get UV2Kind(): string {
            return VertexBuffer._UV2Kind;
        }

        public static get UV3Kind(): string {
            return VertexBuffer._UV3Kind;
        }

        public static get UV4Kind(): string {
            return VertexBuffer._UV4Kind;
        }

        public static get UV5Kind(): string {
            return VertexBuffer._UV5Kind;
        }

        public static get UV6Kind(): string {
            return VertexBuffer._UV6Kind;
        }

        public static get ColorKind(): string {
            return VertexBuffer._ColorKind;
        }

        public static get MatricesIndicesKind(): string {
            return VertexBuffer._MatricesIndicesKind;
        }

        public static get MatricesWeightsKind(): string {
            return VertexBuffer._MatricesWeightsKind;
        }

        public static get MatricesIndicesExtraKind(): string {
            return VertexBuffer._MatricesIndicesExtraKind;
        }

        public static get MatricesWeightsExtraKind(): string {
            return VertexBuffer._MatricesWeightsExtraKind;
        }

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
         * Gets the byte length of the given type.
         * @param type the type
         * @returns the number of bytes
         */
        public static GetTypeByteLength(type: number): number {
            switch (type) {
                case VertexBuffer.BYTE:
                case VertexBuffer.UNSIGNED_BYTE:
                    return 1;
                case VertexBuffer.SHORT:
                case VertexBuffer.UNSIGNED_SHORT:
                    return 2;
                case VertexBuffer.INT:
                case VertexBuffer.FLOAT:
                    return 4;
                default:
                    throw new Error(`Invalid type '${type}'`);
            }
        }

        /**
         * Enumerates each value of the given parameters as numbers.
         * @param data the data to enumerate
         * @param byteOffset the byte offset of the data
         * @param byteStride the byte stride of the data
         * @param componentCount the number of components per element
         * @param componentType the type of the component
         * @param count the total number of components
         * @param normalized whether the data is normalized
         * @param callback the callback function called for each value
         */
        public static ForEach(data: DataArray, byteOffset: number, byteStride: number, componentCount: number, componentType: number, count: number, normalized: boolean, callback: (value: number, index: number) => void): void {
            if (data instanceof Array) {
                let offset = byteOffset / 4;
                const stride = byteStride / 4;
                for (let index = 0; index < count; index += componentCount) {
                    for (let componentIndex = 0; componentIndex < componentCount; componentIndex++) {
                        callback(data[offset + componentIndex], index + componentIndex);
                    }
                    offset += stride;
                }
            }
            else {
                const dataView = data instanceof ArrayBuffer ? new DataView(data) : new DataView(data.buffer, data.byteOffset, data.byteLength);
                const componentByteLength = VertexBuffer.GetTypeByteLength(componentType);
                for (let index = 0; index < count; index += componentCount) {
                    let componentByteOffset = byteOffset;
                    for (let componentIndex = 0; componentIndex < componentCount; componentIndex++) {
                        const value = VertexBuffer._GetFloatValue(dataView, componentType, componentByteOffset, normalized);
                        callback(value, index + componentIndex);
                        componentByteOffset += componentByteLength;
                    }
                    byteOffset += byteStride;
                }
            }
        }

        private static _GetFloatValue(dataView: DataView, type: number, byteOffset: number, normalized: boolean): number {
            switch (type) {
                case VertexBuffer.BYTE: {
                    let value = dataView.getInt8(byteOffset);
                    if (normalized) {
                        value = (value + 0.5) / 127.5;
                    }
                    return value;
                }
                case VertexBuffer.UNSIGNED_BYTE: {
                    let value = dataView.getUint8(byteOffset);
                    if (normalized) {
                        value = value / 255;
                    }
                    return value;
                }
                case VertexBuffer.SHORT: {
                    let value = dataView.getInt16(byteOffset, true);
                    if (normalized) {
                        value = (value + 0.5) / 16383.5;
                    }
                    return value;
                }
                case VertexBuffer.UNSIGNED_SHORT: {
                    let value = dataView.getUint16(byteOffset, true);
                    if (normalized) {
                        value = value / 65535;
                    }
                    return value;
                }
                case VertexBuffer.FLOAT: {
                    return dataView.getFloat32(byteOffset, true);
                }
                default: {
                    throw new Error(`Invalid component type ${type}`);
                }
            }
        }
    }
}