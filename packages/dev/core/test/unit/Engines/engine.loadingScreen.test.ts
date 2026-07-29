import { Engine } from "core/Engines/engine.pure";
import { ThinEngine } from "core/Engines/thinEngine.pure";
import { WebGPUEngine } from "core/Engines/webgpuEngine.pure";
import { AbstractEngine } from "core/Engines/abstractEngine.pure";
import { afterEach, describe, expect, it, vi } from "vitest";

function withUnregisteredLoadingScreen(callback: () => void): void {
    const descriptor = Object.getOwnPropertyDescriptor(AbstractEngine.prototype, "hideLoadingUI");
    Object.defineProperty(AbstractEngine.prototype, "hideLoadingUI", {
        configurable: true,
        value: undefined,
        writable: true,
    });

    try {
        callback();
    } finally {
        if (descriptor) {
            Object.defineProperty(AbstractEngine.prototype, "hideLoadingUI", descriptor);
        } else {
            delete (AbstractEngine.prototype as { hideLoadingUI?: () => void }).hideLoadingUI;
        }
    }
}

describe("engine disposal without loading screen registration", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("disposes Engine when hideLoadingUI is not registered", () => {
        const engine = Object.assign(Object.create(Engine.prototype) as Engine, {
            _rescalePostProcess: null,
            _renderingCanvas: null,
        });
        vi.spyOn(ThinEngine.prototype, "dispose").mockImplementation(() => {});

        withUnregisteredLoadingScreen(() => {
            expect(() => engine.dispose()).not.toThrow();
        });
    });

    it("disposes WebGPUEngine when hideLoadingUI is not registered", () => {
        const engine = Object.assign(Object.create(WebGPUEngine.prototype) as WebGPUEngine, {
            _timestampQuery: { dispose: vi.fn() } as WebGPUEngine["_timestampQuery"],
            _mainTexture: null,
            _depthTexture: null,
            _textureHelper: { destroyDeferredTextures: vi.fn() } as unknown as WebGPUEngine["_textureHelper"],
            _bufferManager: { destroyDeferredBuffers: vi.fn() } as unknown as WebGPUEngine["_bufferManager"],
            _device: { destroy: vi.fn() } as unknown as GPUDevice,
            _renderingCanvas: null,
        });
        vi.spyOn(AbstractEngine.prototype, "dispose").mockImplementation(() => {});

        withUnregisteredLoadingScreen(() => {
            expect(() => engine.dispose()).not.toThrow();
        });
    });
});
