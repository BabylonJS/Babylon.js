import { NullEngine } from "core/Engines";
import { Scene } from "core/scene";
import { FlowGraphCoordinator } from "core/FlowGraph/flowGraphCoordinator";
import { Matrix, Quaternion, Vector2, Vector3 } from "core/Maths";
import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { FreeCamera } from "core/Cameras/freeCamera";
import "core/Culling/ray";
import { Logger } from "core/Misc";
import { ParseFlowGraphAsync } from "core/FlowGraph";
import { InteractivityGraphToFlowGraphParser } from "loaders/glTF/2.0/Extensions/KHR_interactivity/interactivityGraphParser";
import "loaders/glTF/2.0/glTFLoaderAnimation";
import "loaders/glTF/2.0/Extensions/KHR_animation_pointer.data";
import { _AddInteractivityObjectModel } from "loaders/glTF/2.0/Extensions/KHR_interactivity";
import { GetPathToObjectConverter, _RetainGLTFMaterialTextureSources } from "loaders/glTF/2.0/Extensions/objectModelMapping";
import { IKHRInteractivity_Declaration, IKHRInteractivity_Graph, IKHRInteractivity_Node, IKHRInteractivity_Type, IKHRInteractivity_Variable } from "babylonjs-gltf2interface";
import { Mesh } from "core/Meshes/mesh";
import { TransformNode } from "core/Meshes/transformNode";
import { MorphTarget } from "core/Morph/morphTarget";
import { MorphTargetManager } from "core/Morph/morphTargetManager";
import { FlowGraphInteger } from "core/FlowGraph/CustomTypes/flowGraphInteger.pure";
import { type IGLTF } from "loaders/glTF/2.0/glTFLoaderInterfaces";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { OpenPBRMaterial } from "core/Materials/PBR/openpbrMaterial";
import { Color3, Color4 } from "core/Maths/math.color";
import { Constants } from "core/Engines/constants";
import { Texture } from "core/Materials/Textures/texture";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * These tests will check the connection between interactivity's object model and pointers to the flow graph.
 * It will check pointer get, pointer set, interpolation, and the JSON pointers specified in the interactivity specs.
 */

