/**
 * @vitest-environment jsdom
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const LiteInspectionMocks = vi.hoisted(() => ({
    snapshots: new Map<object, unknown>(),
    setProperty: vi.fn(),
    setTexture: vi.fn(),
}));

vi.mock("@babylonjs/lite", async (importOriginal) => {
    const original = await importOriginal<typeof import("@babylonjs/lite")>();
    return {
        ...original,
        inspectMaterial: (material: object) => {
            const snapshot = LiteInspectionMocks.snapshots.get(material);
            if (!snapshot) {
                throw new Error("Not an inspectable material.");
            }
            return snapshot;
        },
        getMaterialTextureBindings: (material: object) => {
            const snapshot = LiteInspectionMocks.snapshots.get(material) as { textureBindings?: readonly unknown[] } | undefined;
            return snapshot?.textureBindings ?? [];
        },
        setMaterialInspectionProperty: LiteInspectionMocks.setProperty,
        setMaterialInspectionTexture: LiteInspectionMocks.setTexture,
    };
});

import { type Material, type MaterialInspection, type MaterialInspectionSection, type MaterialTextureBinding, type SceneContext } from "@babylonjs/lite";
import { Observable } from "core/Misc/observable";
import { NodeMaterialAdapter } from "../../src/lite/services/panes/properties/materialAdapters/nodeMaterialAdapter";
import { PbrMaterialAdapter } from "../../src/lite/services/panes/properties/materialAdapters/pbrMaterialAdapter";
import { ShaderMaterialAdapter } from "../../src/lite/services/panes/properties/materialAdapters/shaderMaterialAdapter";
import { StandardMaterialAdapter } from "../../src/lite/services/panes/properties/materialAdapters/standardMaterialAdapter";
import { MaterialPropertiesServiceDefinition } from "../../src/lite/services/panes/properties/materialPropertiesService";
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

type RegisteredContent = Parameters<IPropertiesService["addSectionContent"]>[0];

function MakeDeferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<T>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    return { promise, resolve, reject };
}

const Editable = { access: "read-write", mutation: "A", postMutation: "none" } as const;
const ReadOnly = { access: "read-only", reason: "Computed by the shader" } as const;

function MakeProperty(
    id: string,
    section: MaterialInspectionSection,
    label: string,
    valueType: "string" | "boolean" | "number" | "enum" | "vec2" | "vec3" | "vec4" | "mat4" | "summary",
    value: unknown,
    access = Editable
) {
    return {
        id,
        section,
        label,
        valueType,
        value: value === undefined ? { state: "absent" } : { state: "present", value },
        access,
    };
}

function MakeInspection(
    material: Material,
    family: string | undefined,
    properties: readonly unknown[],
    textureBindings: readonly MaterialTextureBinding[] = []
): MaterialInspection {
    return {
        source: material,
        family,
        displayName: family ? `${family} material` : "Unknown material",
        isView: false,
        properties,
        textureBindings,
    } as MaterialInspection;
}

function MakeResourceService(
    recordOrRecords: ILiteMaterialResourceRecord | readonly ILiteMaterialResourceRecord[] | undefined,
    textures: readonly ILiteTextureResourceRecord[] = []
) {
    const records = recordOrRecords ? (Array.isArray(recordOrRecords) ? recordOrRecords : [recordOrRecords]) : [];
    const onChanged = new Observable<void>();
    const onDisposed = new Observable<void>();
    let isDisposed = false;
    const refresh = vi.fn(() => onChanged.notifyObservers());
    const index = {
        getMaterialRecord: (material: Material) => records.find((record) => record.source === material),
        getSceneSnapshot: (scene: SceneContext) => ({ scene, materials: records.filter((record) => record.scenes.includes(scene)), textures }),
        getTextureRecord: (texture: object) => textures.find((candidate) => candidate.entity === texture),
    };
    return {
        index,
        onChanged,
        onDisposed,
        refresh,
        get isDisposed() {
            return isDisposed;
        },
        dispose: vi.fn(() => {
            isDisposed = true;
            onDisposed.notifyObservers();
            onDisposed.clear();
            onChanged.clear();
        }),
    } as unknown as ILiteSceneResourceIndexService;
}

function MakeSelectionService() {
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

describe("Babylon Lite material Properties", () => {
    const roots: Root[] = [];
    const containers: HTMLElement[] = [];

    beforeEach(() => {
        LiteInspectionMocks.snapshots.clear();
        LiteInspectionMocks.setProperty.mockReset();
        LiteInspectionMocks.setTexture.mockReset();
        LiteInspectionMocks.setProperty.mockResolvedValue({ changed: true, mutation: "A", postMutation: "none" });
        LiteInspectionMocks.setTexture.mockResolvedValue({ changed: true, mutation: "A", postMutation: "none" });
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

    it("registers isolated lazy adapters for all four families and a safe unknown fallback", () => {
        const families = ["standard", "pbr", "shader", "node"] as const;
        const materials = families.map((family) => ({ family }) as unknown as Material);
        materials.forEach((material, index) => LiteInspectionMocks.snapshots.set(material, MakeInspection(material, families[index], [])));
        const unknown = {} as Material;
        LiteInspectionMocks.snapshots.set(unknown, MakeInspection(unknown, undefined, []));
        const records = [...materials, unknown].map((material) => ({
            source: material,
            inspection: LiteInspectionMocks.snapshots.get(material),
            scenes: [],
            bindings: [],
        })) as ILiteMaterialResourceRecord[];
        const registrations = new Map<string, RegisteredContent>();
        const propertiesService = {
            addSectionContent: vi.fn((content: RegisteredContent) => {
                registrations.set(content.key, content);
                return { dispose: vi.fn() };
            }),
        } as unknown as IPropertiesService;

        const service = MaterialPropertiesServiceDefinition.factory(propertiesService, MakeResourceService(records), MakeSelectionService());

        expect(registrations.size).toBe(5);
        families.forEach((family, index) => {
            expect(registrations.get(`Babylon Lite ${family} Material Properties`)?.predicate(materials[index])).toBe(true);
        });
        expect(registrations.get("Babylon Lite standard Material Properties")?.content.map((content) => content.section)).toEqual([
            "General",
            "Transparency",
            "Lighting & Colors",
            "Textures",
            "Texture Settings",
            "Transform",
            "Stencil",
        ]);
        expect(registrations.get("Babylon Lite pbr Material Properties")?.content.map((content) => content.section)).toEqual([
            "General",
            "Transparency",
            "Lighting & Colors",
            "Textures",
            "Occlusion",
            "Lightmap",
            "Metallic Reflectance",
            "Clear Coat",
            "Sheen",
            "Iridescence",
            "Anisotropy",
            "Subsurface / Translucency",
            "Subsurface / Thickness",
            "Subsurface / Tint",
            "Transmission",
            "Special Modes",
            "Transform",
            "Stencil",
        ]);
        expect(registrations.get("Babylon Lite shader Material Properties")?.content.map((content) => content.section)).toEqual(["General", "Inputs", "Textures", "Configuration"]);
        expect(registrations.get("Babylon Lite node Material Properties")?.content.map((content) => content.section)).toEqual(["General", "Inputs"]);
        expect(registrations.get("Babylon Lite Unknown Material Properties")?.predicate(unknown)).toBe(true);
        expect(registrations.get("Babylon Lite Unknown Material Properties")?.predicate({})).toBe(false);

        const source = readFileSync(resolve(import.meta.dirname, "../../src/lite/services/panes/properties/materialPropertiesService.tsx"), "utf8");
        families.forEach((family) => expect(source).toContain(`import("./materialAdapters/${family}MaterialAdapter")`));
        expect(source).not.toMatch(/^import .*materialAdapters\/(?:standard|pbr|shader|node)MaterialAdapter/m);
        service?.dispose();
    });

    it("keeps every Lite family adapter isolated from other families and preview/editor dependencies", () => {
        const adapterRoot = resolve(import.meta.dirname, "../../src/lite/services/panes/properties/materialAdapters");
        const families = ["standard", "pbr", "shader", "node"];

        for (const family of families) {
            const source = readFileSync(`${adapterRoot}/${family}MaterialAdapter.tsx`, "utf8");
            families.filter((candidate) => candidate !== family).forEach((candidate) => expect(source).not.toContain(`${candidate}MaterialAdapter`));
            expect(source).not.toMatch(/from ["'](?:core\/|@dev\/core)/);
            expect(source).not.toMatch(/(?:texturePreview|materialEditor|readback|upload)/i);
        }

        const core = readFileSync(`${adapterRoot}/materialAdapterCore.tsx`, "utf8");
        expect(core).not.toMatch(/from ["'](?:core\/|@dev\/core)/);
        expect(core).not.toMatch(/(?:texturePreview|materialEditor|readback|upload)/i);
    });

    it("renders exact snapshot states and mutates a selected MaterialView with complete scene scope", async () => {
        const source = {} as Material;
        const view = {} as Material;
        const sceneA = {} as SceneContext;
        const sceneB = {} as SceneContext;
        const texture = {};
        const replacement = {};
        const binding = {
            id: "standard.diffuse",
            label: "Diffuse Texture",
            value: { state: "present", value: { entity: texture, kind: "2d" } },
            acceptedKinds: ["2d"],
            sampleCategory: "float",
            viewCategory: "2d",
            directions: ["replace", "clear", "navigate"],
            mutation: Editable,
            transform: { state: "unsupported", reason: "No transform" },
        } as MaterialTextureBinding;
        const properties = [
            MakeProperty("material.name", "general", "Name", "string", "View source"),
            MakeProperty("standard.alpha", "transparency", "Alpha", "number", 0.5),
            MakeProperty("standard.diffuseColor", "lighting-colors", "Diffuse Color", "vec4", [1, 0.5, 0.25, 1], ReadOnly),
            MakeProperty("standard.uvScale", "texture-settings", "UV Scale", "vec4", undefined),
            {
                ...MakeProperty("standard.stencil.readMask", "stencil", "Read Mask", "number", undefined, ReadOnly),
                value: { state: "unsupported", reason: "Unavailable on this material" },
            },
        ];
        const inspection = { ...MakeInspection(source, "standard", properties, [binding]), isView: true };
        LiteInspectionMocks.snapshots.set(view, inspection);
        const record = { source, inspection, scenes: [sceneA, sceneB], bindings: [binding] } as ILiteMaterialResourceRecord;
        const textureRecords = [
            { entity: texture, ordinal: 1, consumers: [], inspection: { kind: "2d", displayName: { state: "known", value: "Current" } } },
            { entity: replacement, ordinal: 2, consumers: [], inspection: { kind: "2d", displayName: { state: "known", value: "Replacement" } } },
        ] as unknown as ILiteTextureResourceRecord[];
        const resourceService = MakeResourceService(record, textureRecords);
        const selectionService = MakeSelectionService();
        const container = Render(
            <>
                {(["general", "transparency", "lighting-colors", "textures", "texture-settings", "stencil"] as const).map((section) => (
                    <StandardMaterialAdapter key={section} material={view} section={section} resourceIndexService={resourceService} selectionService={selectionService} />
                ))}
            </>
        );

        expect(container.querySelector<HTMLInputElement>('input[value="View source"]')).not.toBeNull();
        expect(container.querySelector<HTMLInputElement>('input[value="0.5"]')).not.toBeNull();
        expect(container.textContent).toContain("[1, 0.5, 0.25, 1]");
        expect(container.textContent).toContain("Not configured");
        expect(container.textContent).toContain("Unavailable on this material");
        expect(container.textContent).toContain("Current");

        const currentLink = Array.from(container.querySelectorAll("button")).find((button) => button.textContent?.includes("Current"));
        act(() => currentLink?.click());
        expect(selectionService.selectedEntity).toBe(texture);

        const nameInput = container.querySelector<HTMLInputElement>('input[value="View source"]')!;
        const setInputValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
        await act(async () => {
            setInputValue.call(nameInput, "Renamed");
            nameInput.dispatchEvent(new Event("input", { bubbles: true }));
            nameInput.blur();
            await Promise.resolve();
        });
        expect(LiteInspectionMocks.setProperty).toHaveBeenCalledWith({ scenes: [sceneA, sceneB] }, view, "material.name", "Renamed");
        expect(resourceService.refresh).toHaveBeenCalled();

        const unlinkButton = Array.from(container.querySelectorAll<HTMLButtonElement>("button[aria-describedby]"))[0];
        await act(async () => {
            unlinkButton?.click();
            await Promise.resolve();
        });
        expect(LiteInspectionMocks.setTexture).toHaveBeenCalledWith({ scenes: [sceneA, sceneB] }, view, "standard.diffuse", { direction: "clear" });
    });

    it("renders PBR, Shader, and Node family-owned snapshot fields", () => {
        const scene = {} as SceneContext;
        const families = [
            {
                material: {} as Material,
                inspection: undefined as unknown as MaterialInspection,
                content: PbrMaterialAdapter,
                section: "lighting-colors" as const,
                property: MakeProperty("pbr.baseColorFactor", "lighting-colors", "Base Color", "vec4", [0.1, 0.2, 0.3, 1]),
                expected: "Base Color",
            },
            {
                material: {} as Material,
                inspection: undefined as unknown as MaterialInspection,
                content: ShaderMaterialAdapter,
                section: "configuration" as const,
                property: MakeProperty("shader.configuration", "configuration", "Shader Configuration", "string", "vertex/fragment", ReadOnly),
                expected: "vertex/fragment",
            },
            {
                material: {} as Material,
                inspection: undefined as unknown as MaterialInspection,
                content: NodeMaterialAdapter,
                section: "inputs" as const,
                property: MakeProperty("node.input:direction", "inputs", "Direction", "vec4", [1, 2, 3, 4]),
                expected: "[1.00, 2.00, 3.00, 4.00]",
            },
        ];
        for (const [index, entry] of families.entries()) {
            const family = (["pbr", "shader", "node"] as const)[index];
            entry.inspection = MakeInspection(entry.material, family, [entry.property]);
            LiteInspectionMocks.snapshots.set(entry.material, entry.inspection);
        }
        const records = families.map(({ material, inspection }) => ({ source: material, inspection, scenes: [scene], bindings: [] })) as ILiteMaterialResourceRecord[];
        const resourceService = MakeResourceService(records);
        const selectionService = MakeSelectionService();
        const container = Render(
            <>
                {families.map((entry, index) => {
                    const Component = entry.content;
                    return <Component key={index} material={entry.material} section={entry.section} resourceIndexService={resourceService} selectionService={selectionService} />;
                })}
            </>
        );

        families.forEach((entry) => expect(container.textContent).toContain(entry.expected));
    });

    it("maps every finalized property value and access state through the shared controls", () => {
        const material = {} as Material;
        const scene = {} as SceneContext;
        const properties = [
            MakeProperty("standard.backFaceCulling", "general", "Boolean", "boolean", true),
            {
                ...MakeProperty("standard.reflectionCoordMode", "texture-settings", "Enum", "enum", 1),
                options: [
                    { label: "Spherical", value: 1 },
                    { label: "Planar", value: 2 },
                ],
            },
            MakeProperty("standard.uvScale", "transform", "Vector 2", "vec2", [1, 2]),
            MakeProperty("standard.diffuseColor", "lighting-colors", "Color 3", "vec3", [0.1, 0.2, 0.3]),
            MakeProperty("shader.uniform:matrix", "general", "Matrix", "mat4", [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
            MakeProperty("shader.configuration", "general", "Summary", "summary", "Read-only summary", ReadOnly),
            MakeProperty("standard.uvOffset", "transform", "Absent", "vec2", undefined),
            {
                ...MakeProperty("standard.stencil.compare", "stencil", "Unsupported", "enum", undefined, ReadOnly),
                value: { state: "unsupported", reason: "Stencil is unavailable" },
            },
        ];
        const inspection = MakeInspection(material, "standard", properties);
        LiteInspectionMocks.snapshots.set(material, inspection);
        const resourceService = MakeResourceService({ source: material, inspection, scenes: [scene], bindings: [] });
        const selectionService = MakeSelectionService();
        const container = Render(
            <>
                {(["general", "texture-settings", "transform", "lighting-colors", "stencil"] as const).map((section) => (
                    <StandardMaterialAdapter key={section} material={material} section={section} resourceIndexService={resourceService} selectionService={selectionService} />
                ))}
            </>
        );

        expect(container.querySelector('input[type="checkbox"]')).not.toBeNull();
        expect(container.querySelector('[role="combobox"]')).not.toBeNull();
        expect(container.textContent).toContain("[1.00, 2.00]");
        expect(container.textContent).toContain("[4 × 4]");
        expect(container.textContent).toContain("Read-only summary");
        expect(container.textContent).toContain("Not configured");
        expect(container.textContent).toContain("Stencil is unavailable");
    });

    it("places every finalized PBR binding group in its approved section and keeps one-way modes read-only", () => {
        const material = {} as Material;
        const scene = {} as SceneContext;
        const bindingSections = new Map<string, MaterialInspectionSection>([
            ["pbr.baseColor", "textures"],
            ["pbr.normal", "textures"],
            ["pbr.orm", "textures"],
            ["pbr.occlusion", "textures"],
            ["pbr.emissive", "textures"],
            ["pbr.specGloss", "textures"],
            ["pbr.lightmap", "lightmap"],
            ["pbr.metallicReflectance", "metallic-reflectance"],
            ["pbr.reflectance", "metallic-reflectance"],
            ["pbr.clearCoat", "clear-coat"],
            ["pbr.clearCoatRoughness", "clear-coat"],
            ["pbr.clearCoatBump", "clear-coat"],
            ["pbr.sheen", "sheen"],
            ["pbr.sheenRoughness", "sheen"],
            ["pbr.iridescence", "iridescence"],
            ["pbr.iridescenceThickness", "iridescence"],
            ["pbr.anisotropy", "anisotropy"],
            ["pbr.translucencyColor", "subsurface-translucency"],
            ["pbr.translucencyIntensity", "subsurface-translucency"],
            ["pbr.thickness", "subsurface-thickness"],
            ["pbr.transmission", "transmission"],
        ]);
        const bindings = [...bindingSections].map(
            ([id]) =>
                ({
                    id,
                    label: id,
                    value: { state: "absent" },
                    acceptedKinds: ["2d"],
                    sampleCategory: "float",
                    viewCategory: "2d",
                    directions: [],
                    mutation: ReadOnly,
                    transform: { state: "absent" },
                }) as MaterialTextureBinding
        );
        const modeProperties = [
            MakeProperty("pbr.mode.unlit", "special-modes", "pbr.mode.unlit", "boolean", true, ReadOnly),
            MakeProperty("pbr.mode.unlitColor", "special-modes", "pbr.mode.unlitColor", "vec3", [1, 1, 1], ReadOnly),
            MakeProperty("pbr.mode.gammaAlbedo", "special-modes", "pbr.mode.gammaAlbedo", "boolean", true, ReadOnly),
            MakeProperty("pbr.mode.skybox", "special-modes", "pbr.mode.skybox", "boolean", true, ReadOnly),
            MakeProperty("pbr.mode.shadowOnly", "special-modes", "pbr.mode.shadowOnly", "boolean", true, ReadOnly),
            MakeProperty("pbr.mode.shadowOnlyColor", "special-modes", "pbr.mode.shadowOnlyColor", "vec3", [0, 0, 0], ReadOnly),
            MakeProperty("pbr.mode.shadowOnlyOpacity", "special-modes", "pbr.mode.shadowOnlyOpacity", "number", 1, ReadOnly),
            MakeProperty("pbr.mode.shadowOnlyFalloff", "special-modes", "pbr.mode.shadowOnlyFalloff", "number", 0, ReadOnly),
        ];
        const properties = modeProperties;
        const inspection = MakeInspection(material, "pbr", properties, bindings);
        LiteInspectionMocks.snapshots.set(material, inspection);
        const resourceService = MakeResourceService({ source: material, inspection, scenes: [scene], bindings });
        const selectionService = MakeSelectionService();

        for (const section of new Set(bindingSections.values())) {
            const container = Render(<PbrMaterialAdapter material={material} section={section} resourceIndexService={resourceService} selectionService={selectionService} />);
            for (const [id, expectedSection] of bindingSections) {
                expect(container.textContent?.includes(id)).toBe(expectedSection === section);
            }
        }

        const modes = Render(<PbrMaterialAdapter material={material} section="special-modes" resourceIndexService={resourceService} selectionService={selectionService} />);
        modeProperties.forEach(({ id }) => expect(modes.textContent).toContain(id));
        expect(modes.querySelectorAll("input")).toHaveLength(0);
    });

    it("filters texture candidates by both accepted kind and sample category", () => {
        const material = {} as Material;
        const scene = {} as SceneContext;
        const filterable = {};
        const depth = {};
        const binding = {
            id: "shader.sampler:shadow",
            label: "Shadow Sampler",
            value: { state: "absent" },
            acceptedKinds: ["2d"],
            sampleCategory: "depth",
            viewCategory: "2d",
            directions: ["assign"],
            mutation: Editable,
            transform: { state: "unsupported", reason: "Shader samplers do not use standard transforms." },
        } as MaterialTextureBinding;
        const inspection = MakeInspection(material, "shader", [], [binding]);
        LiteInspectionMocks.snapshots.set(material, inspection);
        const textures = [
            { entity: filterable, ordinal: 1, consumers: [], inspection: { kind: "2d", sampleCategory: "float", displayName: { state: "known", value: "Filterable" } } },
            { entity: depth, ordinal: 2, consumers: [], inspection: { kind: "2d", sampleCategory: "depth", displayName: { state: "known", value: "Depth" } } },
        ] as unknown as ILiteTextureResourceRecord[];
        const resourceService = MakeResourceService({ source: material, inspection, scenes: [scene], bindings: [binding] }, textures);
        const container = Render(<ShaderMaterialAdapter material={material} section="textures" resourceIndexService={resourceService} selectionService={MakeSelectionService()} />);

        const comboBox = container.querySelector<HTMLInputElement>('[role="combobox"]')!;
        act(() => comboBox.click());
        const options = Array.from(document.querySelectorAll('[role="option"]'));
        expect(options.some((option) => option.textContent === "Depth")).toBe(true);
        expect(options.some((option) => option.textContent === "Filterable")).toBe(false);
    });

    it("refreshes unchanged edits, exposes pending/rejected states, preserves selection, and handles stale resources independently", async () => {
        const sourceA = {} as Material;
        const sourceB = {} as Material;
        const sceneA = {} as SceneContext;
        const sceneB = {} as SceneContext;
        const property = MakeProperty("material.name", "general", "Name", "string", "Material");
        const inspectionA = MakeInspection(sourceA, "standard", [property]);
        const inspectionB = MakeInspection(sourceB, "standard", [property]);
        LiteInspectionMocks.snapshots.set(sourceA, inspectionA);
        LiteInspectionMocks.snapshots.set(sourceB, inspectionB);
        const serviceA = MakeResourceService({ source: sourceA, inspection: inspectionA, scenes: [sceneA], bindings: [] });
        const serviceB = MakeResourceService({ source: sourceB, inspection: inspectionB, scenes: [sceneB], bindings: [] });
        const selection = MakeSelectionService();
        selection.selectedEntity = sourceA;
        let rejectMutation: ((reason: Error) => void) | undefined;
        LiteInspectionMocks.setProperty
            .mockResolvedValueOnce({ changed: false, mutation: "A", postMutation: "none" })
            .mockImplementationOnce(() => new Promise((_resolve, reject) => (rejectMutation = reject)));
        const first = Render(<StandardMaterialAdapter material={sourceA} section="general" resourceIndexService={serviceA} selectionService={selection} />);
        Render(<StandardMaterialAdapter material={sourceB} section="general" resourceIndexService={serviceB} selectionService={MakeSelectionService()} />);
        const setInputValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
        const input = first.querySelector<HTMLInputElement>('input[value="Material"]')!;

        await act(async () => {
            setInputValue.call(input, "No-op");
            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.blur();
            await Promise.resolve();
        });
        expect(serviceA.refresh).toHaveBeenCalledOnce();
        expect(serviceB.refresh).not.toHaveBeenCalled();

        const refreshedInput = first.querySelector<HTMLInputElement>("input")!;
        await act(async () => {
            setInputValue.call(refreshedInput, "Rejected");
            refreshedInput.dispatchEvent(new Event("input", { bubbles: true }));
            refreshedInput.blur();
            await Promise.resolve();
        });
        expect(first.textContent).toContain("Applying");
        await act(async () => {
            rejectMutation?.(new Error("Mutation rejected"));
            await Promise.resolve();
        });
        expect(first.textContent).toContain("Mutation rejected");
        expect(selection.selectedEntity).toBe(sourceA);
        expect(serviceA.refresh).toHaveBeenCalledOnce();

        const staleService = MakeResourceService(undefined);
        const stale = Render(<StandardMaterialAdapter material={sourceA} section="general" resourceIndexService={staleService} selectionService={selection} />);
        expect(stale.textContent).toContain("no longer available");
    });

    it("ignores stale material completions and invalidates pending work when selection changes", async () => {
        const material = {} as Material;
        const scene = {} as SceneContext;
        const property = MakeProperty("material.name", "general", "Name", "string", "Material");
        const inspection = MakeInspection(material, "standard", [property]);
        LiteInspectionMocks.snapshots.set(material, inspection);
        const resourceService = MakeResourceService({ source: material, inspection, scenes: [scene], bindings: [] });
        const selectionService = MakeSelectionService();
        selectionService.selectedEntity = material;
        const first = MakeDeferred<{ changed: boolean }>();
        const second = MakeDeferred<{ changed: boolean }>();
        LiteInspectionMocks.setProperty.mockImplementationOnce(() => first.promise).mockImplementationOnce(() => second.promise);
        const container = Render(<StandardMaterialAdapter material={material} section="general" resourceIndexService={resourceService} selectionService={selectionService} />);
        const setInputValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
        const commit = (value: string) => {
            const input = container.querySelector<HTMLInputElement>("input")!;
            input.focus();
            setInputValue.call(input, value);
            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.blur();
        };

        act(() => {
            commit("First");
            commit("Second");
        });
        await act(async () => {
            first.reject(new Error("obsolete failure"));
            await first.promise.catch(() => undefined);
        });
        expect(container.textContent).toContain("Applying");
        expect(container.textContent).not.toContain("obsolete failure");
        expect(resourceService.refresh).not.toHaveBeenCalled();

        act(() => {
            selectionService.selectedEntity = {};
        });
        await act(async () => {
            second.resolve({ changed: true });
            await second.promise;
        });
        expect(resourceService.refresh).not.toHaveBeenCalled();
        expect(container.textContent).not.toContain("Applying");
    });
});
