import { Engine } from "core/Engines/engine.pure";
import { ThinEngine } from "core/Engines/thinEngine.pure";
import { WebGPUEngine } from "core/Engines/webgpuEngine.pure";
import { AbstractEngine } from "core/Engines/abstractEngine.pure";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("engine disposal without loading screen registration", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("disposes Engine when hideLoadingUI is not registered", () => {
        const engine = Object.create(Engine.prototype) as Engine;
        engine._rescalePostProcess = null;
        engine._renderingCanvas = null;
        vi.spyOn(ThinEngine.prototype, "dispose").mockImplementation(() => {});

        expect(engine.hideLoadingUI).toBeUndefined();
        expect(() => engine.dispose()).not.toThrow();
    });

    it("disposes WebGPUEngine when hideLoadingUI is not registered", () => {
        const engine = Object.create(WebGPUEngine.prototype) as WebGPUEngine;
        engine._timestampQuery = { dispose: vi.fn() } as WebGPUEngine["_timestampQuery"];
        engine._mainTexture = null;
        engine._depthTexture = null;
        engine._textureHelper = { destroyDeferredTextures: vi.fn() } as unknown as WebGPUEngine["_textureHelper"];
        engine._bufferManager = { destroyDeferredBuffers: vi.fn() } as unknown as WebGPUEngine["_bufferManager"];
        engine._device = { destroy: vi.fn() } as unknown as GPUDevice;
        engine._renderingCanvas = null;
        vi.spyOn(AbstractEngine.prototype, "dispose").mockImplementation(() => {});

        expect(engine.hideLoadingUI).toBeUndefined();
        expect(() => engine.dispose()).not.toThrow();
    });
});
