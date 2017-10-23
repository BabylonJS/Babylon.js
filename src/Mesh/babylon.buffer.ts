module BABYLON {
    export class Buffer {
        private _engine: Engine;
        private _buffer: Nullable<WebGLBuffer>;
        private _data: Nullable<FloatArray>;
        private _updatable: boolean;
        private _strideSize: number;
        private _instanced: boolean;
        private _instanceDivisor: number;

        constructor(engine: any, data: FloatArray, updatable: boolean, stride: number, postponeInternalCreation?: boolean, instanced: boolean = false) {
            if (engine instanceof Mesh) { // old versions of BABYLON.VertexBuffer accepted 'mesh' instead of 'engine'
                this._engine = engine.getScene().getEngine();
            }
            else {
                this._engine = engine;
            }

            this._updatable = updatable;

            this._data = data;

            this._strideSize = stride;

            if (!postponeInternalCreation) { // by default
                this.create();
            }

            this._instanced = instanced;
            this._instanceDivisor = instanced ? 1 : 0;
        }

        public createVertexBuffer(kind: string, offset: number, size: number, stride?: number): VertexBuffer {
            // a lot of these parameters are ignored as they are overriden by the buffer
            return new VertexBuffer(this._engine, this, kind, this._updatable, true, stride ? stride : this._strideSize, this._instanced, offset, size);
        }

        // Properties
        public isUpdatable(): boolean {
            return this._updatable;
        }

        public getData(): Nullable<FloatArray> {
            return this._data;
        }

        public getBuffer(): Nullable<WebGLBuffer> {
            return this._buffer;
        }

        public getStrideSize(): number {
            return this._strideSize;
        }

        public getIsInstanced(): boolean {
            return this._instanced;
        }

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

        // Methods
        public create(data: Nullable<FloatArray> = null): void {
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

        public _rebuild(): void {
            this._buffer = null;
            this.create(this._data);
        }

        public update(data: FloatArray): void {
            this.create(data);
        }

        public updateDirectly(data: Float32Array, offset: number, vertexCount?: number): void {
            if (!this._buffer) {
                return;
            }

            if (this._updatable) { // update buffer
                this._engine.updateDynamicVertexBuffer(this._buffer, data, offset, (vertexCount ? vertexCount * this.getStrideSize() : undefined));
                this._data = null;
            }
        }

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
