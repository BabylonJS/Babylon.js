import type { IBoundingInfoHelperPlatform } from "./IBoundingInfoHelperPlatform";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import type { Nullable } from "core/types";
import { ComputeShader } from "core/Compute/computeShader";
import { StorageBuffer } from "core/Buffers/storageBuffer";
import type { WebGPUEngine } from "core/Engines/webgpuEngine";
import type { AbstractEngine } from "core/Engines/abstractEngine";
import type { Mesh } from "core/Meshes/mesh";
import { VertexBuffer } from "core/Buffers/buffer";
import { Vector3 } from "core/Maths/math.vector";
import { UniformBuffer } from "core/Materials/uniformBuffer";

import "../../ShadersWGSL/boundingInfo.compute";

/** @internal */
export class ComputeShaderBoundingHelper implements IBoundingInfoHelperPlatform {
    private _engine: Nullable<AbstractEngine>;
    private _computeShaders: { [key: string]: ComputeShader } = {};
    private _positionBuffers: { [key: number]: StorageBuffer } = {};
    private _indexBuffers: { [key: number]: StorageBuffer } = {};
    private _weightBuffers: { [key: number]: StorageBuffer } = {};
    private _indexExtraBuffers: { [key: number]: StorageBuffer } = {};
    private _weightExtraBuffers: { [key: number]: StorageBuffer } = {};
    private _morphTargetInfluenceBuffers: { [key: number]: StorageBuffer } = {};
    private _morphTargetTextureIndexBuffers: { [key: number]: StorageBuffer } = {};
    private _resultData: Float32Array;
    private _resultBuffer: StorageBuffer;
    private _ubos: UniformBuffer[] = [];
    private _uboIndex: number = 0;

    /**
     * Creates a new ComputeShaderBoundingHelper
     * @param engine defines the engine to use
     */
    constructor(engine: AbstractEngine) {
        this._engine = engine;
    }

