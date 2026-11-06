import { describe, expect, it, vi } from "vitest";
import { WebGPUEngine } from "core/Engines/webgpuEngine.pure";
import { type IWebGPURenderPassCommandRecorderProvider } from "core/Engines/WebGPU/webgpuRenderPassCommandStream";
import { WebGPURenderPassCommandStreamProtocolVersion } from "core/Engines/WebGPU/webgpuRenderPassCommandStream";
import { Logger } from "core/Misc/logger";

function createEngine() {
    const createRenderPass = () => ({
        setPipeline: vi.fn(),
        setIndexBuffer: vi.fn(),
        setVertexBuffer: vi.fn(),
        setBindGroup: vi.fn(),
        draw: vi.fn(),
        drawIndexed: vi.fn(),
        drawIndirect: vi.fn(),
        drawIndexedIndirect: vi.fn(),
        _recordCommands: vi.fn(() => true),
    });
    const renderPass = createRenderPass();
    const bundle = {};
    const bundleEncoder = {
        ...createRenderPass(),
        finish: vi.fn(() => bundle),
    };
    const indexBuffer = { underlyingResource: {}, is32Bits: true };
    const pipeline = {};
    const bindGroups = [{}];
    const state = {
        _compatibilityMode: true,
        _renderPassCommandRecorderProvider: null,
        _renderPassCommandBatching: null,
        _snapshotRendering: { record: false, play: false },
        _currentRenderTarget: null,
        _getCurrentRenderPass: () => renderPass,
        applyStates: vi.fn(),
        bindUniformBufferBase: vi.fn(),
        _currentEffect: { _pipelineContext: { uniformBuffer: null } },
        _currentDrawContext: {
            setVertexPulling: vi.fn(),
            setIndirectData: vi.fn(),
            isDirty: () => false,
            fastBundle: undefined as object | undefined,
            indirectDrawBuffer: null as object | null,
            _enableIndirectDrawInCompatMode: false,
        },
        _currentMaterialContext: {
            useVertexPulling: false,
            updateId: 0,
            isDirty: false,
            forceBindGroupCreation: false,
            hasFloatOrDepthTextures: false,
            textureState: 0,
        },
        _currentVertexBuffers: {},
        _currentOverrideVertexBuffers: null,
        _currentIndexBuffer: indexBuffer,
        _cacheRenderPipeline: {
            indexBuffer,
            getRenderPipeline: () => pipeline,
            vertexBuffers: [{ effectiveBuffer: indexBuffer, _validOffsetRange: false, byteOffset: 8 }],
            colorFormats: ["bgra8unorm"],
        },
        _cacheBindGroups: { getBindGroups: () => bindGroups },
        _applyRenderPassChanges: vi.fn(),
        _bundleList: { addBundle: vi.fn(), getBundleEncoder: () => bundleEncoder, numDrawCalls: 0 },
        _device: { createRenderBundleEncoder: vi.fn(() => bundleEncoder) },
        _counters: { numBundleCreationNonCompatMode: 0, numBundleReuseNonCompatMode: 0 },
        _mainPassSampleCount: 1,
        _depthTextureFormat: "depth24plus",
        _reportDrawCall: vi.fn(),
    };
    const engine = Object.create(WebGPUEngine.prototype) as WebGPUEngine;
    Object.assign(engine, state);
    return { engine, state, renderPass, bundleEncoder, bundle, pipeline, indexBuffer, bindGroups };
}

function createProvider(): IWebGPURenderPassCommandRecorderProvider {
    const ids = new WeakMap<object, number>();
    let nextId = 1;
    return {
        protocolVersion: WebGPURenderPassCommandStreamProtocolVersion,
        isEnabled: () => true,
        getResourceId: (resource) => {
            if (!resource) {
                return 0;
            }
            let id = ids.get(resource);
            if (!id) {
                id = nextId++;
                ids.set(resource, id);
            }
            return id;
        },
    };
}

