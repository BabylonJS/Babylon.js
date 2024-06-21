import type { IBoundingInfoHelperPlatform } from "./IBoundingInfoHelperPlatform";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import type { Nullable } from "core/types";
import { RegisterClass } from "core/Misc/typeStore";
import { ComputeShader } from "core/Compute/computeShader";
import { StorageBuffer } from "core/Buffers/storageBuffer";
import type { WebGPUEngine } from "core/Engines";
import type { AbstractEngine } from "core/Engines/abstractEngine";
import type { Mesh } from "core/Meshes/mesh";
import type { DataBuffer } from "core/Buffers";
import { VertexBuffer } from "core/Buffers";
import { Vector3 } from "core/Maths";
import { UniformBuffer } from "core/Materials";

import "../../ShadersWGSL/boundingInfo.compute";

/** @internal */
export class ComputeShaderBoundingHelper implements IBoundingInfoHelperPlatform {
    private _engine: Nullable<AbstractEngine>;
    private _computeShadersCache: { [key: string]: ComputeShader } = {};
    private _positionBuffers: { [key: number]: StorageBuffer } = {};
    private _indexBuffers: { [key: number]: StorageBuffer } = {};
    private _weightBuffers: { [key: number]: StorageBuffer } = {};
    private _indexExtraBuffers: { [key: number]: StorageBuffer } = {};
    private _weightExtraBuffers: { [key: number]: StorageBuffer } = {};
    private _resultBuffers: StorageBuffer[] = [];
    private _ubos: UniformBuffer[] = [];
    private _uboIndex: number = 0;
    private _processedMeshes: AbstractMesh[] = [];
    private _computeShaders: ComputeShader[] = [];
    private _uniqueComputeShaders: Set<ComputeShader> = new Set();

    /**
     * Creates a new ComputeShaderBoundingHelper
     * @param engine defines the engine to use
     * @param meshes defines the meshes to work with
     */
    constructor(engine: AbstractEngine, meshes: AbstractMesh | AbstractMesh[]) {
        this._engine = engine;

        if (!Array.isArray(meshes)) {
            meshes = [meshes];
        }

        for (let i = 0; i < meshes.length; i++) {
            const mesh = meshes[i];
            const vertexCount = mesh.getTotalVertices();
            const defines = [""];

            if (vertexCount === 0 || !(mesh as Mesh).getVertexBuffer || !(mesh as Mesh).getVertexBuffer(VertexBuffer.PositionKind)) {
                continue;
            }

            this._processedMeshes.push(mesh);

            if (mesh && mesh.useBones && mesh.computeBonesUsingShaders && mesh.skeleton) {
                defines.push("#define NUM_BONE_INFLUENCERS " + mesh.numBoneInfluencers);
            }

            const computeShader = this._getComputeShader(defines);

            this._computeShaders.push(computeShader);
            this._uniqueComputeShaders.add(computeShader);

            // Pre-build the ubos, as they won't change
            const ubo = this._getUBO();
            ubo.updateUInt("indexResult", this._processedMeshes.length - 1);
            ubo.update();
        }
    }

    public registerMeshListAsync(): Promise<void> {
        return new Promise((resolve) => {
            const check = () => {
                for (const computeShader of this._uniqueComputeShaders) {
                    if (!computeShader.isReady()) {
                        setTimeout(check, 10);
                        return;
                    }
                }
                resolve();
            };
            check();
        });
    }

    private _getComputeShader(defines: string[]) {
        let computeShader: ComputeShader;
        const join = defines.join("\n");

        if (!this._computeShadersCache[join]) {
            computeShader = new ComputeShader("boundingInfoCompute", this._engine!, "boundingInfo", {
                bindingsMapping: {
                    positionBuffer: { group: 0, binding: 0 },
                    resultBuffer: { group: 0, binding: 1 },
                    boneSampler: { group: 0, binding: 2 },
                    indexBuffer: { group: 0, binding: 3 },
                    weightBuffer: { group: 0, binding: 4 },
                    indexExtraBuffer: { group: 0, binding: 5 },
                    weightExtraBuffer: { group: 0, binding: 6 },
                    settings: { group: 0, binding: 7 },
                },
                defines: defines,
            });
            this._computeShadersCache[join] = computeShader;
        } else {
            computeShader = this._computeShadersCache[join];
        }

        return computeShader;
    }

    private _getUBO() {
        if (this._uboIndex >= this._ubos.length) {
            const ubo = new UniformBuffer(this._engine!);
            ubo.addUniform("indexResult", 4);
            this._ubos.push(ubo);
        }

        return this._ubos[this._uboIndex++];
    }

    private _extractDataAndLink(computeShader: ComputeShader, mesh: Mesh, kind: string, stride: number, name: string, storageUnit: { [key: number]: StorageBuffer }) {
        let buffer: StorageBuffer;
        const vertexCount = mesh.getTotalVertices();
        if (!storageUnit[mesh.uniqueId]) {
            const dataArray = mesh.getVertexBuffer(kind)?.getFloatData(vertexCount);
            buffer = new StorageBuffer(this._engine as WebGPUEngine, Float32Array.BYTES_PER_ELEMENT * vertexCount * stride);
            buffer.update(dataArray!);

            storageUnit[mesh.uniqueId] = buffer;
        } else {
            buffer = storageUnit[mesh.uniqueId];
        }

        computeShader.setStorageBuffer(name, buffer);
    }

