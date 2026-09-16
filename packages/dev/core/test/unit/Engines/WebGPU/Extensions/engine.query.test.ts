import { ThinWebGPUEngine } from "core/Engines/thinWebGPUEngine";
import { WebGPURenderItemBeginOcclusionQuery } from "core/Engines/WebGPU/webgpuBundleList";
import { RegisterEnginesWebGPUExtensionsEngineQuery } from "core/Engines/WebGPU/Extensions/engine.query.pure";
import { describe, expect, it, vi } from "vitest";

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
