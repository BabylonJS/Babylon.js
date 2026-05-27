/** This file must only contain pure code and pure imports */

import { type Nullable, type DeepImmutableObject, type FloatArray } from "../types";
import { type Vector2, Vector3, TmpVectors, Matrix } from "../Maths/math.vector.pure";
import { Logger } from "../Misc/logger";
import { BoundingInfo } from "core/Culling/boundingInfo";
import { Mesh } from "../Meshes/mesh.pure";
import { VertexBuffer, Buffer } from "../Buffers/buffer.pure";

const BakedVertexAnimationSettingsInstancedKind = "bakedVertexAnimationSettingsInstanced";

function HasCpuReadableBakedVertexAnimationData(mesh: Mesh): boolean {
    const textureData = mesh.bakedVertexAnimationManager?.texture?.getInternalTexture()?._bufferView;

    return textureData instanceof Float32Array || textureData instanceof Uint16Array;
}

function ExtractMinAndMaxToRef(data: FloatArray, count: number, minimum: Vector3, maximum: Vector3): void {
    minimum.setAll(Number.POSITIVE_INFINITY);
    maximum.setAll(Number.NEGATIVE_INFINITY);

    for (let index = 0; index < count * 3; index += 3) {
        const x = data[index];
        const y = data[index + 1];
        const z = data[index + 2];

        if (x < minimum.x) {
            minimum.x = x;
        }
        if (y < minimum.y) {
            minimum.y = y;
        }
        if (z < minimum.z) {
            minimum.z = z;
        }
        if (x > maximum.x) {
            maximum.x = x;
        }
        if (y > maximum.y) {
            maximum.y = y;
        }
        if (z > maximum.z) {
            maximum.z = z;
        }
    }
}

function ApplyBoundingBiasToMinAndMax(minimum: Vector3, maximum: Vector3, bias: Nullable<Vector2>): void {
    if (!bias) {
        return;
    }

    minimum.x -= minimum.x * bias.x + bias.y;
    minimum.y -= minimum.y * bias.x + bias.y;
    minimum.z -= minimum.z * bias.x + bias.y;
    maximum.x += maximum.x * bias.x + bias.y;
    maximum.y += maximum.y * bias.x + bias.y;
    maximum.z += maximum.z * bias.x + bias.y;
}

function UpdateTransformedMinAndMaxToRef(minimum: Vector3, maximum: Vector3, matrix: Matrix, globalMinimum: Vector3, globalMaximum: Vector3): void {
    const corner = TmpVectors.Vector3[7];
    const transformed = TmpVectors.Vector3[8];

    for (let x = 0; x < 2; ++x) {
        for (let y = 0; y < 2; ++y) {
            for (let z = 0; z < 2; ++z) {
                corner.set(x ? maximum.x : minimum.x, y ? maximum.y : minimum.y, z ? maximum.z : minimum.z);
                Vector3.TransformCoordinatesToRef(corner, matrix, transformed);
                globalMinimum.minimizeInPlace(transformed);
                globalMaximum.maximizeInPlace(transformed);
            }
        }
    }
}

function UpdateTransformedDataMinAndMaxToRef(data: FloatArray, count: number, matrix: Matrix, globalMinimum: Vector3, globalMaximum: Vector3): void {
    const transformed = TmpVectors.Vector3[7];

    for (let index = 0; index < count * 3; index += 3) {
        Vector3.TransformCoordinatesFromFloatsToRef(data[index], data[index + 1], data[index + 2], matrix, transformed);
        globalMinimum.minimizeInPlace(transformed);
        globalMaximum.maximizeInPlace(transformed);
    }
}

function UpdateRawBoundingVectors(vectors: Vector3[], rawBoundingInfo: BoundingInfo): void {
    vectors.length = 0;

    for (let v = 0; v < rawBoundingInfo.boundingBox.vectors.length; ++v) {
        vectors.push(rawBoundingInfo.boundingBox.vectors[v].clone());
    }
}

