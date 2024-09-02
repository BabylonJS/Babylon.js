import type { IBoundingInfoHelperPlatform } from "./IBoundingInfoHelperPlatform";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import { ComputeShader } from "core/Compute/computeShader";
import { StorageBuffer } from "core/Buffers/storageBuffer";
import type { WebGPUEngine } from "core/Engines/webgpuEngine";
import type { AbstractEngine } from "core/Engines/abstractEngine";
import type { Mesh } from "core/Meshes/mesh";
import { VertexBuffer } from "core/Buffers/buffer";
import { Vector3 } from "core/Maths/math.vector";
import { UniformBuffer } from "core/Materials/uniformBuffer";
import type { DataBuffer } from "core/Buffers/dataBuffer";
import type { ComputeBindingMapping } from "core/Engines/Extensions/engine.computeShader";

import "../../ShadersWGSL/boundingInfo.compute";

/** @internal */
export class ComputeShaderBoundingHelper implements IBoundingInfoHelperPlatform {
    private _engine: AbstractEngine;
    private _computeShadersCache: { [key: string]: ComputeShader } = {};
    private _positionBuffers: { [key: number]: StorageBuffer } = {};
    private _indexBuffers: { [key: number]: StorageBuffer } = {};
    private _weightBuffers: { [key: number]: StorageBuffer } = {};
    private _indexExtraBuffers: { [key: number]: StorageBuffer } = {};
    private _weightExtraBuffers: { [key: number]: StorageBuffer } = {};
    private _morphTargetInfluenceBuffers: { [key: number]: StorageBuffer } = {};
    private _morphTargetTextureIndexBuffers: { [key: number]: StorageBuffer } = {};
    private _ubos: UniformBuffer[] = [];
    private _uboIndex: number = 0;
    private _processedMeshes: AbstractMesh[] = [];
    private _computeShaders: ComputeShader[][] = [];
    private _uniqueComputeShaders: Set<ComputeShader> = new Set();
    private _resultBuffers: StorageBuffer[] = [];

    /**
     * Creates a new ComputeShaderBoundingHelper
     * @param engine defines the engine to use
     */
    constructor(engine: AbstractEngine) {
        this._engine = engine;
    }

