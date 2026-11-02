/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Engine, NullEngine } from "core/Engines";
import { HtmlTexture, IsHtmlInCanvasUploadSupported, UploadHtmlElementToTexture } from "core/Materials";
import { InternalTexture, InternalTextureSource } from "core/Materials/Textures/internalTexture";
import { Scene } from "core/scene";
import { Constants } from "core/Engines/constants";
import { InstallHtmlInCanvasPolyfill, UninstallHtmlInCanvasPolyfill } from "core/Materials/Textures/HTML/htmlInCanvasPolyfill";
import { type WebGPUEngine } from "core/Engines/webgpuEngine";

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
        UninstallHtmlInCanvasPolyfill();
        scene.dispose();
        engine.dispose();
        document.body.innerHTML = "";
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    function mockSvgUpload() {
        vi.stubGlobal(
            "Image",
            class {
                public onload: (() => void) | null = null;
                public set src(_value: string) {
                    this.onload?.();
                }
            }
        );
        return vi.spyOn(engine, "updateDynamicTexture").mockImplementation((texture) => {
            if (texture) {
                texture.isReady = true;
            }
        });
    }

    it("reports the correct class name", () => {
        const texture = new HtmlTexture("html", element, { scene });
        expect(texture.getClassName()).toBe("HtmlTexture");
        texture.dispose();
    });

    it("hosts the element inside a hidden helper element attached to the document", () => {
        const texture = new HtmlTexture("html", element, { scene });

        expect(texture.host).not.toBeNull();
        const host = texture.host!;
        expect(host.parentElement).toBe(document.body);
        expect(element.parentElement).toBe(host);
        expect(host.style.position).toBe("absolute");

        texture.dispose();
    });

    it("uses the provided width and height", () => {
        const texture = new HtmlTexture("html", element, { scene, width: 128, height: 64 });
        expect(texture.getSize().width).toBe(128);
        expect(texture.getSize().height).toBe(64);
        texture.dispose();
    });

    it("falls back to a 256x256 size when no size is provided and the element has no layout", () => {
        const texture = new HtmlTexture("html", element, { scene });
        expect(texture.getSize().width).toBe(256);
        expect(texture.getSize().height).toBe(256);
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

        texture.host!.dispatchEvent(new Event("paint"));

        expect(spy).toHaveBeenCalled();
        texture.dispose();
    });

    it("renders once on the first paint then stops when auto-update is disabled", () => {
        const texture = new HtmlTexture("html", element, { scene, autoUpdate: false });
        const spy = vi.spyOn(texture, "update");

        texture.host!.dispatchEvent(new Event("paint"));
        texture.host!.dispatchEvent(new Event("paint"));

        // Unrequested paints after the initial snapshot must not refresh a static texture.
        expect(spy).toHaveBeenCalledTimes(1);
        texture.dispose();
    });

    it("only refreshes when its own element is among the paint event's changed elements", () => {
        const texture = new HtmlTexture("html", element, { scene, autoUpdate: true });
        const spy = vi.spyOn(texture, "update");

        // A paint caused by an unrelated element on the shared canvas must not trigger an upload.
        const otherElement = document.createElement("div");
        const unrelatedPaint = new Event("paint") as Event & { changedElements: readonly Element[] };
        unrelatedPaint.changedElements = [otherElement];
        texture.host!.dispatchEvent(unrelatedPaint);
        expect(spy).not.toHaveBeenCalled();

        // A paint that lists this texture's element (or a descendant) does trigger an upload.
        const child = document.createElement("span");
        element.appendChild(child);
        const relevantPaint = new Event("paint") as Event & { changedElements: readonly Element[] };
        relevantPaint.changedElements = [child];
        texture.host!.dispatchEvent(relevantPaint);
        expect(spy).toHaveBeenCalledTimes(1);

        texture.dispose();
    });

    it("removes the helper host from the document on dispose", () => {
        const texture = new HtmlTexture("html", element, { scene });
        const host = texture.host!;
        expect(host.parentElement).toBe(document.body);

        texture.dispose();

        expect(host.parentElement).toBeNull();
    });

    it("returns gracefully when no engine or scene is provided", () => {
        const texture = new HtmlTexture("html", element, {});
        expect(texture.host).toBeNull();
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

    it("detects the current WebGL and WebGPU upload APIs without the legacy names", () => {
        expect(
            IsHtmlInCanvasUploadSupported({
                isWebGPU: false,
                _gl: { texElementSubImage2D: vi.fn() },
            } as unknown as Engine)
        ).toBe(true);
        expect(
            IsHtmlInCanvasUploadSupported({
                isWebGPU: true,
                _device: { queue: { drawElementImageToTexture: vi.fn() } },
            } as unknown as Engine)
        ).toBe(true);
    });

    it.each([true, false])("uses SVG immediately when requestPaint exists but native upload is unavailable (autoUpdate: %s)", (autoUpdate) => {
        const canvas = document.createElement("canvas");
        canvas.requestPaint = vi.fn();
        vi.spyOn(engine, "getRenderingCanvas").mockReturnValue(canvas);
        const upload = mockSvgUpload();

        const texture = new HtmlTexture("html", element, { scene, autoUpdate });

        expect(upload).toHaveBeenCalledTimes(1);
        expect(canvas.requestPaint).not.toHaveBeenCalled();
        expect(texture.isReady()).toBe(true);

        element.textContent = "Updated HTML";
        texture.requestUpdate();
        expect(upload).toHaveBeenCalledTimes(2);
        texture.dispose();
    });

    it("attempts an immediate update when requestPaint exists and SVG fallback is disabled", () => {
        const canvas = document.createElement("canvas");
        canvas.requestPaint = vi.fn();
        vi.spyOn(engine, "getRenderingCanvas").mockReturnValue(canvas);
        const update = vi.spyOn(HtmlTexture.prototype, "update");
        const upload = vi.spyOn(engine, "updateDynamicTexture");

        const texture = new HtmlTexture("html", element, { scene, useSvgFallback: false });

        expect(update).toHaveBeenCalledTimes(1);
        expect(upload).not.toHaveBeenCalled();
        expect(canvas.requestPaint).not.toHaveBeenCalled();
        texture.dispose();
    });

    it("opts into current canvas layout and restores the source's drawable attribute on disposal", () => {
        const canvas = document.createElement("canvas");
        canvas.content = "fallback";
        vi.spyOn(engine, "getRenderingCanvas").mockReturnValue(canvas);
        mockSvgUpload();

        const texture = new HtmlTexture("html", element, { scene });

        expect(canvas.content).toBe("drawable");
        expect(element.hasAttribute("drawable")).toBe(true);
        texture.dispose();
        expect(element.hasAttribute("drawable")).toBe(false);

        element.setAttribute("drawable", "drawable");
        const alreadyDrawable = new HtmlTexture("html", element, { scene });
        expect(element.getAttribute("drawable")).toBe("drawable");
        alreadyDrawable.dispose();
        expect(element.getAttribute("drawable")).toBe("drawable");
    });

    it("keeps the legacy polyfill paint opt-in when canvas.content also exists", async () => {
        const canvas = document.createElement("canvas");
        canvas.content = "fallback";
        Object.defineProperty(canvas, "layoutSubtree", {
            get: () => canvas.hasAttribute("layoutsubtree"),
            set: (value: boolean) => canvas.toggleAttribute("layoutsubtree", value),
        });
        canvas.requestPaint = vi.fn(() => {
            if (canvas.hasAttribute("layoutsubtree")) {
                canvas.dispatchEvent(new Event("paint"));
            }
        });
        vi.spyOn(engine, "getRenderingCanvas").mockReturnValue(canvas);
        Object.defineProperty(engine, "_gl", { value: { texElementImage2D: vi.fn() } });
        const update = vi.spyOn(HtmlTexture.prototype, "update").mockImplementation(() => {});
        const removeChild = vi.spyOn(canvas, "removeChild");
        await InstallHtmlInCanvasPolyfill({ force: true, polyfillModule: { installHtmlInCanvasPolyfill: vi.fn() } });

        const texture = new HtmlTexture("html", element, { scene, autoUpdate: false });
        expect(canvas.hasAttribute("layoutsubtree")).toBe(true);
        expect(canvas.content).toBe("fallback");
        expect(update).toHaveBeenCalledTimes(1);
        texture.requestUpdate();
        expect(update).toHaveBeenCalledTimes(2);
        texture.dispose();
        expect(removeChild).toHaveBeenCalledWith(element);
    });

    it("keeps using layoutSubtree on legacy canvas implementations", () => {
        const canvas = document.createElement("canvas");
        vi.spyOn(engine, "getRenderingCanvas").mockReturnValue(canvas);
        mockSvgUpload();

        const texture = new HtmlTexture("html", element, { scene });

        expect(canvas.layoutSubtree).toBe(true);
        expect(element.hasAttribute("drawable")).toBe(false);
        texture.dispose();
    });

    it.each([true, false])("honors explicit native requests with empty changedElements (autoUpdate: %s)", (autoUpdate) => {
        const canvas = document.createElement("canvas");
        canvas.content = "fallback";
        canvas.requestPaint = vi.fn();
        vi.spyOn(engine, "getRenderingCanvas").mockReturnValue(canvas);
        Object.defineProperty(engine, "_gl", { value: { texElementSubImage2D: vi.fn() } });
        const update = vi.spyOn(HtmlTexture.prototype, "update").mockImplementation(() => {});

        const texture = new HtmlTexture("html", element, { scene, autoUpdate });
        expect(canvas.requestPaint).toHaveBeenCalledTimes(1);
        expect(update).not.toHaveBeenCalled();

        const paint = new Event("paint") as PaintEvent;
        Object.defineProperty(paint, "changedElements", { value: [] });
        canvas.dispatchEvent(paint);
        expect(update).toHaveBeenCalledTimes(1);

        canvas.dispatchEvent(paint);
        expect(update).toHaveBeenCalledTimes(1);

        texture.requestUpdate();
        canvas.dispatchEvent(paint);
        expect(update).toHaveBeenCalledTimes(2);

        texture.requestUpdate();
        texture.dispose();
        canvas.dispatchEvent(paint);
        expect(update).toHaveBeenCalledTimes(2);
    });

    it("allocates WebGL storage once and prefers the current subimage upload API", () => {
        const gl = {
            TEXTURE_2D: 0x0de1,
            texImage2D: vi.fn(),
            texElementSubImage2D: vi.fn(),
            texElementImage2D: vi.fn(),
            generateMipmap: vi.fn(),
        };
        const webglEngine = {
            isWebGPU: false,
            _gl: gl,
            _getRGBABufferInternalSizedFormat: () => 0x8058,
            _getInternalFormat: () => 0x1908,
            _getWebGLTextureType: () => 0x1401,
            _bindTextureDirectly: vi.fn().mockReturnValue(false),
            _unpackFlipY: vi.fn(),
        } as unknown as Engine;
        const internal = new InternalTexture(engine, InternalTextureSource.Dynamic);
        internal.width = 64;
        internal.height = 32;
        internal.generateMipMaps = true;

        expect(UploadHtmlElementToTexture(webglEngine, internal, element)).toBe(true);
        expect(gl.texImage2D).toHaveBeenCalledWith(gl.TEXTURE_2D, 0, 0x8058, 64, 32, 0, 0x1908, 0x1401, null);
        expect(gl.texElementSubImage2D).toHaveBeenCalledWith(gl.TEXTURE_2D, 0, 0, 0, element, expect.objectContaining({ width: 64, height: 32 }));
        expect(gl.texElementImage2D).not.toHaveBeenCalled();
        expect(internal.isReady).toBe(true);

        const config = { sx: 2, sy: 3, swidth: 4, sheight: 5, width: 16, height: 8 };
        expect(UploadHtmlElementToTexture(webglEngine, internal, element, false, config)).toBe(true);
        expect(gl.texImage2D).toHaveBeenCalledTimes(1);
        expect(gl.texElementSubImage2D).toHaveBeenLastCalledWith(gl.TEXTURE_2D, 0, 0, 0, element, config);
        expect(gl.generateMipmap).toHaveBeenCalledTimes(2);
        expect(internal.invertY).toBe(false);
        expect(webglEngine._bindTextureDirectly).toHaveBeenLastCalledWith(gl.TEXTURE_2D, null);

        internal.dispose();
    });

    it.each([
        { format: Constants.TEXTUREFORMAT_RGB, internalFormat: 0x8051, glFormat: 0x1907 },
        { format: Constants.TEXTUREFORMAT_RGBA, internalFormat: 0x8058, glFormat: 0x1908 },
        { format: Constants.TEXTUREFORMAT_RED, internalFormat: 0x8229, glFormat: 0x1903 },
        { format: Constants.TEXTUREFORMAT_RG, internalFormat: 0x822b, glFormat: 0x8227 },
    ])("normalizes an unset type when allocating WebGL format $format", ({ format, internalFormat, glFormat }) => {
        const gl = {
            TEXTURE_2D: 0x0de1,
            RGB: 0x1907,
            RGB8: 0x8051,
            RGBA: 0x1908,
            RGBA8: 0x8058,
            RED: 0x1903,
            R8: 0x8229,
            RG: 0x8227,
            RG8: 0x822b,
            UNSIGNED_BYTE: 0x1401,
            texImage2D: vi.fn(),
            texElementSubImage2D: vi.fn(),
        };
        const webglEngine = {
            isWebGPU: false,
            _webGLVersion: 2,
            _gl: gl,
            _getRGBABufferInternalSizedFormat: Engine.prototype._getRGBABufferInternalSizedFormat,
            _getInternalFormat: Engine.prototype._getInternalFormat,
            _getWebGLTextureType: Engine.prototype._getWebGLTextureType,
            _bindTextureDirectly: vi.fn().mockReturnValue(false),
            _unpackFlipY: vi.fn(),
        } as unknown as Engine;
        const internal = new InternalTexture(engine, InternalTextureSource.Dynamic);
        internal.width = 64;
        internal.height = 32;
        internal.format = format;
        expect(internal.type).toBe(-1);

        expect(UploadHtmlElementToTexture(webglEngine, internal, element)).toBe(true);
        expect(gl.texImage2D).toHaveBeenCalledWith(gl.TEXTURE_2D, 0, internalFormat, 64, 32, 0, glFormat, gl.UNSIGNED_BYTE, null);
        internal.dispose();
    });

    it("uses the installed legacy WebGL polyfill instead of a remaining native upload API", async () => {
        const currentUpload = vi.fn();
        const legacyUpload = vi.fn();
        const webglEngine = {
            isWebGPU: false,
            _gl: { TEXTURE_2D: 0x0de1, texElementSubImage2D: currentUpload, texElementImage2D: legacyUpload },
            _getRGBABufferInternalSizedFormat: () => 0x8058,
            _bindTextureDirectly: vi.fn().mockReturnValue(false),
            _unpackFlipY: vi.fn(),
        } as unknown as Engine;
        const internal = new InternalTexture(engine, InternalTextureSource.Dynamic);
        await InstallHtmlInCanvasPolyfill({ force: true, polyfillModule: { installHtmlInCanvasPolyfill: vi.fn() } });

        expect(UploadHtmlElementToTexture(webglEngine, internal, element)).toBe(true);
        expect(legacyUpload).toHaveBeenCalledTimes(1);
        expect(currentUpload).not.toHaveBeenCalled();
        internal.dispose();
    });

    it("uses the installed WebGPU polyfill's element overload instead of the remaining native API", async () => {
        const currentUpload = vi.fn();
        const legacyUpload = vi.fn();
        const gpuTexture = {};
        const webgpuEngine = {
            isWebGPU: true,
            _device: { queue: { drawElementImageToTexture: currentUpload, copyElementImageToTexture: legacyUpload } },
        } as unknown as Engine;
        const internal = new InternalTexture(engine, InternalTextureSource.Dynamic);
        internal.width = 64;
        internal.height = 32;
        Object.defineProperty(internal, "_hardwareTexture", { value: { underlyingResource: gpuTexture } });
        await InstallHtmlInCanvasPolyfill({ force: true, polyfillModule: { installHtmlInCanvasPolyfill: vi.fn() } });

        expect(UploadHtmlElementToTexture(webgpuEngine, internal, element)).toBe(true);
        expect(legacyUpload).toHaveBeenCalledWith(element, 64, 32, { texture: gpuTexture });
        expect(currentUpload).not.toHaveBeenCalled();
    });

    it.each([true, false])("preserves WebGL binding state and permits retry after a current-API failure (previously bound: %s)", (wasPreviouslyBound) => {
        const gl = {
            TEXTURE_2D: 0x0de1,
            texImage2D: vi.fn(),
            texElementSubImage2D: vi.fn().mockImplementationOnce(() => {
                throw new Error("no snapshot recorded yet");
            }),
        };
        const webglEngine = {
            isWebGPU: false,
            _gl: gl,
            _getRGBABufferInternalSizedFormat: () => 0x8058,
            _getInternalFormat: () => 0x1908,
            _getWebGLTextureType: () => 0x1401,
            _bindTextureDirectly: vi.fn().mockReturnValue(wasPreviouslyBound),
            _unpackFlipY: vi.fn(),
        } as unknown as Engine;
        const internal = new InternalTexture(engine, InternalTextureSource.Dynamic);
        internal.width = 64;
        internal.height = 32;

        expect(UploadHtmlElementToTexture(webglEngine, internal, element)).toBe(false);
        expect(internal.isReady).toBe(false);
        expect(internal._isDisabled).toBeFalsy();
        expect(webglEngine._bindTextureDirectly).toHaveBeenCalledTimes(wasPreviouslyBound ? 1 : 2);
        expect(webglEngine._bindTextureDirectly).toHaveBeenLastCalledWith(...(wasPreviouslyBound ? [gl.TEXTURE_2D, internal, true] : [gl.TEXTURE_2D, null]));

        expect(UploadHtmlElementToTexture(webglEngine, internal, element)).toBe(true);
        expect(internal.isReady).toBe(true);
        internal.dispose();
    });

    it("uploads through the current WebGPU API with its descriptors and permits retry after a transient failure", () => {
        const draw = vi.fn().mockImplementationOnce(() => {
            throw new Error("no snapshot recorded yet");
        });
        const legacyCopy = vi.fn();
        const gpuTexture = {};
        const webgpuEngine = {
            isWebGPU: true,
            _device: { queue: { drawElementImageToTexture: draw, copyElementImageToTexture: legacyCopy } },
            _generateMipmaps: vi.fn(),
        } as unknown as WebGPUEngine;
        const internal = new InternalTexture(engine, InternalTextureSource.Dynamic);
        internal.width = 64;
        internal.height = 32;
        internal.generateMipMaps = true;
        Object.defineProperty(internal, "_hardwareTexture", { value: { underlyingResource: gpuTexture } });

        expect(UploadHtmlElementToTexture(webgpuEngine, internal, element)).toBe(false);
        expect(internal.isReady).toBe(false);
        expect(internal._isDisabled).toBeFalsy();
        expect(UploadHtmlElementToTexture(webgpuEngine, internal, element)).toBe(true);
        expect(draw).toHaveBeenCalledWith({ source: element }, { texture: gpuTexture, size: { width: 64, height: 32 } });
        expect(legacyCopy).not.toHaveBeenCalled();
        expect(internal.isReady).toBe(true);
        expect(webgpuEngine._generateMipmaps).toHaveBeenCalledTimes(1);

        const config = { sx: 2, sy: 3, swidth: 4, sheight: 5, width: 16, height: 8 };
        expect(UploadHtmlElementToTexture(webgpuEngine, internal, element, false, config)).toBe(true);
        expect(draw).toHaveBeenLastCalledWith(
            { source: element, sourceX: 2, sourceY: 3, sourceWidth: 4, sourceHeight: 5 },
            { texture: gpuTexture, size: { width: 16, height: 8 } }
        );
        expect(internal.invertY).toBe(false);
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
            _getRGBABufferInternalSizedFormat: () => 0x8058,
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

    it("falls back to the legacy signature when the three-html-render polyfill rejects the new form", () => {
        // The three-html-render polyfill implements only the legacy texImage2D-shaped overload and rejects
        // the 4-argument spec form with a different wrong-arity message than native ("unexpected argument count N").
        const legacyCalls: unknown[][] = [];
        const webglEngine = {
            isWebGPU: false,
            _gl: {
                TEXTURE_2D: 0x0de1,
                RGBA: 0x1908,
                UNSIGNED_BYTE: 0x1401,
                texElementImage2D: (...args: unknown[]) => {
                    if (args.length < 6) {
                        throw new TypeError("texElementImage2D: unexpected argument count 4");
                    }
                    legacyCalls.push(args);
                },
                generateMipmap: vi.fn(),
            },
            _getRGBABufferInternalSizedFormat: () => 0x8058, // RGBA8
            _bindTextureDirectly: vi.fn().mockReturnValue(false),
            _unpackFlipY: vi.fn(),
        } as unknown as Engine;

        const internal = new InternalTexture(engine, InternalTextureSource.Dynamic);

        expect(UploadHtmlElementToTexture(webglEngine, internal, element)).toBe(true);
        expect(internal.isReady).toBe(true);
        expect(legacyCalls).toHaveLength(1);

        // Legacy overload: (target, level, internalformat, format, type, element).
        const [target, level, internalformat, format, type, el] = legacyCalls[0];
        expect(target).toBe(0x0de1);
        expect(level).toBe(0);
        expect(internalformat).toBe(0x8058);
        expect(format).toBe(0x1908);
        expect(type).toBe(0x1401);
        expect(el).toBe(element);
    });

    it("falls back to the legacy 6-argument texElementImage2D signature when the new form is rejected", () => {
        // Older Chrome builds (e.g. stable, behind the flag) still ship the texImage2D-shaped overload
        // and reject the current 4-argument spec form with a wrong-arity TypeError.
        const legacyCalls: unknown[][] = [];
        const webglEngine = {
            isWebGPU: false,
            _gl: {
                TEXTURE_2D: 0x0de1,
                RGBA: 0x1908,
                UNSIGNED_BYTE: 0x1401,
                texElementImage2D: (...args: unknown[]) => {
                    if (args.length < 6) {
                        throw new TypeError("Failed to execute 'texElementImage2D' on 'WebGL2RenderingContext': 6 arguments required, but only 4 present.");
                    }
                    legacyCalls.push(args);
                },
                generateMipmap: vi.fn(),
            },
            _getRGBABufferInternalSizedFormat: () => 0x8058, // RGBA8
            _bindTextureDirectly: vi.fn().mockReturnValue(false),
            _unpackFlipY: vi.fn(),
        } as unknown as Engine;

        const internal = new InternalTexture(engine, InternalTextureSource.Dynamic);

        expect(UploadHtmlElementToTexture(webglEngine, internal, element)).toBe(true);
        expect(internal.isReady).toBe(true);
        expect(legacyCalls).toHaveLength(1);

        // Legacy overload: (target, level, internalformat, format, type, element).
        const [target, level, internalformat, format, type, el] = legacyCalls[0];
        expect(target).toBe(0x0de1);
        expect(level).toBe(0);
        expect(internalformat).toBe(0x8058);
        expect(format).toBe(0x1908);
        expect(type).toBe(0x1401);
        expect(el).toBe(element);
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
