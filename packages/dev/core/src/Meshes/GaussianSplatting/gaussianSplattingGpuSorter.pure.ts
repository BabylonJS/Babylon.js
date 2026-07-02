/** This file must only contain pure code and pure imports */

import { type Nullable } from "core/types";
import { type AbstractEngine } from "core/Engines/abstractEngine.pure";
import { type WebGPUEngine } from "core/Engines/webgpuEngine.pure";
import { type DataBuffer } from "core/Buffers/dataBuffer";
import { type ComputeBindingMapping } from "core/Engines/Extensions/engine.computeShader.pure";
import { ComputeShader } from "core/Compute/computeShader.pure";
import { StorageBuffer } from "core/Buffers/storageBuffer";
import { UniformBuffer } from "core/Materials/uniformBuffer";
import { Constants } from "core/Engines/constants";

/**
 * @internal
 * WebGPU compute driver that produces the per-splat `splatIndex` order buffer for a
 * {@link GaussianSplattingMeshBase} on the GPU.
 *
 * Phase 0 scaffold: it uploads a packed (interval-aware) source-index list and normalizes it
 * through a compute pass, so the resulting buffer is produced on the GPU and can be bound directly
 * as the `splatIndex` instanced vertex buffer with no CPU readback. This validates the
 * compute to storage buffer to instanced vertex buffer path that the full fast path depends on.
 * Phase 1 replaces the seed copy with GPU depth-key generation followed by a radix sort.
 */
export class GaussianSplattingGpuSorter {
    private readonly _engine: AbstractEngine;
    private _compute: Nullable<ComputeShader> = null;
    private _params: Nullable<UniformBuffer> = null;
    private _seedBuffer: Nullable<StorageBuffer> = null;
    private _sortedIndexBuffer: Nullable<StorageBuffer> = null;
    private _capacity = 0;

    /**
     * Whether the running engine supports the WebGPU compute sort path.
     * @param engine the engine to test
     * @returns true when compute shaders are available
     */
    public static IsSupported(engine: AbstractEngine): boolean {
        return !!engine.getCaps().supportComputeShaders;
    }

    /**
     * Creates a new GPU sorter.
     * @param engine the (WebGPU) engine to run the compute passes on
     */
    public constructor(engine: AbstractEngine) {
        this._engine = engine;
    }

    private _ensureResources(paddedCount: number): void {
        if (!this._compute) {
            const bindingsMapping: ComputeBindingMapping = {
                seedBuffer: { group: 0, binding: 0 },
                sortedIndexBuffer: { group: 0, binding: 1 },
                params: { group: 0, binding: 2 },
            };
            this._compute = new ComputeShader("gaussianSplattingSplatIndexInit", this._engine, "gaussianSplattingSplatIndexInit", { bindingsMapping });
            this._params = new UniformBuffer(this._engine, undefined, undefined, "GaussianSplattingGpuSorterParams");
            this._params.addUniform("count", 1);
        }

        if (paddedCount > this._capacity) {
            this._seedBuffer?.dispose();
            this._sortedIndexBuffer?.dispose();
            const byteLength = paddedCount * Float32Array.BYTES_PER_ELEMENT;
            this._seedBuffer = new StorageBuffer(this._engine as WebGPUEngine, byteLength, Constants.BUFFER_CREATIONFLAG_READWRITE, "GaussianSplattingSplatIndexSeed");
            // The sorted-index buffer is consumed as an instanced vertex buffer, so it needs the VERTEX usage flag
            // in addition to READWRITE (written by the compute pass).
            this._sortedIndexBuffer = new StorageBuffer(
                this._engine as WebGPUEngine,
                byteLength,
                Constants.BUFFER_CREATIONFLAG_READWRITE | Constants.BUFFER_CREATIONFLAG_VERTEX,
                "GaussianSplattingSplatIndexSorted"
            );
            this._capacity = paddedCount;
        }
    }

    /**
     * Generates the sorted-index buffer from a packed source-index list.
     * @param seedIndices packed (interval-aware) source indices, one f32 per rendered slot (already padded)
     * @returns true when the compute pass was dispatched (the shader was ready); false when it must be retried
     */
    public build(seedIndices: Float32Array): boolean {
        const paddedCount = seedIndices.length;
        if (paddedCount === 0) {
            return false;
        }
        this._ensureResources(paddedCount);

        this._seedBuffer!.update(seedIndices);
        this._params!.updateUInt("count", paddedCount);
        this._params!.update();

        this._compute!.setStorageBuffer("seedBuffer", this._seedBuffer!);
        this._compute!.setStorageBuffer("sortedIndexBuffer", this._sortedIndexBuffer!);
        this._compute!.setUniformBuffer("params", this._params!);
        // dispatch returns false when the compute effect (or a bound resource) is not ready yet; the caller
        // keeps the "dirty" state and retries on a later frame.
        return this._compute!.dispatch(Math.ceil(paddedCount / 256));
    }

    /**
     * The GPU data buffer to bind as the `splatIndex` instanced vertex buffer, or null before the first build.
     */
    public get sortedDataBuffer(): Nullable<DataBuffer> {
        return this._sortedIndexBuffer ? this._sortedIndexBuffer.getBuffer() : null;
    }

    /**
     * Releases all GPU resources held by the sorter.
     */
    public dispose(): void {
        this._seedBuffer?.dispose();
        this._sortedIndexBuffer?.dispose();
        this._params?.dispose();
        this._seedBuffer = null;
        this._sortedIndexBuffer = null;
        this._params = null;
        this._compute = null;
        this._capacity = 0;
    }
}
