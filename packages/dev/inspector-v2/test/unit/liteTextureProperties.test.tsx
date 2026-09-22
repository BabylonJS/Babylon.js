/**
 * @vitest-environment jsdom
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const TextureInspectionMocks = vi.hoisted(() => ({
    snapshots: new Map<object, unknown>(),
    setTransform: vi.fn(),
}));

vi.mock("@babylonjs/lite", async (importOriginal) => {
    const original = await importOriginal<typeof import("@babylonjs/lite")>();
    return {
        ...original,
        inspectTexture: (texture: object) => TextureInspectionMocks.snapshots.get(texture),
        setTextureInspectionTransform: TextureInspectionMocks.setTransform,
    };
});

import {
    type Material,
    type MaterialTextureBinding,
    type SceneContext,
    type TextureInspection,
    type TextureInspectionKind,
    type TextureInspectionTransform,
} from "@babylonjs/lite";
import { Observable } from "core/Misc/observable";
import { LiteTextureMetadataAdapter } from "../../src/lite/services/panes/properties/liteTextureMetadataAdapter";
import { TexturePropertiesServiceDefinition } from "../../src/lite/services/panes/properties/texturePropertiesService";
import { type ILiteSceneResourceIndexService } from "../../src/lite/services/panes/scene/sceneResourceIndexService";
import { type ILiteMaterialResourceRecord, type ILiteTextureResourceRecord } from "../../src/lite/services/panes/scene/sceneResources";
import { type IPropertiesService } from "../../src/services/panes/properties/propertiesService";
import { type ISelectionService } from "../../src/services/selectionService";

vi.hoisted(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal(
        "matchMedia",
        vi.fn(() => ({
            matches: false,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        }))
    );
});

vi.stubGlobal("NodeFilter", window.NodeFilter);

const PresentTransform: TextureInspectionTransform = { uScale: 1, vScale: 1, uOffset: 0, vOffset: 0, uAng: 0 };

function Known<T>(value: T) {
    return { state: "known", value } as const;
}

function MakeInspection(kind: TextureInspectionKind, overrides: Partial<TextureInspection> = {}): TextureInspection {
    return {
        kind,
        displayName: Known(`${kind} texture`),
        origin: Known(kind === "cube" ? "ktx2" : "url-raster"),
        width: 64,
        height: 32,
        depthOrLayers: Known(kind === "cube" ? 6 : kind === "2d-array" ? 4 : 1),
        sampleCategory: "float",
        format: Known("rgba8unorm"),
        mipLevelCount: Known(3),
        colorSpace: "srgb",
        invertY: { state: "present", value: true },
        sampler: {
            addressModeU: Known("repeat"),
            addressModeV: Known("clamp-to-edge"),
            addressModeW: Known("mirror-repeat"),
            minFilter: Known("linear"),
            magFilter: Known("linear"),
            mipmapFilter: Known("nearest"),
            maxAnisotropy: Known(4),
        },
        transform: kind === "2d" ? { state: "present", value: PresentTransform } : { state: "unsupported", reason: "Only 2D textures support UV transforms." },
        capabilities: {
            dynamicUpdate: Known(false),
            htmlReadiness: { state: "unknown" },
            renderAttachment: Known(kind === "2d"),
            sampledDepth: false,
            released: Known(false),
        },
        ...overrides,
    } as TextureInspection;
}

function MakeBinding(texture: object, id = "standard.diffuse"): MaterialTextureBinding {
    return {
        id,
        label: id === "standard.diffuse" ? "Diffuse Texture" : "Texture",
        value: { state: "present", value: { entity: texture, kind: "2d" } },
        acceptedKinds: ["2d"],
        sampleCategory: "float",
        viewCategory: "2d",
        directions: ["replace", "clear", "navigate"],
        mutation: { access: "read-write", mutation: "R", postMutation: "rebuild-material" },
        transform: { state: "present", value: PresentTransform },
    } as MaterialTextureBinding;
}

function MakeServices(texture: object, inspection: TextureInspection, includeRecord = true) {
    const sceneA = { meshes: [] } as unknown as SceneContext;
    const sceneB = { meshes: [] } as unknown as SceneContext;
    const material = {} as Material;
    const binding = MakeBinding(texture);
    const materialRecord = {
        source: material,
        inspection: {
            source: material,
            family: "standard",
            displayName: "Shared Standard",
            isView: false,
            properties: [],
            textureBindings: [binding],
        },
        scenes: [sceneA, sceneB],
        bindings: [binding],
    } as ILiteMaterialResourceRecord;
    const textureRecord = {
        entity: texture,
        inspection,
        ordinal: 7,
        consumers: [{ material, bindingId: binding.id }],
    } as ILiteTextureResourceRecord;
    const onChanged = new Observable<void>();
    const refresh = vi.fn(() => onChanged.notifyObservers());
    const resourceIndexService = {
        index: {
            getTextureRecord: (candidate: object) => (includeRecord && candidate === texture ? textureRecord : undefined),
            getMaterialRecord: (candidate: Material) => (candidate === material ? materialRecord : undefined),
        },
        onChanged,
        refresh,
        dispose: vi.fn(),
    } as unknown as ILiteSceneResourceIndexService;
    let selectedEntity: object | null = texture;
    const selectionService = {
        get selectedEntity() {
            return selectedEntity;
        },
        set selectedEntity(value) {
            selectedEntity = value;
        },
        onSelectedEntityChanged: new Observable<void>(),
        dispose: vi.fn(),
    } as ISelectionService;
    return { resourceIndexService, selectionService, material, sceneA, sceneB, textureRecord };
}

function GetNormalizedText(container: HTMLElement): string {
    return container.textContent?.replace(/\s/g, "") ?? "";
}

describe("Babylon Lite texture metadata Properties", () => {
    const roots: Root[] = [];
    const containers: HTMLElement[] = [];

    beforeEach(() => {
        TextureInspectionMocks.snapshots.clear();
        TextureInspectionMocks.setTransform.mockReset();
        TextureInspectionMocks.setTransform.mockResolvedValue({ changed: true, mutation: "R", postMutation: "rebuild-material" });
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
        ["2d", "Width64pxHeight32px"],
        ["2d-array", "Layers4"],
        ["3d", "Depth1"],
        ["cube", "Faces6"],
    ] as const)("renders safe %s metadata without GPU details", (kind, expected) => {
        const texture = {};
        const inspection = MakeInspection(kind);
        TextureInspectionMocks.snapshots.set(texture, inspection);
        const services = MakeServices(texture, inspection);
        const container = Render(<LiteTextureMetadataAdapter texture={texture} {...services} />);
        const text = GetNormalizedText(container);

        expect(text).toContain(expected);
        expect(text).toContain(`Kind${kind}`);
        expect(text).toContain("Formatrgba8unorm");
        expect(text).not.toMatch(/GPU|handle|preview|editor|export/i);
        expect(text.includes("UScale")).toBe(kind === "2d");
    });

    it("renders unknown and transient facts deterministically", () => {
        const texture = {};
        const inspection = MakeInspection("2d", {
            width: 0,
            height: 0,
            displayName: { state: "unknown", reason: "Name was not retained." },
            format: { state: "unknown" },
            capabilities: {
                dynamicUpdate: { state: "unknown" },
                htmlReadiness: { state: "unknown" },
                renderAttachment: { state: "unknown" },
                sampledDepth: true,
                released: { state: "unknown" },
            },
        });
        TextureInspectionMocks.snapshots.set(texture, inspection);
        const services = MakeServices(texture, inspection, false);
        const container = Render(<LiteTextureMetadataAdapter texture={texture} {...services} />);
        const text = GetNormalizedText(container);

        expect(text).toContain("NameUnavailable");
        expect(text).toContain("FormatUnavailable");
        expect(text).toContain("SampledDepth");
        expect(text).toContain("AvailabilityTransientorunavailable");
        expect(text).not.toContain("UScale");
    });

    it("renders render-target and sampled-depth capabilities without runtime actions", () => {
        const texture = {};
        const inspection = MakeInspection("2d", {
            origin: Known("render-target"),
            capabilities: {
                dynamicUpdate: Known(false),
                htmlReadiness: { state: "unknown" },
                renderAttachment: Known(true),
                sampledDepth: true,
                released: Known(false),
            },
            transform: { state: "unsupported", reason: "Render targets do not expose UV transforms." },
        });
        TextureInspectionMocks.snapshots.set(texture, inspection);
        const services = MakeServices(texture, inspection, false);
        const text = GetNormalizedText(Render(<LiteTextureMetadataAdapter texture={texture} {...services} />));

        expect(text).toContain("Originrender-target");
        expect(text).toContain("RenderAttachment");
        expect(text).toContain("SampledDepth");
        expect(text).not.toContain("UScale");
    });

    it("navigates consumers by exact source material identity", () => {
        const texture = {};
        const inspection = MakeInspection("cube");
        TextureInspectionMocks.snapshots.set(texture, inspection);
        const services = MakeServices(texture, inspection);
        const container = Render(<LiteTextureMetadataAdapter texture={texture} {...services} />);
        const link = container.querySelector('[aria-label="Open material Shared Standard, Diffuse Texture"]');

        expect(link).not.toBeNull();
        act(() => link?.dispatchEvent(new MouseEvent("click", { bubbles: true })));
        expect(services.selectionService.selectedEntity).toBe(services.material);
    });

    it("commits transforms with every owning scene and refreshes successful and no-op results", async () => {
        const texture = {};
        const inspection = MakeInspection("2d");
        TextureInspectionMocks.snapshots.set(texture, inspection);
        const services = MakeServices(texture, inspection);
        const container = Render(<LiteTextureMetadataAdapter texture={texture} {...services} />);
        const input = container.querySelector('input[value="1"]') as HTMLInputElement;
        const setInputValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;

        await act(async () => {
            input.focus();
            setInputValue.call(input, "2");
            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.blur();
            await Promise.resolve();
        });

        expect(TextureInspectionMocks.setTransform).toHaveBeenCalledWith({ scenes: [services.sceneA, services.sceneB] }, texture, expect.objectContaining({ uScale: 2 }));
        expect(services.resourceIndexService.refresh).toHaveBeenCalledTimes(1);

        TextureInspectionMocks.setTransform.mockResolvedValueOnce({ changed: false, mutation: "R", postMutation: "none" });
        await act(async () => {
            input.focus();
            setInputValue.call(input, "3");
            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.blur();
            await Promise.resolve();
        });
        expect(services.resourceIndexService.refresh).toHaveBeenCalledTimes(2);
    });

    it("preserves selection and the applied value when a transform is rejected", async () => {
        const texture = {};
        const inspection = MakeInspection("2d");
        TextureInspectionMocks.snapshots.set(texture, inspection);
        TextureInspectionMocks.setTransform.mockRejectedValueOnce(new Error("Transform rejected"));
        const services = MakeServices(texture, inspection);
        const container = Render(<LiteTextureMetadataAdapter texture={texture} {...services} />);
        const input = container.querySelector('input[value="1"]') as HTMLInputElement;
        const setInputValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;

        await act(async () => {
            input.focus();
            setInputValue.call(input, "2");
            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.blur();
            await Promise.resolve();
        });

        expect(services.selectionService.selectedEntity).toBe(texture);
        expect(services.resourceIndexService.refresh).not.toHaveBeenCalled();
        expect(container.querySelector('[role="alert"]')?.textContent).toContain("Transform rejected");
        expect(container.querySelector('input[value="1"]')).not.toBeNull();
    });

    it("handles stale and malformed wrappers without throwing", () => {
        const texture = {};
        const services = MakeServices(texture, MakeInspection("2d"), false);
        const container = Render(<LiteTextureMetadataAdapter texture={texture} {...services} />);
        expect(container.querySelector('[role="alert"]')?.textContent).toContain("unavailable or malformed");
    });

    it("keeps service instances and selection isolated", () => {
        const texture = {};
        const inspection = MakeInspection("cube");
        TextureInspectionMocks.snapshots.set(texture, inspection);
        const first = MakeServices(texture, inspection);
        const second = MakeServices(texture, inspection);
        const firstContainer = Render(<LiteTextureMetadataAdapter texture={texture} {...first} />);
        Render(<LiteTextureMetadataAdapter texture={texture} {...second} />);

        act(() => firstContainer.querySelector('[aria-label="Open material Shared Standard, Diffuse Texture"]')?.dispatchEvent(new MouseEvent("click", { bubbles: true })));
        expect(first.selectionService.selectedEntity).toBe(first.material);
        expect(second.selectionService.selectedEntity).toBe(texture);
    });

    it("registers one lazy metadata component and keeps preview/editor modules isolated", () => {
        const texture = {};
        TextureInspectionMocks.snapshots.set(texture, MakeInspection("2d"));
        const registrations: Parameters<IPropertiesService["addSectionContent"]>[0][] = [];
        const propertiesService = {
            addSectionContent: vi.fn((registration) => {
                registrations.push(registration);
                return { dispose: vi.fn() };
            }),
        } as unknown as IPropertiesService;
        const services = MakeServices(texture, MakeInspection("2d"));

        TexturePropertiesServiceDefinition.factory(propertiesService, services.resourceIndexService, services.selectionService);
        expect(registrations).toHaveLength(1);
        expect(registrations[0].predicate(texture)).toBe(true);
        TextureInspectionMocks.snapshots.delete(texture);
        expect(registrations[0].predicate(texture)).toBe(true);
        expect(registrations[0].predicate({})).toBe(false);

        const serviceSource = readFileSync(resolve(__dirname, "../../src/lite/services/panes/properties/texturePropertiesService.tsx"), "utf8");
        const adapterSource = readFileSync(resolve(__dirname, "../../src/lite/services/panes/properties/liteTextureMetadataAdapter.tsx"), "utf8");
        expect(serviceSource).toContain('import("./liteTextureMetadataAdapter")');
        expect(`${serviceSource}\n${adapterSource}`).not.toMatch(/texturePreview|textureEditor|readback|uploadTexture|exportTexture|core\/Materials\/Textures/i);
    });
});
