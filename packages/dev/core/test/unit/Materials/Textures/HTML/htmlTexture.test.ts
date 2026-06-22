/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { type Engine, NullEngine } from "core/Engines";
import { HtmlTexture, IsHtmlInCanvasUploadSupported, UploadHtmlElementToTexture } from "core/Materials";
import { InternalTexture, InternalTextureSource } from "core/Materials/Textures/internalTexture";
import { Scene } from "core/scene";

describe("HtmlTexture", () => {
    let engine: Engine;
    let scene: Scene;
    let element: HTMLDivElement;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(engine);
        element = document.createElement("div");
        element.textContent = "Hello HTML texture";
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
        document.body.innerHTML = "";
    });

    it("reports the correct class name", () => {
        const texture = new HtmlTexture("html", element, { scene });
        expect(texture.getClassName()).toBe("HtmlTexture");
        texture.dispose();
    });

    it("hosts the element inside a hidden layoutsubtree canvas attached to the document", () => {
        const texture = new HtmlTexture("html", element, { scene });

        expect(texture.hostCanvas).not.toBeNull();
        const host = texture.hostCanvas!;
        expect(host.layoutSubtree).toBe(true);
        expect(host.parentElement).toBe(document.body);
        expect(element.parentElement).toBe(host);
        expect(host.style.position).toBe("absolute");

        texture.dispose();
    });

    it("uses the provided width and height", () => {
        const texture = new HtmlTexture("html", element, { scene, width: 128, height: 64 });
        expect(texture.hostCanvas!.width).toBe(128);
        expect(texture.hostCanvas!.height).toBe(64);
        texture.dispose();
    });

    it("falls back to a 256x256 size when no size is provided and the element has no layout", () => {
        const texture = new HtmlTexture("html", element, { scene });
        expect(texture.hostCanvas!.width).toBe(256);
        expect(texture.hostCanvas!.height).toBe(256);
        texture.dispose();
    });

    it("updates without throwing when the WICG API is unavailable", () => {
        const texture = new HtmlTexture("html", element, { scene, autoUpdate: false });
        expect(() => texture.update()).not.toThrow();
        texture.dispose();
    });

    it("refreshes on paint events when auto-update is enabled", () => {
        const texture = new HtmlTexture("html", element, { scene, autoUpdate: true });
        const spy = vi.spyOn(texture, "update");

        texture.hostCanvas!.dispatchEvent(new Event("paint"));

        expect(spy).toHaveBeenCalled();
        texture.dispose();
    });

    it("renders once on the first paint then stops when auto-update is disabled", () => {
        const texture = new HtmlTexture("html", element, { scene, autoUpdate: false });
        const spy = vi.spyOn(texture, "update");

        texture.hostCanvas!.dispatchEvent(new Event("paint"));
        texture.hostCanvas!.dispatchEvent(new Event("paint"));

        // The first paint provides the initial snapshot (one-shot), the handler then detaches.
        expect(spy).toHaveBeenCalledTimes(1);
        texture.dispose();
    });

    it("removes the host canvas from the document on dispose", () => {
        const texture = new HtmlTexture("html", element, { scene });
        const host = texture.hostCanvas!;
        expect(host.parentElement).toBe(document.body);

        texture.dispose();

        expect(host.parentElement).toBeNull();
    });

    it("returns gracefully when no engine or scene is provided", () => {
        const texture = new HtmlTexture("html", element, {});
        expect(texture.hostCanvas).toBeNull();
        expect(() => texture.update()).not.toThrow();
        texture.dispose();
    });

    it("UploadHtmlElementToTexture returns false when texElementImage2D is unavailable", () => {
        const internal = new InternalTexture(engine, InternalTextureSource.Dynamic);
        // NullEngine has no WebGL context, so the WICG API is unavailable.
        expect(UploadHtmlElementToTexture(engine, internal, element)).toBe(false);
        expect(internal.isReady).toBe(false);
    });

    it("UploadHtmlElementToTexture returns false for a null texture", () => {
        expect(UploadHtmlElementToTexture(engine, null, element)).toBe(false);
    });

    it("UploadHtmlElementToTexture uploads through GPUQueue.copyElementImageToTexture on WebGPU", () => {
        const copySpy = vi.fn();
        const gpuTexture = {};
        const webgpuEngine = {
            isWebGPU: true,
            _device: { queue: { copyElementImageToTexture: copySpy } },
            _generateMipmaps: vi.fn(),
        } as unknown as Engine;

        const internal = new InternalTexture(engine, InternalTextureSource.Dynamic);
        internal.width = 64;
        internal.height = 32;
        (internal as any)._hardwareTexture = { underlyingResource: gpuTexture };

        expect(UploadHtmlElementToTexture(webgpuEngine, internal, element)).toBe(true);
        expect(copySpy).toHaveBeenCalledTimes(1);

        const [source, destination] = copySpy.mock.calls[0];
        expect(source.source).toBe(element);
        expect(destination.destination.texture).toBe(gpuTexture);
        expect(destination.width).toBe(64);
        expect(destination.height).toBe(32);
        expect(internal.isReady).toBe(true);
    });

    it("UploadHtmlElementToTexture returns false on WebGPU when copyElementImageToTexture is unavailable", () => {
        const webgpuEngine = {
            isWebGPU: true,
            _device: { queue: {} },
        } as unknown as Engine;

        const internal = new InternalTexture(engine, InternalTextureSource.Dynamic);
        (internal as any)._hardwareTexture = { underlyingResource: {} };

        expect(UploadHtmlElementToTexture(webgpuEngine, internal, element)).toBe(false);
        expect(internal.isReady).toBe(false);
    });

    it("IsHtmlInCanvasUploadSupported reports false when no native API is present", () => {
        // NullEngine has neither a WebGL context nor a WebGPU device.
        expect(IsHtmlInCanvasUploadSupported(engine)).toBe(false);
    });

    it("IsHtmlInCanvasUploadSupported detects the WebGL and WebGPU native APIs", () => {
        const webglEngine = {
            isWebGPU: false,
            _gl: { texElementImage2D: () => {} },
        } as unknown as Engine;
        expect(IsHtmlInCanvasUploadSupported(webglEngine)).toBe(true);

        const webgpuEngine = {
            isWebGPU: true,
            _device: { queue: { copyElementImageToTexture: () => {} } },
        } as unknown as Engine;
        expect(IsHtmlInCanvasUploadSupported(webgpuEngine)).toBe(true);

        const unsupportedWebgpu = {
            isWebGPU: true,
            _device: { queue: {} },
        } as unknown as Engine;
        expect(IsHtmlInCanvasUploadSupported(unsupportedWebgpu)).toBe(false);
    });

    it("does not permanently disable the texture when the native upload throws before the first snapshot", () => {
        const webglEngine = {
            isWebGPU: false,
            _gl: {
                TEXTURE_2D: 0x0de1,
                texElementImage2D: () => {
                    throw new Error("no snapshot recorded yet");
                },
                generateMipmap: vi.fn(),
            },
            _getInternalFormat: () => 0x1908,
            _getRGBABufferInternalSizedFormat: () => 0x8058,
            _getWebGLTextureType: () => 0x1401,
            _bindTextureDirectly: vi.fn().mockReturnValue(false),
            _unpackFlipY: vi.fn(),
        } as unknown as Engine;

        const internal = new InternalTexture(engine, InternalTextureSource.Dynamic);

        expect(UploadHtmlElementToTexture(webglEngine, internal, element)).toBe(false);
        // The transient failure must not disable the texture, otherwise later paint-driven updates short-circuit.
        expect(internal._isDisabled).toBeFalsy();

        // A subsequent successful upload must still work.
        (webglEngine as any)._gl.texElementImage2D = vi.fn();
        expect(UploadHtmlElementToTexture(webglEngine, internal, element)).toBe(true);
        expect(internal.isReady).toBe(true);
    });

    it("renders through the SVG fallback when the native API is unavailable", () => {
        class FakeImage {
            public onload: (() => void) | null = null;
            public onerror: (() => void) | null = null;
            private _src = "";
            public get src() {
                return this._src;
            }
            public set src(value: string) {
                this._src = value;
                this.onload?.();
            }
        }
        vi.stubGlobal("Image", FakeImage);
        const updateSpy = vi.spyOn(engine, "updateDynamicTexture").mockImplementation((tex) => {
            if (tex) {
                tex.isReady = true;
            }
        });

        // Construction triggers the initial update, which routes through the SVG fallback on NullEngine.
        const texture = new HtmlTexture("html", element, { scene });

        expect(updateSpy).toHaveBeenCalled();
        const uploadedImage = updateSpy.mock.calls[0][1] as unknown as FakeImage;
        expect(uploadedImage.src).toContain("data:image/svg+xml");

        texture.dispose();
        vi.unstubAllGlobals();
    });

    it("does not use the SVG fallback when it is disabled", () => {
        const updateSpy = vi.spyOn(engine, "updateDynamicTexture");
        const texture = new HtmlTexture("html", element, { scene, useSvgFallback: false });

        // With the fallback disabled and no native API, no dynamic texture upload happens.
        expect(updateSpy).not.toHaveBeenCalled();
        texture.dispose();
    });
});
