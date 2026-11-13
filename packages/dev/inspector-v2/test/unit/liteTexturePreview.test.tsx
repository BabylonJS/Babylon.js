/**
 * @vitest-environment jsdom
 */

import { act, type FunctionComponent } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { type CubeTexture, type EngineContext, type Texture2D, type TextureReadbackInfo } from "@babylonjs/lite";
import { Observable } from "core/Misc/observable";

import { type TexturePreviewCoreProps, type TexturePreviewSelection } from "../../src/components/properties/textures/texturePreviewCore";
import { type ISceneResourceIndexService } from "../../src/lite/services/panes/scene/sceneResourceIndexService";

const PreviewMocks = vi.hoisted(() => ({
    getInfo: vi.fn(),
    getMetadata: vi.fn(),
    readPixels: vi.fn(),
    render: vi.fn(),
}));

vi.mock("@babylonjs/lite", () => ({
    getTextureReadbackInfo: PreviewMocks.getInfo,
    getTextureMetadata: PreviewMocks.getMetadata,
    readTexturePixelsRGBA8: PreviewMocks.readPixels,
}));

vi.mock("../../src/components/properties/textures/texturePreviewCore", () => {
    const TexturePreviewCore: FunctionComponent<TexturePreviewCoreProps> = (props) => {
        PreviewMocks.render(props);
        return <div data-testid="texture-preview" />;
    };
    return { TexturePreviewCore };
});

import { TexturePreviewProperties } from "../../src/lite/services/panes/properties/texturePreviewProperties";

const AllChannels = { R: true, G: true, B: true, A: true };
const Selection: TexturePreviewSelection = { face: 4, layer: 3, lod: 2, slice: 1, channels: AllChannels };

describe("Babylon Lite texture preview adapter", () => {
    let container: HTMLDivElement;
    let root: Root;
    let texture: Texture2D | CubeTexture;
    let engine: EngineContext;
    let resourceIndexService: ISceneResourceIndexService;
    let isDisposed: boolean;
    let onChanged: Observable<void>;
    let onDisposed: Observable<void>;

    beforeEach(() => {
        vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
        PreviewMocks.getInfo.mockReset();
        PreviewMocks.getMetadata.mockReset().mockReturnValue({ name: "color\u0000:map" });
        PreviewMocks.readPixels.mockReset().mockResolvedValue({ width: 1, height: 1, pixels: new Uint8Array([12, 34, 56, 78]) });
        PreviewMocks.render.mockReset();
        texture = { width: 1, height: 1 } as Texture2D;
        engine = {} as EngineContext;
        isDisposed = false;
        onChanged = new Observable<void>();
        onDisposed = new Observable<void>();
        resourceIndexService = {
            onChanged,
            onDisposed,
            get isDisposed() {
                return isDisposed;
            },
            getSceneSnapshot: vi.fn(() => {
                throw new Error("Unexpected scene snapshot request.");
            }),
            getMaterialRecord: vi.fn(() => undefined),
            getTextureRecord: vi.fn(() => undefined),
            refresh: vi.fn(),
        };
        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
        vi.unstubAllGlobals();
    });

    async function Render(selectedTexture = texture) {
        await act(async () => root.render(<TexturePreviewProperties texture={selectedTexture} engine={engine} resourceIndexService={resourceIndexService} />));
    }

    function PreviewProps(): TexturePreviewCoreProps {
        return PreviewMocks.render.mock.lastCall![0] as TexturePreviewCoreProps;
    }

    it.each([
        ["2d", { mipLevel: 2 }],
        ["cube", { mipLevel: 2, face: 4 }],
        ["2d-array", { mipLevel: 2, layer: 3 }],
        ["3d", { mipLevel: 2, slice: 1 }],
    ] as const)("reads the selected %s subresource and applies the shared channel display rules", async (kind, expectedOptions) => {
        const info: TextureReadbackInfo = { kind, width: 8, height: 4, depthOrArrayLayers: 6, mipLevelCount: 4 };
        PreviewMocks.getInfo.mockReturnValue(info);
        await Render();

        const props = PreviewProps();
        expect(props).toMatchObject({
            source: texture,
            kind,
            maxLod: 3,
            layerCount: kind === "2d-array" ? 6 : 0,
            depth: kind === "3d" ? 6 : 1,
            refreshable: true,
            downloadFileName: "color__map.png",
        });
        const result = await props.getPixelsAsync({ ...Selection, channels: { R: false, G: true, B: false, A: false } });
        expect(PreviewMocks.getInfo).toHaveBeenCalledWith(texture);
        expect(PreviewMocks.readPixels).toHaveBeenCalledWith(engine, texture, expectedOptions);
        expect(result).toEqual({ width: 1, height: 1, data: new Uint8Array([34, 34, 34, 255]) });
    });

    it("reports invalid or unavailable texture metadata", async () => {
        PreviewMocks.getInfo.mockImplementation(() => {
            throw new Error("Texture is unavailable");
        });
        await Render();
        expect(container.querySelector('[role="alert"]')?.textContent).toContain("Texture is unavailable");
        expect(container.querySelector('[data-testid="texture-preview"]')).toBeNull();
    });

    it("does not reuse dimensions or kind from the previously selected texture", async () => {
        const nextTexture = {} as CubeTexture;
        PreviewMocks.getInfo.mockImplementation((selected: Texture2D | CubeTexture): TextureReadbackInfo =>
            selected === nextTexture
                ? { kind: "cube", width: 4, height: 4, depthOrArrayLayers: 6, mipLevelCount: 3 }
                : { kind: "2d", width: 8, height: 4, depthOrArrayLayers: 1, mipLevelCount: 1 }
        );
        await Render();
        await Render(nextTexture);
        expect(PreviewProps()).toMatchObject({ source: nextTexture, kind: "cube", maxLod: 2 });
        await PreviewProps().getPixelsAsync(Selection);
        expect(PreviewMocks.readPixels).toHaveBeenLastCalledWith(engine, nextTexture, { mipLevel: 2, face: 4 });
    });

    it("refreshes metadata after resource changes and rejects readback after Inspector disposal", async () => {
        PreviewMocks.getInfo.mockReturnValue({ kind: "2d", width: 1, height: 1, depthOrArrayLayers: 1, mipLevelCount: 1 } satisfies TextureReadbackInfo);
        await Render();
        PreviewMocks.getMetadata.mockReturnValue({ name: "updated.png" });
        await act(async () => onChanged.notifyObservers());
        expect(PreviewProps().downloadFileName).toBe("updated.png");

        let finishReadback!: (value: { width: number; height: number; pixels: Uint8Array }) => void;
        PreviewMocks.readPixels.mockReturnValue(new Promise((resolve) => (finishReadback = resolve)));
        const pending = PreviewProps().getPixelsAsync(Selection);
        const rejection = pending.catch((error: unknown) => error);
        await act(async () => {
            isDisposed = true;
            onDisposed.notifyObservers();
        });
        expect(container.querySelector('[role="alert"]')?.textContent).toContain("The Inspector is closed");
        finishReadback({ width: 1, height: 1, pixels: new Uint8Array([1, 2, 3, 4]) });
        expect(await rejection).toMatchObject({ message: "The Inspector is closed." });
    });
});
