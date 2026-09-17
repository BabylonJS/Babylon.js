import { ThinWebGPUEngine } from "core/Engines/thinWebGPUEngine";
import { WebGPUEngine } from "core/Engines/webgpuEngine.pure";
import { WebGPURenderItemBeginOcclusionQuery } from "core/Engines/WebGPU/webgpuBundleList";
import { RegisterEnginesWebGPUExtensionsEngineQuery } from "core/Engines/WebGPU/Extensions/engine.query.pure";
import { describe, expect, it, vi } from "vitest";

interface WebGPUEngineRenderPassInternals {
    _currentRenderTarget: null;
    _currentRenderPass: GPURenderPassEncoder | null;
    _mainRenderPassWrapper: {
        renderPassDescriptor: {
            occlusionQuerySet?: GPUQuerySet;
        };
    };
    _occlusionQuery: ThinWebGPUEngine["_occlusionQuery"];
    _endCurrentRenderPass(): number;
    _startMainRenderPass(setClearStates: boolean): void;
    _getCurrentRenderPass(): GPURenderPassEncoder;
}

describe("WebGPU engine queries", () => {
    it("creates a compatibility-mode render pass before beginning an occlusion query", () => {
        RegisterEnginesWebGPUExtensionsEngineQuery();

        const engine = Object.create(ThinWebGPUEngine.prototype) as ThinWebGPUEngine;
        const renderPass = {
            beginOcclusionQuery: vi.fn(),
        } as unknown as GPURenderPassEncoder;
        engine.compatibilityMode = true;
        engine._currentRenderPass = null;
        engine._getCurrentRenderPass = vi.fn(() => {
            engine._currentRenderPass = renderPass;
            return renderPass;
        });
        engine._occlusionQuery = {
            canBeginQuery: vi.fn(() => engine._currentRenderPass === renderPass),
        } as unknown as ThinWebGPUEngine["_occlusionQuery"];

        expect(engine.beginOcclusionQuery(0, 3)).toBe(true);
        expect(engine._getCurrentRenderPass).toHaveBeenCalledOnce();
        expect(engine._occlusionQuery.canBeginQuery).toHaveBeenCalledExactlyOnceWith(3);
        expect(renderPass.beginOcclusionQuery).toHaveBeenCalledExactlyOnceWith(3);
    });

    it("returns false without recording a compatibility-mode query when it cannot begin", () => {
        RegisterEnginesWebGPUExtensionsEngineQuery();

        const engine = Object.create(ThinWebGPUEngine.prototype) as ThinWebGPUEngine;
        const renderPass = {
            beginOcclusionQuery: vi.fn(),
        } as unknown as GPURenderPassEncoder;
        engine.compatibilityMode = true;
        engine._currentRenderPass = null;
        engine._getCurrentRenderPass = vi.fn(() => {
            engine._currentRenderPass = renderPass;
            return renderPass;
        });
        engine._occlusionQuery = {
            canBeginQuery: vi.fn(() => false),
        } as unknown as ThinWebGPUEngine["_occlusionQuery"];

        expect(engine.beginOcclusionQuery(0, 7)).toBe(false);
        expect(engine._getCurrentRenderPass).toHaveBeenCalledOnce();
        expect(engine._occlusionQuery.canBeginQuery).toHaveBeenCalledExactlyOnceWith(7);
        expect(renderPass.beginOcclusionQuery).not.toHaveBeenCalled();
    });

    it("returns false when a compatibility-mode engine cannot provide a render pass", () => {
        RegisterEnginesWebGPUExtensionsEngineQuery();

        const engine = Object.create(ThinWebGPUEngine.prototype) as ThinWebGPUEngine;
        engine.compatibilityMode = true;
        engine._currentRenderPass = null;
        engine._occlusionQuery = {
            canBeginQuery: vi.fn(),
        } as unknown as ThinWebGPUEngine["_occlusionQuery"];

        expect(engine.beginOcclusionQuery(0, 9)).toBe(false);
        expect(engine._occlusionQuery.canBeginQuery).not.toHaveBeenCalled();
    });

    it("restarts an existing pass when it does not contain the current occlusion query set", () => {
        const engine = Object.create(WebGPUEngine.prototype) as WebGPUEngineRenderPassInternals;
        const oldRenderPass = {} as GPURenderPassEncoder;
        const newRenderPass = {} as GPURenderPassEncoder;
        const querySet = {} as GPUQuerySet;
        const renderPassDescriptor: { occlusionQuerySet?: GPUQuerySet } = {};
        engine._currentRenderTarget = null;
        engine._currentRenderPass = oldRenderPass;
        engine._mainRenderPassWrapper = { renderPassDescriptor };
        engine._occlusionQuery = {
            hasQueries: true,
            querySet,
        } as ThinWebGPUEngine["_occlusionQuery"];
        engine._endCurrentRenderPass = vi.fn(() => {
            engine._currentRenderPass = null;
            return 2;
        });
        engine._startMainRenderPass = vi.fn(() => {
            renderPassDescriptor.occlusionQuerySet = querySet;
            engine._currentRenderPass = newRenderPass;
        });

        expect(engine._getCurrentRenderPass()).toBe(newRenderPass);
        expect(engine._endCurrentRenderPass).toHaveBeenCalledOnce();
        expect(engine._startMainRenderPass).toHaveBeenCalledExactlyOnceWith(false);
    });

    it("keeps recording occlusion queries in the bundle list outside compatibility mode", () => {
        RegisterEnginesWebGPUExtensionsEngineQuery();

        const engine = Object.create(ThinWebGPUEngine.prototype) as ThinWebGPUEngine;
        const addItem = vi.fn();
        Object.defineProperty(engine, "compatibilityMode", { value: false });
        engine._getCurrentRenderPass = vi.fn();
        engine._bundleList = { addItem } as unknown as ThinWebGPUEngine["_bundleList"];

        expect(engine.beginOcclusionQuery(0, 11)).toBe(true);
        expect(engine._getCurrentRenderPass).not.toHaveBeenCalled();
        expect(addItem).toHaveBeenCalledOnce();
        expect(addItem.mock.calls[0][0]).toBeInstanceOf(WebGPURenderItemBeginOcclusionQuery);
        expect(addItem.mock.calls[0][0].query).toBe(11);
    });
});
