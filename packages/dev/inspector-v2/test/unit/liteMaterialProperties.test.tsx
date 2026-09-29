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
    setStandardReflectionCubeTexture: vi.fn((material: Record<string, unknown>, texture: object | null) => {
        material.reflectionCubeTexture = texture ?? undefined;
    }),
    setShaderUniform: vi.fn((material: Record<string, any>, name: string, value: number | number[]) => {
        material.uniforms[name] = value;
    }),
    setShaderTexture: vi.fn((material: Record<string, any>, name: string, texture: object | null) => {
        material.textures[name] = texture;
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
        setStandardReflectionCubeTexture: InspectionMocks.setStandardReflectionCubeTexture,
        setShaderUniform: InspectionMocks.setShaderUniform,
        setShaderTexture: InspectionMocks.setShaderTexture,
    };
});

import { type Material, type SceneContext } from "@babylonjs/lite";
import { Observable } from "core/Misc/observable";

import { StandardMaterialAdapter } from "../../src/lite/services/panes/properties/materials/standardMaterialProperties";
import { PbrMaterialAdapter } from "../../src/lite/services/panes/properties/materials/pbrMaterialProperties";
import { ShaderMaterialAdapter } from "../../src/lite/services/panes/properties/materials/shaderMaterialProperties";
import { NodeMaterialAdapter } from "../../src/lite/services/panes/properties/materials/nodeMaterialProperties";
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