function TryUpdateBakedVertexAnimationThinInstanceBoundingInfo(mesh: Mesh, vectors: Vector3[], applyMorph: boolean): boolean {
    const storage = mesh._userThinInstanceBuffersStorage;
    const bakedVertexAnimationSettingsData = storage?.data[BakedVertexAnimationSettingsInstancedKind];
    const bakedVertexAnimationSettingsStride = storage?.strides[BakedVertexAnimationSettingsInstancedKind];

    if (!bakedVertexAnimationSettingsData || !bakedVertexAnimationSettingsStride || bakedVertexAnimationSettingsStride < 4 || !HasCpuReadableBakedVertexAnimationData(mesh)) {
        return false;
    }

    const matrixData = mesh._thinInstanceDataStorage.matrixData;
    if (!matrixData) {
        return false;
    }

    const cache = {};
    const settings = TmpVectors.Vector4[0];
    const rawMinimum = TmpVectors.Vector3[1];
    const rawMaximum = TmpVectors.Vector3[2];
    const globalMinimum = TmpVectors.Vector3[3];
    const globalMaximum = TmpVectors.Vector3[4];
    const localMinimum = TmpVectors.Vector3[5];
    const localMaximum = TmpVectors.Vector3[6];
    const matrix = TmpVectors.Matrix[2];
    const bias = mesh.geometry ? mesh.geometry.boundingBias : null;
    const vertexCount = mesh.getTotalVertices();

    rawMinimum.setAll(Number.POSITIVE_INFINITY);
    rawMaximum.setAll(Number.NEGATIVE_INFINITY);
    globalMinimum.setAll(Number.POSITIVE_INFINITY);
    globalMaximum.setAll(Number.NEGATIVE_INFINITY);

    for (let index = 0; index < mesh._thinInstanceDataStorage.instancesCount; ++index) {
        const settingsOffset = index * bakedVertexAnimationSettingsStride;
        settings.set(
            bakedVertexAnimationSettingsData[settingsOffset],
            bakedVertexAnimationSettingsData[settingsOffset + 1],
            bakedVertexAnimationSettingsData[settingsOffset + 2],
            bakedVertexAnimationSettingsData[settingsOffset + 3]
        );

        const positionData = mesh._getData(
            {
                applyMorph,
                applyBakedVertexAnimation: true,
                bakedVertexAnimationSettings: settings,
                updatePositionsArray: false,
                cache,
            },
            null,
            VertexBuffer.PositionKind
        );

        if (!positionData) {
            return false;
        }

        ExtractMinAndMaxToRef(positionData, vertexCount, localMinimum, localMaximum);
        ApplyBoundingBiasToMinAndMax(localMinimum, localMaximum, bias);
        rawMinimum.minimizeInPlace(localMinimum);
        rawMaximum.maximizeInPlace(localMaximum);

        Matrix.FromArrayToRef(matrixData, index * 16, matrix);
        if (bias) {
            UpdateTransformedMinAndMaxToRef(localMinimum, localMaximum, matrix, globalMinimum, globalMaximum);
        } else {
            UpdateTransformedDataMinAndMaxToRef(positionData, vertexCount, matrix, globalMinimum, globalMaximum);
        }
    }

    if (!isFinite(rawMinimum.x) || !isFinite(globalMinimum.x)) {
        return false;
    }

    const boundingInfo = mesh.getBoundingInfo();
    boundingInfo.reConstruct(globalMinimum, globalMaximum);
    mesh.rawBoundingInfo = new BoundingInfo(rawMinimum, rawMaximum);
    UpdateRawBoundingVectors(vectors, mesh.rawBoundingInfo);

    mesh._updateBoundingInfo();

    return true;
}