    private _getComputeShader(defines: string[]) {
        let computeShader: ComputeShader;
        const join = defines.join("\n");

        if (!this._computeShaders[join]) {
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
                    morphTargets: { group: 0, binding: 8 },
                    morphTargetInfluences: { group: 0, binding: 9 },
                    morphTargetTextureIndices: { group: 0, binding: 10 },
                },
                defines: defines,
            });
            this._computeShaders[join] = computeShader;
        } else {
            computeShader = this._computeShaders[join];
        }

        return computeShader;
    }

    private _getUBO() {
        if (this._uboIndex >= this._ubos.length) {
            const ubo = new UniformBuffer(this._engine!);
            ubo.addUniform("indexResult", 4);
            ubo.addFloat3("morphTargetTextureInfo", 0, 0, 0);
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

    private _prepareStorage(computeShader: ComputeShader, name: string, id: number, storageUnit: { [key: number]: StorageBuffer }, numInfluencers: number, data: Float32Array) {
        let buffer: StorageBuffer;
        if (!storageUnit[id]) {
            buffer = new StorageBuffer(this._engine as WebGPUEngine, Float32Array.BYTES_PER_ELEMENT * numInfluencers);

            storageUnit[id] = buffer;
        } else {
            buffer = storageUnit[id];
        }
        buffer.update(data);

        computeShader.setStorageBuffer(name, buffer);
    }

    /** @internal */
    public processAsync(meshes: AbstractMesh | AbstractMesh[]): Promise<void> {
        if (!Array.isArray(meshes)) {
            meshes = [meshes];
        }

        this._uboIndex = 0;

        // Results
        const resultDataSize = 8 * meshes.length;
        let resultData: Float32Array;
        let resultBuffer: StorageBuffer;
        if (!this._resultData || this._resultData.length !== resultDataSize) {
            this._resultBuffer?.dispose();

            resultData = new Float32Array(resultDataSize);
            resultBuffer = new StorageBuffer(this._engine as WebGPUEngine, Float32Array.BYTES_PER_ELEMENT * resultDataSize);

            this._resultData = resultData;
            this._resultBuffer = resultBuffer;
        } else {
            resultData = this._resultData;
            resultBuffer = this._resultBuffer;
        }

        for (let i = 0; i < meshes.length; i++) {
            resultData[i * 8 + 0] = Number.POSITIVE_INFINITY;
            resultData[i * 8 + 1] = Number.POSITIVE_INFINITY;
            resultData[i * 8 + 2] = Number.POSITIVE_INFINITY;

            resultData[i * 8 + 3] = Number.NEGATIVE_INFINITY;
            resultData[i * 8 + 4] = Number.NEGATIVE_INFINITY;
            resultData[i * 8 + 5] = Number.NEGATIVE_INFINITY;
        }

        resultBuffer.update(resultData);

        const promises: Promise<void>[] = [];
        const processedMeshes: AbstractMesh[] = [];

        for (let i = 0; i < meshes.length; i++) {
            const mesh = meshes[i];
            const vertexCount = mesh.getTotalVertices();
            const defines = [""];

            if (vertexCount === 0 || !(mesh as Mesh).getVertexBuffer || !(mesh as Mesh).getVertexBuffer(VertexBuffer.PositionKind)) {
                continue;
            }

            processedMeshes.push(mesh);

            if (mesh && mesh.useBones && mesh.computeBonesUsingShaders && mesh.skeleton) {
                defines.push("#define NUM_BONE_INFLUENCERS " + mesh.numBoneInfluencers);
            }

            const manager = (<Mesh>mesh).morphTargetManager;
            if (manager && manager.numInfluencers > 0) {
                defines.push("MORPHTARGETS");
                defines.push("#define NUM_MORPH_INFLUENCERS " + manager.numInfluencers);
            }

            const computeShader = this._getComputeShader(defines);

            this._extractDataAndLink(computeShader, mesh as Mesh, VertexBuffer.PositionKind, 3, "positionBuffer", this._positionBuffers);

            // UBO
            const ubo = this._getUBO();
            ubo.updateUInt("indexResult", processedMeshes.length - 1);

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

            // Morphs
            if (manager && manager.numInfluencers > 0) {
                const morphTargets = manager._targetStoreTexture;
                computeShader.setTexture("morphTargets", morphTargets!, false);

                this._prepareStorage(computeShader, "morphTargetInfluences", mesh.uniqueId, this._morphTargetInfluenceBuffers, manager.numInfluencers, manager.influences);
                this._prepareStorage(
                    computeShader,
                    "morphTargetTextureIndices",
                    mesh.uniqueId,
                    this._morphTargetTextureIndexBuffers,
                    manager.numInfluencers,
                    manager._morphTargetTextureIndices
                );
                ubo.updateFloat3("morphTargetTextureInfo", manager._textureVertexStride, manager._textureWidth, manager._textureHeight);
            }

            ubo.update();

            computeShader.setStorageBuffer("resultBuffer", resultBuffer);
            computeShader.setUniformBuffer("settings", ubo);

            // Dispatch
            promises.push(computeShader.dispatchWhenReady(Math.ceil(vertexCount / 64)));
        }

        if (promises.length === 0) {
            return Promise.resolve();
        }

        return Promise.all(promises).then(() => {
            return resultBuffer.read(undefined, undefined, resultData, true).then(() => {
                for (let i = 0; i < processedMeshes.length; i++) {
                    const mesh = processedMeshes[i];
                    mesh._refreshBoundingInfoDirect({
                        minimum: Vector3.FromArray(resultData, i * 8),
                        maximum: Vector3.FromArray(resultData, i * 8 + 3),
                    });
                }
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
        this._disposeCache(this._morphTargetInfluenceBuffers);
        this._morphTargetInfluenceBuffers = {};
        this._disposeCache(this._morphTargetTextureIndexBuffers);
        this._morphTargetTextureIndexBuffers = {};
        this._resultBuffer.dispose();
        this._resultBuffer = undefined!;
        this._resultData = undefined!;
        for (const ubo of this._ubos) {
            ubo.dispose();
        }
        this._ubos = [];
        this._computeShaders = {};
        this._engine = null;
    }
}
