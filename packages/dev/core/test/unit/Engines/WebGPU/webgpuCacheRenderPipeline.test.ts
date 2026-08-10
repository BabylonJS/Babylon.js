import { describe, it, expect, beforeEach, vi } from "vitest";
import { WebGPUCacheRenderPipelineTree } from "core/Engines/WebGPU/webgpuCacheRenderPipelineTree";
import { Constants } from "core/Engines/constants";
import { type Effect } from "core/Materials/effect";
import { type VertexBuffer } from "core/Buffers/buffer";
import { type WebGPUPipelineContext } from "core/Engines/WebGPU/webgpuPipelineContext";
import { RegisterEnginesWebGPUExtensionsEngineAlphaToCoverage } from "core/Engines/WebGPU/Extensions/engine.alphaToCoverage.pure";

// Minimal mock types for the pipeline cache tests
function createMockDevice(): GPUDevice {
    const asyncMockPipeline = { label: "mock-pipeline-async" } as unknown as GPURenderPipeline;
    let pipelineId = 0;

    return {
        limits: { maxVertexBufferArrayStride: 2048, maxVertexAttributes: 16 },
        createRenderPipeline: vi.fn(() => ({ label: `mock-pipeline-${pipelineId++}` }) as unknown as GPURenderPipeline),
        createRenderPipelineAsync: vi.fn(() => Promise.resolve(asyncMockPipeline)),
        createPipelineLayout: vi.fn(() => ({})),
        createBindGroupLayout: vi.fn(() => ({})),
    } as unknown as GPUDevice;
}

function createMockEffect(uniqueId: number, attributes: string[] = []): Effect {
    return {
        uniqueId,
        getEngine: () => ({}),
        _pipelineContext: {
            stages: {
                vertexStage: { module: {}, entryPoint: "main" },
                fragmentStage: { module: {}, entryPoint: "main" },
            },
            shaderProcessingContext: {
                attributeNamesFromEffect: attributes,
                attributeLocationsFromEffect: attributes.map((_, index) => index),
                bindGroupLayoutEntries: [],
                bindGroupEntries: [],
                bindGroupLayoutEntryInfo: [],
            },
            bindGroupLayouts: {},
        } as unknown as WebGPUPipelineContext,
    } as unknown as Effect;
}