describe("WebGPU draw submission", () => {
    it("submits indexed draws directly without initializing command batching", () => {
        const { engine, renderPass, pipeline, indexBuffer, bindGroups } = createEngine();

        engine.drawElementsType(0, 5, 36, 2);

        expect(renderPass.setPipeline).toHaveBeenCalledExactlyOnceWith(pipeline);
        expect(renderPass.setIndexBuffer).toHaveBeenCalledExactlyOnceWith(indexBuffer.underlyingResource, "uint32", 0);
        expect(renderPass.setVertexBuffer).toHaveBeenCalledExactlyOnceWith(0, indexBuffer.underlyingResource, 8);
        expect(renderPass.setBindGroup).toHaveBeenCalledExactlyOnceWith(0, bindGroups[0]);
        expect(renderPass.drawIndexed).toHaveBeenCalledExactlyOnceWith(36, 2, 5, 0, 0);
        expect(renderPass._recordCommands).not.toHaveBeenCalled();
        expect(engine).toHaveProperty("_renderPassCommandBatching", null);
    });

    it("submits non-indexed draws directly without initializing command batching", () => {
        const { engine, renderPass } = createEngine();

        engine.drawArraysType(0, 4, 12, 0);

        expect(renderPass.setIndexBuffer).not.toHaveBeenCalled();
        expect(renderPass.draw).toHaveBeenCalledExactlyOnceWith(12, 1, 4, 0);
        expect(engine).toHaveProperty("_renderPassCommandBatching", null);
    });

    it("does not access native batching state when no provider is installed", () => {
        const { engine, renderPass } = createEngine();
        Object.defineProperty(engine, "_renderPassCommandBatching", {
            get: () => {
                throw new Error("The direct draw path must not access native batching state.");
            },
        });

        engine.drawElementsType(0, 0, 3);

        expect(renderPass.drawIndexed).toHaveBeenCalledExactlyOnceWith(3, 1, 0, 0, 0);
    });

    it.each([true, false])("preserves direct indirect draws with indexed=%s", (indexed) => {
        const { engine, state, renderPass } = createEngine();
        const indirectBuffer = {};
        state._currentDrawContext.indirectDrawBuffer = indirectBuffer;
        state._currentDrawContext._enableIndirectDrawInCompatMode = true;

        if (indexed) {
            engine.drawElementsType(0, 5, 36, 2);
            expect(renderPass.drawIndexedIndirect).toHaveBeenCalledExactlyOnceWith(indirectBuffer, 0);
        } else {
            engine.drawArraysType(0, 5, 36, 2);
            expect(renderPass.drawIndirect).toHaveBeenCalledExactlyOnceWith(indirectBuffer, 0);
        }

        expect(state._currentDrawContext.setIndirectData).toHaveBeenCalledExactlyOnceWith(36, 2, 5);
        expect(engine).toHaveProperty("_renderPassCommandBatching", null);
    });

    it("constructs and reuses render bundles without initializing command batching", () => {
        const { engine, state, renderPass, bundleEncoder, bundle } = createEngine();
        engine.compatibilityMode = false;

        engine.drawElementsType(0, 0, 3);
        engine.drawElementsType(0, 0, 3);

        expect(state._device.createRenderBundleEncoder).toHaveBeenCalledOnce();
        expect(bundleEncoder.drawIndexed).toHaveBeenCalledExactlyOnceWith(3, 1, 0, 0, 0);
        expect(bundleEncoder.finish).toHaveBeenCalledOnce();
        expect(state._bundleList.addBundle).toHaveBeenCalledTimes(2);
        expect(state._bundleList.addBundle).toHaveBeenCalledWith(bundle);
        expect(state._counters.numBundleReuseNonCompatMode).toBe(1);
        expect(renderPass.drawIndexed).not.toHaveBeenCalled();
        expect(engine).toHaveProperty("_renderPassCommandBatching", null);
    });

    it("records snapshot bundles directly even when a native provider is installed", () => {
        const { engine, state, bundleEncoder, renderPass } = createEngine();
        engine.renderPassCommandRecorderProvider = createProvider();
        state._snapshotRendering.record = true;

        engine.drawElementsType(0, 0, 3);

        expect(bundleEncoder.drawIndexed).toHaveBeenCalledExactlyOnceWith(3, 1, 0, 0, 0);
        expect(renderPass.drawIndexed).not.toHaveBeenCalled();
        expect(renderPass._recordCommands).not.toHaveBeenCalled();
        expect(state._bundleList.numDrawCalls).toBe(1);
    });

    it("initializes batching only when installing a provider and flushes before removing it", () => {
        const { engine, renderPass } = createEngine();
        engine.renderPassCommandRecorderProvider = null;
        expect(engine).toHaveProperty("_renderPassCommandBatching", null);

        engine.renderPassCommandRecorderProvider = createProvider();
        engine.drawElementsType(0, 0, 3);
        expect(renderPass.drawIndexed).not.toHaveBeenCalled();
        expect(renderPass._recordCommands).not.toHaveBeenCalled();

        engine.renderPassCommandRecorderProvider = null;
        expect(renderPass._recordCommands).toHaveBeenCalledOnce();
        engine.drawElementsType(0, 3, 3);
        expect(renderPass.drawIndexed).toHaveBeenCalledExactlyOnceWith(3, 1, 3, 0, 0);
        expect(renderPass._recordCommands).toHaveBeenCalledOnce();
    });

    it("keeps indexed and non-indexed native draws on the batched path", () => {
        const { engine, renderPass } = createEngine();
        engine.renderPassCommandRecorderProvider = createProvider();

        engine.drawElementsType(0, 0, 3);
        engine.drawArraysType(0, 3, 3);
        engine._flushRenderPassCommands();

        expect(renderPass.drawIndexed).not.toHaveBeenCalled();
        expect(renderPass.draw).not.toHaveBeenCalled();
        expect(renderPass._recordCommands).toHaveBeenCalledExactlyOnceWith(expect.any(Uint32Array), 2, 0, 0, expect.any(Number));
    });

    it("flushes pending native draws before changing providers", () => {
        const { engine, renderPass } = createEngine();
        const oldProvider = createProvider();
        const newProvider = createProvider();
        engine.renderPassCommandRecorderProvider = oldProvider;
        engine.drawElementsType(0, 0, 3);
        renderPass._recordCommands.mockImplementation(() => {
            expect(engine.renderPassCommandRecorderProvider).toBe(oldProvider);
            return true;
        });

        engine.renderPassCommandRecorderProvider = newProvider;

        expect(renderPass._recordCommands).toHaveBeenCalledOnce();
        expect(engine.renderPassCommandRecorderProvider).toBe(newProvider);
    });

    it("flushes pending native draws before constructing a non-compatibility bundle", () => {
        const { engine, renderPass, bundleEncoder } = createEngine();
        const events: string[] = [];
        renderPass._recordCommands.mockImplementation(() => {
            events.push("batch");
            return true;
        });
        bundleEncoder.drawIndexed.mockImplementation(() => events.push("direct"));
        engine.renderPassCommandRecorderProvider = createProvider();
        engine.drawElementsType(0, 0, 3);
        engine.compatibilityMode = false;

        engine.drawElementsType(0, 3, 3);

        expect(events).toEqual(["batch", "direct"]);
    });

    it("preserves permanent fallback when a provider is removed and reinstalled", () => {
        const { engine, renderPass } = createEngine();
        const provider = createProvider();
        const errorSpy = vi.spyOn(Logger, "Error").mockImplementation(() => {});
        provider.protocolVersion++;
        try {
            engine.renderPassCommandRecorderProvider = provider;
            engine.drawElementsType(0, 0, 3);
            engine.renderPassCommandRecorderProvider = null;
            engine.renderPassCommandRecorderProvider = createProvider();

            engine.drawElementsType(0, 3, 3);
            engine._flushRenderPassCommands();

            expect(renderPass.drawIndexed).toHaveBeenCalledTimes(2);
            expect(renderPass._recordCommands).not.toHaveBeenCalled();
        } finally {
            errorSpy.mockRestore();
        }
    });
});
