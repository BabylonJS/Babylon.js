import { Nullable } from "../types";
import { Mesh, _InstancesBatch } from "../Meshes/mesh";
import { VertexBuffer, Buffer } from './buffer';
//import { SubMesh } from "./subMesh";
//import { Effect } from "../Materials/effect";
//import { Engine } from "../Engines/engine";
import { Matrix, Vector3 } from '../Maths/math.vector';

const tmpMatrix = Matrix.Identity();
const tmpV1 = new Vector3();
const tmpV2 = new Vector3();
const tmpV3 = new Vector3();

declare module "./mesh" {
    export interface Mesh {
        thinInstanceSetBuffer(kind: string, buffer: Nullable<Float32Array>,  stride: number): void;

        thinInstanceBufferUpdated(kind: string): void;

        thinInstanceGetMatrixAt(index: number, matrix: Matrix): boolean;

        thinInstanceSetMatrixAt(index: number, matrix: Matrix, refresh: boolean): void;

        thinInstanceRefreshBoundingInfo(): void;

        /** @hidden */
        _thinInstanceStorage: Nullable<{
            instancesCount: number,
            nonUniformScaling: boolean,
            matrixBuffer: Nullable<Buffer>,
            data: {[key: string]: Float32Array},
            sizes: {[key: string]: number},
            vertexBuffers: {[key: string]: Nullable<VertexBuffer>},
            strides: {[key: string]: number},
            boundingVectors: Array<Vector3>,
        }>;
    }
}

Mesh.prototype.thinInstanceSetBuffer = function(kind: string, buffer: Nullable<Float32Array>, stride: number = 0): void {
    if (kind === "matrix") {
        stride = 16;
    }

    if (!this._thinInstanceStorage) {
        this._thinInstanceStorage = {
            instancesCount: 0,
            nonUniformScaling: false,
            matrixBuffer: null,
            data: {},
            vertexBuffers: {},
            strides: {},
            sizes: {},
            boundingVectors: [],
        };
    }

    if (buffer === null) {
        delete this._thinInstanceStorage.data[kind];
    } else {
        this._thinInstanceStorage.data[kind] = buffer;
    }

    if (kind === "matrix") {
        if (this._thinInstanceStorage.matrixBuffer) {
            this._thinInstanceStorage.matrixBuffer.dispose();
            this._thinInstanceStorage.matrixBuffer = null;
        }

        if (buffer !== null) {
            this._thinInstanceStorage.instancesCount = buffer.length / stride;

            const matrixBuffer = new Buffer(this.getEngine(), buffer, true, stride, false, true);

            this._thinInstanceStorage.matrixBuffer = matrixBuffer;

            this.setVerticesBuffer(matrixBuffer.createVertexBuffer("world0", 0, 4));
            this.setVerticesBuffer(matrixBuffer.createVertexBuffer("world1", 4, 4));
            this.setVerticesBuffer(matrixBuffer.createVertexBuffer("world2", 8, 4));
            this.setVerticesBuffer(matrixBuffer.createVertexBuffer("world3", 12, 4));

            this._thinInstanceStorage.nonUniformScaling = false;

            /*if (!this.ignoreNonUniformScaling) {
                for (let i = 0; i < this._thinInstanceStorage.instancesCount && !this._thinInstanceStorage.nonUniformScaling; ++i) {
                    tmpV2.copyFromFloats(buffer[i * 16 + 0], buffer[i * 16 + 1], buffer[i * 16 + 2]);
                    tmpV1.x = tmpV2.lengthSquared(); // scale x squared
                    tmpV2.copyFromFloats(buffer[i * 16 + 4], buffer[i * 16 + 5], buffer[i * 16 + 6]);
                    tmpV1.y = tmpV2.lengthSquared(); // scale y squared
                    tmpV2.copyFromFloats(buffer[i * 16 + 8], buffer[i * 16 + 9], buffer[i * 16 + 10]);
                    tmpV1.z = tmpV2.lengthSquared(); // scale z squared
                    this._thinInstanceStorage.nonUniformScaling = tmpV1.isNonUniformWithinEpsilon(0.0001);
                }

                if (this._thinInstanceStorage.nonUniformScaling && !this.nonUniformScaling) {
                    this._updateNonUniformScalingState(true);
                }
            }*/

            if (!this.doNotSyncBoundingInfo) {
                this.thinInstanceRefreshBoundingInfo();
            }
        } else {
            this._thinInstanceStorage.instancesCount = 0;
            if (!this.doNotSyncBoundingInfo) {
                // mesh has no more thin instances, so need to recompute the bounding box because it's the regular mesh that will now be displayed
                this.refreshBoundingInfo(true);
            }
        }
    } else {
        if (buffer === null) {
            this.removeVerticesData(kind);
            delete this._thinInstanceStorage.vertexBuffers[kind];
        } else {
            this._thinInstanceStorage.vertexBuffers[kind] = new VertexBuffer(this.getEngine(), buffer, kind, true, false, stride, true);
            this.setVerticesBuffer(this._thinInstanceStorage.vertexBuffers[kind]!);
        }
    }
};

