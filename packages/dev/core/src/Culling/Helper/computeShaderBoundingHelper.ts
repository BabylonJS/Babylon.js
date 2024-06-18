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
    private _computeShader: ComputeShader;
    private _positionBuffers: { [key: number]: StorageBuffer } = {};
    private _indexBuffers: { [key: number]: StorageBuffer } = {};
    private _weightBuffers: { [key: number]: StorageBuffer } = {};
    private _resultData: { [key: number]: Float32Array } = {};
    private _resultBuffers: { [key: number]: StorageBuffer } = {};

    /**
     * Creates a new ComputeShaderBoundingHelper
     * @param engine defines the engine to use
     */
    constructor(engine: AbstractEngine) {
        this._engine = engine;
        this._computeShader = new ComputeShader("boundingInfoCompute", this._engine!, "boundingInfo", {
            bindingsMapping: {
                positionBuffer: { group: 0, binding: 0 },
                resultBuffer: { group: 0, binding: 1 },
                indexBuffer: { group: 0, binding: 2 },
                weightBuffer: { group: 0, binding: 3 },
            },
        });
    }

    private _extractDataAndLink(mesh: Mesh, kind: string, stride: number, name: string, storageUnit: { [key: number]: StorageBuffer }) {
        let buffer: StorageBuffer;
        const vertexCount = mesh.getTotalVertices();
        if (!storageUnit[mesh.uniqueId]) {
            const dataArray = mesh.getVertexBuffer(kind)?.getData();
            buffer = new StorageBuffer(this._engine as WebGPUEngine, Float32Array.BYTES_PER_ELEMENT * vertexCount * stride);
            buffer.update(dataArray!);

            storageUnit[mesh.uniqueId] = buffer;
        } else {
            buffer = storageUnit[mesh.uniqueId];
        }

        this._computeShader.setStorageBuffer(name, buffer);
    }

    /** @internal */
    public processAsync(mesh: AbstractMesh): Promise<void> {
        const vertexCount = mesh.getTotalVertices();

        this._extractDataAndLink(mesh as Mesh, VertexBuffer.PositionKind, 3, "positionBuffer", this._positionBuffers);

        // Bones
        if (mesh && mesh.useBones && mesh.computeBonesUsingShaders && mesh.skeleton) {
            // this._extractDataAndLink(mesh as Mesh, VertexBuffer.MatricesIndicesKind, 4, "indexBuffer", this._indexBuffers);
            //this._extractDataAndLink(mesh as Mesh, VertexBuffer.MatricesWeightsKind, 4, "weightBuffer", this._weightBuffers);
            // if (mesh.numBoneInfluencers > 4) {
            //     attribs.push(VertexBuffer.MatricesIndicesExtraKind);
            //     attribs.push(VertexBuffer.MatricesWeightsExtraKind);
            // }
            // const skeleton = mesh.skeleton;
            // defines.push("#define NUM_BONE_INFLUENCERS " + mesh.numBoneInfluencers);
            // if (skeleton.isUsingTextureForMatrices) {
            //     defines.push("#define BONETEXTURE");
            //     if (uniforms.indexOf("boneTextureWidth") === -1) {
            //         uniforms.push("boneTextureWidth");
            //     }
            //     if (samplers.indexOf("boneSampler") === -1) {
            //         samplers.push("boneSampler");
            //     }
            // } else {
            //     defines.push("#define BonesPerMesh " + (skeleton.bones.length + 1));
            //     if (uniforms.indexOf("mBones") === -1) {
            //         uniforms.push("mBones");
            //     }
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
        resultData[0] = Number.MAX_SAFE_INTEGER;
        resultData[1] = Number.MAX_SAFE_INTEGER;
        resultData[2] = Number.MAX_SAFE_INTEGER;
        resultData[3] = Number.MIN_SAFE_INTEGER;
        resultData[4] = Number.MIN_SAFE_INTEGER;
        resultData[5] = Number.MIN_SAFE_INTEGER;

        let resultBuffer: StorageBuffer;
        if (!this._resultBuffers[mesh.uniqueId]) {
            resultBuffer = new StorageBuffer(this._engine as WebGPUEngine, Float32Array.BYTES_PER_ELEMENT * 6);

            this._resultBuffers[mesh.uniqueId] = resultBuffer;
        } else {
            resultBuffer = this._resultBuffers[mesh.uniqueId];
        }

        resultBuffer.update(resultData);

        this._computeShader.setStorageBuffer("resultBuffer", resultBuffer);

        // Dispatch
        this._computeShader.dispatchWhenReady(vertexCount).then(() => {
            resultBuffer.read(undefined, undefined, resultData).then(() => {
                mesh._refreshBoundingInfoDirect({
                    minimum: Vector3.FromArray(resultData, 0),
                    maximum: Vector3.FromArray(resultData, 3),
                });
            });
        });
        return Promise.resolve();
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
        this._engine = null;
    }
}

RegisterClass("BABYLON.ComputeShaderBoundingHelper", ComputeShaderBoundingHelper);