    private _getComputeShader(defines: string[], hasBones: boolean, hasMorphs: boolean) {
        let computeShader: ComputeShader;
        const join = defines.join("\n");

        if (!this._computeShadersCache[join]) {
            const bindingsMapping: ComputeBindingMapping = {
                positionBuffer: { group: 0, binding: 0 },
                resultBuffer: { group: 0, binding: 1 },
                settings: { group: 0, binding: 7 },
            };

            if (hasBones) {
                bindingsMapping.boneSampler = { group: 0, binding: 2 };
                bindingsMapping.indexBuffer = { group: 0, binding: 3 };
                bindingsMapping.weightBuffer = { group: 0, binding: 4 };
                bindingsMapping.indexExtraBuffer = { group: 0, binding: 5 };
                bindingsMapping.weightExtraBuffer = { group: 0, binding: 6 };
            }
            if (hasMorphs) {
                bindingsMapping.morphTargets = { group: 0, binding: 8 };
                bindingsMapping.morphTargetInfluences = { group: 0, binding: 9 };
                bindingsMapping.morphTargetTextureIndices = { group: 0, binding: 10 };
            }

            computeShader = new ComputeShader(`boundingInfoCompute${hasBones ? "_bones" : ""}${hasMorphs ? "_morphs" : ""}`, this._engine, "boundingInfo", {
                bindingsMapping,
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
            const ubo = new UniformBuffer(this._engine);
            ubo.addFloat3("morphTargetTextureInfo", 0, 0, 0);
            ubo.addUniform("morphTargetCount", 1);
            ubo.addUniform("indexResult", 1);
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
    public async processAsync(meshes: AbstractMesh | AbstractMesh[]): Promise<void> {
        await this.registerMeshListAsync(meshes);
        this.processMeshList();
        await this.fetchResultsForMeshListAsync();
    }

    /** @internal */
    public registerMeshListAsync(meshes: AbstractMesh | AbstractMesh[]): Promise<void> {
        this._disposeForMeshList();

        if (!Array.isArray(meshes)) {
            meshes = [meshes];
        }

        let maxNumInfluencers = 0;
        for (let i = 0; i < meshes.length; i++) {
            const mesh = meshes[i];
            const vertexCount = mesh.getTotalVertices();

            if (vertexCount === 0 || !(mesh as Mesh).getVertexBuffer || !(mesh as Mesh).getVertexBuffer(VertexBuffer.PositionKind)) {
                continue;
            }

            this._processedMeshes.push(mesh);

            const manager = (<Mesh>mesh).morphTargetManager;
            if (manager) {
                maxNumInfluencers = Math.max(maxNumInfluencers, manager.numTargets);
            }
        }

        for (let i = 0; i < this._processedMeshes.length; i++) {
            const mesh = this._processedMeshes[i];
            let defines = [""];

            let hasBones = false;
            if (mesh && mesh.useBones && mesh.computeBonesUsingShaders && mesh.skeleton) {
                defines.push("#define NUM_BONE_INFLUENCERS " + mesh.numBoneInfluencers);
                hasBones = true;
            }

            const computeShaderWithoutMorph = this._getComputeShader(defines, hasBones, false);

            this._uniqueComputeShaders.add(computeShaderWithoutMorph);

            const manager = (<Mesh>mesh).morphTargetManager;
            if (manager) {
                defines = defines.slice();
                defines.push("#define MORPHTARGETS");
                defines.push("#define NUM_MORPH_INFLUENCERS " + maxNumInfluencers);

                const computeShaderWithMorph = this._getComputeShader(defines, hasBones, true);

                this._uniqueComputeShaders.add(computeShaderWithMorph);
                this._computeShaders.push([computeShaderWithoutMorph, computeShaderWithMorph]);
            } else {
                this._computeShaders.push([computeShaderWithoutMorph, computeShaderWithoutMorph]);
            }

            // Pre-build the ubos, as they won't change if there's no morph targets
            const ubo = this._getUBO();
            ubo.updateUInt("indexResult", i);

            ubo.update();
        }

        return new Promise((resolve) => {
            const check = () => {
                const iterator = this._uniqueComputeShaders.keys();
                for (let key = iterator.next(); key.done !== true; key = iterator.next()) {
                    const computeShader = key.value;
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

    /** @internal */
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

            const [computeShaderWithoutMorph, computeShaderWithMorph] = this._computeShaders[i];

            const manager = (<Mesh>mesh).morphTargetManager;
            const hasMorphs = manager && manager.numInfluencers > 0;
            const computeShader = hasMorphs ? computeShaderWithMorph : computeShaderWithoutMorph;

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

            const ubo = this._getUBO();

            // Morphs
            if (hasMorphs) {
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
                ubo.updateInt("morphTargetCount", manager.numInfluencers);
                ubo.update();
            }

            computeShader.setStorageBuffer("resultBuffer", resultBuffer);

            computeShader.setUniformBuffer("settings", ubo);

            // Dispatch
            computeShader.dispatch(Math.ceil(vertexCount / 256));

            this._engine.flushFramebuffer();
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

            (this._engine as WebGPUEngine).readFromMultipleStorageBuffers(buffers, 0, undefined, resultData, true).then(() => {
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

    private _disposeForMeshList() {
        for (const resultBuffer of this._resultBuffers) {
            resultBuffer.dispose();
        }
        this._resultBuffers = [];
        this._processedMeshes = [];
        this._computeShaders = [];
        this._uniqueComputeShaders = new Set();
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
        for (const ubo of this._ubos) {
            ubo.dispose();
        }
        this._ubos = [];
        this._computeShadersCache = {};
        this._engine = undefined!;
        this._disposeForMeshList();
    }
}