describe("Babylon Lite material properties", () => {
    const roots: Root[] = [];
    const containers: HTMLElement[] = [];

    beforeEach(() => {
        InspectionMocks.markDirty.mockReset();
        InspectionMocks.rebuild.mockReset();
        InspectionMocks.rebuild.mockResolvedValue(undefined);
        InspectionMocks.setStandardEmissiveTexture.mockClear();
        InspectionMocks.setStandardReflectionCubeTexture.mockClear();
        InspectionMocks.setShaderUniform.mockClear();
        InspectionMocks.setShaderTexture.mockClear();
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

    it("renders native-accessor controls and exact texture navigation", () => {
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

    it("uses direct Standard texture slots for clear, rebuild, and cube navigation", async () => {
        const texture = { metadata: { kind: "2d", sampleType: "float", capabilities: {} } };
        const cube = { metadata: { kind: "cube", sampleType: "float", capabilities: {} } };
        const material = MakeStandard({ emissiveTexture: texture, reflectionCubeTexture: cube });
        const record: IMaterialResourceRecord = {
            source: material,
            family: "standard",
            displayName: "Standard source",
            scenes: [{ meshes: [{ material }] } as SceneContext],
            bindings: [
                { id: "standard.emissive", entity: texture },
                { id: "standard.reflectionCube", entity: cube },
            ],
        };
        const textures: ITextureResourceRecord[] = [texture, cube].map((entity, ordinal) => ({
            entity,
            metadata: entity.metadata,
            ordinal: ordinal + 1,
            consumers: [{ material, bindingId: ordinal ? "standard.reflectionCube" : "standard.emissive" }],
        }));
        const resources = MakeResourceService([record], textures);
        const selection = MakeSelectionService();
        const container = Render(<StandardMaterialAdapter material={material} section="textures" resourceIndexService={resources} selectionService={selection} />);
        act(() => container.querySelector<HTMLButtonElement>('[aria-label="Clear Emissive Texture"]')?.click());
        await act(async () => {
            await Promise.resolve();
        });
        expect(InspectionMocks.setStandardEmissiveTexture).toHaveBeenCalledWith(material, null);
        expect(InspectionMocks.rebuild).toHaveBeenCalledWith(record.scenes[0], material, { rebuildViews: true, rebuildFrameGraph: false });
        act(() => container.querySelector<HTMLElement>('[aria-label^="Reflection Cube Texture: open"]')?.click());
        expect(selection.selectedEntity).toBe(cube);
        expect(InspectionMocks.setStandardReflectionCubeTexture).not.toHaveBeenCalled();
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

    it("writes selected MaterialView fields without mutating the indexed source", async () => {
        const source = MakeStandard({ name: "Source" });
        const view = Object.assign(Object.create(source), { source, name: "View", alphaCutOff: 0.6 }) as Material;
        const scene = { meshes: [{ material: view }] } as SceneContext;
        const resources = MakeResourceService([{ source, family: "standard", displayName: "Source", scenes: [scene], bindings: [] }]);
        const container = Render(<StandardMaterialAdapter material={view} section="transparency" resourceIndexService={resources} selectionService={MakeSelectionService()} />);
        const input = container.querySelector<HTMLInputElement>('input[value="0.6"]');
        expect(input).not.toBeNull();
        const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
        await act(async () => {
            input?.focus();
            setValue.call(input, "0.7");
            input?.dispatchEvent(new Event("input", { bubbles: true }));
            input?.blur();
            await Promise.resolve();
        });
        expect((view as { alphaCutOff: number }).alphaCutOff).toBe(0.7);
        expect((source as { alphaCutOff: number }).alphaCutOff).toBe(0.4);
        expect(InspectionMocks.markDirty).toHaveBeenCalledWith(view);
    });

    it("rejects rebuild edits when the indexed material has no owning scene", async () => {
        const material = MakeStandard();
        const resources = MakeResourceService([{ source: material, family: "standard", displayName: "Standard source", scenes: [], bindings: [] }]);
        const container = Render(<StandardMaterialAdapter material={material} section="general" resourceIndexService={resources} selectionService={MakeSelectionService()} />);
        await act(async () => {
            container.querySelector<HTMLInputElement>('input[type="checkbox"]')?.click();
            await Promise.resolve();
        });
        expect((material as { backFaceCulling: boolean }).backFaceCulling).toBe(true);
        expect(container.querySelector('[role="alert"]')?.textContent).toContain("at least one owning scene");
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

    it("renders PBR fields directly and keeps one-way modes read-only", async () => {
        const material = { family: "pbr", name: "PBR", doubleSided: false, shadowOnly: true } as unknown as Material;
        const scene = { meshes: [{ material }] } as SceneContext;
        const resources = MakeResourceService([{ source: material, family: "pbr", displayName: "PBR", scenes: [scene], bindings: [] }]);
        const selection = MakeSelectionService();
        const general = Render(<PbrMaterialAdapter material={material} section="general" resourceIndexService={resources} selectionService={selection} />);
        expect(general.textContent).toContain("Double Sided");
        await act(async () => {
            general.querySelector<HTMLInputElement>('input[type="checkbox"]')?.click();
            await Promise.resolve();
        });
        expect((material as { doubleSided: boolean }).doubleSided).toBe(true);
        expect(InspectionMocks.rebuild).toHaveBeenCalledWith(scene, material, { rebuildViews: true, rebuildFrameGraph: false });
        const modes = Render(<PbrMaterialAdapter material={material} section="special-modes" resourceIndexService={resources} selectionService={selection} />);
        expect(modes.textContent).toContain("Shadow Only");
        expect(modes.querySelector("input")).toBeNull();
    });

    it("keeps PBR texture slots with unsupported clear directions navigable", () => {
        const texture = { metadata: { kind: "2d", sampleType: "float", capabilities: {} } };
        const material = {
            family: "pbr",
            name: "PBR",
            metallicReflectance: { texture },
            lightmapTexture: texture,
        } as unknown as Material;
        const scene = { meshes: [{ material }] } as SceneContext;
        const resources = MakeResourceService(
            [
                {
                    source: material,
                    family: "pbr",
                    displayName: "PBR",
                    scenes: [scene],
                    bindings: [
                        { id: "pbr.metallicReflectance", entity: texture },
                        { id: "pbr.lightmap", entity: texture },
                    ],
                },
            ],
            [{ entity: texture, metadata: texture.metadata, ordinal: 1, consumers: [{ material, bindingId: "pbr.metallicReflectance" }] }]
        );
        const selection = MakeSelectionService();
        const metallic = Render(<PbrMaterialAdapter material={material} section="metallic-reflectance" resourceIndexService={resources} selectionService={selection} />);
        expect(metallic.querySelector('[aria-label="Clear Metallic Reflectance Texture"]')).toBeNull();
        act(() => metallic.querySelector<HTMLElement>('[aria-label^="Metallic Reflectance Texture: open"]')?.click());
        expect(selection.selectedEntity).toBe(texture);
        const lightmap = Render(<PbrMaterialAdapter material={material} section="lightmap" resourceIndexService={resources} selectionService={selection} />);
        expect(lightmap.querySelector('[aria-label="Clear Lightmap Texture"]')).toBeNull();
    });

    it("discovers Shader uniforms and samplers without mutating the live vector on edit", async () => {
        const original = new Float32Array([1, 2]);
        const texture = { metadata: { kind: "2d", sampleType: "float", capabilities: {} } };
        const shader = {
            family: "shader",
            name: "Shader",
            uniformDecls: [{ name: "offset", type: "vec2<f32>" }],
            samplerDecls: [{ name: "albedo", sampleType: "float", viewDimension: "2d" }],
            uniforms: { offset: original },
            textures: { albedo: texture },
        } as unknown as Material;
        const scene = { meshes: [{ material: shader }] } as SceneContext;
        const record: IMaterialResourceRecord = {
            source: shader,
            family: "shader",
            displayName: "Shader",
            scenes: [scene],
            bindings: [{ id: "shader.sampler:albedo", entity: texture }],
        };
        const resources = MakeResourceService(
            [record],
            [{ entity: texture, metadata: texture.metadata, ordinal: 1, consumers: [{ material: shader, bindingId: "shader.sampler:albedo" }] }]
        );
        const selection = MakeSelectionService();
        const inputs = Render(<ShaderMaterialAdapter material={shader} section="inputs" resourceIndexService={resources} selectionService={selection} />);
        expect(inputs.textContent).toContain("offset");
        act(() => inputs.querySelector<HTMLButtonElement>('[aria-label="Expand/Collapse property"]')?.click());
        const edit = inputs.querySelectorAll<HTMLInputElement>("input")[0];
        expect(edit).toBeDefined();
        const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
        await act(async () => {
            edit.focus();
            setValue.call(edit, "3");
            edit.dispatchEvent(new Event("input", { bubbles: true }));
            edit.blur();
            await Promise.resolve();
        });
        expect(original[0]).toBe(1);
        expect(InspectionMocks.setShaderUniform).toHaveBeenCalledWith(shader, "offset", expect.arrayContaining([3, 2]));
        const bindings = Render(<ShaderMaterialAdapter material={shader} section="textures" resourceIndexService={resources} selectionService={selection} />);
        act(() => bindings.querySelector<HTMLElement>('[aria-label^="albedo: open"]')?.click());
        expect(selection.selectedEntity).toBe(texture);
    });

    it("discovers sorted Node inputs and their texture links without descriptors", () => {
        const texture = { metadata: { kind: "2d", sampleType: "float", capabilities: {} } };
        const node = {
            family: "node",
            name: "Node",
            inputs: {
                strength: { type: "f32", value: 0.8 },
                albedo: { type: "texture2d", texture },
            },
        } as unknown as Material;
        const scene = { meshes: [{ material: node }] } as SceneContext;
        const record: IMaterialResourceRecord = {
            source: node,
            family: "node",
            displayName: "Node",
            scenes: [scene],
            bindings: [{ id: "node.texture:albedo", entity: texture }],
        };
        const resources = MakeResourceService(
            [record],
            [{ entity: texture, metadata: texture.metadata, ordinal: 1, consumers: [{ material: node, bindingId: "node.texture:albedo" }] }]
        );
        const selection = MakeSelectionService();
        const container = Render(<NodeMaterialAdapter material={node} section="inputs" resourceIndexService={resources} selectionService={selection} />);
        expect(container.textContent).toContain("strength");
        expect(container.textContent).toContain("albedo");
        expect(container.textContent!.indexOf("albedo")).toBeLessThan(container.textContent!.indexOf("strength"));
        act(() => container.querySelector<HTMLElement>('[aria-label^="albedo: open"]')?.click());
        expect(selection.selectedEntity).toBe(texture);
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