    public processMeshList(): void {
        if (this._processedMeshes.length === 0) {
            return;
        }

        this._uboIndex = 0;

        const resultDataSize = 8 * this._processedMeshes.length;
        const resultData = new Float32Array(resultDataSize);

        const resultBuffer = new StorageBuffer(this._engine as WebGPUEngine, Float32Array.BYTES_PER_ELEMENT * resultDataSize);
        this._resultBuffers.push(resultBuffer);

        for (let i = 0; i < this._processedMeshes.length; i++) {
            resultData[i * 8 + 0] = Number.POSITIVE_INFINITY;
            resultData[i * 8 + 1] = Number.POSITIVE_INFINITY;
            resultData[i * 8 + 2] = Number.POSITIVE_INFINITY;

            resultData[i * 8 + 3] = Number.NEGATIVE_INFINITY;
            resultData[i * 8 + 4] = Number.NEGATIVE_INFINITY;
            resultData[i * 8 + 5] = Number.NEGATIVE_INFINITY;
        }

        resultBuffer.update(resultData);

        for (let i = 0; i < this._processedMeshes.length; i++) {
            const mesh = this._processedMeshes[i];
            const vertexCount = mesh.getTotalVertices();

            const computeShader = this._computeShaders[i];

            this._extractDataAndLink(computeShader, mesh as Mesh, VertexBuffer.PositionKind, 3, "positionBuffer", this._positionBuffers);

            // Bones
            if (mesh && mesh.useBones && mesh.computeBonesUsingShaders && mesh.skeleton && mesh.skeleton.useTextureToStoreBoneMatrices) {
                this._extractDataAndLink(computeShader, mesh as Mesh, VertexBuffer.MatricesIndicesKind, 4, "indexBuffer", this._indexBuffers);
                this._extractDataAndLink(computeShader, mesh as Mesh, VertexBuffer.MatricesWeightsKind, 4, "weightBuffer", this._weightBuffers);
                const boneSampler = mesh.skeleton.getTransformMatrixTexture(mesh);
                computeShader.setTexture("boneSampler", boneSampler!, false);
                if (mesh.numBoneInfluencers > 4) {
                    this._extractDataAndLink(computeShader, mesh as Mesh, VertexBuffer.MatricesIndicesExtraKind, 4, "indexExtraBuffer", this._indexExtraBuffers);
                    this._extractDataAndLink(computeShader, mesh as Mesh, VertexBuffer.MatricesWeightsExtraKind, 4, "weightExtraBuffer", this._weightExtraBuffers);
                }
            }

            computeShader.setStorageBuffer("resultBuffer", resultBuffer);

            computeShader.setUniformBuffer("settings", this._getUBO());

            // Dispatch
            computeShader.dispatch(Math.ceil(vertexCount / 64));

            this._engine!.flushFramebuffer();
        }
    }

    /** @internal */
    public fetchResultsForMeshListAsync(): Promise<void> {
        return new Promise((resolve) => {
            const buffers: DataBuffer[] = [];
            let size = 0;
            for (let i = 0; i < this._resultBuffers.length; i++) {
                const buffer = this._resultBuffers[i].getBuffer();
                buffers.push(buffer);
                size += buffer.capacity;
            }

            const resultData = new Float32Array(size / Float32Array.BYTES_PER_ELEMENT);

            const minimum = Vector3.Zero();
            const maximum = Vector3.Zero();

            const minmax = { minimum, maximum };

            (this._engine as WebGPUEngine).readFromStorageBuffer(buffers, 0, undefined, resultData, true).then(() => {
                let resultDataOffset = 0;
                for (let j = 0; j < this._resultBuffers.length; j++) {
                    for (let i = 0; i < this._processedMeshes.length; i++) {
                        const mesh = this._processedMeshes[i];

                        Vector3.FromArrayToRef(resultData, resultDataOffset + i * 8, minimum);
                        Vector3.FromArrayToRef(resultData, resultDataOffset + i * 8 + 3, maximum);

                        if (j > 0) {
                            minimum.minimizeInPlace(mesh.getBoundingInfo().minimum);
                            maximum.maximizeInPlace(mesh.getBoundingInfo().maximum);
                        }

                        mesh._refreshBoundingInfoDirect(minmax);

                        if (i === 0) {
                            //console.log("Q", j, minimum + "", maximum + "");
                        }
                    }

                    resultDataOffset += 8 * this._processedMeshes.length;
                }

                for (const resultBuffer of this._resultBuffers) {
                    resultBuffer.dispose();
                }

                this._resultBuffers = [];
                this._uboIndex = 0;

                resolve();
            });
        });
    }

    private _disposeCache(storageUnit: { [key: number]: StorageBuffer }) {
        for (const key in storageUnit) {
            storageUnit[key].dispose();
        }
    }

    /** @internal */
    public dispose(): void {
        this._disposeCache(this._positionBuffers);
        this._positionBuffers = {};
        this._disposeCache(this._indexBuffers);
        this._indexBuffers = {};
        this._disposeCache(this._weightBuffers);
        this._weightBuffers = {};
        for (const resultBuffer of this._resultBuffers) {
            resultBuffer.dispose();
        }
        this._resultBuffers = [];
        for (const ubo of this._ubos) {
            ubo.dispose();
        }
        this._ubos = [];
        this._computeShadersCache = {};
        this._engine = null;
    }
}

RegisterClass("BABYLON.ComputeShaderBoundingHelper", ComputeShaderBoundingHelper);
