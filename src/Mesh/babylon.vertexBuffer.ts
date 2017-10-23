module BABYLON {
    export class VertexBuffer {
        private _buffer: Buffer;
        private _kind: string;
        private _offset: number;
        private _size: number;
        private _stride: number;
        private _ownsBuffer: boolean;

        constructor(engine: any, data: FloatArray | Buffer, kind: string, updatable: boolean, postponeInternalCreation?: boolean, stride?: number, instanced?: boolean, offset?: number, size?: number) {
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
                    case VertexBuffer.TangentKind:
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
                this._buffer = new Buffer(engine, <FloatArray>data, updatable, stride, postponeInternalCreation, instanced);
                this._ownsBuffer = true;
            }

            this._stride = stride;


            this._offset = offset ? offset : 0;
            this._size = size ? size : stride;

            this._kind = kind;
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
         * Returns an array of numbers or a Float32Array containing the VertexBuffer data.  
         */
        public getData(): FloatArray {
            return this._buffer.getData();
        }

        /**
         * Returns the WebGLBuffer associated to the VertexBuffer.  
         */
        public getBuffer(): WebGLBuffer {
            return this._buffer.getBuffer();
        }

        /**
         * Returns the stride of the VertexBuffer (integer).  
         */
        public getStrideSize(): number {
            return this._stride;
        }

        /**
         * Returns the offset (integer).  
         */
        public getOffset(): number {
            return this._offset;
        }

        /**
         * Returns the VertexBuffer total size (integer).  
         */
        public getSize(): number {
            return this._size;
        }

        /**
         * Boolean : is the WebGLBuffer of the VertexBuffer instanced now ?
         */
        public getIsInstanced(): boolean {
            return this._buffer.getIsInstanced();
        }

        /**
         * Returns the instancing divisor, zero for non-instanced (integer).  
         */
        public getInstanceDivisor(): number {
            return this._buffer.instanceDivisor;
        }

        // Methods

        /**
         * Creates the underlying WebGLBuffer from the passed numeric array or Float32Array.  
         * Returns the created WebGLBuffer.   
         */
        public create(data?: FloatArray): void {
            return this._buffer.create(data);
        }

        /**
         * Updates the underlying WebGLBuffer according to the passed numeric array or Float32Array.  
         * Returns the updated WebGLBuffer.  
         */
        public update(data: FloatArray): void {
            return this._buffer.update(data);
        }

        /**
         * Updates directly the underlying WebGLBuffer according to the passed numeric array or Float32Array.  
         * Returns the directly updated WebGLBuffer. 
         */
        public updateDirectly(data: Float32Array, offset: number): void {
            return this._buffer.updateDirectly(data, offset);
        }

        /** 
         * Disposes the VertexBuffer and the underlying WebGLBuffer.  
         */
        public dispose(): void {
            if (this._ownsBuffer) {
                this._buffer.dispose();
            }
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
    }
} 