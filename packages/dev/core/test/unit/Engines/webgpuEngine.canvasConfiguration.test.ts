import { describe, expect, it, vi } from "vitest";

import { WebGPUEngine, type WebGPUEngineOptions } from "core/Engines/webgpuEngine.pure";
import * as WebGPUConstants from "core/Engines/WebGPU/webgpuConstants";

interface CanvasConfigurationEngine {
    _configureContext(): void;
    _context: Pick<GPUCanvasContext, "configure">;
    _device: object;
    _options: WebGPUEngineOptions;
    premultipliedAlpha: boolean;
}

function ConfigureContext(options: WebGPUEngineOptions = {}, premultipliedAlpha = false) {
    const configure = vi.fn<(configuration: GPUCanvasConfiguration) => void>();
    const engine = Object.assign(Object.create(WebGPUEngine.prototype) as CanvasConfigurationEngine, {
        _context: { configure },
        _device: {},
        _options: { swapChainFormat: "bgra8unorm", ...options },
        premultipliedAlpha,
    });

    engine._configureContext();

    return { configure, engine };
}

describe("WebGPUEngine canvas configuration", () => {
    it("leaves presentation settings undefined to preserve browser defaults", () => {
        const { configure, engine } = ConfigureContext();

        expect(configure).toHaveBeenCalledExactlyOnceWith({
            device: engine._device,
            format: "bgra8unorm",
            usage: WebGPUConstants.TextureUsage.RenderAttachment | WebGPUConstants.TextureUsage.CopySrc,
            alphaMode: "opaque",
            toneMapping: undefined,
            colorSpace: undefined,
        });
    });

    it("forwards HDR and wide-gamut presentation settings with the requested swap chain format", () => {
        const toneMapping: GPUCanvasToneMapping = { mode: "extended" };
        const { configure, engine } = ConfigureContext({ swapChainFormat: "rgba16float", canvasToneMapping: toneMapping, canvasColorSpace: "display-p3" }, true);

        expect(configure).toHaveBeenCalledExactlyOnceWith({
            device: engine._device,
            format: "rgba16float",
            usage: WebGPUConstants.TextureUsage.RenderAttachment | WebGPUConstants.TextureUsage.CopySrc,
            alphaMode: "premultiplied",
            toneMapping,
            colorSpace: "display-p3",
        });
    });

    it.each(["srgb", "display-p3"] as const)("allows %s output without changing tone mapping or the swap chain format", (colorSpace) => {
        const { configure } = ConfigureContext({ canvasColorSpace: colorSpace });

        expect(configure).toHaveBeenCalledWith(expect.objectContaining({ format: "bgra8unorm", colorSpace, toneMapping: undefined }));
    });

    it.each(["standard", "extended"] as const)("allows %s tone mapping without selecting a color space", (mode) => {
        const { configure } = ConfigureContext({ swapChainFormat: "rgba16float", canvasToneMapping: { mode } });

        expect(configure).toHaveBeenCalledWith(expect.objectContaining({ format: "rgba16float", toneMapping: { mode }, colorSpace: undefined }));
    });

    it("forwards an empty tone mapping dictionary so the browser selects its default mode", () => {
        const { configure } = ConfigureContext({ canvasToneMapping: {} });

        expect(configure).toHaveBeenCalledWith(expect.objectContaining({ toneMapping: {}, colorSpace: undefined }));
    });

    it("retains presentation settings when the context is configured again", () => {
        const { configure, engine } = ConfigureContext({ canvasToneMapping: { mode: "extended" }, canvasColorSpace: "display-p3" });

        engine._configureContext();

        expect(configure).toHaveBeenCalledTimes(2);
        expect(configure.mock.calls[1][0]).toEqual(configure.mock.calls[0][0]);
    });
});
