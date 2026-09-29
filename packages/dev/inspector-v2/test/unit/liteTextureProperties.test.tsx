/**
 * @vitest-environment jsdom
 */

import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const InspectionMocks = vi.hoisted(() => ({
    setTransform: vi.fn(),
    enableUv: vi.fn(),
    dirty: vi.fn(),
    rebuild: vi.fn(),
}));

vi.mock("@babylonjs/lite", async (importOriginal) => {
    const original = await importOriginal<typeof import("@babylonjs/lite")>();
    return {
        ...original,
        getTextureMetadata: (texture: Record<string, unknown>) => texture.metadata,
        getTextureTransform: (texture: Record<string, unknown>) => texture.transform,
        getTextureCoordinateIndex: (texture: Record<string, unknown>) => texture.coordinateIndex,
        hasTextureTransform: (texture: Record<string, unknown>) => texture.transform !== undefined,
        setTextureTransform: InspectionMocks.setTransform,
        enableMaterialUvTransform: InspectionMocks.enableUv,
        markMaterialUboDirty: InspectionMocks.dirty,
        rebuildMaterial: InspectionMocks.rebuild,
    };
});

import { type Material, type SceneContext, type TextureMetadata } from "@babylonjs/lite";
import { Observable } from "core/Misc/observable";

import { TextureMetadataProperties } from "../../src/lite/services/panes/properties/textureMetadataProperties";
import { type ISceneResourceIndexService } from "../../src/lite/services/panes/scene/sceneResourceIndexService";
import { type IMaterialResourceRecord, type ITextureResourceRecord } from "../../src/lite/services/panes/scene/sceneResources";
import { type ISelectionService } from "../../src/services/selectionService";

vi.hoisted(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal(
        "matchMedia",
        vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    );
});
vi.stubGlobal("NodeFilter", window.NodeFilter);

function MakeSelectionService(): ISelectionService {
    let selectedEntity: object | null = null;
    return {
        get selectedEntity() {
            return selectedEntity;
        },
        set selectedEntity(value) {
            selectedEntity = value;
            this.onSelectedEntityChanged.notifyObservers();
        },
        onSelectedEntityChanged: new Observable<void>(),
        dispose: vi.fn(),
    } as ISelectionService;
}

function MakeServices(metadata: TextureMetadata, kind: "standard" | "pbr" = "standard") {
    const scene = {} as SceneContext;
    const material = { family: kind, name: "Material" } as unknown as Material;
    const texture = {
        metadata,
        coordinateIndex: 1,
        transform: { uOffset: 0, vOffset: 0, uScale: 1, vScale: 1, uAng: 0 },
    };
    const materialRecord: IMaterialResourceRecord = {
        source: material,
        family: kind,
        displayName: "Material",
        scenes: [scene],
        bindings: [{ id: `${kind}.baseColor`, entity: texture }],
    };
    const textureRecord: ITextureResourceRecord = {
        entity: texture,
        metadata,
        ordinal: 4,
        consumers: [{ material, bindingId: `${kind}.baseColor` }],
    };
    const onChanged = new Observable<void>();
    const onDisposed = new Observable<void>();
    let disposed = false;
    const refresh = vi.fn(() => onChanged.notifyObservers());
    const resourceIndexService = {
        index: {
            getTextureRecord: (entity: object) => (entity === texture ? textureRecord : undefined),
            getMaterialRecord: (entity: Material) => (entity === material ? materialRecord : undefined),
            getSceneSnapshot: () => ({ scene, materials: [materialRecord], textures: [textureRecord] }),
        },
        onChanged,
        onDisposed,
        refresh,
        get isDisposed() {
            return disposed;
        },
        dispose: vi.fn(() => {
            disposed = true;
            onDisposed.notifyObservers();
        }),
    } as unknown as ISceneResourceIndexService;
    return { texture, material, scene, materialRecord, textureRecord, resourceIndexService, selectionService: MakeSelectionService(), refresh };
}

