module BABYLON {
    export interface IVertexBuffer extends IDisposable {
        getKind(): string;
        getStrideSize(): number;
        getData(): number[] | Float32Array;
        getBuffer(): WebGLBuffer;
        getOffset(): number;
        getSize(): number;
        getIsInstanced(): boolean;
        isUpdatable(): boolean;
        create(data?: number[] | Float32Array): void;
        update(data: number[] | Float32Array): void;
        updateDirectly(data: Float32Array, offset: number): void;
    }

    export class VertexBuffer implements IVertexBuffer {
        private _engine: Engine;
        private _buffer: WebGLBuffer;
        private _data: number[] | Float32Array;
        private _updatable: boolean;
        private _kind: string;
        private _strideSize: number;
        private _instanced: boolean;

        constructor(engine: any, data: number[] | Float32Array, kind: string, updatable: boolean, postponeInternalCreation?: boolean, stride?: number, instanced?: boolean) {
            if (engine instanceof Mesh) { // old versions of BABYLON.VertexBuffer accepted 'mesh' instead of 'engine'
                this._engine = engine.getScene().getEngine();
            }
            else {
                this._engine = engine;
            }

            this._updatable = updatable;

            this._data = data;

            this._instanced = instanced;

            if (!postponeInternalCreation) { // by default
                this.create();
            }

            this._kind = kind;

            if (stride) {
                this._strideSize = stride;
                return;
            }

            // Deduce stride from kind
            switch (kind) {
                case VertexBuffer.PositionKind:
                    this._strideSize = 3;
                    break;
                case VertexBuffer.NormalKind:
                    this._strideSize = 3;
                    break;
                case VertexBuffer.UVKind:
                case VertexBuffer.UV2Kind:
                case VertexBuffer.UV3Kind:
                case VertexBuffer.UV4Kind:
                case VertexBuffer.UV5Kind:
                case VertexBuffer.UV6Kind:
                    this._strideSize = 2;
                    break;
                case VertexBuffer.ColorKind:
                    this._strideSize = 4;
                    break;
                case VertexBuffer.MatricesIndicesKind:
                case VertexBuffer.MatricesIndicesExtraKind:
                    this._strideSize = 4;
                    break;
                case VertexBuffer.MatricesWeightsKind:
                case VertexBuffer.MatricesWeightsExtraKind:
                    this._strideSize = 4;
                    break;
            }
        }

        // Properties
        public isUpdatable(): boolean {
            return this._updatable;
        }

        public getKind(): string {
            return this._kind;
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

        public getOffset(): number {
            return 0;
        }

        public getSize(): number {
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

        public updateDirectly(data: Float32Array, offset: number): void {
            if (!this._buffer) {
                return;
            }

            if (this._updatable) { // update buffer
                this._engine.updateDynamicVertexBuffer(this._buffer, data, offset);
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

        // Enums
        private static _PositionKind = "position";
        private static _NormalKind = "normal";
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
    }
} 