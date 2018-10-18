module BABYLON {
    /**
     * Class used to store data that will be store in GPU memory
     */
    export class Buffer {
        private _engine: Engine;
        private _buffer: Nullable<WebGLBuffer>;
        /** @hidden */
        public _data: Nullable<DataArray>;
        private _updatable: boolean;
        private _instanced: boolean;

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
         */
        constructor(engine: any, data: DataArray, updatable: boolean, stride = 0, postponeInternalCreation = false, instanced = false, useBytes = false) {
            if (engine instanceof Mesh) { // old versions of BABYLON.VertexBuffer accepted 'mesh' instead of 'engine'
                this._engine = engine.getScene().getEngine();
            }
            else {
                this._engine = engine;
            }

            this._updatable = updatable;
            this._instanced = instanced;

            this._data = data;

            this.byteStride = useBytes ? stride : stride * Float32Array.BYTES_PER_ELEMENT;

            if (!postponeInternalCreation) { // by default
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
         * @param useBytes defines if the offset and stride are in bytes
         * @returns the new vertex buffer
         */
        public createVertexBuffer(kind: string, offset: number, size: number, stride?: number, instanced?: boolean, useBytes = false): VertexBuffer {
            const byteOffset = useBytes ? offset : offset * Float32Array.BYTES_PER_ELEMENT;
            const byteStride = stride ? (useBytes ? stride : stride * Float32Array.BYTES_PER_ELEMENT) : this.byteStride;

            // a lot of these parameters are ignored as they are overriden by the buffer
            return new VertexBuffer(this._engine, this, kind, this._updatable, true, byteStride, instanced === undefined ? this._instanced : instanced, byteOffset, size, undefined, undefined, true);
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
        public getBuffer(): Nullable<WebGLBuffer> {
            return this._buffer;
        }

        /**
         * Gets the stride in float32 units (i.e. byte stride / 4).
         * May not be an integer if the byte stride is not divisible by 4.
         * DEPRECATED. Use byteStride instead.
         * @returns the stride in float32 units
         */
        public getStrideSize(): number {
            return this.byteStride / Float32Array.BYTES_PER_ELEMENT;
        }

        // Methods

        /**
         * Store data into the buffer. If the buffer was already used it will be either recreated or updated depending on isUpdatable property
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

            if (!this._buffer) { // create buffer
                if (this._updatable) {
                    this._buffer = this._engine.createDynamicVertexBuffer(data);
                    this._data = data;
                } else {
                    this._buffer = this._engine.createVertexBuffer(data);
                }
            } else if (this._updatable) { // update buffer
                this._engine.updateDynamicVertexBuffer(this._buffer, data);
                this._data = data;
            }
        }

        /** @hidden */
        public _rebuild(): void {
            this._buffer = null;
            this.create(this._data);
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

            if (this._updatable) { // update buffer
                this._engine.updateDynamicVertexBuffer(this._buffer, data, useBytes ? offset : offset * Float32Array.BYTES_PER_ELEMENT, (vertexCount ? vertexCount * this.byteStride : undefined));
                this._data = null;
            }
        }

        /**
         * Release all resources
         */
        public dispose(): void {
            if (!this._buffer) {
                return;
            }
            if (this._engine._releaseBuffer(this._buffer)) {
                this._buffer = null;
            }
        }
    }
}