describe("Babylon Lite texture accessor metadata", () => {
    const roots: Root[] = [];
    const containers: HTMLElement[] = [];

    beforeEach(() => {
        InspectionMocks.setTransform.mockReset();
        InspectionMocks.setTransform.mockImplementation((texture, transform) => {
            if (JSON.stringify(texture.transform) === JSON.stringify(transform)) {
                return false;
            }
            texture.transform = transform;
            return true;
        });
        InspectionMocks.enableUv.mockReset();
        InspectionMocks.enableUv.mockReturnValue(false);
        InspectionMocks.dirty.mockReset();
        InspectionMocks.rebuild.mockReset();
        InspectionMocks.rebuild.mockResolvedValue(undefined);
    });

    afterEach(() => {
        roots.splice(0).forEach((root) => act(() => root.unmount()));
        containers.splice(0).forEach((container) => container.remove());
    });

    function Render(content: ReactNode): HTMLElement {
        const container = document.createElement("div");
        document.body.appendChild(container);
        containers.push(container);
        const root = createRoot(container);
        roots.push(root);
        act(() => root.render(<FluentProvider theme={webLightTheme}>{content}</FluentProvider>));
        return container;
    }

    it.each([
        ["2d", "Width64Height32"],
        ["2d-array", "Layers4"],
        ["3d", "Depth8"],
        ["cube", "Faces6"],
    ] as const)("renders metadata-only %s rows without exposing GPU objects", (kind, expected) => {
        const metadata: TextureMetadata = {
            kind,
            name: "Albedo",
            origin: "url-raster",
            width: 64,
            height: 32,
            layers: kind === "2d-array" ? 4 : undefined,
            depth: kind === "3d" ? 8 : undefined,
            format: "rgba8unorm",
            mipLevelCount: 3,
            sampleType: "float",
            colorSpace: "srgb",
            sampler: { addressModeU: "repeat", minFilter: "linear" },
            capabilities: { dynamicUpdate: false, renderAttachment: false, sampledDepth: false },
        };
        const services = MakeServices(metadata);
        const container = Render(<TextureMetadataProperties {...services} />);
        const text = (container.textContent ?? "").replaceAll(/\s/g, "");

        expect(text).toContain(expected);
        expect(text).toContain(`Kind${kind}`);
        expect(text).toContain("Formatrgba8unorm");
        expect(text).not.toMatch(/GPUTexture|GPUTextureView|GPUHandle/);
        expect(container.querySelector("canvas")).toBeNull();
        expect(container.querySelector('input[type="file"]')).toBeNull();
    });

    it("renders deterministic unknown and transient metadata states", () => {
        const services = MakeServices({ kind: "2d", width: 0, height: 0, capabilities: {} });
        const text = (Render(<TextureMetadataProperties {...services} />).textContent ?? "").replaceAll(/\s/g, "");

        expect(text).toContain("NameUnavailable");
        expect(text).toContain("FormatUnavailable");
        expect(text).toContain("AvailabilityTransientorunavailable");
    });

    it("navigates to the exact source material consumer", () => {
        const services = MakeServices({ kind: "2d", capabilities: {} });
        const container = Render(<TextureMetadataProperties {...services} />);
        const link = container.querySelector('[aria-label^="Open material Material"]');

        expect(link).not.toBeNull();
        act(() => link?.dispatchEvent(new MouseEvent("click", { bubbles: true })));
        expect(services.selectionService.selectedEntity).toBe(services.material);
    });

    it("commits transforms with complete consumer scope and refreshes applied metadata", async () => {
        const services = MakeServices({ kind: "2d", capabilities: {} });
        const container = Render(<TextureMetadataProperties {...services} />);
        const input = container.querySelector<HTMLInputElement>('input[value="1"]')!;
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!;

        await act(async () => {
            input.focus();
            setter.call(input, "2");
            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.blur();
        });

        expect(InspectionMocks.setTransform).toHaveBeenCalledWith(services.texture, expect.objectContaining({ uScale: 2 }));
        expect(InspectionMocks.enableUv).toHaveBeenCalledWith(services.material);
        expect(InspectionMocks.dirty).toHaveBeenCalledWith(services.material);
        expect(services.refresh).toHaveBeenCalled();
    });

    it("awaits rebuilds when enabling transform support changes the material pipeline", async () => {
        InspectionMocks.enableUv.mockReturnValue(true);
        const services = MakeServices({ kind: "2d", capabilities: {} });
        const container = Render(<TextureMetadataProperties {...services} />);
        const input = container.querySelector<HTMLInputElement>('input[value="1"]')!;
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!;

        await act(async () => {
            input.focus();
            setter.call(input, "3");
            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.blur();
        });

        expect(InspectionMocks.rebuild).toHaveBeenCalledWith(services.scene, services.material, {
            rebuildViews: true,
            rebuildFrameGraph: false,
        });
    });

    it("announces a failed transform write without changing metadata rows", async () => {
        InspectionMocks.setTransform.mockImplementation(() => {
            throw new Error("Transform unavailable");
        });
        const services = MakeServices({ kind: "2d", width: 64, capabilities: {} });
        const container = Render(<TextureMetadataProperties {...services} />);
        const input = container.querySelector<HTMLInputElement>('input[value="1"]')!;
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!;

        await act(async () => {
            input.focus();
            setter.call(input, "2");
            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.blur();
        });

        expect(container.querySelector('[role="alert"]')?.textContent).toContain("Transform unavailable");
        expect(container.textContent).toContain("Width");
        expect(container.textContent).toContain("64");
        expect(services.refresh).not.toHaveBeenCalled();
    });

    it("keeps stale and malformed wrappers accessible without throwing", () => {
        const selectionService = MakeSelectionService();
        const resourceIndexService = {
            index: { getTextureRecord: () => undefined },
            onChanged: new Observable<void>(),
            onDisposed: new Observable<void>(),
            isDisposed: false,
        } as unknown as ISceneResourceIndexService;
        const container = Render(<TextureMetadataProperties texture={{}} resourceIndexService={resourceIndexService} selectionService={selectionService} />);

        expect(container.textContent).toContain("This texture is unavailable or malformed.");
        expect(container.querySelector('[role="alert"]')).not.toBeNull();
    });

    it("does not offer transform editing for cube wrappers", () => {
        const services = MakeServices({ kind: "cube", capabilities: {} });
        const container = Render(<TextureMetadataProperties {...services} />);
        expect(container.querySelector("input")).toBeNull();
    });
});
