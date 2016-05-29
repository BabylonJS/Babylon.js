module BABYLON {
    export class InterleavedVertexBuffer implements IVertexBuffer {
        private _buffer: InterleavedBuffer;
        private _offset: number;
        private _size: number;
        private _kind: string;

        constructor(buffer: InterleavedBuffer, kind: string, size: number, offset: number) {
            this._kind = kind;

            this._buffer = buffer;
            this._offset = offset;
            this._size = size;
        }

        public getKind(): string {
            return this._kind;
        }

        public getStrideSize(): number {
            return this._buffer.getStrideSize();
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

        public getBuffer(): WebGLBuffer {
            return this._buffer.getBuffer();
        }

        public getData(): number[] | Float32Array {
            return this._buffer.getData();
        }

        public isUpdatable(): boolean {
            return this._buffer.isUpdatable();
        }

        public create(data?: number[] | Float32Array): void
        {
            return this._buffer.create(data);
        }

        public update(data: number[] | Float32Array): void
        {
            return this._buffer.update(data);
        }

        public updateDirectly(data: Float32Array, offset: number): void
        {
            return this._buffer.updateDirectly(data, offset);
        }

        public dispose(): void {
        }
    }
} 
