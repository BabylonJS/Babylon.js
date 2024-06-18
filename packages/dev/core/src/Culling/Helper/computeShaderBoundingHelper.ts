import type { IBoundingInfoHelperPlatform } from "./IBoundingInfoHelperPlatform";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import type { Nullable } from "core/types";
import { RegisterClass } from "core/Misc/typeStore";
import { ComputeShader } from "core/Compute/computeShader";
import { StorageBuffer } from "core/Buffers/storageBuffer";
import type { WebGPUEngine } from "core/Engines";
import type { AbstractEngine } from "core/Engines/abstractEngine";
import type { Mesh } from "core/Meshes/mesh";
import { VertexBuffer } from "core/Buffers";
import { Vector3 } from "core/Maths";

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
    private _resultData: { [key: number]: Float32Array } = {};
    private _resultBuffers: { [key: number]: StorageBuffer } = {};

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
                },
                defines: defines,
            });
            this._computeShaders[join] = computeShader;
        } else {
            computeShader = this._computeShaders[join];
        }

        return computeShader;
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

    /** @internal */
    public processAsync(mesh: AbstractMesh): Promise<void> {
        const vertexCount = mesh.getTotalVertices();
        const defines = [""];

        if (mesh && mesh.useBones && mesh.computeBonesUsingShaders && mesh.skeleton) {
            // defines.push("#define NUM_BONE_INFLUENCERS " + mesh.numBoneInfluencers);
        }

        const computeShader = this._getComputeShader(defines);

        this._extractDataAndLink(computeShader, mesh as Mesh, VertexBuffer.PositionKind, 3, "positionBuffer", this._positionBuffers);

        // Bones
        if (mesh && mesh.useBones && mesh.computeBonesUsingShaders && mesh.skeleton && mesh.skeleton.useTextureToStoreBoneMatrices) {
            // this._extractDataAndLink(computeShader, mesh as Mesh, VertexBuffer.MatricesIndicesKind, 4, "indexBuffer", this._indexBuffers);
            // this._extractDataAndLink(computeShader, mesh as Mesh, VertexBuffer.MatricesWeightsKind, 4, "weightBuffer", this._weightBuffers);
            // const boneSampler = mesh.skeleton.getTransformMatrixTexture(mesh);
            // computeShader.setTexture("boneSampler", boneSampler!, false);
            // if (mesh.numBoneInfluencers > 4) {
            //     this._extractDataAndLink(computeShader, mesh as Mesh, VertexBuffer.MatricesIndicesExtraKind, 4, "indexExtraBuffer", this._indexExtraBuffers);
            //     this._extractDataAndLink(computeShader, mesh as Mesh, VertexBuffer.MatricesWeightsExtraKind, 4, "weightExtraBuffer", this._weightExtraBuffers);
            // }
        }

        // Results
        let resultData: Float32Array;
        if (!this._resultData[mesh.uniqueId]) {
            resultData = new Float32Array(6);

            this._resultData[mesh.uniqueId] = resultData;
        } else {
            resultData = this._resultData[mesh.uniqueId];
        }

        resultData[0] = Number.POSITIVE_INFINITY;
        resultData[1] = Number.POSITIVE_INFINITY;
        resultData[2] = Number.POSITIVE_INFINITY;

        resultData[3] = Number.NEGATIVE_INFINITY;
        resultData[4] = Number.NEGATIVE_INFINITY;
        resultData[5] = Number.NEGATIVE_INFINITY;

        let resultBuffer: StorageBuffer;
        if (!this._resultBuffers[mesh.uniqueId]) {
            resultBuffer = new StorageBuffer(this._engine as WebGPUEngine, Float32Array.BYTES_PER_ELEMENT * 6);

            this._resultBuffers[mesh.uniqueId] = resultBuffer;
        } else {
            resultBuffer = this._resultBuffers[mesh.uniqueId];
        }

        resultBuffer.update(resultData);

        computeShader.setStorageBuffer("resultBuffer", resultBuffer);

        // Dispatch
        return new Promise((resolve) => {
            computeShader.dispatchWhenReady(Math.ceil(vertexCount / 64)).then(() => {
                resultBuffer.read(undefined, undefined, resultData, true).then(() => {
                    mesh._refreshBoundingInfoDirect({
                        minimum: Vector3.FromArray(resultData, 0),
                        maximum: Vector3.FromArray(resultData, 3),
                    });
                    resolve();
                });
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
        this._disposeCache(this._resultBuffers);
        this._resultBuffers = {};
        this._resultData = {};
        this._computeShaders = {};
        this._engine = null;
    }
}

RegisterClass("BABYLON.ComputeShaderBoundingHelper", ComputeShaderBoundingHelper);
