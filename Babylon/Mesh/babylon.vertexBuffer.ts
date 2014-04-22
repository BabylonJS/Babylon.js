module BABYLON {
    export class VertexBuffer {
        private _mesh; //ANY
        private _engine; //ANY
        private _buffer;
        private _data: number[];
        private _updatable: boolean;
        private _kind: string;
        private _strideSize: number;

        //ANY
        constructor(mesh, data: number[], kind: string, updatable: boolean, engine?) {
            this._mesh = mesh;
            this._engine = engine || mesh.getScene().getEngine();
            this._updatable = updatable;

            if (updatable) {
                this._buffer = this._engine.createDynamicVertexBuffer(data.length * 4);
                this._engine.updateDynamicVertexBuffer(this._buffer, data);
            } else {
                this._buffer = this._engine.createVertexBuffer(data);
            }

            this._data = data;
            this._kind = kind;

            switch (kind) {
                case VertexBuffer.PositionKind:
                    this._strideSize = 3;
                    if (this._mesh) {
                        this._mesh._resetPointsArrayCache();
                    }
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

        public getStrideSize(): number {
            return this._strideSize;
        }

        // Methods
        public update(data: number[]): void {
            this._engine.updateDynamicVertexBuffer(this._buffer, data);
            this._data = data;

            if (this._kind === BABYLON.VertexBuffer.PositionKind && this._mesh) {
                this._mesh._resetPointsArrayCache();
            }
        }

        public dispose(): void {
            this._engine._releaseBuffer(this._buffer);
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