describe("glTF interactivity Object Model", () => {
    let engine: NullEngine;
    let scene: Scene;
    const log: ReturnType<typeof vi.spyOn> = vi.spyOn(Logger, "Log").mockImplementation(() => {});
    const errorLog: ReturnType<typeof vi.spyOn> = vi.spyOn(Logger, "Error").mockImplementation(() => {});
    let renderInterval: any;

    async function generateSimpleNodeGraph(
        mockGltf: any, //Partial<IGLTF>,
        declarations: IKHRInteractivity_Declaration[],
        nodes: IKHRInteractivity_Node[],
        types: IKHRInteractivity_Type[] = [],
        variables: IKHRInteractivity_Variable[] = []
    ) {
        const ig: IKHRInteractivity_Graph = {
            declarations: [...declarations, { op: "event/onStart" }],
            types,
            nodes: [
                ...nodes,
                {
                    declaration: declarations.length,
                    flows: {
                        out: {
                            node: 0, // first node provided should be the flow node tested
                            socket: "in",
                        },
                    },
                },
            ],
            variables,
        };

        const pathConverter = GetPathToObjectConverter(mockGltf, (mapping) => _AddInteractivityObjectModel(scene, 60, mapping));
        const i2fg = new InteractivityGraphToFlowGraphParser(ig, mockGltf);
        const json = i2fg.serializeToFlowGraph();
        const coordinator = new FlowGraphCoordinator({ scene });
        const graph = await ParseFlowGraphAsync(json, { coordinator, pathConverter });
        graph.getContext(0).enableLogging = true;
        graph.getContext(0).logger!.logToConsole = false;

        coordinator.start();

        return {
            graph,
            logger: graph.getContext(0).logger!,
        };
    }

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        new ArcRotateCamera("", Math.PI / 2, Math.PI / 2, 4, new Vector3(0, 0, 0));
        log.mockClear();
        errorLog.mockClear();
        renderInterval = setInterval(() => scene?.render(), 16);
    });

    afterEach(() => {
        clearInterval(renderInterval);
        scene.dispose();
        engine.dispose();
    });

    // basic JSON Pointer tests
    it("should reject a relative JSON pointer even when a ref value could prefix it", async () => {
        const mesh = new Mesh("mesh", scene);
        const mockGltf: any = {
            nodes: [
                {
                    _babylonTransformNode: mesh,
                },
            ],
        };

        await expect(
            generateSimpleNodeGraph(
                mockGltf,
                [{ op: "pointer/get" }, { op: "flow/log", extension: "BABYLON" }],
                [
                    {
                        declaration: 1,
                        values: {
                            message: {
                                node: 1,
                                socket: "value",
                            },
                        },
                    },
                    {
                        declaration: 0,
                        configuration: {
                            pointer: { value: ["translation"] },
                            type: { value: [0] },
                        },
                        values: {
                            nodeRef: {
                                value: ["/nodes/0/"],
                                type: 1,
                            },
                        },
                    },
                ],
                [{ signature: "float3" }, { signature: "ref" }]
            )
        ).rejects.toThrow();
    });

    it("should ignore anisotropy strength access when the Babylon material is unavailable", () => {
        const converter = GetPathToObjectConverter({
            materials: [
                {
                    extensions: {
                        KHR_materials_anisotropy: {},
                    },
                },
            ],
        } as any);
        const accessor = converter.convert("/materials/0/extensions/KHR_materials_anisotropy/anisotropyStrength");

        expect(accessor.info.get(accessor.object)).toBeUndefined();
        expect(() => accessor.info.set?.(0.5, accessor.object)).not.toThrow();
    });

    it("writes material scalars, colors and flags to all loaded variants while preserving explicit fill-mode selection", () => {
        const triangle = new PBRMaterial("triangle", scene);
        const lines = new PBRMaterial("lines", scene);
        triangle.metallic = 0.2;
        lines.metallic = 0.4;
        const gltf: IGLTF = {
            asset: { version: "2.0" },
            materials: [
                {
                    index: 0,
                    pbrMetallicRoughness: {},
                    _data: {
                        [Constants.MATERIAL_TriangleFillMode]: { babylonMaterial: triangle, babylonMeshes: [], promise: Promise.resolve() },
                        [Constants.MATERIAL_LineListDrawMode]: { babylonMaterial: lines, babylonMeshes: [], promise: Promise.resolve() },
                    },
                },
            ],
        };
        const converter = GetPathToObjectConverter(gltf);
        const metallic = converter.convert("/materials/0/pbrMetallicRoughness/metallicFactor");
        const payload = Object.freeze({ fillMode: Constants.MATERIAL_LineListDrawMode });
        expect(metallic.info.get(metallic.object)).toBe(0.2);
        expect(metallic.info.get(metallic.object, undefined, payload)).toBe(0.4);
        metallic.info.set!(0.9, metallic.object);
        expect([triangle.metallic, lines.metallic]).toEqual([0.9, 0.9]);
        metallic.info.set!(0.7, metallic.object, undefined, payload);
        expect([triangle.metallic, lines.metallic]).toEqual([0.9, 0.7]);
        const color = converter.convert("/materials/0/pbrMetallicRoughness/baseColorFactor");
        color.info.set!(new Color4(0.2, 0.4, 0.6, 0.8), color.object);
        const flag = converter.convert("/materials/0/doubleSided");
        flag.info.set!(true, flag.object);
        for (const material of [triangle, lines]) {
            expect(material.albedoColor.asArray()).toEqual([0.2, 0.4, 0.6]);
            expect(material.alpha).toBe(0.8);
            expect(material.backFaceCulling).toBe(false);
        }
    });

    it("writes material texture values to all loaded variants and reads the selected variant", () => {
        const triangle = new PBRMaterial("triangle", scene);
        const lines = new PBRMaterial("lines", scene);
        const triangleTexture = new Texture(null, scene);
        const lineTexture = new Texture(null, scene);
        triangle.bumpTexture = triangleTexture;
        lines.bumpTexture = lineTexture;
        triangleTexture.level = 0.2;
        lineTexture.level = 0.4;
        const converter = GetPathToObjectConverter({
            asset: { version: "2.0" },
            materials: [
                {
                    index: 0,
                    normalTexture: { index: 0 },
                    _data: {
                        [Constants.MATERIAL_TriangleFillMode]: { babylonMaterial: triangle, babylonMeshes: [], promise: Promise.resolve() },
                        [Constants.MATERIAL_LineListDrawMode]: { babylonMaterial: lines, babylonMeshes: [], promise: Promise.resolve() },
                    },
                },
            ],
        });
        const payload = Object.freeze({ fillMode: Constants.MATERIAL_LineListDrawMode });
        const scale = converter.convert("/materials/0/normalTexture/scale");
        expect(scale.info.get(scale.object, undefined, payload)).toBe(0.4);
        scale.info.set!(0.6, scale.object);
        expect([triangleTexture.level, lineTexture.level]).toEqual([0.6, 0.6]);
        const rotation = converter.convert("/materials/0/normalTexture/extensions/KHR_texture_transform/rotation");
        rotation.info.set!(0.8, rotation.object);
        expect([triangleTexture.wAng, lineTexture.wAng]).toEqual([-0.8, -0.8]);
        rotation.info.set!(0.3, rotation.object, undefined, payload);
        expect([triangleTexture.wAng, lineTexture.wAng]).toEqual([-0.8, -0.3]);
        expect(rotation.info.get(rotation.object, undefined, payload)).toBe(0.3);
    });

    describe("runtime OpenPBR material pointers", () => {
        function createMaterialPointers(alphaMode: "OPAQUE" | "MASK" | "BLEND" = "BLEND", triangle = true) {
            const pbr = new PBRMaterial("pbr", scene);
            const openpbr = new OpenPBRMaterial("openpbr", scene);
            openpbr.ambientOcclusionTexture = new Texture(null, scene);
            const material = {
                index: 0,
                alphaMode,
                pbrMetallicRoughness: { baseColorTexture: { index: 0 }, metallicRoughnessTexture: { index: 0 } },
                normalTexture: { index: 0 },
                occlusionTexture: { index: 0 },
                emissiveTexture: { index: 0 },
                extensions: {
                    KHR_materials_anisotropy: { anisotropyTexture: { index: 0 } },
                    KHR_materials_clearcoat: { clearcoatTexture: { index: 0 }, clearcoatNormalTexture: { index: 0 }, clearcoatRoughnessTexture: { index: 0 } },
                    KHR_materials_dispersion: {},
                    KHR_materials_emissive_strength: {},
                    KHR_materials_ior: {},
                    KHR_materials_iridescence: { iridescenceTexture: { index: 0 }, iridescenceThicknessTexture: { index: 0 } },
                    KHR_materials_sheen: { sheenColorTexture: { index: 0 }, sheenRoughnessTexture: { index: 0 } },
                    KHR_materials_specular: { specularTexture: { index: 0 }, specularColorTexture: { index: 0 } },
                    KHR_materials_transmission: { transmissionTexture: { index: 0 } },
                    KHR_materials_diffuse_transmission: { diffuseTransmissionTexture: { index: 0 }, diffuseTransmissionColorTexture: { index: 0 } },
                    KHR_materials_volume: { thicknessTexture: { index: 0 } },
                },
                _data: {
                    ...(triangle ? { [Constants.MATERIAL_TriangleFillMode]: { babylonMaterial: pbr, babylonMeshes: [], promise: Promise.resolve() } } : {}),
                    [Constants.MATERIAL_LineListDrawMode]: { babylonMaterial: openpbr, babylonMeshes: [], promise: Promise.resolve() },
                },
            };
            const gltf = { asset: { version: "2.0" }, materials: [material] };
            const converter = GetPathToObjectConverter(gltf);
            return {
                pbr,
                openpbr,
                gltf,
                pointer: (path: string) => converter.convert(`/materials/0/${path}`),
                payload: Object.freeze({ fillMode: Constants.MATERIAL_LineListDrawMode }),
            };
        }

        const scalarCases: [string, (material: OpenPBRMaterial) => number][] = [
            ["alphaCutoff", (m) => m.alphaCutOff],
            ["pbrMetallicRoughness/metallicFactor", (m) => m.baseMetalness],
            ["pbrMetallicRoughness/roughnessFactor", (m) => m.specularRoughness],
            ["occlusionTexture/strength", (m) => m.ambientOcclusionTexture!.level],
            ["extensions/KHR_materials_anisotropy/anisotropyStrength", (m) => m.specularRoughnessAnisotropy],
            ["extensions/KHR_materials_anisotropy/anisotropyRotation", (m) => m.geometryTangentAngle],
            ["extensions/KHR_materials_clearcoat/clearcoatFactor", (m) => m.coatWeight],
            ["extensions/KHR_materials_clearcoat/clearcoatRoughnessFactor", (m) => m.coatRoughness],
            ["extensions/KHR_materials_dispersion/dispersion", (m) => m.transmissionDispersionScale],
            ["extensions/KHR_materials_emissive_strength/emissiveStrength", (m) => m.emissionLuminance],
            ["extensions/KHR_materials_ior/ior", (m) => m.specularIor],
            ["extensions/KHR_materials_iridescence/iridescenceFactor", (m) => m.thinFilmWeight],
            ["extensions/KHR_materials_iridescence/iridescenceIor", (m) => m.thinFilmIor],
            ["extensions/KHR_materials_iridescence/iridescenceThicknessMinimum", (m) => m.thinFilmThicknessMin * 1000],
            ["extensions/KHR_materials_iridescence/iridescenceThicknessMaximum", (m) => m.thinFilmThickness * 1000],
            ["extensions/KHR_materials_sheen/sheenRoughnessFactor", (m) => m.fuzzRoughness],
            ["extensions/KHR_materials_specular/specularFactor", (m) => m.specularWeight],
            ["extensions/KHR_materials_transmission/transmissionFactor", (m) => m.transmissionWeight],
            ["extensions/KHR_materials_diffuse_transmission/diffuseTransmissionFactor", (m) => m.subsurfaceWeight],
            ["extensions/KHR_materials_volume/attenuationDistance", (m) => m.transmissionDepth],
            ["extensions/KHR_materials_volume/thicknessFactor", (m) => m.geometryThickness],
        ];
        it.each(scalarCases)("reads and writes %s for mixed material implementations", (path, read) => {
            const { openpbr, pointer, payload } = createMaterialPointers();
            const accessor = pointer(path);
            accessor.info.set!(0.7, accessor.object);
            expect(read(openpbr)).toBeCloseTo(0.7);
            expect(accessor.info.get(accessor.object)).toBeCloseTo(0.7);
            expect(accessor.info.get(accessor.object, undefined, payload)).toBeCloseTo(0.7);
            accessor.info.set!(0.4, accessor.object, undefined, payload);
            expect(read(openpbr)).toBeCloseTo(0.4);
            expect(accessor.info.get(accessor.object)).toBeCloseTo(0.7);
            expect(accessor.info.getTarget?.(accessor.object, undefined, payload)).toBe(openpbr);
        });

        const colorCases: [string, (material: OpenPBRMaterial) => Color3][] = [
            ["emissiveFactor", (m) => m.emissionColor],
            ["extensions/KHR_materials_sheen/sheenColorFactor", (m) => m.fuzzColor],
            ["extensions/KHR_materials_specular/specularColorFactor", (m) => m.specularColor],
            ["extensions/KHR_materials_diffuse_transmission/diffuseTransmissionColorFactor", (m) => m.subsurfaceColor],
            ["extensions/KHR_materials_volume/attenuationColor", (m) => m.transmissionColor],
        ];
        it.each(colorCases)("reads and writes %s colors", (path, read) => {
            const { openpbr, pointer, payload } = createMaterialPointers();
            const accessor = pointer(path);
            accessor.info.set!(new Color3(0.2, 0.4, 0.6), accessor.object);
            expect(read(openpbr).asArray()).toEqual([0.2, 0.4, 0.6]);
            expect(accessor.info.get(accessor.object, undefined, payload).asArray()).toEqual([0.2, 0.4, 0.6]);
            accessor.info.set!(Color3.White(), accessor.object, undefined, payload);
            expect(read(openpbr).asArray()).toEqual([1, 1, 1]);
        });

        it.each(["OPAQUE", "MASK", "BLEND"] as const)("uses geometry opacity without changing material alpha for %s", (alphaMode) => {
            const { pbr, openpbr, pointer, payload } = createMaterialPointers(alphaMode);
            openpbr.alpha = 0.9;
            const accessor = pointer("pbrMetallicRoughness/baseColorFactor");
            accessor.info.set!(new Color4(0.2, 0.4, 0.6, 0.3), accessor.object);
            expect(openpbr.baseColor.asArray()).toEqual([0.2, 0.4, 0.6]);
            expect(openpbr.geometryOpacity).toBe(alphaMode === "OPAQUE" ? 1 : 0.3);
            expect(openpbr.alpha).toBe(0.9);
            expect(pbr.alpha).toBe(0.3);
            expect(accessor.info.get(accessor.object, undefined, payload).asArray()).toEqual([0.2, 0.4, 0.6, alphaMode === "OPAQUE" ? 1 : 0.3]);
        });

        it("updates thin-surface transmission tint, including transmission enabled after a color write", () => {
            const { openpbr, pointer, payload } = createMaterialPointers();
            openpbr.geometryThinWalled = 1;
            const base = pointer("pbrMetallicRoughness/baseColorFactor");
            base.info.set!(new Color4(0.2, 0.4, 0.6, 1), base.object);
            const transmission = pointer("extensions/KHR_materials_transmission/transmissionFactor");
            transmission.info.set!(0.5, transmission.object);
            expect(openpbr.transmissionColor.asArray()).toEqual([0.2, 0.4, 0.6]);
            base.info.set!(new Color4(0.3, 0.5, 0.7, 1), base.object, undefined, payload);
            expect(openpbr.transmissionColor.asArray()).toEqual([0.3, 0.5, 0.7]);
        });

        it("preserves volumetric attenuation tint when base color changes", () => {
            const { openpbr, pointer, payload } = createMaterialPointers();
            openpbr.geometryThinWalled = 0;
            openpbr.transmissionDepth = 2;
            openpbr.transmissionWeight = 0.5;
            openpbr.transmissionColor = new Color3(0.7, 0.8, 0.9);
            const accessor = pointer("pbrMetallicRoughness/baseColorFactor");
            accessor.info.set!(new Color4(0.2, 0.4, 0.6, 1), accessor.object, undefined, payload);
            expect(openpbr.transmissionColor.asArray()).toEqual([0.7, 0.8, 0.9]);
        });

        it("does not mutate base color when attenuation replaces a base-derived transmission tint", () => {
            const { openpbr, pointer, payload } = createMaterialPointers();
            openpbr.transmissionWeight = 0.5;
            openpbr.geometryThinWalled = 1;
            const base = pointer("pbrMetallicRoughness/baseColorFactor");
            base.info.set!(new Color4(0.2, 0.4, 0.6, 1), base.object, undefined, payload);
            const attenuation = pointer("extensions/KHR_materials_volume/attenuationColor");
            attenuation.info.set!(new Color3(0.7, 0.8, 0.9), attenuation.object, undefined, payload);
            expect(openpbr.baseColor.asArray()).toEqual([0.2, 0.4, 0.6]);
            expect(openpbr.transmissionColor.asArray()).toEqual([0.7, 0.8, 0.9]);
        });

        it("updates base-derived transmission tint without attenuation depth even on a thick surface", () => {
            const { openpbr, pointer, payload } = createMaterialPointers();
            openpbr.geometryThinWalled = 0;
            openpbr.transmissionDepth = 0;
            openpbr.transmissionWeight = 0.5;
            const accessor = pointer("pbrMetallicRoughness/baseColorFactor");
            accessor.info.set!(new Color4(0.2, 0.4, 0.6, 1), accessor.object, undefined, payload);
            expect(openpbr.transmissionColor.asArray()).toEqual([0.2, 0.4, 0.6]);
        });

        it("stops sharing base-derived tint when attenuation depth becomes positive", () => {
            const { openpbr, pointer, payload } = createMaterialPointers();
            openpbr.geometryThinWalled = 0;
            openpbr.transmissionDepth = 0;
            openpbr.transmissionWeight = 0.5;
            const base = pointer("pbrMetallicRoughness/baseColorFactor");
            base.info.set!(new Color4(0.2, 0.4, 0.6, 1), base.object, undefined, payload);
            const distance = pointer("extensions/KHR_materials_volume/attenuationDistance");
            distance.info.set!(2, distance.object, undefined, payload);
            base.info.set!(new Color4(0.3, 0.5, 0.7, 1), base.object, undefined, payload);
            expect(openpbr.transmissionColor.asArray()).toEqual([0.2, 0.4, 0.6]);
            distance.info.set!(0, distance.object, undefined, payload);
            expect(openpbr.transmissionColor.asArray()).toEqual([0.3, 0.5, 0.7]);
        });

        it("writes double-sided state to both implementations without adding PBR-only properties to OpenPBR", () => {
            const { pbr, openpbr, pointer, payload } = createMaterialPointers();
            const accessor = pointer("doubleSided");
            accessor.info.set!(true, accessor.object);
            expect([pbr.backFaceCulling, openpbr.backFaceCulling]).toEqual([false, false]);
            expect(accessor.info.get(accessor.object, undefined, payload)).toBe(true);
            expect("albedoColor" in openpbr).toBe(false);
            expect("metallic" in openpbr).toBe(false);
            expect("roughness" in openpbr).toBe(false);
            expect("ambientTextureStrength" in openpbr).toBe(false);
        });

        it("treats an omitted alpha mode as opaque", () => {
            const { openpbr, pointer, gltf, payload } = createMaterialPointers();
            Reflect.deleteProperty(gltf.materials[0], "alphaMode");
            const accessor = pointer("pbrMetallicRoughness/baseColorFactor");
            accessor.info.set!(new Color4(0.2, 0.4, 0.6, 0.3), accessor.object, undefined, payload);
            expect(openpbr.geometryOpacity).toBe(1);
        });

        it.each([true, false])("runs graph pointer/set and pointer/get with triangle material present: %s", async (triangle) => {
            const { gltf, pbr, openpbr } = createMaterialPointers("BLEND", triangle);
            await generateSimpleNodeGraph(
                gltf,
                [{ op: "pointer/set" }, { op: "pointer/get" }, { op: "flow/log", extension: "BABYLON" }],
                [
                    {
                        declaration: 0,
                        configuration: { pointer: { value: ["/materials/0/pbrMetallicRoughness/metallicFactor"] } },
                        flows: { out: { node: 2, socket: "in" } },
                        values: { value: { value: [0.6], type: 0 } },
                    },
                    {
                        declaration: 1,
                        configuration: { pointer: { value: ["/materials/0/pbrMetallicRoughness/metallicFactor"] }, type: { value: [0] } },
                    },
                    { declaration: 2, values: { message: { node: 1, socket: "value" } } },
                ],
                [{ signature: "float" }]
            );
            expect(log).toHaveBeenCalledWith(0.6);
            if (triangle) {
                expect(pbr.metallic).toBe(0.6);
            }
            expect(openpbr.baseMetalness).toBe(0.6);
        });

        it("falls back to the actual available fill mode and never substitutes an explicitly missing mode", () => {
            const { openpbr, pointer } = createMaterialPointers("BLEND", false);
            const accessor = pointer("pbrMetallicRoughness/metallicFactor");
            accessor.info.set!(0.6, accessor.object);
            expect(openpbr.baseMetalness).toBe(0.6);
            expect(accessor.info.get(accessor.object)).toBe(0.6);
            expect(accessor.info.getTarget?.(accessor.object)).toBe(openpbr);
            expect(accessor.info.getTarget?.(accessor.object, undefined, { fillMode: Constants.MATERIAL_TriangleFillMode })).toBeUndefined();
        });

        const textureCases: [string, (material: OpenPBRMaterial, texture: Texture | null) => void][] = [
            ["pbrMetallicRoughness/baseColorTexture", (m, t) => (m.baseColorTexture = t)],
            ["pbrMetallicRoughness/metallicRoughnessTexture", (m, t) => (m.baseMetalnessTexture = t)],
            ["normalTexture", (m, t) => (m.geometryNormalTexture = t)],
            ["occlusionTexture", (m, t) => (m.ambientOcclusionTexture = t)],
            ["emissiveTexture", (m, t) => (m.emissionColorTexture = t)],
            ["extensions/KHR_materials_anisotropy/anisotropyTexture", (m, t) => (m.geometryTangentTexture = t)],
            ["extensions/KHR_materials_clearcoat/clearcoatTexture", (m, t) => (m.coatWeightTexture = t)],
            ["extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture", (m, t) => (m.coatRoughnessTexture = t)],
            ["extensions/KHR_materials_clearcoat/clearcoatNormalTexture", (m, t) => (m.geometryCoatNormalTexture = t)],
            ["extensions/KHR_materials_iridescence/iridescenceTexture", (m, t) => (m.thinFilmWeightTexture = t)],
            ["extensions/KHR_materials_iridescence/iridescenceThicknessTexture", (m, t) => (m.thinFilmThicknessTexture = t)],
            ["extensions/KHR_materials_sheen/sheenColorTexture", (m, t) => (m.fuzzColorTexture = t)],
            ["extensions/KHR_materials_sheen/sheenRoughnessTexture", (m, t) => (m.fuzzRoughnessTexture = t)],
            ["extensions/KHR_materials_specular/specularTexture", (m, t) => (m.specularWeightTexture = t)],
            ["extensions/KHR_materials_specular/specularColorTexture", (m, t) => (m.specularColorTexture = t)],
            ["extensions/KHR_materials_transmission/transmissionTexture", (m, t) => (m.transmissionWeightTexture = t)],
            ["extensions/KHR_materials_diffuse_transmission/diffuseTransmissionTexture", (m, t) => (m.subsurfaceWeightTexture = t)],
            ["extensions/KHR_materials_diffuse_transmission/diffuseTransmissionColorTexture", (m, t) => (m.subsurfaceColorTexture = t)],
            ["extensions/KHR_materials_volume/thicknessTexture", (m, t) => (m.geometryThicknessTexture = t)],
        ];
        it.each(textureCases)("reads and writes %s texture transforms", (path, assign) => {
            const { openpbr, pointer, payload } = createMaterialPointers();
            const texture = new Texture(null, scene);
            assign(openpbr, texture);
            const rotation = pointer(`${path}/extensions/KHR_texture_transform/rotation`);
            rotation.info.set!(0.7, rotation.object);
            expect(texture.wAng).toBe(-0.7);
            expect(rotation.info.get(rotation.object, undefined, payload)).toBe(0.7);
            const offset = pointer(`${path}/extensions/KHR_texture_transform/offset`);
            offset.info.set!(new Vector2(0.2, 0.4), offset.object, undefined, payload);
            expect([texture.uOffset, texture.vOffset]).toEqual([0.2, 0.4]);
            expect(offset.info.get(offset.object, undefined, payload).asArray()).toEqual([0.2, 0.4]);
            const scale = pointer(`${path}/extensions/KHR_texture_transform/scale`);
            scale.info.set!(new Vector2(0.3, 0.5), scale.object, undefined, payload);
            expect([texture.uScale, texture.vScale]).toEqual([0.3, 0.5]);
            expect(scale.info.get(scale.object, undefined, payload).asArray()).toEqual([0.3, 0.5]);
            expect(rotation.info.getTarget?.(rotation.object, undefined, payload)).toBe(openpbr);
        });

        it.each(textureCases)("retains %s source transforms after finalization replaces its slot", (path, assign) => {
            const { openpbr, pointer, payload } = createMaterialPointers();
            const source = new Texture(null, scene);
            const baked = new Texture(null, scene);
            assign(openpbr, source);
            _RetainGLTFMaterialTextureSources(openpbr);
            assign(openpbr, baked);
            _RetainGLTFMaterialTextureSources(openpbr);
            const rotation = pointer(`${path}/extensions/KHR_texture_transform/rotation`);
            rotation.info.set!(0.6, rotation.object, undefined, payload);
            expect(source.wAng).toBe(-0.6);
            expect(baked.wAng).toBe(0);
            expect(rotation.info.get(rotation.object, undefined, payload)).toBe(0.6);
            assign(openpbr, null);
            rotation.info.set!(0.2, rotation.object, undefined, payload);
            expect(source.wAng).toBe(-0.2);
        });

        it("resolves specular weight transforms packed into specular color alpha", () => {
            const { openpbr, pointer, payload } = createMaterialPointers();
            const texture = new Texture(null, scene);
            openpbr.specularColorTexture = texture;
            openpbr.specularWeightTexture = null;
            openpbr._useSpecularWeightFromSpecularColorTexture = true;
            _RetainGLTFMaterialTextureSources(openpbr);
            openpbr.specularColorTexture = new Texture(null, scene);
            const accessor = pointer("extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/rotation");
            accessor.info.set!(0.2, accessor.object, undefined, payload);
            expect(texture.wAng).toBe(-0.2);
            expect(accessor.info.get(accessor.object, undefined, payload)).toBe(0.2);
        });

        it("returns unique original texture identities for dynamic processing, including after slot replacement", () => {
            const { openpbr } = createMaterialPointers();
            const source = new Texture(null, scene);
            const baked = new Texture(null, scene);
            openpbr.baseColorTexture = source;
            openpbr.coatWeightTexture = source;
            openpbr.specularColorTexture = source;
            openpbr._useSpecularWeightFromSpecularColorTexture = true;
            openpbr.ambientOcclusionTexture = null;
            expect(_RetainGLTFMaterialTextureSources(openpbr)).toEqual([source]);
            openpbr.baseColorTexture = baked;
            openpbr.coatWeightTexture = null;
            openpbr.specularColorTexture = baked;
            expect(_RetainGLTFMaterialTextureSources(openpbr)).toEqual([source]);
        });

        it("returns no texture identities when all original bindings are empty", () => {
            const { openpbr } = createMaterialPointers();
            openpbr.ambientOcclusionTexture = null;
            expect(_RetainGLTFMaterialTextureSources(openpbr)).toEqual([]);
        });

        it("does not retain or mark textures on the existing PBR implementation", () => {
            const { pbr } = createMaterialPointers();
            pbr.albedoTexture = new Texture(null, scene);
            expect(_RetainGLTFMaterialTextureSources(pbr)).toEqual([]);
        });

        it("retains texture levels for normal and occlusion scale pointers", () => {
            const { openpbr, pointer, payload } = createMaterialPointers();
            const source = new Texture(null, scene);
            openpbr.geometryNormalTexture = source;
            openpbr.geometryCoatNormalTexture = source;
            openpbr.ambientOcclusionTexture = source;
            _RetainGLTFMaterialTextureSources(openpbr);
            openpbr.geometryNormalTexture = null;
            openpbr.geometryCoatNormalTexture = null;
            openpbr.ambientOcclusionTexture = null;
            for (const path of ["normalTexture/scale", "extensions/KHR_materials_clearcoat/clearcoatNormalTexture/scale", "occlusionTexture/strength"]) {
                const accessor = pointer(path);
                source.level = 1;
                accessor.info.set!(0.2, accessor.object, undefined, payload);
                expect(source.level).toBe(0.2);
                expect(accessor.info.get(accessor.object, undefined, payload)).toBe(0.2);
            }
        });

        it.each(["normalTexture", "extensions/KHR_materials_clearcoat/clearcoatNormalTexture"])("updates %s scale", (path) => {
            const { openpbr, pointer, payload } = createMaterialPointers();
            const texture = new Texture(null, scene);
            openpbr.geometryNormalTexture = texture;
            openpbr.geometryCoatNormalTexture = texture;
            const accessor = pointer(`${path}/scale`);
            accessor.info.set!(0.2, accessor.object, undefined, payload);
            expect(texture.level).toBe(0.2);
            expect(accessor.info.get(accessor.object, undefined, payload)).toBe(0.2);
        });
    });

    it("should resolve the KHR_interactivity animation maxTime pointer even though the animation has no stored extensions object", () => {
        // Regression (WhackAMole): the animation `.../extensions/KHR_interactivity/maxTime` pointer
        // (and its minTime/isPlaying/playhead siblings) is computed from the Babylon animation group
        // and is NOT present in the glTF JSON, so the animation object has no `extensions` member to
        // traverse into. The path converter must treat this like the node-visibility pointers and not
        // reject the path. Without the `/animations/<i>/extensions/` exception, `pointer/get` on
        // maxTime throws and aborts any graph that reads it — e.g. WhackAMole's `animation/start`
        // reads maxTime for its end time, so the whole onStart pop-up chain never runs.
        const converter = GetPathToObjectConverter(
            {
                animations: [
                    {
                        _babylonAnimationGroup: { from: 0, to: 120, isPlaying: true },
                    },
                ],
            } as any,
            (mapping) => _AddInteractivityObjectModel(scene, 60, mapping)
        );

        let maxTime!: ReturnType<typeof converter.convert>;
        expect(() => {
            maxTime = converter.convert("/animations/0/extensions/KHR_interactivity/maxTime");
        }).not.toThrow();
        // maxTime is the group's end time converted from frames to seconds (fixed 1/60 factor).
        expect(maxTime.info.get(maxTime.object)).toBe(2);
        expect(maxTime.info.getTarget?.(maxTime.object)).toBeDefined();

        // A boolean sibling under the same virtual namespace must resolve through the same exception.
        const isPlaying = converter.convert("/animations/0/extensions/KHR_interactivity/isPlaying");
        expect(isPlaying.info.get(isPlaying.object)).toBe(true);
    });

    it("uses the loader target FPS for all KHR_interactivity animation time properties", () => {
        const converter = GetPathToObjectConverter(
            {
                animations: [
                    {
                        _babylonAnimationGroup: {
                            from: 30,
                            to: 120,
                            getRetainedCurrentFrame: () => 90,
                            getVirtualCurrentFrame: () => 150,
                        },
                    },
                ],
            } as any,
            (mapping) => _AddInteractivityObjectModel(scene, 30, mapping)
        );

        expect(
            converter.convert("/animations/0/extensions/KHR_interactivity/minTime").info.get(converter.convert("/animations/0/extensions/KHR_interactivity/minTime").object)
        ).toBe(1);
        expect(
            converter.convert("/animations/0/extensions/KHR_interactivity/maxTime").info.get(converter.convert("/animations/0/extensions/KHR_interactivity/maxTime").object)
        ).toBe(4);
        expect(
            converter.convert("/animations/0/extensions/KHR_interactivity/playhead").info.get(converter.convert("/animations/0/extensions/KHR_interactivity/playhead").object)
        ).toBe(3);
        expect(
            converter
                .convert("/animations/0/extensions/KHR_interactivity/virtualPlayhead")
                .info.get(converter.convert("/animations/0/extensions/KHR_interactivity/virtualPlayhead").object)
        ).toBe(5);
    });

    it("prefers the animation timeline FPS over the loader fallback", () => {
        const converter = GetPathToObjectConverter(
            {
                animations: [
                    {
                        _babylonAnimationGroup: {
                            from: 24,
                            to: 72,
                            targetedAnimations: [{ animation: { framePerSecond: 24 } }],
                        },
                    },
                ],
            } as any,
            (mapping) => _AddInteractivityObjectModel(scene, 30, mapping)
        );
        const minTime = converter.convert("/animations/0/extensions/KHR_interactivity/minTime");
        const maxTime = converter.convert("/animations/0/extensions/KHR_interactivity/maxTime");

        expect(minTime.info.get(minTime.object)).toBe(1);
        expect(maxTime.info.get(maxTime.object)).toBe(3);
    });

    it("should find a node's translation", async () => {
        const mesh = new Mesh("mesh", scene);
        mesh.position.set(1, 2, 3);
        const mockGltf: any = {
            nodes: [
                {
                    _babylonTransformNode: mesh,
                },
            ],
        };

        await generateSimpleNodeGraph(
            mockGltf,
            [{ op: "pointer/get" }, { op: "flow/log", extension: "BABYLON" }],
            [
                {
                    declaration: 1,
                    values: {
                        message: {
                            node: 1,
                            socket: "value",
                        },
                    },
                },
                {
                    declaration: 0,
                    configuration: {
                        pointer: { value: ["/nodes/0/translation"] },
                        type: {
                            value: [0],
                        },
                    },
                },
            ],
            [{ signature: "float3" }]
        );

        expect(log).toHaveBeenCalledWith(new Vector3(1, 2, 3));
    });

    it("should report node weights.length as invalid when the node has no mesh", async () => {
        const node = new TransformNode("node", scene);
        const mockGltf: any = {
            nodes: [{ _babylonTransformNode: node }],
        };

        await generateSimpleNodeGraph(
            mockGltf,
            [{ op: "pointer/get" }, { op: "flow/log", extension: "BABYLON" }],
            [
                {
                    declaration: 1,
                    values: {
                        message: { node: 1, socket: "isValid" },
                    },
                },
                {
                    declaration: 0,
                    configuration: {
                        pointer: { value: ["/nodes/0/weights.length"] },
                        type: { value: [0] },
                    },
                },
            ],
            [{ signature: "float" }]
        );

        expect(log).toHaveBeenCalledWith(false);
    });

    it("should report a node weight as invalid when the node has no mesh", async () => {
        const node = new TransformNode("node", scene);
        const mockGltf: any = {
            nodes: [{ _babylonTransformNode: node }],
        };

        await generateSimpleNodeGraph(
            mockGltf,
            [{ op: "pointer/get" }, { op: "flow/log", extension: "BABYLON" }],
            [
                {
                    declaration: 1,
                    values: {
                        message: { node: 1, socket: "isValid" },
                    },
                },
                {
                    declaration: 0,
                    configuration: {
                        pointer: { value: ["/nodes/0/weights/0"] },
                        type: { value: [0] },
                    },
                },
            ],
            [{ signature: "float" }]
        );

        expect(log).toHaveBeenCalledWith(false);
    });

    it("should report a node weight as invalid when its mesh has no morph targets", async () => {
        const mesh = new Mesh("mesh", scene);
        const mockGltf: any = {
            nodes: [
                {
                    mesh: 0,
                    _babylonTransformNode: mesh,
                    _primitiveBabylonMeshes: [mesh],
                },
            ],
        };

        await generateSimpleNodeGraph(
            mockGltf,
            [{ op: "pointer/get" }, { op: "flow/log", extension: "BABYLON" }],
            [
                {
                    declaration: 1,
                    values: {
                        message: { node: 1, socket: "isValid" },
                    },
                },
                {
                    declaration: 0,
                    configuration: {
                        pointer: { value: ["/nodes/0/weights/0"] },
                        type: { value: [0] },
                    },
                },
            ],
            [{ signature: "float" }]
        );

        expect(log).toHaveBeenCalledWith(false);
    });

    it("should report weights.length as valid and zero when a node's mesh has no morph targets", async () => {
        const mesh = new Mesh("mesh", scene);
        const mockGltf: any = {
            nodes: [
                {
                    mesh: 0,
                    _babylonTransformNode: mesh,
                    _primitiveBabylonMeshes: [mesh],
                },
            ],
        };

        await generateSimpleNodeGraph(
            mockGltf,
            [{ op: "pointer/get" }, { op: "flow/log", extension: "BABYLON" }],
            [
                {
                    declaration: 1,
                    values: {
                        message: { node: 2, socket: "isValid" },
                    },
                    flows: {
                        out: { node: 1, socket: "in" },
                    },
                },
                {
                    declaration: 1,
                    values: {
                        message: { node: 2, socket: "value" },
                    },
                },
                {
                    declaration: 0,
                    configuration: {
                        pointer: { value: ["/nodes/0/weights.length"] },
                        type: { value: [0] },
                    },
                },
            ],
            [{ signature: "float" }]
        );

        const calls = log.mock.calls.map((call) => call[0]);
        expect(calls[0]).toBe(true);
        expect(calls[1].value).toBe(0);
    });

    it("should read morph-target length, validity, and static weight values from a node mesh", async () => {
        const mesh = new Mesh("mesh", scene);
        const manager = new MorphTargetManager(scene);
        manager.addTarget(new MorphTarget("target0", 0.1, scene));
        manager.addTarget(new MorphTarget("target1", 0.2, scene));
        mesh.morphTargetManager = manager;
        const mockGltf: any = {
            nodes: [
                {
                    mesh: 0,
                    _babylonTransformNode: mesh,
                    _primitiveBabylonMeshes: [mesh],
                },
            ],
        };

        const getOutput = async (pointer: string, socket: "isValid" | "value"): Promise<any> => {
            log.mockClear();
            await generateSimpleNodeGraph(
                mockGltf,
                [{ op: "pointer/get" }, { op: "flow/log", extension: "BABYLON" }],
                [
                    {
                        declaration: 1,
                        values: {
                            message: { node: 1, socket },
                        },
                    },
                    {
                        declaration: 0,
                        configuration: {
                            pointer: { value: [pointer] },
                            type: { value: [0] },
                        },
                    },
                ],
                [{ signature: "float" }]
            );
            return log.mock.calls[log.mock.calls.length - 1][0];
        };

        expect(await getOutput("/nodes/0/weights.length", "isValid")).toBe(true);
        expect((await getOutput("/nodes/0/weights.length", "value")).value).toBe(2);
        expect(await getOutput("/nodes/0/weights/0", "isValid")).toBe(true);
        expect(await getOutput("/nodes/0/weights/0", "value")).toBeCloseTo(0.1);
    });

    it("should read non-static morph weights from a descendant mesh", async () => {
        const node = new TransformNode("node", scene);
        const mesh = new Mesh("mesh", scene);
        mesh.parent = node;
        const manager = new MorphTargetManager(scene);
        manager.addTarget(new MorphTarget("target0", 0.5, scene));
        manager.addTarget(new MorphTarget("target1", 0.25, scene));
        mesh.morphTargetManager = manager;
        const mockGltf: any = {
            nodes: [{ _babylonTransformNode: node }],
        };

        const getOutput = async (pointer: string, socket: "isValid" | "value"): Promise<any> => {
            log.mockClear();
            await generateSimpleNodeGraph(
                mockGltf,
                [{ op: "pointer/get" }, { op: "flow/log", extension: "BABYLON" }],
                [
                    {
                        declaration: 1,
                        values: {
                            message: { node: 1, socket },
                        },
                    },
                    {
                        declaration: 0,
                        configuration: {
                            pointer: { value: [pointer] },
                            type: { value: [0] },
                        },
                    },
                ],
                [{ signature: "float" }]
            );
            return log.mock.calls[log.mock.calls.length - 1][0];
        };

        expect((await getOutput("/nodes/0/weights.length", "value")).value).toBe(2);
        expect(await getOutput("/nodes/0/weights/0", "isValid")).toBe(true);
        expect(await getOutput("/nodes/0/weights/0", "value")).toBe(0.5);
    });

    it("should expose a node-overridden morph weight", async () => {
        const mesh = new Mesh("mesh", scene);
        const manager = new MorphTargetManager(scene);
        manager.addTarget(new MorphTarget("target0", 0.6, scene));
        manager.addTarget(new MorphTarget("target1", 0.2, scene));
        mesh.morphTargetManager = manager;
        const mockGltf: any = {
            nodes: [
                {
                    mesh: 0,
                    weights: [0.6, 0.2],
                    _babylonTransformNode: mesh,
                    _primitiveBabylonMeshes: [mesh],
                },
            ],
        };

        await generateSimpleNodeGraph(
            mockGltf,
            [{ op: "pointer/get" }, { op: "flow/log", extension: "BABYLON" }],
            [
                {
                    declaration: 1,
                    values: {
                        message: { node: 1, socket: "value" },
                    },
                },
                {
                    declaration: 0,
                    configuration: {
                        pointer: { value: ["/nodes/0/weights/0"] },
                        type: { value: [0] },
                    },
                },
            ],
            [{ signature: "float" }]
        );

        expect(log).toHaveBeenCalledWith(0.6);
    });

    it("should set a morph weight and read it back", async () => {
        const mesh = new Mesh("mesh", scene);
        const manager = new MorphTargetManager(scene);
        manager.addTarget(new MorphTarget("target0", 0.1, scene));
        mesh.morphTargetManager = manager;
        const mockGltf: any = {
            nodes: [
                {
                    mesh: 0,
                    _babylonTransformNode: mesh,
                    _primitiveBabylonMeshes: [mesh],
                },
            ],
        };

        await generateSimpleNodeGraph(
            mockGltf,
            [{ op: "pointer/set" }, { op: "pointer/get" }, { op: "flow/log", extension: "BABYLON" }],
            [
                {
                    declaration: 0,
                    configuration: {
                        pointer: { value: ["/nodes/0/weights/0"] },
                    },
                    values: {
                        value: { type: 0, value: [0.9] },
                    },
                    flows: {
                        out: { node: 2, socket: "in" },
                    },
                },
                {
                    declaration: 1,
                    configuration: {
                        pointer: { value: ["/nodes/0/weights/0"] },
                        type: { value: [0] },
                    },
                },
                {
                    declaration: 2,
                    values: {
                        message: { node: 1, socket: "value" },
                    },
                },
            ],
            [{ signature: "float" }]
        );

        expect(log).toHaveBeenCalledWith(0.9);
        expect(manager.getTarget(0).influence).toBe(0.9);
    });

    it.each([
        { nodeWeights: [0.6, 0.2], meshWeights: [0.1, 0.3], expected: [0.6, 0.2] },
        { nodeWeights: undefined, meshWeights: [0.1, 0.3], expected: [0.1, 0.3] },
        { nodeWeights: undefined, meshWeights: undefined, expected: [0, 0] },
    ])("retains independent off-scene morph weights with defaults $expected", ({ nodeWeights, meshWeights, expected }) => {
        const gltf: IGLTF = {
            asset: { version: "2.0" },
            nodes: [
                { index: 0, mesh: 0, weights: nodeWeights },
                { index: 1, mesh: 0 },
            ],
            meshes: [
                {
                    index: 0,
                    weights: meshWeights,
                    primitives: [{ attributes: { POSITION: 0 }, targets: [{ POSITION: 0 }, { POSITION: 0 }] }],
                },
            ],
            scenes: [{ index: 0, nodes: [] }],
            scene: 0,
        };
        const converter = GetPathToObjectConverter(gltf);
        const length = converter.convert("/nodes/0/weights.length");
        expect(length.info.get(length.object)).toEqual(new FlowGraphInteger(2));
        const weights = converter.convert("/nodes/0/weights");
        expect(weights.info.get(weights.object)).toEqual(expected);
        const weight = converter.convert("/nodes/0/weights/1");
        expect(weight.info.get(weight.object)).toBe(expected[1]);
        weight.info.set!(0.9, weight.object);
        expect(weight.info.get(weight.object)).toBe(0.9);
        expect(weight.info.getTarget!(weight.object)).toEqual([expected[0], 0.9]);
        expect(weight.info.getPropertyName![0](weight.object)).toBe("1");
        const invalid = converter.convert("/nodes/0/weights/2");
        expect(invalid.info.get(invalid.object)).toBeUndefined();
        const other = converter.convert("/nodes/1/weights/1");
        expect(other.info.get(other.object)).toBe(meshWeights?.[1] ?? 0);
        const reimported = GetPathToObjectConverter(gltf).convert("/nodes/0/weights/1");
        expect(reimported.info.get(reimported.object)).toBe(0.9);
        expect(scene.meshes).toHaveLength(0);
    });

    // use variables to store the pointer
    it("should find a node's translation using a template variable", async () => {
        const mesh = new Mesh("mesh", scene);
        mesh.position.set(1, 2, 3);
        const mockGltf: any = {
            nodes: [
                {
                    _babylonTransformNode: mesh,
                },
            ],
        };

        await generateSimpleNodeGraph(
            mockGltf,
            [{ op: "pointer/get" }, { op: "flow/log", extension: "BABYLON" }],
            [
                {
                    declaration: 1,
                    values: {
                        message: {
                            node: 1,
                            socket: "value",
                        },
                    },
                },
                {
                    declaration: 0,
                    configuration: {
                        pointer: { value: ["/nodes/{nodeIdx}/translation"] },
                        type: { value: [1] },
                    },
                    values: {
                        nodeIdx: { value: [0], type: 0 },
                    },
                },
            ],
            [{ signature: "int" }, { signature: "float3" }]
        );

        expect(log).toHaveBeenCalledWith(new Vector3(1, 2, 3));
    });

    it("should get the active camera's position", async () => {
        await generateSimpleNodeGraph(
            {
                extensions: {
                    KHR_interactivity: {},
                },
            },
            [{ op: "pointer/get" }, { op: "flow/log", extension: "BABYLON" }],
            [
                {
                    declaration: 1,
                    values: {
                        message: {
                            node: 1,
                            socket: "value",
                        },
                    },
                },
                {
                    declaration: 0,
                    configuration: {
                        pointer: { value: ["/extensions/KHR_interactivity/activeCamera/position"] },
                        type: { value: [0] },
                    },
                },
            ],
            [{ signature: "float3" }]
        );
        // the result comes from the definition in the beforeEach function - a: PI/2, b: PI/2, r: 4
        const lastCallValue = log.mock.calls[log.mock.calls.length - 1][0];
        // round the result
        expect(lastCallValue.x).toBeCloseTo(0);
        expect(lastCallValue.y).toBeCloseTo(0);
        expect(lastCallValue.z).toBeCloseTo(4);
    });

    // check activeCamera/rotation
    it("should get the active camera's rotation", async () => {
        await generateSimpleNodeGraph(
            {
                extensions: {
                    KHR_interactivity: {},
                },
            },
            [{ op: "pointer/get" }, { op: "flow/log", extension: "BABYLON" }],
            [
                {
                    declaration: 1,
                    values: {
                        message: {
                            node: 1,
                            socket: "value",
                        },
                    },
                },
                {
                    declaration: 0,
                    configuration: {
                        pointer: { value: ["/extensions/KHR_interactivity/activeCamera/rotation"] },
                        type: { value: [0] },
                    },
                },
            ],
            [{ signature: "float4" }]
        );

        const lastCallValue = log.mock.calls[log.mock.calls.length - 1][0];
        expect(lastCallValue.x).toBeCloseTo(0);
        expect(lastCallValue.y).toBeCloseTo(0);
        expect(lastCallValue.z).toBeCloseTo(0);
        expect(Math.abs(lastCallValue.w)).toBeCloseTo(1);
    });

    it.each([false, true])("active camera rotation preserves glTF forward and up directions (right handed: %s)", async (rightHanded) => {
        scene.useRightHandedSystem = rightHanded;
        const parent = new TransformNode("cameraParent", scene);
        parent.rotationQuaternion = Quaternion.RotationYawPitchRoll(0.3, -0.4, 0.2);
        const camera = new FreeCamera("active", new Vector3(2, 3, 4), scene);
        camera.parent = parent;
        camera.rotationQuaternion = Quaternion.RotationYawPitchRoll(-0.7, 0.5, -0.6);
        scene.activeCamera = camera;
        await generateSimpleNodeGraph(
            { extensions: { KHR_interactivity: {} } },
            [{ op: "pointer/get" }, { op: "flow/log", extension: "BABYLON" }],
            [
                { declaration: 1, values: { message: { node: 1, socket: "value" } } },
                {
                    declaration: 0,
                    configuration: {
                        pointer: { value: ["/extensions/KHR_interactivity/activeCamera/rotation"] },
                        type: { value: [0] },
                    },
                },
            ],
            [{ signature: "float4" }]
        );
        const rotation: Quaternion = log.mock.calls[log.mock.calls.length - 1][0];
        const matrix = Matrix.FromQuaternionToRef(rotation, Matrix.Identity());
        const forward = Vector3.TransformNormal(new Vector3(0, 0, -1), matrix);
        const up = Vector3.TransformNormal(Vector3.Up(), matrix);
        const expectedForward = camera.getForwardRay().direction;
        const expectedUp = Vector3.TransformNormal(Vector3.Up(), camera.getWorldMatrix()).normalize();
        if (!rightHanded) {
            expectedForward.x *= -1;
            expectedUp.x *= -1;
        }
        expect(Vector3.Distance(forward, expectedForward)).toBeCloseTo(0);
        expect(Vector3.Distance(up, expectedUp)).toBeCloseTo(0);
    });

    it("keeps active camera accessors scoped to the converter's scene", () => {
        const otherScene = new Scene(engine);
        const firstCamera = scene.activeCamera!;
        firstCamera.position.set(1, 2, 3);
        const secondCamera = new ArcRotateCamera("second", 0, Math.PI / 2, 8, Vector3.Zero(), otherScene);
        otherScene.activeCamera = secondCamera;

        const gltf = { extensions: { KHR_interactivity: {} } };
        const firstConverter = GetPathToObjectConverter(gltf, (mapping) => _AddInteractivityObjectModel(scene, 60, mapping));
        const secondConverter = GetPathToObjectConverter(gltf, (mapping) => _AddInteractivityObjectModel(otherScene, 60, mapping));
        const pointer = "/extensions/KHR_interactivity/activeCamera/position";

        const firstPosition = firstConverter.convert(pointer).info.get(undefined);
        const secondPosition = secondConverter.convert(pointer).info.get(undefined);

        expect(firstPosition).not.toEqual(secondPosition);
        expect(firstConverter.convert(pointer).info.get(undefined)).toEqual(firstPosition);
        otherScene.dispose();
    });

    // Helper: run a single pointer/get on a scalar (float) activeCamera pointer and return the logged value.
    async function getActiveCameraScalar(pointer: string): Promise<number> {
        log.mockClear();
        await generateSimpleNodeGraph(
            { extensions: { KHR_interactivity: {} } },
            [{ op: "pointer/get" }, { op: "flow/log", extension: "BABYLON" }],
            [
                {
                    declaration: 1,
                    values: {
                        message: { node: 1, socket: "value" },
                    },
                },
                {
                    declaration: 0,
                    configuration: {
                        pointer: { value: [pointer] },
                        type: { value: [0] },
                    },
                },
            ],
            [{ signature: "float" }]
        );
        return log.mock.calls[log.mock.calls.length - 1][0] as number;
    }

    // check activeCamera perspective projection properties
    it("should get the active camera's perspective projection properties", async () => {
        const camera = scene.activeCamera!;
        camera.mode = 0; // perspective (default for ArcRotateCamera)
        camera.fovMode = 0; // vertical fixed
        camera.fov = 0.75;
        camera.minZ = 0.5;
        camera.maxZ = 100;

        expect(await getActiveCameraScalar("/extensions/KHR_interactivity/activeCamera/perspective/yfov")).toBeCloseTo(0.75);
        expect(await getActiveCameraScalar("/extensions/KHR_interactivity/activeCamera/perspective/znear")).toBeCloseTo(0.5);
        expect(await getActiveCameraScalar("/extensions/KHR_interactivity/activeCamera/perspective/zfar")).toBeCloseTo(100);
        expect(await getActiveCameraScalar("/extensions/KHR_interactivity/activeCamera/perspective/aspectRatio")).toBeCloseTo(scene.getEngine().getAspectRatio(camera));
        // Orthographic pointers must be NaN for a perspective camera.
        expect(await getActiveCameraScalar("/extensions/KHR_interactivity/activeCamera/orthographic/xmag")).toBeNaN();
        expect(await getActiveCameraScalar("/extensions/KHR_interactivity/activeCamera/orthographic/ymag")).toBeNaN();
    });

    it("should report an infinite perspective far clipping plane as Infinity", async () => {
        const camera = scene.activeCamera!;
        camera.mode = 0;
        camera.maxZ = 0; // Babylon uses maxZ === 0 to mean an infinite far plane
        expect(await getActiveCameraScalar("/extensions/KHR_interactivity/activeCamera/perspective/zfar")).toBe(Infinity);
    });

    // check activeCamera orthographic projection properties
    it("should get the active camera's orthographic projection properties", async () => {
        const camera = scene.activeCamera!;
        camera.mode = 1; // orthographic
        camera.orthoLeft = -3;
        camera.orthoRight = 3; // xmag = (3 - (-3)) / 2 = 3
        camera.orthoBottom = -2;
        camera.orthoTop = 2; // ymag = (2 - (-2)) / 2 = 2
        camera.minZ = 0.1;
        camera.maxZ = 50;

        expect(await getActiveCameraScalar("/extensions/KHR_interactivity/activeCamera/orthographic/xmag")).toBeCloseTo(3);
        expect(await getActiveCameraScalar("/extensions/KHR_interactivity/activeCamera/orthographic/ymag")).toBeCloseTo(2);
        expect(await getActiveCameraScalar("/extensions/KHR_interactivity/activeCamera/orthographic/znear")).toBeCloseTo(0.1);
        expect(await getActiveCameraScalar("/extensions/KHR_interactivity/activeCamera/orthographic/zfar")).toBeCloseTo(50);
        // Perspective pointers must be NaN for an orthographic camera.
        expect(await getActiveCameraScalar("/extensions/KHR_interactivity/activeCamera/perspective/yfov")).toBeNaN();
        expect(await getActiveCameraScalar("/extensions/KHR_interactivity/activeCamera/perspective/aspectRatio")).toBeNaN();
    });

    it("should set a pointer value and get it correctly", async () => {
        const mesh = new Mesh("mesh", scene);
        const mockGltf: any = {
            nodes: [
                {
                    _babylonTransformNode: mesh,
                },
            ],
        };

        await generateSimpleNodeGraph(
            mockGltf,
            [{ op: "pointer/set" }, { op: "pointer/get" }, { op: "flow/log", extension: "BABYLON" }],
            [
                {
                    declaration: 0,
                    configuration: {
                        pointer: { value: ["/nodes/0/scale"] },
                    },
                    flows: {
                        out: {
                            node: 2,
                            socket: "in",
                        },
                    },
                    values: {
                        value: { value: [2, 3, 4], type: 0 },
                    },
                },
                {
                    declaration: 1,
                    configuration: {
                        pointer: { value: ["/nodes/0/scale"] },
                        type: { value: [0] },
                    },
                },
                {
                    declaration: 2,
                    values: {
                        message: {
                            node: 1,
                            socket: "value",
                        },
                    },
                },
            ],
            [{ signature: "float3" }]
        );

        expect(log).toHaveBeenCalledWith(new Vector3(2, 3, 4));
    });

    it.each(["literal", "variable", "pointer"] as const)("interpolates baseColorFactor from a %s value without corrupting alpha", async (source) => {
        const material = new PBRMaterial("target", scene);
        material.albedoColor = new Color3(0.2, 0.4, 0.6);
        material.alpha = 0.5;
        const sourceMaterial = new PBRMaterial("source", scene);
        sourceMaterial.albedoColor = new Color3(0.8, 0.6, 0.4);
        sourceMaterial.alpha = 0.9;
        const mockGltf = {
            materials: [material, sourceMaterial].map((babylonMaterial) => ({
                pbrMetallicRoughness: {},
                _data: { 0: { babylonMaterial } },
            })),
        };
        await generateSimpleNodeGraph(
            mockGltf,
            [{ op: "pointer/interpolate" }, { op: "variable/get" }, { op: "pointer/get" }],
            [
                {
                    declaration: 0,
                    configuration: {
                        pointer: { value: ["/materials/0/pbrMetallicRoughness/baseColorFactor"] },
                        type: { value: [0] },
                    },
                    values: {
                        value: source === "literal" ? { type: 0, value: [0.8, 0.6, 0.4, 0.9] } : { node: 1, socket: "value" },
                        duration: { type: 1, value: [1] },
                    },
                },
                source === "pointer"
                    ? {
                          declaration: 2,
                          configuration: {
                              pointer: { value: ["/materials/1/pbrMetallicRoughness/baseColorFactor"] },
                              type: { value: [0] },
                          },
                      }
                    : { declaration: 1, configuration: { variable: { value: [0] } } },
            ],
            [{ signature: "float4" }, { signature: "float" }],
            [{ type: 0, value: [0.8, 0.6, 0.4, 0.9] }]
        );

        const group = scene.animationGroups[0];
        expect(group.targetedAnimations.map(({ animation }) => animation.targetProperty)).toEqual(["albedoColor", "alpha"]);
        group.goToFrame(30);
        for (const component of material.albedoColor.asArray()) {
            expect(component).toBeCloseTo(0.5);
        }
        expect(material.alpha).toBeCloseTo(0.7);
        group.goToFrame(60);
        expect(material.albedoColor).toEqual(sourceMaterial.albedoColor);
        expect(material.alpha).toBeCloseTo(0.9);
        expect(errorLog).not.toHaveBeenCalled();
    });

    // simple pointer/interpolate
    it("should interpolate a pointer value", async () => {
        // the reason for cloning is that the same vector is being returned, meaning that the values will be the same at the end of the interpolation
        const calls: any[] = [];
        log.mockImplementation((val) => {
            calls.push(val.clone());
        });
        const mesh = new Mesh("mesh", scene);
        mesh.position.set(1, 2, 3);
        const mockGltf: any = {
            nodes: [
                {
                    _babylonTransformNode: mesh,
                },
            ],
        };

        await generateSimpleNodeGraph(
            mockGltf,
            [{ op: "pointer/interpolate" }, { op: "pointer/get" }, { op: "flow/log", extension: "BABYLON" }, { op: "event/onTick" }],
            [
                {
                    declaration: 0,
                    configuration: {
                        pointer: { value: ["/nodes/0/translation"] },
                        type: { value: [0] },
                    },
                    values: {
                        value: {
                            value: [2, 3, 4],
                            type: 0,
                        },
                        duration: {
                            value: [0.9],
                            type: 1,
                        },
                    },
                    flows: {
                        // on start - log
                        out: {
                            node: 1,
                            socket: "in",
                        },
                        // on done - log
                        done: {
                            node: 1,
                            socket: "in",
                        },
                    },
                },
                {
                    declaration: 2,
                    values: {
                        message: {
                            node: 2,
                            socket: "value",
                        },
                    },
                },
                {
                    declaration: 1,
                    configuration: {
                        pointer: { value: ["/nodes/0/translation"] },
                        type: { value: [0] },
                    },
                },
                {
                    declaration: 3,
                    flows: {
                        out: {
                            node: 1,
                            socket: "in",
                        },
                    },
                },
            ],
            [{ signature: "float3" }, { signature: "float" }]
        );

        // wait for 1 second + buffer
        await new Promise((resolve) => setTimeout(resolve, 1000 + 300));
        expect(calls[0]).toEqual(new Vector3(1, 2, 3));
        calls.forEach((call, idx) => {
            if (idx === 0) {
                return;
            }
            expect(call.x).toBeGreaterThanOrEqual(calls[idx - 1].x);
            expect(call.y).toBeGreaterThanOrEqual(calls[idx - 1].y);
            expect(call.z).toBeGreaterThanOrEqual(calls[idx - 1].z);
        });
        expect(calls.pop()).toEqual(new Vector3(2, 3, 4));

        log.mockImplementation(() => {});
    });

    it("should activate err for pointer/interpolate CSS control points outside the valid X range", async () => {
        const mesh = new Mesh("mesh", scene);
        const mockGltf: any = {
            nodes: [{ _babylonTransformNode: mesh }],
        };

        await generateSimpleNodeGraph(
            mockGltf,
            [{ op: "pointer/interpolate" }, { op: "flow/log", extension: "BABYLON" }],
            [
                {
                    declaration: 0,
                    configuration: {
                        pointer: { value: ["/nodes/0/translation"] },
                        type: { value: [0] },
                    },
                    values: {
                        value: { type: 0, value: [2, 3, 4] },
                        duration: { type: 2, value: [1] },
                        p1: { type: 1, value: [-0.01, 0] },
                        p2: { type: 1, value: [1, 1] },
                    },
                    flows: {
                        err: { node: 1, socket: "in" },
                        out: { node: 2, socket: "in" },
                    },
                },
                {
                    declaration: 1,
                    values: {
                        message: { type: 2, value: [1] },
                    },
                },
                {
                    declaration: 1,
                    values: {
                        message: { type: 2, value: [2] },
                    },
                },
            ],
            [{ signature: "float3" }, { signature: "float2" }, { signature: "float" }]
        );

        expect(log.mock.calls.map((call) => call[0])).toEqual([1]);
    });

    // A concurrent invalid pointer/interpolate (bad duration) must not cancel a running interpolation on the same target.
    it("should not let an invalid pointer/interpolate cancel a running one", async () => {
        const mesh = new Mesh("mesh", scene);
        mesh.position.set(1, 2, 3);
        const mockGltf: any = {
            nodes: [
                {
                    _babylonTransformNode: mesh,
                },
            ],
        };

        await generateSimpleNodeGraph(
            mockGltf,
            // 0: valid interpolate, 1: invalid interpolate (same op/declaration), 2: unused
            [{ op: "pointer/interpolate" }],
            [
                {
                    // valid interpolation to (2,3,4) over ~0.9s
                    declaration: 0,
                    configuration: {
                        pointer: { value: ["/nodes/0/translation"] },
                        type: { value: [0] },
                    },
                    values: {
                        value: { value: [2, 3, 4], type: 0 },
                        duration: { value: [0.9], type: 1 },
                    },
                    flows: {
                        // as soon as the valid interpolation starts, trigger the invalid one on the same target
                        out: {
                            node: 1,
                            socket: "in",
                        },
                    },
                },
                {
                    // invalid interpolation (negative duration) targeting the same node
                    declaration: 0,
                    configuration: {
                        pointer: { value: ["/nodes/0/translation"] },
                        type: { value: [0] },
                    },
                    values: {
                        value: { value: [9, 9, 9], type: 0 },
                        duration: { value: [-1], type: 1 },
                    },
                },
            ],
            [{ signature: "float3" }, { signature: "float" }]
        );

        // wait for the valid interpolation to complete
        await new Promise((resolve) => setTimeout(resolve, 1000 + 300));
        // the running interpolation must not have been cancelled by the invalid one
        expect(mesh.position.x).toBeCloseTo(2, 3);
        expect(mesh.position.y).toBeCloseTo(3, 3);
        expect(mesh.position.z).toBeCloseTo(4, 3);
    });
});
