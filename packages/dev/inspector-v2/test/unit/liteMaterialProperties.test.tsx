/**
 * @vitest-environment jsdom
 */

import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const InspectionMocks = vi.hoisted(() => ({
    markDirty: vi.fn(),
    rebuild: vi.fn(),
    setStandardEmissiveTexture: vi.fn((material: Record<string, unknown>, texture: object | null) => {
        material.emissiveTexture = texture ?? undefined;
    }),
}));

vi.mock("@babylonjs/lite", async (importOriginal) => {
    const original = await importOriginal<typeof import("@babylonjs/lite")>();
    const field = (name: string) => (material: Record<string, unknown>) => material[name];
    return {
        ...original,
        getMaterialSource: (material: { source?: object }) => material.source ?? material,
        isMaterialView: (material: { source?: object }) => material.source !== undefined,
        getMaterialFamily: (material: { source?: { family?: string }; family?: string }) => material.source?.family ?? material.family,
        getStandardEmissiveTexture: field("emissiveTexture"),
        getStandardBumpTexture: field("bumpTexture"),
        getStandardSpecularTexture: field("specularTexture"),
        getStandardAmbientTexture: field("ambientTexture"),
        getStandardLightmapTexture: field("lightmapTexture"),
        getStandardOpacityTexture: field("opacityTexture"),
        getStandardReflectionTexture: field("reflectionTexture"),
        getStandardReflectionCubeTexture: field("reflectionCubeTexture"),
        getPbrAlphaCutoff: field("alphaCutoff"),
        getPbrEmissiveColor: field("emissiveColor"),
        getPbrMetallicReflectance: field("metallicReflectance"),
        getPbrClearCoat: field("clearCoat"),
        getPbrSheen: field("sheen"),
        getPbrIridescence: field("iridescence"),
        getPbrAnisotropy: field("anisotropy"),
        getPbrSubsurface: field("subsurface"),
        getPbrTransmission: (material: Record<string, any>) => material.subsurface?.refraction,
        getPbrDispersion: (material: Record<string, any>) => material.subsurface?.refraction?.dispersion,
        isPbrGammaAlbedo: field("gammaAlbedo"),
        getPbrUnlit: field("unlit"),
        isPbrSkybox: field("skybox"),
        getShadowOnly: field("shadowOnly"),
        getShaderUniform: (material: Record<string, any>, name: string) => material.uniforms?.[name],
        getShaderTexture: (material: Record<string, any>, name: string) => material.textures?.[name],
        getTextureMetadata: (texture: Record<string, unknown>) => texture.metadata,
        getTextureTransform: (texture: Record<string, unknown>) => texture.transform,
        hasTextureTransform: (texture: Record<string, unknown>) => texture.transform !== undefined,
        hasMaterialUvTransform: () => true,
        markMaterialUboDirty: InspectionMocks.markDirty,
        rebuildMaterial: InspectionMocks.rebuild,
        setStandardEmissiveTexture: InspectionMocks.setStandardEmissiveTexture,
    };
});

import { type Material, type SceneContext } from "@babylonjs/lite";
import { Observable } from "core/Misc/observable";

import { CreateMaterialDescriptorWithFamily, SetMaterialDescriptorPropertyWithFamily } from "../../src/lite/services/panes/properties/descriptors/materialDescriptor";
import { NodeMaterialDescriptor } from "../../src/lite/services/panes/properties/descriptors/nodeDescriptor";
import { PbrMaterialDescriptor } from "../../src/lite/services/panes/properties/descriptors/pbrDescriptor";
import { ShaderMaterialDescriptor } from "../../src/lite/services/panes/properties/descriptors/shaderDescriptor";
import { StandardMaterialDescriptor } from "../../src/lite/services/panes/properties/descriptors/standardDescriptor";
import { StandardMaterialAdapter } from "../../src/lite/services/panes/properties/materialAdapters/standardMaterialAdapter";
import { MaterialPropertiesServiceDefinition } from "../../src/lite/services/panes/properties/materialPropertiesService";
import { type ISceneResourceIndexService } from "../../src/lite/services/panes/scene/sceneResourceIndexService";
import { type IMaterialResourceRecord, type ITextureResourceRecord } from "../../src/lite/services/panes/scene/sceneResources";
import { type IPropertiesService } from "../../src/services/panes/properties/propertiesService";
import { type ISelectionService } from "../../src/services/selectionService";

vi.hoisted(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal(
        "matchMedia",
        vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    );
});
vi.stubGlobal("NodeFilter", window.NodeFilter);

