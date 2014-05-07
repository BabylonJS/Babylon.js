module BABYLON {
    export class VertexBuffer {
        private _mesh: Mesh;
        private _engine: Engine;
        private _buffer: WebGLBuffer;
        private _data: number[];
        private _updatable: boolean;
        private _kind: string;
        private _strideSize: number;

        constructor(engine: any, data: number[], kind: string, updatable: boolean, postponeInternalCreation?: boolean) {
            if (engine instanceof Mesh) { // old versions of BABYLON.VertexBuffer accepted 'mesh' instead of 'engine'
                this._engine = engine.getScene().getEngine();
            }
            else {
                this._engine = engine;
            }

            this._updatable = updatable;

            this._data = data;

            if (!postponeInternalCreation) { // by default
                this.create();
            }

            this._kind = kind;

            switch (kind) {
                case VertexBuffer.PositionKind:
                    this._strideSize = 3;
                    break;
                case VertexBuffer.NormalKind:
                    this._strideSize = 3;
                    break;
                case VertexBuffer.UVKind:
                    this._strideSize = 2;
                    break;
                case VertexBuffer.UV2Kind:
                    this._strideSize = 2;
                    break;
                case VertexBuffer.ColorKind:
                    this._strideSize = 3;
                    break;
                case VertexBuffer.MatricesIndicesKind:
                    this._strideSize = 4;
                    break;
                case VertexBuffer.MatricesWeightsKind:
                    this._strideSize = 4;
                    break;
            }
        }

        // Properties
        public isUpdatable(): boolean {
            return this._updatable;
        }

        public getData(): number[] {
            return this._data;
        }

        public getBuffer(): WebGLBuffer {
            return this._buffer;
        }

        public getStrideSize(): number {
            return this._strideSize;
        }

        // Methods
        public create(data?: number[]): void {
            if (!data && this._buffer) {
                return; // nothing to do
            }

            data = data || this._data;

            if (!this._buffer) { // create buffer
                if (this._updatable) {
                    this._buffer = this._engine.createDynamicVertexBuffer(data.length * 4);
                } else {
                    this._buffer = this._engine.createVertexBuffer(data);
                }
            }

            if (this._updatable) { // update buffer
                this._engine.updateDynamicVertexBuffer(this._buffer, data);
                this._data = data;
            }
        }

        public update(data: number[]): void {
            this.create(data);
        }

        public dispose(): void {
            if (!this._buffer) {
                return;
            }
            if (this._engine._releaseBuffer(this._buffer)) {
                this._buffer = null;
            }
        }

        // Enums
        public static PositionKind = "position";
        public static NormalKind = "normal";
        public static UVKind = "uv";
        public static UV2Kind = "uv2";
        public static ColorKind = "color";
        public static MatricesIndicesKind = "matricesIndices";
        public static MatricesWeightsKind = "matricesWeights";
    }
} 