let _Registered = false;
/**
 * Register side effects for thinInstanceMesh.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterThinInstanceMesh(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    Mesh.prototype.thinInstanceAdd = function (matrix: DeepImmutableObject<Matrix> | Array<DeepImmutableObject<Matrix>>, refresh: boolean = true): number {
        if (!this.getScene().getEngine().getCaps().instancedArrays) {
            Logger.Error("Thin Instances are not supported on this device as Instanced Array extension not supported");
            return -1;
        }

        this._thinInstanceUpdateBufferSize("matrix", Array.isArray(matrix) ? matrix.length : 1);

        const index = this._thinInstanceDataStorage.instancesCount;

        if (Array.isArray(matrix)) {
            for (let i = 0; i < matrix.length; ++i) {
                this.thinInstanceSetMatrixAt(this._thinInstanceDataStorage.instancesCount++, matrix[i], i === matrix.length - 1 && refresh);
            }
        } else {
            this.thinInstanceSetMatrixAt(this._thinInstanceDataStorage.instancesCount++, matrix, refresh);
        }

        return index;
    };

    Mesh.prototype.thinInstanceAddSelf = function (refresh: boolean = true): number {
        return this.thinInstanceAdd(Matrix.IdentityReadOnly, refresh);
    };

    Mesh.prototype.thinInstanceRegisterAttribute = function (kind: string, stride: number): void {
        // preserve backward compatibility
        if (kind === VertexBuffer.ColorKind) {
            kind = VertexBuffer.ColorInstanceKind;
        }

        this.removeVerticesData(kind);

        this._thinInstanceInitializeUserStorage();

        this._userThinInstanceBuffersStorage.strides[kind] = stride;
        this._userThinInstanceBuffersStorage.sizes[kind] = stride * Math.max(32, this._thinInstanceDataStorage.instancesCount); // Initial size
        this._userThinInstanceBuffersStorage.data[kind] = new Float32Array(this._userThinInstanceBuffersStorage.sizes[kind]);
        this._userThinInstanceBuffersStorage.vertexBuffers[kind] = new VertexBuffer(
            this.getEngine(),
            this._userThinInstanceBuffersStorage.data[kind],
            kind,
            true,
            false,
            stride,
            true
        );

        this.setVerticesBuffer(this._userThinInstanceBuffersStorage.vertexBuffers[kind]!);
    };

    Mesh.prototype.thinInstanceSetMatrixAt = function (index: number, matrix: DeepImmutableObject<Matrix>, refresh: boolean = true): boolean {
        if (!this._thinInstanceDataStorage.matrixData || index >= this._thinInstanceDataStorage.instancesCount) {
            return false;
        }

        const matrixData = this._thinInstanceDataStorage.matrixData;

        matrix.copyToArray(matrixData, index * 16);

        if (this._thinInstanceDataStorage.worldMatrices) {
            this._thinInstanceDataStorage.worldMatrices[index] = matrix as Matrix;
        }

        if (refresh) {
            this.thinInstanceBufferUpdated("matrix");

            if (!this.doNotSyncBoundingInfo) {
                this.thinInstanceRefreshBoundingInfo(false);
            }
        }

        return true;
    };

    Mesh.prototype.thinInstanceSetAttributeAt = function (kind: string, index: number, value: Array<number>, refresh: boolean = true): boolean {
        // preserve backward compatibility
        if (kind === VertexBuffer.ColorKind) {
            kind = VertexBuffer.ColorInstanceKind;
        }

        if (!this._userThinInstanceBuffersStorage || !this._userThinInstanceBuffersStorage.data[kind] || index >= this._thinInstanceDataStorage.instancesCount) {
            return false;
        }

        this._thinInstanceUpdateBufferSize(kind, 0); // make sur the buffer for the kind attribute is big enough

        this._userThinInstanceBuffersStorage.data[kind].set(value, index * this._userThinInstanceBuffersStorage.strides[kind]);

        if (refresh) {
            this.thinInstanceBufferUpdated(kind);
        }

        return true;
    };

    Object.defineProperty(Mesh.prototype, "thinInstanceCount", {
        get: function (this: Mesh) {
            return this._thinInstanceDataStorage.instancesCount;
        },
        set: function (this: Mesh, value: number) {
            const matrixData = this._thinInstanceDataStorage.matrixData ?? this.source?._thinInstanceDataStorage.matrixData;
            const numMaxInstances = matrixData ? matrixData.length / 16 : 0;

            if (value <= numMaxInstances) {
                this._thinInstanceDataStorage.instancesCount = value;
            }
        },
        enumerable: true,
        configurable: true,
    });

    Mesh.prototype._thinInstanceCreateMatrixBuffer = function (kind: string, buffer: Float32Array, staticBuffer: boolean = true): Buffer {
        const matrixBuffer = new Buffer(this.getEngine(), buffer, !staticBuffer, 16, false, true);

        for (let i = 0; i < 4; i++) {
            this.setVerticesBuffer(matrixBuffer.createVertexBuffer(kind + i, i * 4, 4));
        }

        return matrixBuffer;
    };

    Mesh.prototype.thinInstanceSetBuffer = function (kind: string, buffer: Nullable<Float32Array>, stride: number = 0, staticBuffer: boolean = true): void {
        stride = stride || 16;

        if (kind === "matrix") {
            this._thinInstanceDataStorage.matrixBuffer?.dispose();
            this._thinInstanceDataStorage.matrixBuffer = null;
            this._thinInstanceDataStorage.matrixBufferSize = buffer ? buffer.length : 32 * stride;
            this._thinInstanceDataStorage.matrixData = buffer;
            this._thinInstanceDataStorage.worldMatrices = null;

            if (buffer !== null) {
                this._thinInstanceDataStorage.instancesCount = buffer.length / stride;
                this._thinInstanceDataStorage.matrixBuffer = this._thinInstanceCreateMatrixBuffer("world", buffer, staticBuffer);

                if (!this.doNotSyncBoundingInfo) {
                    this.thinInstanceRefreshBoundingInfo(false);
                }
            } else {
                this._thinInstanceDataStorage.instancesCount = 0;
                if (!this.doNotSyncBoundingInfo) {
                    // mesh has no more thin instances, so need to recompute the bounding box because it's the regular mesh that will now be displayed
                    this.refreshBoundingInfo();
                }
            }
        } else if (kind === "previousMatrix") {
            this._thinInstanceDataStorage.previousMatrixBuffer?.dispose();
            this._thinInstanceDataStorage.previousMatrixBuffer = null;
            this._thinInstanceDataStorage.previousMatrixData = buffer;
            if (buffer !== null) {
                this._thinInstanceDataStorage.previousMatrixBuffer = this._thinInstanceCreateMatrixBuffer("previousWorld", buffer, staticBuffer);
            }
        } else if (kind === "splatIndex" && buffer) {
            this._thinInstanceInitializeUserStorage();
            this._thinInstanceDataStorage.instancesCount = buffer.length / stride;
            this._userThinInstanceBuffersStorage.data[kind] = buffer;
            this._userThinInstanceBuffersStorage.strides[kind] = stride;
            this._userThinInstanceBuffersStorage.sizes[kind] = buffer.length;
            const splatInstancesBuffer = new Buffer(this.getEngine(), buffer, true, 16, false, true);
            this._thinInstanceDataStorage.matrixBuffer = splatInstancesBuffer;
            for (let i = 0; i < 4; i++) {
                this.setVerticesBuffer(splatInstancesBuffer.createVertexBuffer(kind + i, i * 4, 4));
            }
        } else {
            // color for instanced mesh is ColorInstanceKind and not ColorKind because of native that needs to do the differenciation
            // hot switching kind here to preserve backward compatibility
            if (kind === VertexBuffer.ColorKind) {
                kind = VertexBuffer.ColorInstanceKind;
            }

            if (buffer === null) {
                if (this._userThinInstanceBuffersStorage?.data[kind]) {
                    this.removeVerticesData(kind);
                    delete this._userThinInstanceBuffersStorage.data[kind];
                    delete this._userThinInstanceBuffersStorage.strides[kind];
                    delete this._userThinInstanceBuffersStorage.sizes[kind];
                    delete this._userThinInstanceBuffersStorage.vertexBuffers[kind];
                }
            } else {
                this._thinInstanceInitializeUserStorage();

                this._userThinInstanceBuffersStorage.data[kind] = buffer;
                this._userThinInstanceBuffersStorage.strides[kind] = stride;
                this._userThinInstanceBuffersStorage.sizes[kind] = buffer.length;
                this._userThinInstanceBuffersStorage.vertexBuffers[kind] = new VertexBuffer(this.getEngine(), buffer, kind, !staticBuffer, false, stride, true);

                this.setVerticesBuffer(this._userThinInstanceBuffersStorage.vertexBuffers[kind]!);
            }
        }
    };

    Mesh.prototype.thinInstanceBufferUpdated = function (kind: string): void {
        if (kind === "matrix") {
            if (this.thinInstanceAllowAutomaticStaticBufferRecreation && this._thinInstanceDataStorage.matrixBuffer && !this._thinInstanceDataStorage.matrixBuffer.isUpdatable()) {
                this._thinInstanceRecreateBuffer(kind);
            }
            this._thinInstanceDataStorage.matrixBuffer?.updateDirectly(this._thinInstanceDataStorage.matrixData!, 0, this._thinInstanceDataStorage.instancesCount);
        } else if (kind === "previousMatrix") {
            if (
                this.thinInstanceAllowAutomaticStaticBufferRecreation &&
                this._thinInstanceDataStorage.previousMatrixBuffer &&
                !this._thinInstanceDataStorage.previousMatrixBuffer.isUpdatable()
            ) {
                this._thinInstanceRecreateBuffer(kind);
            }
            this._thinInstanceDataStorage.previousMatrixBuffer?.updateDirectly(this._thinInstanceDataStorage.previousMatrixData!, 0, this._thinInstanceDataStorage.instancesCount);
        } else if (kind === "splatIndex") {
            this._thinInstanceDataStorage.matrixBuffer?.updateDirectly(this._userThinInstanceBuffersStorage.data[kind], 0, this._thinInstanceDataStorage.instancesCount);
        } else {
            // preserve backward compatibility
            if (kind === VertexBuffer.ColorKind) {
                kind = VertexBuffer.ColorInstanceKind;
            }

            if (this._userThinInstanceBuffersStorage?.vertexBuffers[kind]) {
                if (this.thinInstanceAllowAutomaticStaticBufferRecreation && !this._userThinInstanceBuffersStorage.vertexBuffers[kind]!.isUpdatable()) {
                    this._thinInstanceRecreateBuffer(kind);
                }
                this._userThinInstanceBuffersStorage.vertexBuffers[kind]!.updateDirectly(this._userThinInstanceBuffersStorage.data[kind], 0);
            }
        }
    };

    Mesh.prototype.thinInstancePartialBufferUpdate = function (kind: string, dataOrLength: Float32Array | number, offset: number): void {
        if (kind === "matrix") {
            if (this._thinInstanceDataStorage.matrixBuffer) {
                if (typeof dataOrLength === "number") {
                    this._thinInstanceDataStorage.matrixBuffer.updateDirectly(
                        new Float32Array(
                            this._thinInstanceDataStorage.matrixData!.buffer,
                            this._thinInstanceDataStorage.matrixData!.byteOffset + offset * 16 * Float32Array.BYTES_PER_ELEMENT,
                            dataOrLength * 16
                        ),
                        offset * 16
                    );
                } else {
                    this._thinInstanceDataStorage.matrixBuffer.updateDirectly(dataOrLength, offset);
                }
            }
        } else {
            // preserve backward compatibility
            if (kind === VertexBuffer.ColorKind) {
                kind = VertexBuffer.ColorInstanceKind;
            }

            if (this._userThinInstanceBuffersStorage?.vertexBuffers[kind]) {
                const buffer = this._userThinInstanceBuffersStorage.vertexBuffers[kind]!;
                if (typeof dataOrLength === "number") {
                    const data = new Float32Array(
                        this._userThinInstanceBuffersStorage.data[kind].buffer,
                        this._userThinInstanceBuffersStorage.data[kind].byteOffset + offset * this._userThinInstanceBuffersStorage.strides[kind] * Float32Array.BYTES_PER_ELEMENT,
                        dataOrLength * this._userThinInstanceBuffersStorage.strides[kind]
                    );
                    this._userThinInstanceBuffersStorage.vertexBuffers[kind]!.updateDirectly(data, offset * this._userThinInstanceBuffersStorage.strides[kind]);
                } else {
                    buffer.updateDirectly(dataOrLength, offset);
                }
            }
        }
    };

    Mesh.prototype.thinInstanceGetWorldMatrices = function (): Matrix[] {
        if (!this._thinInstanceDataStorage.matrixData || !this._thinInstanceDataStorage.matrixBuffer) {
            return [];
        }
        const matrixData = this._thinInstanceDataStorage.matrixData;

        if (!this._thinInstanceDataStorage.worldMatrices) {
            this._thinInstanceDataStorage.worldMatrices = [] as Matrix[];

            for (let i = 0; i < this._thinInstanceDataStorage.instancesCount; ++i) {
                this._thinInstanceDataStorage.worldMatrices[i] = Matrix.FromArray(matrixData, i * 16);
            }
        }

        return this._thinInstanceDataStorage.worldMatrices;
    };

    Mesh.prototype.thinInstanceRefreshBoundingInfo = function (
        forceRefreshParentInfo: boolean = false,
        applySkeleton: boolean = false,
        applyMorph: boolean = false,
        applyBakedVertexAnimation: boolean = false
    ) {
        if (!this._thinInstanceDataStorage.matrixData || !this._thinInstanceDataStorage.matrixBuffer) {
            return;
        }

        const vectors = this._thinInstanceDataStorage.boundingVectors;

        if (forceRefreshParentInfo || !this.rawBoundingInfo) {
            vectors.length = 0;
            if (applyBakedVertexAnimation && TryUpdateBakedVertexAnimationThinInstanceBoundingInfo(this, vectors, applyMorph)) {
                return;
            }

            const useBakedVertexAnimation = applyBakedVertexAnimation && this.bakedVertexAnimationManager?.isEnabled && HasCpuReadableBakedVertexAnimationData(this);
            if (useBakedVertexAnimation) {
                this.refreshBoundingInfo({ applySkeleton, applyMorph, applyBakedVertexAnimation: true, updatePositionsArray: false });
            } else {
                this.refreshBoundingInfo(applySkeleton, applyMorph);
            }
            const boundingInfo = this.getBoundingInfo();
            this.rawBoundingInfo = new BoundingInfo(boundingInfo.minimum, boundingInfo.maximum);
        }

        const boundingInfo = this.getBoundingInfo();
        const matrixData = this._thinInstanceDataStorage.matrixData;

        if (vectors.length === 0) {
            for (let v = 0; v < boundingInfo.boundingBox.vectors.length; ++v) {
                vectors.push(boundingInfo.boundingBox.vectors[v].clone());
            }
        }

        TmpVectors.Vector3[0].setAll(Number.POSITIVE_INFINITY); // min
        TmpVectors.Vector3[1].setAll(Number.NEGATIVE_INFINITY); // max

        for (let i = 0; i < this._thinInstanceDataStorage.instancesCount; ++i) {
            Matrix.FromArrayToRef(matrixData, i * 16, TmpVectors.Matrix[0]);

            for (let v = 0; v < vectors.length; ++v) {
                Vector3.TransformCoordinatesToRef(vectors[v], TmpVectors.Matrix[0], TmpVectors.Vector3[2]);
                TmpVectors.Vector3[0].minimizeInPlace(TmpVectors.Vector3[2]);
                TmpVectors.Vector3[1].maximizeInPlace(TmpVectors.Vector3[2]);
            }
        }

        boundingInfo.reConstruct(TmpVectors.Vector3[0], TmpVectors.Vector3[1]);

        this._updateBoundingInfo();
    };

    Mesh.prototype._thinInstanceRecreateBuffer = function (kind: string, staticBuffer: boolean = true) {
        if (kind === "matrix") {
            this._thinInstanceDataStorage.matrixBuffer?.dispose();
            this._thinInstanceDataStorage.matrixBuffer = this._thinInstanceCreateMatrixBuffer("world", this._thinInstanceDataStorage.matrixData, staticBuffer);
        } else if (kind === "previousMatrix") {
            if (this._scene.needsPreviousWorldMatrices) {
                this._thinInstanceDataStorage.previousMatrixBuffer?.dispose();
                this._thinInstanceDataStorage.previousMatrixBuffer = this._thinInstanceCreateMatrixBuffer(
                    "previousWorld",
                    this._thinInstanceDataStorage.previousMatrixData ?? this._thinInstanceDataStorage.matrixData,
                    staticBuffer
                );
            }
        } else {
            if (kind === VertexBuffer.ColorKind) {
                kind = VertexBuffer.ColorInstanceKind;
            }

            this._userThinInstanceBuffersStorage.vertexBuffers[kind]?.dispose();
            this._userThinInstanceBuffersStorage.vertexBuffers[kind] = new VertexBuffer(
                this.getEngine(),
                this._userThinInstanceBuffersStorage.data[kind],
                kind,
                !staticBuffer,
                false,
                this._userThinInstanceBuffersStorage.strides[kind],
                true
            );
            this.setVerticesBuffer(this._userThinInstanceBuffersStorage.vertexBuffers[kind]!);
        }
    };

    Mesh.prototype._thinInstanceUpdateBufferSize = function (kind: string, numInstances: number = 1) {
        // preserve backward compatibility
        if (kind === VertexBuffer.ColorKind) {
            kind = VertexBuffer.ColorInstanceKind;
        }

        const kindIsMatrix = kind === "matrix";

        if (!kindIsMatrix && (!this._userThinInstanceBuffersStorage || !this._userThinInstanceBuffersStorage.strides[kind])) {
            return;
        }

        const stride = kindIsMatrix ? 16 : this._userThinInstanceBuffersStorage.strides[kind];
        const currentSize = kindIsMatrix ? this._thinInstanceDataStorage.matrixBufferSize : this._userThinInstanceBuffersStorage.sizes[kind];
        let data = kindIsMatrix ? this._thinInstanceDataStorage.matrixData : this._userThinInstanceBuffersStorage.data[kind];

        const bufferSize = (this._thinInstanceDataStorage.instancesCount + numInstances) * stride;

        let newSize = currentSize;

        while (newSize < bufferSize) {
            newSize *= 2;
        }

        if (!data || currentSize != newSize) {
            if (!data) {
                data = new Float32Array(newSize);
            } else {
                const newData = new Float32Array(newSize);
                newData.set(data, 0);
                data = newData;
            }

            if (kindIsMatrix) {
                this._thinInstanceDataStorage.matrixBuffer?.dispose();
                this._thinInstanceDataStorage.matrixBuffer = this._thinInstanceCreateMatrixBuffer("world", data, false);
                this._thinInstanceDataStorage.matrixData = data;
                this._thinInstanceDataStorage.matrixBufferSize = newSize;
                if (this._scene.needsPreviousWorldMatrices && !this._thinInstanceDataStorage.previousMatrixData) {
                    this._thinInstanceDataStorage.previousMatrixBuffer?.dispose();
                    this._thinInstanceDataStorage.previousMatrixBuffer = this._thinInstanceCreateMatrixBuffer("previousWorld", data, false);
                }
            } else {
                this._userThinInstanceBuffersStorage.vertexBuffers[kind]?.dispose();

                this._userThinInstanceBuffersStorage.data[kind] = data;
                this._userThinInstanceBuffersStorage.sizes[kind] = newSize;
                this._userThinInstanceBuffersStorage.vertexBuffers[kind] = new VertexBuffer(this.getEngine(), data, kind, true, false, stride, true);

                this.setVerticesBuffer(this._userThinInstanceBuffersStorage.vertexBuffers[kind]!);
            }
        }
    };

    Mesh.prototype._thinInstanceInitializeUserStorage = function () {
        if (!this._userThinInstanceBuffersStorage) {
            this._userThinInstanceBuffersStorage = {
                data: {},
                sizes: {},
                vertexBuffers: {},
                strides: {},
            };
        }
    };

    Mesh.prototype._disposeThinInstanceSpecificData = function () {
        if (this._thinInstanceDataStorage?.matrixBuffer) {
            this._thinInstanceDataStorage.matrixBuffer.dispose();
            this._thinInstanceDataStorage.matrixBuffer = null;
        }
        if (this._thinInstanceDataStorage?.previousMatrixBuffer) {
            this._thinInstanceDataStorage.previousMatrixBuffer.dispose();
            this._thinInstanceDataStorage.previousMatrixBuffer = null;
        }
    };
}