function MakeStandard(overrides: Record<string, unknown> = {}): Material {
    return {
        family: "standard",
        name: "Standard source",
        backFaceCulling: true,
        disableLighting: false,
        alpha: 1,
        alphaCutOff: 0.4,
        diffuseColor: [1, 0.5, 0.25],
        specularColor: [1, 1, 1],
        emissiveColor: [0, 0, 0],
        ambientColor: [0, 0, 0],
        specularPower: 64,
        diffuseCoordIndex: 0,
        specularCoordIndex: 0,
        ambientCoordIndex: 0,
        lightmapCoordIndex: 1,
        bumpLevel: 1,
        ambientTexLevel: 1,
        lightmapLevel: 1,
        opacityLevel: 1,
        reflectionLevel: 1,
        reflectionCoordMode: 1,
        useLightmapAsShadowmap: false,
        opacityFromRGB: false,
        uvScale: [1, 1],
        ...overrides,
    } as unknown as Material;
}

function MakeResourceService(records: readonly IMaterialResourceRecord[], textures: readonly ITextureResourceRecord[] = []): ISceneResourceIndexService {
    const onChanged = new Observable<void>();
    return {
        index: {
            getMaterialRecord: (material: Material) => records.find((record) => record.source === material),
            getTextureRecord: (texture: object) => textures.find((record) => record.entity === texture),
            getSceneSnapshot: (scene: SceneContext) => ({ scene, materials: records.filter((record) => record.scenes.includes(scene)), textures }),
        },
        onChanged,
        onDisposed: new Observable<void>(),
        isDisposed: false,
        refresh: vi.fn(() => onChanged.notifyObservers()),
        dispose: vi.fn(),
    } as unknown as ISceneResourceIndexService;
}

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

