import { Nullable } from "../types";
import { Mesh, _InstancesBatch } from "../Meshes/mesh";
import { VertexBuffer, Buffer } from './buffer';
//import { SubMesh } from "./subMesh";
//import { Effect } from "../Materials/effect";
//import { Engine } from "../Engines/engine";

declare module "./mesh" {
    export interface Mesh {
        setThinInstanceBuffer(kind: string, buffer: Float32Array,  stride: number): void;

        /** @hidden */
        _thinInstancedBuffersStorage: Nullable<{
            instancesCount: number,
            matrixBuffer: Nullable<Buffer>,
            data: {[key: string]: Float32Array},
            sizes: {[key: string]: number},
            vertexBuffers: {[key: string]: Nullable<VertexBuffer> | Nullable<Array<VertexBuffer>>},
            strides: {[key: string]: number},
        }>;
    }
}

Mesh.prototype.setThinInstanceBuffer = function(kind: string, buffer: Float32Array, stride: number = 0): void {
    if (kind === "matrix") {
        this.removeVerticesData("world0");
        this.removeVerticesData("world1");
        this.removeVerticesData("world2");
        this.removeVerticesData("world3");
        stride = 16;
    } else {
        this.removeVerticesData(kind);
    }

    if (!this._thinInstancedBuffersStorage) {
        this._thinInstancedBuffersStorage = {
            instancesCount: 0,
            matrixBuffer: null,
            data: {},
            vertexBuffers: {},
            strides: {},
            sizes: {},
        };
    }

    if (kind === "matrix") {
        if (this._thinInstancedBuffersStorage.matrixBuffer) {
            this._thinInstancedBuffersStorage.matrixBuffer.dispose();
            this._thinInstancedBuffersStorage.matrixBuffer = null;
        }

        this._thinInstancedBuffersStorage.instancesCount = buffer.length / stride;

        const matrixBuffer = new Buffer(this.getEngine(), buffer, true, stride, false, true);

        this._thinInstancedBuffersStorage.matrixBuffer = matrixBuffer;
        this._thinInstancedBuffersStorage.vertexBuffers[kind] = [
            matrixBuffer.createVertexBuffer("world0", 0, 4),
            matrixBuffer.createVertexBuffer("world1", 4, 4),
            matrixBuffer.createVertexBuffer("world2", 8, 4),
            matrixBuffer.createVertexBuffer("world3", 12, 4),
        ],

        this.setVerticesBuffer((this._thinInstancedBuffersStorage.vertexBuffers[kind] as Array<VertexBuffer>)[0]);
        this.setVerticesBuffer((this._thinInstancedBuffersStorage.vertexBuffers[kind] as Array<VertexBuffer>)[1]);
        this.setVerticesBuffer((this._thinInstancedBuffersStorage.vertexBuffers[kind] as Array<VertexBuffer>)[2]);
        this.setVerticesBuffer((this._thinInstancedBuffersStorage.vertexBuffers[kind] as Array<VertexBuffer>)[3]);
    } else {
        this._thinInstancedBuffersStorage.vertexBuffers[kind] = new VertexBuffer(this.getEngine(), this._thinInstancedBuffersStorage.data[kind], kind, true, false, stride, true);
        this.setVerticesBuffer(this._thinInstancedBuffersStorage.vertexBuffers[kind] as VertexBuffer);
    }
};

Mesh.prototype._disposeThinInstanceSpecificData = function() {
    if (this._thinInstancedBuffersStorage?.matrixBuffer) {
        this._thinInstancedBuffersStorage.matrixBuffer.dispose();
        this._thinInstancedBuffersStorage.matrixBuffer = null;
    }

    if (this._thinInstancedBuffersStorage) {
        for (const kind in this._thinInstancedBuffersStorage) {
            const vertexBuffer = this._thinInstancedBuffersStorage.vertexBuffers[kind];
            if (vertexBuffer) {
                if (Array.isArray(vertexBuffer)) {
                    vertexBuffer.forEach((vbuffer) => vbuffer.dispose());
                } else {
                    vertexBuffer.dispose();
                }
            }
        }
    }

    this._thinInstancedBuffersStorage = null;
};
