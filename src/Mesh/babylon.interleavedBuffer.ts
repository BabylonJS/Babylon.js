module BABYLON {
    export class InterleavedBuffer {
        private _engine: Engine;
        private _buffer: WebGLBuffer;
        private _data: number[] | Float32Array;
        private _updatable: boolean;
        private _strideSize: number;
        private _instanced: boolean;

        constructor(engine: any, data: number[] | Float32Array, updatable: boolean, stride: number, postponeInternalCreation?: boolean, instanced?: boolean) {
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
        }

        // Properties
        public isUpdatable(): boolean {
            return this._updatable;
        }

        public getData(): number[] | Float32Array {
            return this._data;
        }

        public getBuffer(): WebGLBuffer {
            return this._buffer;
        }

        public getStrideSize(): number {
            return this._strideSize;
        }

        public getIsInstanced(): boolean {
            return this._instanced;
        }

        // Methods
        public create(data?: number[] | Float32Array): void {
            if (!data && this._buffer) {
                return; // nothing to do
            }

            data = data || this._data;

            if (!this._buffer) { // create buffer
                if (this._updatable) {
                    this._buffer = this._engine.createDynamicVertexBuffer(data);
                } else {
                    this._buffer = this._engine.createVertexBuffer(data);
                    this._data = null;
                }
            }

            if (this._updatable) { // update buffer
                this._engine.updateDynamicVertexBuffer(this._buffer, data);
                this._data = data;
            }
        }

        public update(data: number[] | Float32Array): void {
            this.create(data);
        }

        public updateDirectly(data: Float32Array, offset: number, vertexCount?: number): void {
            if (!this._buffer) {
                return;
            }

            if (this._updatable) { // update buffer
                this._engine.updateDynamicVertexBuffer(this._buffer, data, offset, (vertexCount ? vertexCount * this.getStrideSize() : undefined));
                this._data = data;
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
