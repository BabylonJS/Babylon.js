module BABYLON {
    export class VertexBuffer {
        private _buffer: Buffer;
        private _kind: string;
        private _offset: number;
        private _size: number;
        private _stride: number;
        private _ownsBuffer: boolean;

        constructor(engine: any, data: number[] | Float32Array | Buffer, kind: string, updatable: boolean, postponeInternalCreation?: boolean, stride?: number, instanced?: boolean, offset?: number, size?: number) {
            if (!stride) {
                // Deduce stride from kind
                switch (kind) {
                    case VertexBuffer.PositionKind:
                        stride = 3;
                        break;
                    case VertexBuffer.NormalKind:
                        stride = 3;
                        break;
                    case VertexBuffer.UVKind:
                    case VertexBuffer.UV2Kind:
                    case VertexBuffer.UV3Kind:
                    case VertexBuffer.UV4Kind:
                    case VertexBuffer.UV5Kind:
                    case VertexBuffer.UV6Kind:
                        stride = 2;
                        break;
                    case VertexBuffer.ColorKind:
                        stride = 4;
                        break;
                    case VertexBuffer.MatricesIndicesKind:
                    case VertexBuffer.MatricesIndicesExtraKind:
                        stride = 4;
                        break;
                    case VertexBuffer.MatricesWeightsKind:
                    case VertexBuffer.MatricesWeightsExtraKind:
                        stride = 4;
                        break;
                }
            }

            if (data instanceof Buffer) {
                if (!stride) {
                    stride = data.getStrideSize();
                }
                this._buffer = data;
                this._ownsBuffer = false;
            } else {
                this._buffer = new Buffer(engine, <number[] | Float32Array>data, updatable, stride, postponeInternalCreation, instanced);
                this._ownsBuffer = true;
            }

            this._stride = stride;


            this._offset = offset ? offset : 0;
            this._size = size ? size : stride;

            this._kind = kind;
        }


        public getKind(): string {
            return this._kind;
        }

        // Properties
        public isUpdatable(): boolean {
            return this._buffer.isUpdatable();
        }

        public getData(): number[] | Float32Array {
            return this._buffer.getData();
        }

        public getBuffer(): WebGLBuffer {
            return this._buffer.getBuffer();
        }

        public getStrideSize(): number {
            return this._stride;
        }

        public getOffset(): number {
            return this._offset;
        }

        public getSize(): number {
            return this._size;
        }

        public getIsInstanced(): boolean {
            return this._buffer.getIsInstanced();
        }

        // Methods


        public create(data?: number[] | Float32Array): void {
            return this._buffer.create(data);
        }

        public update(data: number[] | Float32Array): void {
            return this._buffer.update(data);
        }

        public updateDirectly(data: Float32Array, offset: number): void {
            return this._buffer.updateDirectly(data, offset);
        }

        public dispose(): void {
            if (this._ownsBuffer) {
                this._buffer.dispose();
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