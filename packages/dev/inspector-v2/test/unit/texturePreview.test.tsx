/**
 * @vitest-environment jsdom
 */

import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { type BaseTexture } from "core/index";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const NativeMocks = vi.hoisted(() => ({
    whenReady: vi.fn(),
    getPixels: vi.fn(),
}));

vi.mock("core/Misc/textureTools", () => ({ WhenTextureReadyAsync: NativeMocks.whenReady }));
vi.mock("../../src/misc/textureTools", () => ({ ApplyChannelsToTextureDataAsync: NativeMocks.getPixels }));
vi.mock("../../src/hooks/compoundPropertyHooks", () => ({
    useProperty: (target: Record<string, unknown>, key: string) => target[key],
}));

import { TexturePreview } from "../../src/components/properties/textures/texturePreview";
import { TexturePreviewCore, type TexturePreviewCoreProps, type TexturePreviewPixels } from "../../src/components/properties/textures/texturePreviewCore";
import { ApplyTextureChannels } from "../../src/misc/textureChannels";

function Deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<T>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    return { promise, resolve, reject };
}

describe("texture channel display", () => {
    it.each([
        [{ R: true, G: false, B: false, A: false }, [12, 12, 12, 255]],
        [{ R: false, G: true, B: false, A: false }, [34, 34, 34, 255]],
        [{ R: false, G: false, B: true, A: false }, [56, 56, 56, 255]],
        [{ R: false, G: false, B: false, A: true }, [78, 78, 78, 255]],
        [{ R: true, G: true, B: true, A: true }, [12, 34, 56, 78]],
    ])("maps the selected channels without changing later pixels", (channels, expected) => {
        const pixels = new Uint8Array([12, 34, 56, 78, 1, 2, 3, 4]);
        ApplyTextureChannels(pixels, channels, 1);
        expect([...pixels]).toEqual([...expected, 1, 2, 3, 4]);
    });
});

