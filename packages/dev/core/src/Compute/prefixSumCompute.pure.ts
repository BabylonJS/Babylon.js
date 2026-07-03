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

const BlockSize = 256;

/**
 * @internal
 * WebGPU compute utility that performs an in-place hierarchical EXCLUSIVE prefix sum (scan) over a
 * `StorageBuffer` of u32 values.
 *
 * It scans the array in blocks of {@link BlockSize}, recursively scans the per-block totals, and adds
 * the resulting offsets back, so it handles arrays much larger than a single workgroup. It is used by
 * the Gaussian Splatting GPU depth sort (histogram into per-bucket start offsets) and is intended to be
 * reused by the interval culling pass in a later phase.
 */
export class PrefixSumCompute {
    private readonly _engine: AbstractEngine;
    private _scanBlock: Nullable<ComputeShader> = null;
    private _addOffsets: Nullable<ComputeShader> = null;
    // One UBO per dispatch, cycled per scan, to avoid a later dispatch's parameters overwriting an
    // earlier (still-pending) dispatch's uniform buffer (the update/dispatch hazard).
    private _ubos: UniformBuffer[] = [];
    private _uboIndex = 0;
    // Per-recursion-level scratch buffers holding the block totals; grown/cached by level.
    private _levelBuffers: StorageBuffer[] = [];

    /**
     * Creates a new prefix-sum compute helper.
     * @param engine the (WebGPU) engine to run the compute passes on
     */
    public constructor(engine: AbstractEngine) {
        this._engine = engine;
    }

    private _ensureShaders(): void {
        if (this._scanBlock) {
            return;
        }
        const scanBlockBindings: ComputeBindingMapping = {
            data: { group: 0, binding: 0 },
            blockSums: { group: 0, binding: 1 },
            params: { group: 0, binding: 2 },
        };
        this._scanBlock = new ComputeShader("prefixSumScanBlock", this._engine, "prefixSumScanBlock", { bindingsMapping: scanBlockBindings });
        const addOffsetsBindings: ComputeBindingMapping = {
            data: { group: 0, binding: 0 },
            blockOffsets: { group: 0, binding: 1 },
            params: { group: 0, binding: 2 },
        };
        this._addOffsets = new ComputeShader("prefixSumAddOffsets", this._engine, "prefixSumAddOffsets", { bindingsMapping: addOffsetsBindings });
    }

    private _getUbo(count: number): UniformBuffer {
        if (this._uboIndex >= this._ubos.length) {
            const ubo = new UniformBuffer(this._engine, undefined, undefined, "PrefixSumComputeParams", false, false);
            ubo.addUniform("count", 1);
            this._ubos.push(ubo);
        }
        const ubo = this._ubos[this._uboIndex++];
        ubo.updateUInt("count", count);
        ubo.update();
        return ubo;
    }

    private _getLevelBuffer(level: number, numBlocks: number): StorageBuffer {
        // Padded to a multiple of BlockSize so the next level's block scan never reads out of bounds.
        const capacity = (Math.ceil(numBlocks / BlockSize) * BlockSize) | 0;
        const existing = this._levelBuffers[level];
        if (existing && existing.getBuffer().capacity >= capacity * Uint32Array.BYTES_PER_ELEMENT) {
            return existing;
        }
        existing?.dispose();
        const buffer = new StorageBuffer(
            this._engine as WebGPUEngine,
            Math.max(capacity, BlockSize) * Uint32Array.BYTES_PER_ELEMENT,
            Constants.BUFFER_CREATIONFLAG_READWRITE,
            "PrefixSumLevel" + level
        );
        this._levelBuffers[level] = buffer;
        return buffer;
    }

    /**
     * Whether both compute shaders are compiled and ready to dispatch.
     * @returns true when the scan can run
     */
    public isReady(): boolean {
        this._ensureShaders();
        return !!this._scanBlock!.isReady() && !!this._addOffsets!.isReady();
    }

    /**
     * Runs an in-place exclusive prefix sum over the first `count` entries of `buffer`.
     * Call {@link resetForFrame} once before the sequence of scans issued in a frame.
     * @param buffer the u32 storage buffer to scan in place
     * @param count number of valid entries to scan
     */
    public scanExclusive(buffer: StorageBuffer, count: number): void {
        this._ensureShaders();
        this._scanRecursive(buffer.getBuffer(), count, 0);
    }

    /**
     * Resets the internal UBO ring. Must be called once at the start of each frame's scan sequence.
     */
    public resetForFrame(): void {
        this._uboIndex = 0;
    }

    private _scanRecursive(data: DataBuffer, count: number, level: number): void {
        // count === 1 must still run the block scan so the single element is written to its exclusive value (0);
        // returning here would leave it unchanged. Only an empty scan is a true no-op.
        if (count <= 0) {
            return;
        }
        const numBlocks = Math.ceil(count / BlockSize);
        const blockSums = this._getLevelBuffer(level, numBlocks);

        const scanUbo = this._getUbo(count);
        this._scanBlock!.setStorageBuffer("data", data);
        this._scanBlock!.setStorageBuffer("blockSums", blockSums);
        this._scanBlock!.setUniformBuffer("params", scanUbo);
        this._scanBlock!.dispatch(numBlocks);

        if (numBlocks > 1) {
            this._scanRecursive(blockSums.getBuffer(), numBlocks, level + 1);

            const addUbo = this._getUbo(count);
            this._addOffsets!.setStorageBuffer("data", data);
            this._addOffsets!.setStorageBuffer("blockOffsets", blockSums);
            this._addOffsets!.setUniformBuffer("params", addUbo);
            this._addOffsets!.dispatch(numBlocks);
        }
    }

    /**
     * Releases all GPU resources held by the helper.
     */
    public dispose(): void {
        for (const ubo of this._ubos) {
            ubo.dispose();
        }
        for (const buffer of this._levelBuffers) {
            buffer.dispose();
        }
        this._ubos = [];
        this._levelBuffers = [];
        this._uboIndex = 0;
        this._scanBlock = null;
        this._addOffsets = null;
    }
}
