import { describe, it, expect, beforeEach, vi } from "vitest";
import { WebGPUCacheRenderPipelineTree } from "core/Engines/WebGPU/webgpuCacheRenderPipelineTree";
import { Constants } from "core/Engines/constants";
import { type Effect } from "core/Materials/effect";
import { type VertexBuffer } from "core/Buffers/buffer";
import { type WebGPUPipelineContext } from "core/Engines/WebGPU/webgpuPipelineContext";

// Minimal mock types for the pipeline cache tests
function createMockDevice(): GPUDevice {
    const mockPipeline = { label: "mock-pipeline" } as unknown as GPURenderPipeline;
    const asyncMockPipeline = { label: "mock-pipeline-async" } as unknown as GPURenderPipeline;

    return {
        limits: { maxVertexBufferArrayStride: 2048 },
        createRenderPipeline: vi.fn(() => mockPipeline),
        createRenderPipelineAsync: vi.fn(() => Promise.resolve(asyncMockPipeline)),
        createPipelineLayout: vi.fn(() => ({})),
        createBindGroupLayout: vi.fn(() => ({})),
    } as unknown as GPUDevice;
}

function createMockEffect(uniqueId: number): Effect {
    return {
        uniqueId,
        _pipelineContext: {
            stages: {
                vertexStage: { module: {}, entryPoint: "main" },
                fragmentStage: { module: {}, entryPoint: "main" },
            },
            shaderProcessingContext: {
                attributeNamesFromEffect: [],
                attributeLocationsFromEffect: [],
                bindGroupLayoutEntries: [],
                bindGroupEntries: [],
                bindGroupLayoutEntryInfo: [],
            },
            bindGroupLayouts: {},
        } as unknown as WebGPUPipelineContext,
    } as unknown as Effect;
}

function createMockVertexBuffer(): VertexBuffer {
    return {
        getSize: () => 12,
        byteStride: 12,
        byteOffset: 0,
        effectiveByteStride: 12,
        effectiveByteOffset: 0,
        effectiveBuffer: null,
        hashCode: 1,
        _validOffsetRange: true,
    } as unknown as VertexBuffer;
}

describe("WebGPUCacheRenderPipeline", () => {
    let device: GPUDevice;
    let cache: WebGPUCacheRenderPipelineTree;
    let effect: Effect;

    beforeEach(() => {
        device = createMockDevice();
        const emptyVB = createMockVertexBuffer();
        cache = new WebGPUCacheRenderPipelineTree(device, emptyVB);
        effect = createMockEffect(1);

        WebGPUCacheRenderPipelineTree.ResetCache();
        cache.reset();
    });

    describe("getRenderPipeline", () => {
        it("should create a pipeline on cache miss", () => {
            const pipeline = cache.getRenderPipeline(Constants.MATERIAL_TriangleFillMode, effect, 1, 0);

            expect(pipeline).toBeDefined();
            expect(device.createRenderPipeline).toHaveBeenCalledTimes(1);
        });

        it("should return cached pipeline on second call with same state", () => {
            const pipeline1 = cache.getRenderPipeline(Constants.MATERIAL_TriangleFillMode, effect, 1, 0);
            const pipeline2 = cache.getRenderPipeline(Constants.MATERIAL_TriangleFillMode, effect, 1, 0);

            expect(pipeline1).toBe(pipeline2);
            expect(device.createRenderPipeline).toHaveBeenCalledTimes(1);
        });

        it("should create a new pipeline when effect changes", () => {
            const effect2 = createMockEffect(2);

            cache.getRenderPipeline(Constants.MATERIAL_TriangleFillMode, effect, 1, 0);
            cache.getRenderPipeline(Constants.MATERIAL_TriangleFillMode, effect2, 1, 0);

            expect(device.createRenderPipeline).toHaveBeenCalledTimes(2);
        });

        it("should create a new pipeline when fill mode changes", () => {
            cache.getRenderPipeline(Constants.MATERIAL_TriangleFillMode, effect, 1, 0);
            cache.getRenderPipeline(Constants.MATERIAL_WireFrameFillMode, effect, 1, 0);

            expect(device.createRenderPipeline).toHaveBeenCalledTimes(2);
        });
    });

    describe("preWarmPipeline", () => {
        it("should return null when pipeline is already cached", () => {
            // First, create the pipeline synchronously
            cache.getRenderPipeline(Constants.MATERIAL_TriangleFillMode, effect, 1, 0);

            // Pre-warming the same state should return null (already cached)
            const result = cache.preWarmPipeline(Constants.MATERIAL_TriangleFillMode, effect, 1, 0);

            expect(result).toBeNull();
            expect(device.createRenderPipelineAsync).not.toHaveBeenCalled();
        });

        it("should return a Promise on cache miss", () => {
            const result = cache.preWarmPipeline(Constants.MATERIAL_TriangleFillMode, effect, 1, 0);

            expect(result).toBeInstanceOf(Promise);
            expect(device.createRenderPipelineAsync).toHaveBeenCalledTimes(1);
        });

        it("should resolve with the compiled pipeline", async () => {
            const promise = cache.preWarmPipeline(Constants.MATERIAL_TriangleFillMode, effect, 1, 0);

            expect(promise).not.toBeNull();
            const pipeline = await promise!;
            expect(pipeline).toBeDefined();
            expect(pipeline.label).toBe("mock-pipeline-async");
        });

        it("should store the pipeline in cache after async completion", async () => {
            const promise = cache.preWarmPipeline(Constants.MATERIAL_TriangleFillMode, effect, 1, 0);
            await promise;

            // Now getRenderPipeline should find it cached (no sync creation needed)
            cache.getRenderPipeline(Constants.MATERIAL_TriangleFillMode, effect, 1, 0);

            // createRenderPipeline (sync) should NOT have been called
            expect(device.createRenderPipeline).not.toHaveBeenCalled();
        });

        it("should allow multiple pre-warms via Promise.all", async () => {
            const effect2 = createMockEffect(2);
            const effect3 = createMockEffect(3);

            const promises: Promise<GPURenderPipeline>[] = [];

            const p1 = cache.preWarmPipeline(Constants.MATERIAL_TriangleFillMode, effect, 1, 0);
            if (p1) {
                promises.push(p1);
            }

            const p2 = cache.preWarmPipeline(Constants.MATERIAL_TriangleFillMode, effect2, 1, 0);
            if (p2) {
                promises.push(p2);
            }

            const p3 = cache.preWarmPipeline(Constants.MATERIAL_TriangleFillMode, effect3, 1, 0);
            if (p3) {
                promises.push(p3);
            }

            expect(promises).toHaveLength(3);
            expect(device.createRenderPipelineAsync).toHaveBeenCalledTimes(3);

            await Promise.all(promises);

            // All three should now be cached
            cache.getRenderPipeline(Constants.MATERIAL_TriangleFillMode, effect, 1, 0);
            cache.getRenderPipeline(Constants.MATERIAL_TriangleFillMode, effect2, 1, 0);
            cache.getRenderPipeline(Constants.MATERIAL_TriangleFillMode, effect3, 1, 0);

            expect(device.createRenderPipeline).not.toHaveBeenCalled();
        });
    });
});