describe("runtime-neutral texture preview", () => {
    let container: HTMLDivElement;
    let root: Root;
    let paint: ReturnType<typeof vi.fn>;
    let anchorClick: ReturnType<typeof vi.spyOn>;
    let getPixels: ReturnType<typeof vi.fn<TexturePreviewCoreProps["getPixelsAsync"]>>;
    let source: object;

    beforeEach(() => {
        vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
        vi.stubGlobal(
            "matchMedia",
            vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
        );
        vi.stubGlobal("NodeFilter", window.NodeFilter);
        vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:texture"), revokeObjectURL: vi.fn() });
        paint = vi.fn();
        vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
            createImageData: (width: number, height: number) => ({ data: new Uint8ClampedArray(width * height * 4) }),
            putImageData: paint,
        } as unknown as CanvasRenderingContext2D);
        vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback) => callback(new Blob(["png"], { type: "image/png" })));
        anchorClick = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
        source = {};
        getPixels = vi.fn(async () => ({ width: 2, height: 2, data: new Uint8Array([255, 0, 0, 255, 0, 255, 0, 128, 0, 0, 255, 255, 255, 255, 255, 0]) }));
        NativeMocks.whenReady.mockReset().mockResolvedValue(undefined);
        NativeMocks.getPixels.mockReset().mockImplementation(async (_texture, width: number, height: number) => new Uint8Array(width * height * 4));
        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        vi.useRealTimers();
    });

    async function Render(overrides: Partial<TexturePreviewCoreProps> = {}) {
        const props: TexturePreviewCoreProps = {
            source,
            kind: "2d",
            depth: 1,
            layerCount: 0,
            maxLod: 0,
            getPixelsAsync: getPixels,
            ...overrides,
        };
        await act(async () => {
            root.render(
                <FluentProvider theme={webLightTheme}>
                    <TexturePreviewCore {...props} />
                </FluentProvider>
            );
        });
    }

    function Button(label: string): HTMLButtonElement {
        const button = [...container.querySelectorAll("button")].find((candidate) => candidate.textContent?.trim() === label);
        expect(button).toBeDefined();
        return button!;
    }

    it("renders RGBA pixels, crops them, and passes channel selections to its adapter", async () => {
        await Render({ width: 1, height: 1, offsetX: 1, offsetY: 1 });
        const canvas = container.querySelector("canvas")!;
        expect([canvas.width, canvas.height]).toEqual([1, 1]);
        expect(paint).toHaveBeenLastCalledWith(expect.objectContaining({ data: expect.any(Uint8ClampedArray) }), -1, -1, 1, 1, 1, 1);
        expect([...paint.mock.calls.at(-1)![0].data]).toEqual([255, 0, 0, 255, 0, 255, 0, 128, 0, 0, 255, 255, 255, 255, 255, 0]);
        expect(Button("ALL").getAttribute("aria-pressed")).toBe("true");

        await act(async () => Button("R").click());
        expect(Button("R").getAttribute("aria-pressed")).toBe("true");
        expect(getPixels).toHaveBeenLastCalledWith({ face: 0, layer: 0, lod: 0, slice: 0, channels: { R: true, G: false, B: false, A: false } });
    });

    it("passes the selected cube face and mip level to its adapter", async () => {
        await Render({ kind: "cube", depth: 6, maxLod: 2 });
        await act(async () => Button("-Z").click());
        expect(Button("-Z").getAttribute("aria-pressed")).toBe("true");
        const lod = container.querySelector<HTMLInputElement>('input[aria-label="LOD"]')!;
        await act(async () => {
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(lod, "2");
            lod.dispatchEvent(new Event("input", { bubbles: true }));
        });
        expect(getPixels).toHaveBeenLastCalledWith(expect.objectContaining({ face: 5, lod: 2 }));
    });

    it("does not apply a hidden channel filter when switching from a 2D texture to a cube", async () => {
        await Render();
        await act(async () => Button("R").click());
        await Render({ source: {}, kind: "cube", depth: 6 });
        expect(getPixels).toHaveBeenLastCalledWith(expect.objectContaining({ channels: { R: true, G: true, B: true, A: true } }));
    });

    it("ignores an older readback that finishes after the selected channel changes", async () => {
        const first = Deferred<TexturePreviewPixels>();
        const second = Deferred<TexturePreviewPixels>();
        getPixels.mockReset().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
        await Render({ downloadFileName: "texture.png" });
        await act(async () => Button("G").click());
        expect(Button("Export Preview as PNG").disabled).toBe(true);

        await act(async () => second.resolve({ width: 1, height: 1, data: new Uint8Array([0, 255, 0, 255]) }));
        expect(Button("Export Preview as PNG").disabled).toBe(false);
        expect([...paint.mock.calls.at(-1)![0].data]).toEqual([0, 255, 0, 255]);
        await act(async () => first.resolve({ width: 1, height: 1, data: new Uint8Array([255, 0, 0, 255]) }));
        expect(paint).toHaveBeenCalledTimes(1);
    });

    it("marks the preview as busy and disables export while loading", async () => {
        const readback = Deferred<TexturePreviewPixels>();
        getPixels.mockReturnValueOnce(readback.promise);
        await Render({ downloadFileName: "texture.png" });
        const canvas = container.querySelector("canvas")!;
        expect(canvas.getAttribute("aria-busy")).toBe("true");
        expect(Button("Export Preview as PNG").disabled).toBe(true);

        await act(async () => readback.resolve({ width: 1, height: 1, data: new Uint8Array([255, 0, 0, 255]) }));
        expect(canvas.getAttribute("aria-busy")).toBe("false");
        expect(Button("Export Preview as PNG").disabled).toBe(false);
    });

    it("shows readback errors and lets a render target retry", async () => {
        getPixels.mockRejectedValueOnce(new Error("Unsupported texture format"));
        await Render({ refreshable: true, downloadFileName: "texture.png" });
        expect(container.querySelector('[role="alert"]')?.textContent).toContain("Unsupported texture format");
        expect(Button("Export Preview as PNG").disabled).toBe(true);
        await act(async () => Button("Refresh").click());
        expect(container.querySelector('[role="alert"]')).toBeNull();
        expect(Button("Export Preview as PNG").disabled).toBe(false);
    });

    it("exports the displayed canvas as PNG and releases its object URL", async () => {
        vi.useFakeTimers();
        await Render({ downloadFileName: "albedo.png" });
        await act(async () => Button("Export Preview as PNG").click());
        expect(HTMLCanvasElement.prototype.toBlob).toHaveBeenCalledWith(expect.any(Function), "image/png");
        expect(anchorClick.mock.instances[0]).toHaveProperty("download", "albedo.png");
        expect(document.querySelector("a")).toBeNull();
        vi.runAllTimers();
        expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:texture");
    });

    it("does not export an old texture if selection changes while encoding", async () => {
        let finishEncoding!: BlobCallback;
        vi.mocked(HTMLCanvasElement.prototype.toBlob).mockImplementation((callback) => {
            finishEncoding = callback;
        });
        await Render({ downloadFileName: "old.png" });
        await act(async () => Button("Export Preview as PNG").click());
        await Render({ source: {}, downloadFileName: "new.png" });
        await act(async () => finishEncoding(new Blob(["png"])));
        expect(anchorClick).not.toHaveBeenCalled();
    });

    it("reports PNG encoding failures", async () => {
        vi.mocked(HTMLCanvasElement.prototype.toBlob).mockImplementation((callback) => callback(null));
        await Render({ downloadFileName: "texture.png" });
        await act(async () => Button("Export Preview as PNG").click());
        expect(container.querySelector('[role="alert"]')?.textContent).toContain("PNG encoding failed");
        expect(anchorClick).not.toHaveBeenCalled();
    });

    it("keeps the Babylon.js adapter's readiness, size, face, and channel readback behavior", async () => {
        const texture = {
            _texture: { width: 4, height: 2, depth: 6, generateMipMaps: true, is3D: false },
            isCube: true,
            is2DArray: false,
            isRenderTarget: false,
            getSize: () => ({ width: 4, height: 2 }),
        } as unknown as BaseTexture;
        await act(async () => {
            root.render(
                <FluentProvider theme={webLightTheme}>
                    <TexturePreview texture={texture} />
                </FluentProvider>
            );
        });
        await act(async () => Button("-X").click());
        expect(NativeMocks.whenReady).toHaveBeenCalledWith(texture);
        expect(NativeMocks.getPixels).toHaveBeenLastCalledWith(texture, 4, 2, 1, { R: true, G: true, B: true, A: true }, 0, 0);
    });

    it.each([false, true])("renders a Babylon.js nonzero mip at its actual size (array: %s)", async (isArray) => {
        const texture = {
            _texture: { width: 4, height: 4, depth: isArray ? 2 : 1, generateMipMaps: true, is3D: false },
            isCube: false,
            is2DArray: isArray,
            isRenderTarget: false,
            getSize: () => ({ width: 4, height: 4 }),
        } as unknown as BaseTexture;
        await act(async () => {
            root.render(
                <FluentProvider theme={webLightTheme}>
                    <TexturePreview texture={texture} />
                </FluentProvider>
            );
        });
        const lod = container.querySelector<HTMLInputElement>('input[aria-label="LOD"]')!;
        await act(async () => {
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(lod, "1");
            lod.dispatchEvent(new Event("input", { bubbles: true }));
        });
        expect(NativeMocks.getPixels).toHaveBeenLastCalledWith(texture, 2, 2, 0, { R: true, G: true, B: true, A: true }, 1, 0);
        const canvas = container.querySelector("canvas")!;
        expect([canvas.width, canvas.height]).toEqual([2, 2]);
    });
});