function createMockVertexBuffer(buffer: unknown = null, effectiveByteOffset = 0, effectiveByteStride = 12): VertexBuffer {
    return {
        getSize: (sizeInBytes?: boolean) => (sizeInBytes ? 4 : 1),
        getIsInstanced: () => false,
        type: Constants.FLOAT,
        normalized: false,
        byteStride: effectiveByteStride,
        byteOffset: effectiveByteOffset,
        effectiveByteStride,
        effectiveByteOffset,
        effectiveBuffer: buffer ? { underlyingResource: buffer } : null,
        hashCode: effectiveByteStride << 12,
        _validOffsetRange: undefined,
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

        it("should create a new pipeline when the vertex buffer merge structure changes", () => {
            effect = createMockEffect(1, ["position", "normal"]);
            const sharedBuffer = {};

            cache.setBuffers(
                {
                    position: createMockVertexBuffer(sharedBuffer, 0, 16),
                    normal: createMockVertexBuffer(sharedBuffer, 4, 16),
                },
                null,
                null
            );
            cache.getRenderPipeline(Constants.MATERIAL_TriangleFillMode, effect, 1, 0);

            cache.setBuffers(
                {
                    position: createMockVertexBuffer({}, 0, 16),
                    normal: createMockVertexBuffer({}, 4, 16),
                },
                null,
                null
            );
            cache.getRenderPipeline(Constants.MATERIAL_TriangleFillMode, effect, 1, 0);

            expect(device.createRenderPipeline).toHaveBeenCalledTimes(2);
        });

        it("should create a new pipeline when merged vertex attribute offsets change", () => {
            effect = createMockEffect(1, ["position", "normal"]);
            const firstBuffer = {};

            cache.setBuffers(
                {
                    position: createMockVertexBuffer(firstBuffer, 0, 16),
                    normal: createMockVertexBuffer(firstBuffer, 4, 16),
                },
                null,
                null
            );
            cache.getRenderPipeline(Constants.MATERIAL_TriangleFillMode, effect, 1, 0);

            const secondBuffer = {};
            cache.setBuffers(
                {
                    position: createMockVertexBuffer(secondBuffer, 4, 16),
                    normal: createMockVertexBuffer(secondBuffer, 8, 16),
                },
                null,
                null
            );
            cache.getRenderPipeline(Constants.MATERIAL_TriangleFillMode, effect, 1, 0);

            expect(device.createRenderPipeline).toHaveBeenCalledTimes(2);
        });

        it("should reuse a pipeline when only the underlying vertex buffer changes", () => {
            effect = createMockEffect(1, ["position", "normal"]);
            const firstBuffer = {};

            cache.setBuffers(
                {
                    position: createMockVertexBuffer(firstBuffer, 0, 16),
                    normal: createMockVertexBuffer(firstBuffer, 4, 16),
                },
                null,
                null
            );
            const firstPipeline = cache.getRenderPipeline(Constants.MATERIAL_TriangleFillMode, effect, 1, 0);

            const differentLayoutBuffer = {};
            cache.setBuffers(
                {
                    position: createMockVertexBuffer(differentLayoutBuffer, 4, 16),
                    normal: createMockVertexBuffer(differentLayoutBuffer, 8, 16),
                },
                null,
                null
            );
            cache.getRenderPipeline(Constants.MATERIAL_TriangleFillMode, effect, 1, 0);

            const secondBuffer = {};
            cache.setBuffers(
                {
                    position: createMockVertexBuffer(secondBuffer, 0, 16),
                    normal: createMockVertexBuffer(secondBuffer, 4, 16),
                },
                null,
                null
            );
            const reusedPipeline = cache.getRenderPipeline(Constants.MATERIAL_TriangleFillMode, effect, 1, 0);

            expect(reusedPipeline).toBe(firstPipeline);
            expect(device.createRenderPipeline).toHaveBeenCalledTimes(2);
        });

        it("should reuse a pipeline when invalid vertex offsets change", () => {
            effect = createMockEffect(1, ["position"]);

            cache.setBuffers({ position: createMockVertexBuffer({}, 16, 16) }, null, null);
            const firstPipeline = cache.getRenderPipeline(Constants.MATERIAL_TriangleFillMode, effect, 1, 0);

            cache.setBuffers({ position: createMockVertexBuffer({}, 32, 16) }, null, null);
            const reusedPipeline = cache.getRenderPipeline(Constants.MATERIAL_TriangleFillMode, effect, 1, 0);

            expect(reusedPipeline).toBe(firstPipeline);
            expect(device.createRenderPipeline).toHaveBeenCalledTimes(1);
        });

        it("should enable alpha-to-coverage in multisampled pipelines", () => {
            RegisterEnginesWebGPUExtensionsEngineAlphaToCoverage();
            cache.setAlphaToCoverage(true);

            cache.getRenderPipeline(Constants.MATERIAL_TriangleFillMode, effect, 4, 0);

            expect(device.createRenderPipeline).toHaveBeenCalledWith(
                expect.objectContaining({
                    multisample: {
                        count: 4,
                        alphaToCoverageEnabled: true,
                    },
                })
            );
        });

        it("should create a new pipeline when alpha-to-coverage changes", () => {
            RegisterEnginesWebGPUExtensionsEngineAlphaToCoverage();
            cache.getRenderPipeline(Constants.MATERIAL_TriangleFillMode, effect, 4, 0);
            cache.setAlphaToCoverage(true);
            cache.getRenderPipeline(Constants.MATERIAL_TriangleFillMode, effect, 4, 0);

            expect(device.createRenderPipeline).toHaveBeenCalledTimes(2);
        });

        it("should disable alpha-to-coverage in single-sample pipeline descriptors", () => {
            RegisterEnginesWebGPUExtensionsEngineAlphaToCoverage();
            cache.setAlphaToCoverage(true);
            cache.getRenderPipeline(Constants.MATERIAL_TriangleFillMode, effect, 1, 0);
            cache.setAlphaToCoverage(false);
            cache.getRenderPipeline(Constants.MATERIAL_TriangleFillMode, effect, 1, 0);

            expect(device.createRenderPipeline).toHaveBeenCalledTimes(1);
            expect(device.createRenderPipeline).toHaveBeenCalledWith(
                expect.objectContaining({
                    multisample: {
                        count: 1,
                        alphaToCoverageEnabled: false,
                    },
                })
            );
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