describe("Babylon Lite material accessor descriptors", () => {
    const roots: Root[] = [];
    const containers: HTMLElement[] = [];

    beforeEach(() => {
        InspectionMocks.markDirty.mockReset();
        InspectionMocks.rebuild.mockReset();
        InspectionMocks.rebuild.mockResolvedValue(undefined);
        InspectionMocks.setStandardEmissiveTexture.mockClear();
    });

    afterEach(() => {
        roots.splice(0).forEach((root) => act(() => root.unmount()));
        containers.splice(0).forEach((container) => container.remove());
    });

    function Render(content: React.ReactNode): HTMLElement {
        const container = document.createElement("div");
        document.body.appendChild(container);
        containers.push(container);
        const root = createRoot(container);
        roots.push(root);
        act(() => root.render(<FluentProvider theme={webLightTheme}>{content}</FluentProvider>));
        return container;
    }

    it("builds Inspector-owned Standard descriptors including cube reflection", () => {
        const cube = { metadata: { kind: "cube", capabilities: {} } };
        const material = MakeStandard({ reflectionCubeTexture: cube });
        const descriptor = CreateMaterialDescriptorWithFamily(material, StandardMaterialDescriptor);

        expect(descriptor.family).toBe("standard");
        expect(descriptor.properties.map((property) => property.id)).toContain("standard.diffuseColor");
        expect(descriptor.textureBindings).toHaveLength(9);
        expect(descriptor.textureBindings.find((binding) => binding.id === "standard.reflectionCube")).toMatchObject({
            value: { state: "present", value: { entity: cube, kind: "cube" } },
            directions: ["replace", "clear", "navigate"],
        });
    });

    it("builds all 21 canonical PBR bindings and finalized family sections", () => {
        const texture = { metadata: { kind: "2d", sampleType: "float", capabilities: {} }, transform: { uOffset: 0, vOffset: 0, uScale: 1, vScale: 1, uAng: 0 } };
        const material = {
            family: "pbr",
            name: "PBR",
            lightmapTexture: texture,
            baseColorTexture: texture,
            baseColorFactor: [1, 1, 1, 1],
            emissiveColor: [0, 0, 0],
            metallicReflectance: { texture },
            clearCoat: { isEnabled: true, texture },
            sheen: { isEnabled: true, texture },
            iridescence: { isEnabled: true, texture },
            anisotropy: { isEnabled: true, texture },
            unlit: [1, 1, 1],
            subsurface: {
                translucency: { colorTexture: texture, intensityTexture: texture },
                thickness: { texture },
                refraction: { intensity: 1, texture },
            },
        } as unknown as Material;
        const descriptor = CreateMaterialDescriptorWithFamily(material, PbrMaterialDescriptor);

        expect(descriptor.textureBindings).toHaveLength(21);
        expect(new Set(descriptor.textureBindings.map((binding) => binding.id)).size).toBe(21);
        expect(descriptor.properties.map((property) => property.section)).toEqual(
            expect.arrayContaining(["clear-coat", "sheen", "iridescence", "anisotropy", "subsurface-translucency", "transmission", "special-modes"])
        );
    });

    it("derives Shader and Node rows from public declarations and handles", () => {
        const texture = { metadata: { kind: "2d", sampleType: "float", capabilities: {} } };
        const shader = {
            family: "shader",
            name: "Shader",
            uniformDecls: [{ name: "gain", type: "f32" }],
            samplerDecls: [{ name: "albedo", sampleType: "float", viewDimension: "2d" }],
            uniforms: { gain: 0.5 },
            textures: { albedo: texture },
            attributes: [],
            storageBufferDecls: [],
            defines: [],
        } as unknown as Material;
        const node = {
            family: "node",
            name: "Node",
            inputs: {
                strength: { type: "f32", value: 0.8 },
                albedo: { type: "texture2d", texture },
            },
        } as unknown as Material;

        const shaderSnapshot = CreateMaterialDescriptorWithFamily(shader, ShaderMaterialDescriptor);
        const nodeSnapshot = CreateMaterialDescriptorWithFamily(node, NodeMaterialDescriptor);
        expect(shaderSnapshot.properties.find((property) => property.label === "gain")?.value).toEqual({ state: "present", value: 0.5 });
        expect(shaderSnapshot.textureBindings.map((binding) => binding.id)).toEqual(["shader.sampler:albedo"]);
        expect(nodeSnapshot.properties.find((property) => property.label === "strength")?.value).toEqual({ state: "present", value: 0.8 });
        expect(nodeSnapshot.textureBindings.map((binding) => binding.id)).toEqual(["node.texture:albedo"]);
    });

    it("keeps source identity while inspecting and mutating the selected MaterialView", async () => {
        const scene = {} as SceneContext;
        const source = MakeStandard({ name: "Source" });
        const view = Object.assign(Object.create(source), { source, name: "View", alphaCutOff: 0.6 }) as Material;
        const descriptor = CreateMaterialDescriptorWithFamily(view, StandardMaterialDescriptor);

        expect(descriptor.source).toBe(source);
        expect(descriptor.isView).toBe(true);
        expect(descriptor.displayName).toBe("View");
        expect(descriptor.properties.find((property) => property.id === "standard.alphaCutOff")?.value).toEqual({ state: "present", value: 0.6 });

        const result = await SetMaterialDescriptorPropertyWithFamily({ scenes: [scene] }, view, "standard.alphaCutOff", 0.7, StandardMaterialDescriptor);
        expect(result).toEqual({ changed: true, mutation: "U", postMutation: "none" });
        expect((view as any).alphaCutOff).toBe(0.7);
        expect((source as any).alphaCutOff).toBe(0.4);
        expect(InspectionMocks.markDirty).toHaveBeenCalledWith(view);
    });

    it("validates complete scene ownership before rebuilding", async () => {
        const material = MakeStandard();
        await expect(SetMaterialDescriptorPropertyWithFamily({ scenes: [] }, material, "standard.backFaceCulling", false, StandardMaterialDescriptor)).rejects.toThrow(
            "at least one owning scene"
        );
        expect((material as any).backFaceCulling).toBe(true);
    });

    it("accepts synchronous rebuild completion and awaits asynchronous rebuild failures", async () => {
        const material = MakeStandard();
        const scene = { meshes: [{ material }] } as SceneContext;
        InspectionMocks.rebuild.mockReturnValueOnce(undefined);

        await expect(SetMaterialDescriptorPropertyWithFamily({ scenes: [scene] }, material, "standard.backFaceCulling", false, StandardMaterialDescriptor)).resolves.toEqual({
            changed: true,
            mutation: "R",
            postMutation: "rebuild-material",
        });
        expect(InspectionMocks.rebuild).toHaveBeenLastCalledWith(scene, material, {
            rebuildViews: true,
            rebuildFrameGraph: false,
        });

        InspectionMocks.rebuild.mockRejectedValueOnce(new Error("rebuild failed"));
        await expect(SetMaterialDescriptorPropertyWithFamily({ scenes: [scene] }, material, "standard.backFaceCulling", true, StandardMaterialDescriptor)).rejects.toThrow(
            "rebuild failed"
        );
    });

    it("renders shared controls and exact texture navigation from accessor descriptors", () => {
        const scene = {} as SceneContext;
        const texture = { metadata: { kind: "2d", sampleType: "float", capabilities: {} } };
        const material = MakeStandard({ emissiveTexture: texture });
        const materialRecord: IMaterialResourceRecord = {
            source: material,
            family: "standard",
            displayName: "Standard source",
            scenes: [scene],
            bindings: [{ id: "standard.emissive", entity: texture }],
        };
        const textureRecord: ITextureResourceRecord = {
            entity: texture,
            metadata: texture.metadata,
            ordinal: 1,
            consumers: [{ material, bindingId: "standard.emissive" }],
        };
        const resources = MakeResourceService([materialRecord], [textureRecord]);
        const selection = MakeSelectionService();
        const container = Render(<StandardMaterialAdapter material={material} section="textures" resourceIndexService={resources} selectionService={selection} />);

        expect(container.textContent).toContain("Emissive Texture");
        const open = container.querySelector('[aria-label^="Emissive Texture: open"]');
        expect(open).not.toBeNull();
        act(() => open?.dispatchEvent(new MouseEvent("click", { bubbles: true })));
        expect(selection.selectedEntity).toBe(texture);
    });

    it("uses derived controls for writable fields and preserves per-field pending and errors", async () => {
        const material = MakeStandard();
        const scene = { meshes: [{ material }] } as SceneContext;
        const resources = MakeResourceService([{ source: material, family: "standard", displayName: "Standard source", scenes: [scene], bindings: [] }]);
        const container = Render(<StandardMaterialAdapter material={material} section="general" resourceIndexService={resources} selectionService={MakeSelectionService()} />);
        const toggle = container.querySelector<HTMLInputElement>('input[type="checkbox"]');
        expect(toggle).not.toBeNull();
        let rejectRebuild: (error: Error) => void = () => {
            throw new Error("Rebuild was not started.");
        };
        InspectionMocks.rebuild.mockImplementationOnce(() => new Promise<void>((_resolve, reject) => (rejectRebuild = reject)));
        act(() => {
            toggle?.click();
        });
        expect(container.querySelectorAll('[aria-busy="true"]')).toHaveLength(1);
        expect(container.querySelector('[role="status"]')?.textContent).toContain("Back Face Culling");
        expect(toggle?.disabled).toBe(true);
        await act(async () => {
            await Promise.resolve();
        });
        expect(InspectionMocks.rebuild).toHaveBeenCalledOnce();
        await act(async () => rejectRebuild(new Error("Rebuild failed")));
        expect(container.querySelector('[role="alert"]')?.textContent).toContain("Rebuild failed");
        expect(container.querySelectorAll('[aria-busy="true"]')).toHaveLength(0);
        expect((material as { backFaceCulling: boolean }).backFaceCulling).toBe(false);
    });

    it("renders Lite color and vector tuples through existing controls", () => {
        const material = MakeStandard();
        const scene = {} as SceneContext;
        const resources = MakeResourceService([{ source: material, family: "standard", displayName: "Standard source", scenes: [scene], bindings: [] }]);
        const selection = MakeSelectionService();
        const colors = Render(<StandardMaterialAdapter material={material} section="lighting-colors" resourceIndexService={resources} selectionService={selection} />);
        expect(colors.textContent).toContain("Diffuse Color");
        expect(colors.textContent).toContain("Specular Power");
        const transform = Render(<StandardMaterialAdapter material={material} section="transform" resourceIndexService={resources} selectionService={selection} />);
        expect(transform.textContent).toContain("UV Scale");
        expect(transform.textContent).toContain("[1.00, 1.00]");
    });

    it("registers lazy family predicates without importing family descriptors in the service", () => {
        const families = ["standard", "pbr", "shader", "node"] as const;
        const materials = families.map((family) => ({ family, name: family }) as unknown as Material);
        const records = materials.map((source): IMaterialResourceRecord => ({ source, family: (source as any).family, displayName: source.name!, scenes: [], bindings: [] }));
        const registrations = new Map<string, Parameters<IPropertiesService["addSectionContent"]>[0]>();
        const propertiesService = {
            addSectionContent: vi.fn((content: Parameters<IPropertiesService["addSectionContent"]>[0]) => {
                registrations.set(content.key, content);
                return { dispose: vi.fn() };
            }),
        } as unknown as IPropertiesService;
        const service = MaterialPropertiesServiceDefinition.factory(propertiesService, MakeResourceService(records), MakeSelectionService());

        families.forEach((family, index) => {
            expect(registrations.get(`Babylon Lite ${family} Material Properties`)?.predicate(materials[index])).toBe(true);
        });
        service.dispose();
    });
});