Mesh.prototype.thinInstanceBufferUpdated = function(kind: string): void {
    if (this._thinInstanceStorage) {
        if (kind === "matrix") {
            this._thinInstanceStorage.matrixBuffer!.updateDirectly(this._thinInstanceStorage.data["matrix"], 0, this._thinInstanceStorage.instancesCount);
        } else if (this._thinInstanceStorage.vertexBuffers[kind]) {
            this._thinInstanceStorage.vertexBuffers[kind]!.updateDirectly(this._thinInstanceStorage.data[kind], 0);
        }
    }
};

Mesh.prototype.thinInstanceGetMatrixAt = function(index: number, matrix: Matrix): boolean {
    if (!this._thinInstanceStorage || index >= this._thinInstanceStorage.instancesCount) {
        return false;
    }

    const matrixData = this._thinInstanceStorage.data["matrix"];

    Matrix.FromArrayToRef(matrixData, index * 16, matrix);

    return true;
};

Mesh.prototype.thinInstanceSetMatrixAt = function(index: number, matrix: Matrix, refresh: boolean = true): boolean {
    if (!this._thinInstanceStorage || index >= this._thinInstanceStorage.instancesCount) {
        return false;
    }

    const matrixData = this._thinInstanceStorage.data["matrix"];

    matrix.copyToArray(matrixData, index * 16);

    if (refresh) {
        this.thinInstanceBufferUpdated("matrix");

        if (!this.doNotSyncBoundingInfo) {
            this.thinInstanceRefreshBoundingInfo();
        }
    }

    return true;
};

Mesh.prototype.thinInstanceRefreshBoundingInfo = function() {
    if (!this._thinInstanceStorage || !this._thinInstanceStorage.matrixBuffer) {
        return;
    }

    const boundingInfo = this.getBoundingInfo();
    const matrixData = this._thinInstanceStorage.data["matrix"];

    const vectors = this._thinInstanceStorage.boundingVectors;

    if (vectors.length === 0) {
        for (let v = 0; v < boundingInfo.boundingBox.vectors.length; ++v) {
            vectors.push(boundingInfo.boundingBox.vectors[v].clone());
        }
    }

    tmpV1.setAll(Number.MAX_VALUE); // min
    tmpV2.setAll(Number.MIN_VALUE); // max

    for (let i = 0; i < this._thinInstanceStorage.instancesCount; ++i) {
        Matrix.FromArrayToRef(matrixData, i * 16, tmpMatrix);

        for (let v = 0; v < vectors.length; ++v) {
            Vector3.TransformCoordinatesToRef(vectors[v], tmpMatrix, tmpV3);
            tmpV1.minimizeInPlace(tmpV3);
            tmpV2.maximizeInPlace(tmpV3);
        }
    }

    boundingInfo.reConstruct(tmpV1, tmpV2);
};

Mesh.prototype._disposeThinInstanceSpecificData = function() {
    if (this._thinInstanceStorage?.matrixBuffer) {
        this._thinInstanceStorage.matrixBuffer.dispose();
        this._thinInstanceStorage.matrixBuffer = null;
    }

    this._thinInstanceStorage = null;
};
