import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { type IKHRInteractivity_Graph } from "babylonjs-gltf2interface";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { FreeCamera } from "core/Cameras/freeCamera";
import { Vector3 } from "core/Maths/math.vector.pure";
import { AppendSceneAsync } from "core/Loading/sceneLoader";
import { Logger } from "core/Misc/logger";
import { type AnimationGroup } from "core/Animations/animationGroup.pure";
import { type FlowGraphExecutionBlock } from "core/FlowGraph/flowGraphExecutionBlock";
import { Mesh } from "core/Meshes/mesh";
import { PointerInfo, PointerEventTypes } from "core/Events/pointerEvents";
import { PickingInfo } from "core/Collisions/pickingInfo";
import { registerBuiltInLoaders } from "../../../src/dynamic";
import { GetKHRInteractivityImportResult, RegisterKHR_interactivity } from "../../../src/glTF/2.0/Extensions/KHR_interactivity.pure";
import { FlowGraphInteger } from "core/FlowGraph/CustomTypes/flowGraphInteger.pure";
import { DelayReferencePrefix } from "../../../src/glTF/2.0/Extensions/KHR_interactivity/interactivityReferences";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial.pure";
import { type SpotLight } from "core/Lights/spotLight.pure";
import { type RectAreaLight } from "core/Lights/rectAreaLight.pure";

function asset(
    graph: IKHRInteractivity_Graph,
    extensionsUsed: string[] = ["KHR_interactivity"],
    contents: Record<string, unknown> & { extensions?: Record<string, unknown> } = {}
): string {
    return `data:${JSON.stringify({
        asset: { version: "2.0" },
        scenes: [{ nodes: [0] }],
        nodes: [{ translation: [0, 0, 0] }],
        scene: 0,
        ...contents,
        extensionsUsed,
        extensions: { ...contents.extensions, KHR_interactivity: { graphs: [graph] } },
    })}`;
}

function scalarInterpolation(pointer: string, value: number | number[]): IKHRInteractivity_Graph {
    return {
        types: [{ signature: "float" }, { signature: "float2" }],
        declarations: [{ op: "event/onStart" }, { op: "pointer/interpolate" }, { op: "debug/log" }],
        nodes: [
            { declaration: 0, flows: { out: { node: 1 } } },
            {
                declaration: 1,
                configuration: { pointer: { value: [pointer] }, type: { value: [Array.isArray(value) ? 1 : 0] } },
                values: {
                    value: { type: Array.isArray(value) ? 1 : 0, value: Array.isArray(value) ? value : [value] },
                    duration: { type: 0, value: [1] },
                    p1: { type: 1, value: [0, 0] },
                    p2: { type: 1, value: [1, 1] },
                },
                flows: { err: { node: 2 }, out: { node: 3 }, done: { node: 4 } },
            },
            { declaration: 2, configuration: { severity: { value: [0] }, message: { value: ["interpolation error"] } } },
            { declaration: 2, configuration: { severity: { value: [0] }, message: { value: ["interpolation started"] } } },
            { declaration: 2, configuration: { severity: { value: [0] }, message: { value: ["interpolation done"] } } },
        ],
    };
}

function withReadback(graph: IKHRInteractivity_Graph, pointer: string, type = 0): IKHRInteractivity_Graph {
    const declaration = graph.declarations!.length;
    const node = graph.nodes.length;
    graph.variables = [{ type }];
    graph.declarations!.push({ op: "pointer/get" }, { op: "variable/set" }, { op: "event/onTick" });
    graph.nodes.push(
        { declaration, configuration: { pointer: { value: [pointer] }, type: { value: [type] } } },
        { declaration: declaration + 2, flows: { out: { node: node + 2 } } },
        { declaration: declaration + 1, configuration: { variables: { value: [0] } }, values: { "0": { node } } }
    );
    return graph;
}

function pointerWrite(pointer: string, value: number): IKHRInteractivity_Graph {
    return withReadback(
        {
            types: [{ signature: "float" }],
            declarations: [{ op: "event/onStart" }, { op: "pointer/set" }, { op: "debug/log" }],
            nodes: [
                { declaration: 0, flows: { out: { node: 1 } } },
                {
                    declaration: 1,
                    configuration: { pointer: { value: [pointer] }, type: { value: [0] } },
                    values: { value: { type: 0, value: [value] } },
                    flows: { out: { node: 2 }, err: { node: 3 } },
                },
                { declaration: 2, configuration: { severity: { value: [0] }, message: { value: ["written"] } } },
                { declaration: 2, configuration: { severity: { value: [0] }, message: { value: ["write error"] } } },
            ],
        },
        pointer
    );
}

function interpolationThenWrite(pointer: string): IKHRInteractivity_Graph {
    const graph = scalarInterpolation(pointer, 0.2);
    graph.declarations!.push({ op: "pointer/set" });
    graph.nodes[1].flows = { out: { node: 2 }, err: { node: 3 }, done: { node: 5 } };
    graph.nodes.splice(2, 0, {
        declaration: 3,
        configuration: { pointer: { value: [pointer] }, type: { value: [0] } },
        values: { value: { type: 0, value: [0.9] } },
        flows: { out: { node: 4 }, err: { node: 3 } },
    });
    return graph;
}

function materialContents(modes: number[]): Record<string, unknown> {
    const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0]);
    return {
        nodes: [{ mesh: 0 }],
        buffers: [{ byteLength: positions.byteLength, uri: `data:application/octet-stream;base64,${Buffer.from(positions.buffer).toString("base64")}` }],
        bufferViews: [{ buffer: 0, byteLength: positions.byteLength }],
        accessors: [{ bufferView: 0, componentType: 5126, count: 6, type: "VEC3", min: [0, 0, 0], max: [1, 1, 0] }],
        materials: [{ pbrMetallicRoughness: { metallicFactor: 0.2, roughnessFactor: 0.3 } }],
        meshes: [{ primitives: modes.map((mode) => ({ attributes: { POSITION: 0 }, mode, material: 0 })) }],
    };
}

const TextureContents = {
    images: [{ uri: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=" }],
    textures: [{ source: 0 }],
};

describe("KHR_interactivity minimal public loader imports", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeAll(() => {
        registerBuiltInLoaders();
        RegisterKHR_interactivity();
    });

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        new FreeCamera("camera", new Vector3(0, 0, -10), scene);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it("starts before the first tick while appending to an already-rendering, not-ready scene", async () => {
        scene.render();
        const pending = {};
        scene.addPendingData(pending);
        const errors: unknown[] = [];
        const interval = setInterval(() => {
            try {
                scene.render();
            } catch (error) {
                errors.push(error);
            }
        }, 2);
        const log = vi.spyOn(Logger, "Log");
        try {
            await AppendSceneAsync(
                asset({
                    types: [{ signature: "bool" }],
                    variables: [{ type: 0 }],
                    declarations: [{ op: "variable/get" }, { op: "event/onStart" }, { op: "variable/set" }, { op: "debug/log" }, { op: "event/onTick" }],
                    nodes: [
                        { declaration: 0, configuration: { variable: { value: [0] } } },
                        { declaration: 1, flows: { out: { node: 2 } } },
                        {
                            declaration: 2,
                            configuration: { variables: { value: [0] } },
                            values: { "0": { type: 0, value: [true] } },
                            flows: { out: { node: 3 } },
                        },
                        { declaration: 3, configuration: { severity: { value: [0] }, message: { value: ["start"] } } },
                        { declaration: 4, flows: { out: { node: 5 } } },
                        {
                            declaration: 3,
                            configuration: { severity: { value: [0] }, message: { value: ["tick started={started}"] } },
                            values: { started: { node: 0 } },
                        },
                    ],
                }),
                scene
            );
            scene.render();
            const messages = log.mock.calls.map(([message]) => message);
            expect(messages[0]).toBe("start");
            expect(messages.slice(1).every((message) => message === "tick started=true")).toBe(true);
            expect(messages).toContain("tick started=true");
            expect(errors).toEqual([]);
        } finally {
            clearInterval(interval);
            scene.removePendingData(pending);
        }
    }, 30000);

    it("registers pointer interpolation metadata without a loader or core barrel import", async () => {
        await AppendSceneAsync(
            asset({
                types: [{ signature: "float3" }, { signature: "float" }, { signature: "float2" }],
                declarations: [{ op: "event/onStart" }, { op: "pointer/interpolate" }],
                nodes: [
                    { declaration: 0, flows: { out: { node: 1 } } },
                    {
                        declaration: 1,
                        configuration: { pointer: { value: ["/nodes/0/translation"] }, type: { value: [0] } },
                        values: {
                            value: { type: 0, value: [3, 0, 0] },
                            duration: { type: 1, value: [1] },
                            p1: { type: 2, value: [0, 0] },
                            p2: { type: 2, value: [1, 1] },
                        },
                    },
                ],
            }),
            scene
        );
        const graph = GetKHRInteractivityImportResult(scene)!.graphs[0].flowGraph!;
        const play = graph.getAllBlocks().find((block) => block.getClassName() === "FlowGraphPlayAnimationBlock")!;
        const group = play.getDataOutput("currentAnimationGroup")!.getValue(graph.getContext(0)) as AnimationGroup;
        expect(group.targetedAnimations).toHaveLength(1);
        expect(group.targetedAnimations[0].animation.targetProperty).toBe("position");
        group.goToFrame(30);
        expect(group.targetedAnimations[0].target.position.x).toBeGreaterThan(0);
        expect(group.targetedAnimations[0].target.position.x).toBeLessThan(3);
    }, 30000);

    it.each([
        ["metallicFactor", "metallic", "roughness", 0.2, 0.3],
        ["roughnessFactor", "roughness", "metallic", 0.3, 0.2],
    ] as const)("interpolates only the intended material scalar (%s)", async (pointerProperty, property, untouched, initial, otherInitial) => {
        const log = vi.spyOn(Logger, "Log");
        await AppendSceneAsync(
            asset(scalarInterpolation(`/materials/0/pbrMetallicRoughness/${pointerProperty}`, 0.8), ["KHR_interactivity"], {
                scenes: [{ nodes: [] }],
                materials: [{ name: "target material", pbrMetallicRoughness: { metallicFactor: 0.2, roughnessFactor: 0.3 } }],
            }),
            scene,
            { pluginOptions: { gltf: { loadAllMaterials: true } } }
        );
        const material = scene.materials.find((material) => material.name === "target material");
        expect(material).toBeInstanceOf(PBRMaterial);
        if (!(material instanceof PBRMaterial)) {
            throw new Error("Expected the loaded PBR material.");
        }
        const group = scene.animationGroups[0];
        expect(group.targetedAnimations).toHaveLength(1);
        expect(group.targetedAnimations[0].target).toBe(material);
        expect(group.targetedAnimations[0].animation.targetProperty).toBe(property);
        group.goToFrame(30);
        expect(material[property]).toBeCloseTo((initial + 0.8) / 2);
        expect(material[untouched]).toBeCloseTo(otherInitial);
        group.goToFrame(60);
        expect(material[property]).toBeCloseTo(0.8);
        expect(material[untouched]).toBeCloseTo(otherInitial);
        expect(log).not.toHaveBeenCalledWith("interpolation error");
    });

    it.each([{ modes: [4, 1] }, { modes: [1] }])("interpolates loaded primitive-mode variants ($modes)", async ({ modes }) => {
        const log = vi.spyOn(Logger, "Log");
        await AppendSceneAsync(asset(scalarInterpolation("/materials/0/pbrMetallicRoughness/metallicFactor", 0.8), ["KHR_interactivity"], materialContents(modes)), scene, {
            pluginOptions: { gltf: { loadAllMaterials: false } },
        });
        await scene.whenReadyAsync();
        const record = GetKHRInteractivityImportResult(scene)!.glTF.materials![0];
        const materials = Object.values(record._data!).map((data) => data.babylonMaterial);
        expect(materials).toHaveLength(modes.length);
        expect(materials.every((material) => material instanceof PBRMaterial)).toBe(true);
        const group = scene.animationGroups[0];
        expect(new Set(group.targetedAnimations.map((targeted) => targeted.target))).toEqual(new Set(materials));
        for (const [frame, metallic] of [
            [0, 0.2],
            [30, 0.5],
            [60, 0.8],
        ]) {
            group.goToFrame(frame);
            for (const material of materials) {
                if (!(material instanceof PBRMaterial)) {
                    throw new Error("Expected PBR material variants.");
                }
                expect(material.metallic).toBeCloseTo(metallic);
                expect(material.roughness).toBeCloseTo(0.3);
            }
        }
        scene.render();
        expect(log).toHaveBeenCalledWith("interpolation started");
        expect(log).toHaveBeenCalledWith("interpolation done");
        expect(log).not.toHaveBeenCalledWith("interpolation error");
    });

    it("writes every shared material variant before cancelling interpolation", async () => {
        const pointer = "/materials/0/pbrMetallicRoughness/metallicFactor";
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "float" }, { signature: "float2" }, { signature: "bool" }],
            variables: [{ type: 2, value: [false] }],
            declarations: [
                { op: "variable/get" },
                { op: "event/onStart" },
                { op: "pointer/interpolate" },
                { op: "debug/log" },
                { op: "event/onTick" },
                { op: "flow/branch" },
                { op: "pointer/set" },
            ],
            nodes: [
                { declaration: 0, configuration: { variable: { value: [0] } } },
                { declaration: 1, flows: { out: { node: 2 } } },
                {
                    ...scalarInterpolation(pointer, 0.8).nodes[1],
                    declaration: 2,
                    flows: { out: { node: 3 }, done: { node: 8 }, err: { node: 9 } },
                },
                { declaration: 3, configuration: { message: { value: ["interpolation started"] }, severity: { value: [0] } } },
                { declaration: 4, flows: { out: { node: 5 } } },
                { declaration: 5, values: { condition: { node: 0 } }, flows: { true: { node: 6 } } },
                {
                    declaration: 6,
                    configuration: { pointer: { value: [pointer] }, type: { value: [0] } },
                    values: { value: { type: 0, value: [0.9] } },
                    flows: { out: { node: 7 }, err: { node: 9 } },
                },
                { declaration: 3, configuration: { message: { value: ["written"] }, severity: { value: [0] } } },
                { declaration: 3, configuration: { message: { value: ["interpolation done"] }, severity: { value: [0] } } },
                { declaration: 3, configuration: { message: { value: ["error"] }, severity: { value: [0] } } },
            ],
        };
        const log = vi.spyOn(Logger, "Log");
        await AppendSceneAsync(asset(graph, ["KHR_interactivity"], materialContents([4, 1])), scene);
        await scene.whenReadyAsync();
        const result = GetKHRInteractivityImportResult(scene)!;
        const materials = Object.values(result.glTF.materials![0]._data!).map((data) => data.babylonMaterial);
        const group = scene.animationGroups[0];
        group.pause();
        group.goToFrame(30);
        for (const material of materials) {
            expect(material).toBeInstanceOf(PBRMaterial);
            if (!(material instanceof PBRMaterial)) {
                throw new Error("Expected PBR material variants.");
            }
            expect(material.metallic).toBeCloseTo(0.5);
        }
        const context = result.graphs[0].flowGraph!.getContext(0);
        context.setVariable("staticVariable_0", true);
        scene.render();
        context.setVariable("staticVariable_0", false);
        expect(scene.animationGroups).toHaveLength(0);
        vi.useFakeTimers({ toFake: ["Date", "performance"] });
        for (let frame = 0; frame < 120; frame++) {
            vi.advanceTimersByTime(16);
            scene.render();
            for (const material of materials) {
                if (!(material instanceof PBRMaterial)) {
                    throw new Error("Expected PBR material variants.");
                }
                expect(material.metallic).toBeCloseTo(0.9);
                expect(material.roughness).toBeCloseTo(0.3);
            }
        }
        expect(log).toHaveBeenCalledWith("written");
        expect(log).not.toHaveBeenCalledWith("interpolation done");
        expect(log).not.toHaveBeenCalledWith("error");
    });

    it.each(["literal", "connected"])("preserves a %s zero material interpolation endpoint", async (source) => {
        const log = vi.spyOn(Logger, "Log");
        const graph = scalarInterpolation("/materials/0/pbrMetallicRoughness/metallicFactor", 0);
        if (source === "connected") {
            graph.variables = [{ type: 0, value: [0] }];
            graph.declarations!.push({ op: "variable/get" });
            for (const node of graph.nodes) {
                for (const flow of Object.values(node.flows ?? {})) {
                    flow.node++;
                }
            }
            graph.nodes.unshift({ declaration: 3, configuration: { variable: { value: [0] } } });
            graph.nodes[2].values!.value = { node: 0 };
        }
        await AppendSceneAsync(asset(graph, ["KHR_interactivity"], { materials: [{ pbrMetallicRoughness: { metallicFactor: 0.2 } }] }), scene, {
            pluginOptions: { gltf: { loadAllMaterials: true } },
        });
        const group = scene.animationGroups[0];
        const material = group.targetedAnimations[0].target as PBRMaterial;
        expect(group.targetedAnimations[0].animation.getKeys()).toHaveLength(2);
        group.goToFrame(30);
        expect(material.metallic).toBeCloseTo(0.1);
        group.goToFrame(60);
        expect(material.metallic).toBe(0);
        expect(log).toHaveBeenCalledWith("interpolation started");
        expect(log).not.toHaveBeenCalledWith("interpolation error");
        scene.render();
        expect(log).toHaveBeenCalledWith("interpolation done");
    });

    it("still rejects an invalid duration when the interpolation endpoint is zero", async () => {
        const log = vi.spyOn(Logger, "Log");
        const graph = scalarInterpolation("/materials/0/pbrMetallicRoughness/metallicFactor", 0);
        graph.nodes[1].values!.duration = { type: 0 };
        await AppendSceneAsync(asset(graph, ["KHR_interactivity"], { materials: [{ pbrMetallicRoughness: { metallicFactor: 0.2 } }] }), scene, {
            pluginOptions: { gltf: { loadAllMaterials: true } },
        });
        expect(log).toHaveBeenCalledWith("interpolation error");
        expect(log).not.toHaveBeenCalledWith("interpolation started");
        expect(log).not.toHaveBeenCalledWith("interpolation done");
    });

    it.each([
        ["xmag", "orthoLeft", "orthoRight"],
        ["ymag", "orthoBottom", "orthoTop"],
    ] as const)("reads and interpolates scalar orthographic %s with symmetric bounds", async (property, lower, upper) => {
        const pointer = `/cameras/0/orthographic/${property}`;
        const log = vi.spyOn(Logger, "Log");
        await AppendSceneAsync(
            asset(withReadback(scalarInterpolation(pointer, 4), pointer), ["KHR_interactivity"], {
                nodes: [{ camera: 0 }],
                cameras: [{ type: "orthographic", orthographic: { xmag: 2, ymag: 2, znear: 0.1, zfar: 100 } }],
            }),
            scene
        );
        const camera = GetKHRInteractivityImportResult(scene)!.glTF.cameras![0]._babylonCamera!;
        const context = GetKHRInteractivityImportResult(scene)!.graphs[0].flowGraph!.getContext(0);
        const group = scene.animationGroups[0];
        expect(group.targetedAnimations.map((entry) => entry.animation.targetProperty)).toEqual([lower, upper]);
        group.pause();
        for (const [frame, magnitude] of [
            [0, 2],
            [30, 3],
            [60, 4],
        ]) {
            group.goToFrame(frame);
            scene.render();
            expect(camera[lower]).toBeCloseTo(-magnitude);
            expect(camera[upper]).toBeCloseTo(magnitude);
            expect(context.getVariable("staticVariable_0")).toBeCloseTo(magnitude);
        }
        expect(log).not.toHaveBeenCalledWith("interpolation error");
    });

    it.each([
        ["xmag", "orthoLeft", "orthoRight"],
        ["ymag", "orthoBottom", "orthoTop"],
    ] as const)("writes scalar orthographic %s", async (property, lower, upper) => {
        const log = vi.spyOn(Logger, "Log");
        await AppendSceneAsync(
            asset(pointerWrite(`/cameras/0/orthographic/${property}`, 5), ["KHR_interactivity"], {
                nodes: [{ camera: 0 }],
                cameras: [{ type: "orthographic", orthographic: { xmag: 2, ymag: 2, znear: 0.1, zfar: 100 } }],
            }),
            scene
        );
        scene.render();
        const result = GetKHRInteractivityImportResult(scene)!;
        expect(result.glTF.cameras![0]._babylonCamera![lower]).toBe(-5);
        expect(result.glTF.cameras![0]._babylonCamera![upper]).toBe(5);
        expect(result.graphs[0].flowGraph!.getContext(0).getVariable("staticVariable_0")).toBe(5);
        expect(log).toHaveBeenCalledWith("written");
        expect(log).not.toHaveBeenCalledWith("write error");
    });

    it("keeps an explicit normal-scale write authoritative after cancelling interpolation", async () => {
        const log = vi.spyOn(Logger, "Log");
        const pointer = "/materials/0/normalTexture/scale";
        const graph = scalarInterpolation(pointer, 0.2);
        graph.declarations!.push({ op: "pointer/set" });
        graph.nodes[1].flows = { out: { node: 2 }, err: { node: 3 }, done: { node: 5 } };
        graph.nodes.splice(2, 0, {
            declaration: 3,
            configuration: { pointer: { value: [pointer] }, type: { value: [0] } },
            values: { value: { type: 0, value: [0.9] } },
            flows: { out: { node: 4 }, err: { node: 3 } },
        });
        await AppendSceneAsync(asset(graph, ["KHR_interactivity"], { ...TextureContents, materials: [{ normalTexture: { index: 0, scale: 0.6 } }] }), scene, {
            pluginOptions: { gltf: { loadAllMaterials: true } },
        });
        const material = scene.materials.find((entry) => entry instanceof PBRMaterial) as PBRMaterial;
        expect(material.bumpTexture!.level).toBeCloseTo(0.9);
        expect(scene.animationGroups).toHaveLength(0);
        vi.useFakeTimers({ toFake: ["Date", "performance"] });
        for (let frame = 0; frame < 120; frame++) {
            vi.advanceTimersByTime(16);
            scene.render();
        }
        expect(material.bumpTexture!.level).toBeCloseTo(0.9);
        expect(log).toHaveBeenCalledWith("interpolation started");
        expect(log).not.toHaveBeenCalledWith("interpolation done");
        expect(log).not.toHaveBeenCalledWith("interpolation error");
    });

    it.each(["emissive", "clearcoat"])("cancels the metadata-named material interpolation (%s)", async (kind) => {
        const log = vi.spyOn(Logger, "Log");
        const pointer =
            kind === "emissive"
                ? "/materials/0/extensions/KHR_materials_emissive_strength/emissiveStrength"
                : "/materials/0/extensions/KHR_materials_clearcoat/clearcoatNormalTexture/scale";
        await AppendSceneAsync(
            asset(interpolationThenWrite(pointer), ["KHR_interactivity", kind === "emissive" ? "KHR_materials_emissive_strength" : "KHR_materials_clearcoat"], {
                ...TextureContents,
                materials: [
                    {
                        extensions:
                            kind === "emissive"
                                ? { KHR_materials_emissive_strength: { emissiveStrength: 0.6 } }
                                : { KHR_materials_clearcoat: { clearcoatFactor: 1, clearcoatNormalTexture: { index: 0, scale: 0.6 } } },
                    },
                ],
            }),
            scene,
            { pluginOptions: { gltf: { loadAllMaterials: true } } }
        );
        const material = scene.materials.find((entry) => entry instanceof PBRMaterial) as PBRMaterial;
        const read = () => (kind === "emissive" ? material.emissiveIntensity : material.clearCoat.bumpTexture!.level);
        expect(read()).toBeCloseTo(0.9);
        expect(scene.animationGroups).toHaveLength(0);
        vi.useFakeTimers({ toFake: ["Date", "performance"] });
        for (let frame = 0; frame < 120; frame++) {
            vi.advanceTimersByTime(16);
            scene.render();
        }
        expect(read()).toBeCloseTo(0.9);
        expect(log).toHaveBeenCalledWith("interpolation started");
        expect(log).not.toHaveBeenCalledWith("interpolation done");
        expect(log).not.toHaveBeenCalledWith("interpolation error");
    });

    it.each([
        ["scale", [3, 4], "uScale", "vScale", 1, 2, 3, 4],
        ["offset", [0.6, 0.8], "uOffset", "vOffset", 0.2, 0.4, 0.6, 0.8],
        ["rotation", 0.8, "wAng", "wAng", -0.2, -0.2, -0.8, -0.8],
    ] as const)("initializes metallic-roughness texture %s interpolation", async (property, value, first, second, initialFirst, initialSecond, finalFirst, finalSecond) => {
        const log = vi.spyOn(Logger, "Log");
        const pointer = `/materials/0/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/${property}`;
        await AppendSceneAsync(
            asset(
                withReadback(scalarInterpolation(pointer, typeof value === "number" ? value : [...value]), pointer, typeof value === "number" ? 0 : 1),
                ["KHR_interactivity", "KHR_texture_transform"],
                {
                    ...TextureContents,
                    materials: [
                        {
                            pbrMetallicRoughness: {
                                metallicRoughnessTexture: { index: 0, extensions: { KHR_texture_transform: { scale: [1, 2], offset: [0.2, 0.4], rotation: 0.2 } } },
                            },
                        },
                    ],
                }
            ),
            scene,
            { pluginOptions: { gltf: { loadAllMaterials: true } } }
        );
        const material = scene.materials.find((entry) => entry instanceof PBRMaterial) as PBRMaterial;
        const group = scene.animationGroups[0];
        expect(group.targetedAnimations.map((entry) => entry.animation.targetProperty)).toEqual(
            first === second ? [`metallicTexture.${first}`] : [`metallicTexture.${first}`, `metallicTexture.${second}`]
        );
        group.pause();
        for (const [frame, amount] of [
            [0, 0],
            [30, 0.5],
            [60, 1],
        ]) {
            group.goToFrame(frame);
            scene.render();
            expect(material.metallicTexture![first]).toBeCloseTo(initialFirst + amount * (finalFirst - initialFirst));
            expect(material.metallicTexture![second]).toBeCloseTo(initialSecond + amount * (finalSecond - initialSecond));
            if (property === "rotation") {
                expect(GetKHRInteractivityImportResult(scene)!.graphs[0].flowGraph!.getContext(0).getVariable("staticVariable_0")).toBeCloseTo(0.2 + amount * 0.6);
            }
        }
        expect(log).not.toHaveBeenCalledWith("interpolation error");
    });

    it("interpolates dispersion at the actual object-model path", async () => {
        const pointer = "/materials/0/extensions/KHR_materials_dispersion/dispersion";
        await AppendSceneAsync(
            asset(withReadback(scalarInterpolation(pointer, 0.8), pointer), ["KHR_interactivity", "KHR_materials_transmission", "KHR_materials_dispersion"], {
                materials: [{ extensions: { KHR_materials_transmission: { transmissionFactor: 1 }, KHR_materials_dispersion: { dispersion: 0.2 } } }],
            }),
            scene,
            { pluginOptions: { gltf: { loadAllMaterials: true } } }
        );
        const group = scene.animationGroups[0];
        const material = group.targetedAnimations[0].target as PBRMaterial;
        expect(group.targetedAnimations[0].animation.targetProperty).toBe("subSurface.dispersion");
        group.pause();
        const initial = material.subSurface.dispersion;
        expect(initial).toBe(100);
        for (const [frame, value] of [
            [0, initial],
            [30, (initial + 0.8) / 2],
            [60, 0.8],
        ]) {
            group.goToFrame(frame);
            scene.render();
            expect(material.subSurface.dispersion).toBeCloseTo(value);
            expect(GetKHRInteractivityImportResult(scene)!.graphs[0].flowGraph!.getContext(0).getVariable("staticVariable_0")).toBeCloseTo(value);
        }
    });

    it("reads and interpolates sheen roughness independently of intensity", async () => {
        const pointer = "/materials/0/extensions/KHR_materials_sheen/sheenRoughnessFactor";
        await AppendSceneAsync(
            asset(withReadback(scalarInterpolation(pointer, 0.2), pointer), ["KHR_interactivity", "KHR_materials_sheen"], {
                materials: [{ extensions: { KHR_materials_sheen: { sheenColorFactor: [1, 1, 1], sheenRoughnessFactor: 0.6 } } }],
            }),
            scene,
            { pluginOptions: { gltf: { loadAllMaterials: true } } }
        );
        const group = scene.animationGroups[0];
        const material = group.targetedAnimations[0].target as PBRMaterial;
        expect(group.targetedAnimations[0].animation.targetProperty).toBe("sheen.roughness");
        group.pause();
        for (const [frame, value] of [
            [0, 0.6],
            [30, 0.4],
            [60, 0.2],
        ]) {
            group.goToFrame(frame);
            scene.render();
            expect(material.sheen.roughness).toBeCloseTo(value);
            expect(material.sheen.intensity).toBe(1);
            expect(GetKHRInteractivityImportResult(scene)!.graphs[0].flowGraph!.getContext(0).getVariable("staticVariable_0")).toBeCloseTo(value);
        }
    });

    it.each([
        ["innerConeAngle", "innerAngle", 0.1],
        ["outerConeAngle", "angle", 0.6],
    ] as const)("reads and interpolates spotlight half angles (%s)", async (property, runtimeProperty, initial) => {
        const pointer = `/extensions/KHR_lights_punctual/lights/0/spot/${property}`;
        await AppendSceneAsync(
            asset(withReadback(scalarInterpolation(pointer, 0.4), pointer), ["KHR_interactivity", "KHR_lights_punctual"], {
                nodes: [{ extensions: { KHR_lights_punctual: { light: 0 } } }],
                extensions: { KHR_lights_punctual: { lights: [{ type: "spot", spot: { innerConeAngle: 0.1, outerConeAngle: 0.6 } }] } },
            }),
            scene
        );
        const group = scene.animationGroups[0];
        const light = group.targetedAnimations[0].target as SpotLight;
        expect(group.targetedAnimations[0].animation.targetProperty).toBe(runtimeProperty);
        group.pause();
        for (const [frame, amount] of [
            [0, 0],
            [30, 0.5],
            [60, 1],
        ]) {
            group.goToFrame(frame);
            scene.render();
            const value = initial + (0.4 - initial) * amount;
            expect(light[runtimeProperty]).toBeCloseTo(2 * value);
            expect(GetKHRInteractivityImportResult(scene)!.graphs[0].flowGraph!.getContext(0).getVariable("staticVariable_0")).toBeCloseTo(value);
        }
    });

    it.each([
        ["innerConeAngle", "innerAngle"],
        ["outerConeAngle", "angle"],
    ] as const)("writes spotlight half angles (%s)", async (property, runtimeProperty) => {
        await AppendSceneAsync(
            asset(pointerWrite(`/extensions/KHR_lights_punctual/lights/0/spot/${property}`, 0.3), ["KHR_interactivity", "KHR_lights_punctual"], {
                nodes: [{ extensions: { KHR_lights_punctual: { light: 0 } } }],
                extensions: { KHR_lights_punctual: { lights: [{ type: "spot", spot: { innerConeAngle: 0.1, outerConeAngle: 0.6 } }] } },
            }),
            scene
        );
        scene.render();
        expect((scene.lights[0] as SpotLight)[runtimeProperty]).toBeCloseTo(0.6);
        expect(GetKHRInteractivityImportResult(scene)!.graphs[0].flowGraph!.getContext(0).getVariable("staticVariable_0")).toBeCloseTo(0.3);
    });

    it.each([
        ["size", 4, 4, 12],
        ["rect/aspect", 1.5, 2, 3],
    ] as const)("interpolates rectangle dimensions and readback (%s)", async (property, target, height, width) => {
        const pointer = `/extensions/EXT_lights_area/lights/0/${property}`;
        await AppendSceneAsync(
            asset(withReadback(scalarInterpolation(pointer, target), pointer), ["KHR_interactivity", "EXT_lights_area"], {
                nodes: [{ extensions: { EXT_lights_area: { light: 0 } } }],
                extensions: { EXT_lights_area: { lights: [{ type: "rect", size: 2, rect: { aspect: 3 } }] } },
            }),
            scene
        );
        const group = scene.animationGroups[0];
        const light = scene.lights[0] as RectAreaLight;
        expect(group.targetedAnimations.map((entry) => entry.animation.targetProperty)).toEqual(property === "size" ? ["size"] : ["aspect"]);
        group.pause();
        for (const [frame, amount] of [
            [0, 0],
            [30, 0.5],
            [60, 1],
        ]) {
            group.goToFrame(frame);
            scene.render();
            expect(light.height).toBeCloseTo(2 + amount * (height - 2));
            expect(light.width).toBeCloseTo(6 + amount * (width - 6));
            expect(GetKHRInteractivityImportResult(scene)!.graphs[0].flowGraph!.getContext(0).getVariable("staticVariable_0")).toBeCloseTo(
                (property === "size" ? 2 : 3) + amount * (target - (property === "size" ? 2 : 3))
            );
        }
    });

    it("interpolates disk size through the equal-area rectangle dimensions", async () => {
        const pointer = "/extensions/EXT_lights_area/lights/0/size";
        await AppendSceneAsync(
            asset(withReadback(scalarInterpolation(pointer, 4), pointer), ["KHR_interactivity", "EXT_lights_area"], {
                nodes: [{ extensions: { EXT_lights_area: { light: 0 } } }],
                extensions: { EXT_lights_area: { lights: [{ type: "disk", size: 2 }] } },
            }),
            scene
        );
        const group = scene.animationGroups[0];
        const light = scene.lights[0] as RectAreaLight;
        group.pause();
        for (const [frame, size] of [
            [0, 2],
            [30, 3],
            [60, 4],
        ]) {
            group.goToFrame(frame);
            scene.render();
            expect(light.height).toBeCloseTo((size * Math.sqrt(Math.PI)) / 2);
            expect(light.width).toBeCloseTo(light.height);
            expect(GetKHRInteractivityImportResult(scene)!.graphs[0].flowGraph!.getContext(0).getVariable("staticVariable_0")).toBeCloseTo(size);
        }
    });

    it.each(["rect", "disk"])("writes area-light size while retaining its shape (%s)", async (type) => {
        const log = vi.spyOn(Logger, "Log");
        await AppendSceneAsync(
            asset(pointerWrite("/extensions/EXT_lights_area/lights/0/size", 4), ["KHR_interactivity", "EXT_lights_area"], {
                nodes: [{ extensions: { EXT_lights_area: { light: 0 } } }],
                extensions: { EXT_lights_area: { lights: [{ type, size: 2, ...(type === "rect" ? { rect: { aspect: 3 } } : {}) }] } },
            }),
            scene
        );
        scene.render();
        const light = scene.lights[0] as RectAreaLight;
        expect(light.height).toBeCloseTo(type === "rect" ? 4 : 2 * Math.sqrt(Math.PI));
        expect(light.width).toBeCloseTo(light.height * (type === "rect" ? 3 : 1));
        expect(GetKHRInteractivityImportResult(scene)!.graphs[0].flowGraph!.getContext(0).getVariable("staticVariable_0")).toBeCloseTo(4);
        expect(log).toHaveBeenCalledWith("written");
        expect(log).not.toHaveBeenCalledWith("write error");
    });

    it("retains active aspect interpolation when a later positive size write changes height", async () => {
        const pointer = "/extensions/EXT_lights_area/lights/0/rect/aspect";
        const graph = withReadback(scalarInterpolation(pointer, 1.5), pointer);
        graph.events = [{ id: "resize" }];
        const declaration = graph.declarations!.length;
        const node = graph.nodes.length;
        graph.declarations!.push({ op: "event/receive" }, { op: "pointer/set" });
        graph.nodes.push(
            { declaration, configuration: { event: { value: [0] } }, flows: { out: { node: node + 1 } } },
            {
                declaration: declaration + 1,
                configuration: { pointer: { value: ["/extensions/EXT_lights_area/lights/0/size"] }, type: { value: [0] } },
                values: { value: { type: 0, value: [4] } },
            }
        );
        await AppendSceneAsync(
            asset(graph, ["KHR_interactivity", "EXT_lights_area"], {
                nodes: [{ extensions: { EXT_lights_area: { light: 0 } } }],
                extensions: { EXT_lights_area: { lights: [{ type: "rect", size: 2, rect: { aspect: 3 } }] } },
            }),
            scene
        );
        const flowGraph = GetKHRInteractivityImportResult(scene)!.graphs[0].flowGraph!;
        const group = scene.animationGroups[0];
        group.pause();
        group.goToFrame(30);
        const light = scene.lights[0] as RectAreaLight;
        expect(light.width / light.height).toBeCloseTo(2.25);
        const eventId = flowGraph.getAllBlocks().find((block) => block.getClassName() === "FlowGraphReceiveCustomEventBlock")!.config?.eventId;
        if (typeof eventId !== "string") {
            throw new Error("Expected the imported resize event.");
        }
        flowGraph.getContext(0).configuration.coordinator.notifyCustomEvent(eventId, {}, false);
        expect(light.height).toBe(4);
        expect(light.width / light.height).toBeCloseTo(2.25);
        expect(group.isStarted).toBe(true);
        group.goToFrame(60);
        scene.render();
        expect(light.height).toBe(4);
        expect(light.width).toBeCloseTo(6);
        expect(flowGraph.getContext(0).getVariable("staticVariable_0")).toBeCloseTo(1.5);
    });

    it.each(["rect", "disk"])("restores finite size and shape after zero writes and interpolation (%s)", async (type) => {
        const pointer = "/extensions/EXT_lights_area/lights/0/size";
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "float" }, { signature: "float2" }],
            variables: [{ type: 0 }, { type: 0 }],
            declarations: [{ op: "pointer/get" }, { op: "event/onStart" }, { op: "pointer/set" }, { op: "variable/set" }, { op: "pointer/interpolate" }, { op: "event/onTick" }],
            nodes: [
                { declaration: 0, configuration: { pointer: { value: [pointer] }, type: { value: [0] } } },
                { declaration: 1, flows: { out: { node: 2 } } },
                { declaration: 2, configuration: { pointer: { value: [pointer] }, type: { value: [0] } }, values: { value: { type: 0, value: [0] } }, flows: { out: { node: 3 } } },
                { declaration: 2, configuration: { pointer: { value: [pointer] }, type: { value: [0] } }, values: { value: { type: 0, value: [4] } }, flows: { out: { node: 4 } } },
                { declaration: 3, configuration: { variables: { value: [0] } }, values: { "0": { node: 0 } }, flows: { out: { node: 5 } } },
                { declaration: 2, configuration: { pointer: { value: [pointer] }, type: { value: [0] } }, values: { value: { type: 0, value: [0] } }, flows: { out: { node: 6 } } },
                {
                    declaration: 4,
                    configuration: { pointer: { value: [pointer] }, type: { value: [0] } },
                    values: { value: { type: 0, value: [4] }, duration: { type: 0, value: [1] }, p1: { type: 1, value: [0, 0] }, p2: { type: 1, value: [1, 1] } },
                },
                { declaration: 5, flows: { out: { node: 8 } } },
                { declaration: 3, configuration: { variables: { value: [1] } }, values: { "1": { node: 0 } } },
            ],
        };
        await AppendSceneAsync(
            asset(graph, ["KHR_interactivity", "EXT_lights_area"], {
                nodes: [{ extensions: { EXT_lights_area: { light: 0 } } }],
                extensions: { EXT_lights_area: { lights: [{ type, size: 2, ...(type === "rect" ? { rect: { aspect: 3 } } : {}) }] } },
            }),
            scene
        );
        const context = GetKHRInteractivityImportResult(scene)!.graphs[0].flowGraph!.getContext(0);
        expect(context.getVariable("staticVariable_0")).toBeCloseTo(4);
        const group = scene.animationGroups[0];
        const light = scene.lights[0] as RectAreaLight;
        group.pause();
        for (const [frame, size] of [
            [0, 0],
            [30, 2],
            [60, 4],
        ]) {
            group.goToFrame(frame);
            scene.render();
            const height = size * (type === "rect" ? 1 : Math.sqrt(Math.PI) / 2);
            expect(light.height).toBeCloseTo(height);
            expect(light.width).toBeCloseTo(height * (type === "rect" ? 3 : 1));
            expect(context.getVariable("staticVariable_1")).toBeCloseTo(size);
        }
    });

    it.each([
        ["yfov", "fov", 0.6, 1.2],
        ["znear", "minZ", 0.05, 0.2],
        ["zfar", "maxZ", 80, 40],
    ] as const)("interpolates the runtime camera rather than its glTF record (%s)", async (pointerProperty, property, initial, target) => {
        await AppendSceneAsync(
            asset(scalarInterpolation(`/cameras/0/perspective/${pointerProperty}`, target), ["KHR_interactivity"], {
                nodes: [{ camera: 0 }],
                cameras: [{ type: "perspective", perspective: { yfov: 0.6, znear: 0.05, zfar: 80 } }],
            }),
            scene
        );
        const cameraRecord = GetKHRInteractivityImportResult(scene)!.glTF.cameras![0];
        const camera = cameraRecord._babylonCamera!;
        const group = scene.animationGroups[0];
        expect(group.targetedAnimations).toHaveLength(1);
        expect(group.targetedAnimations[0].target).toBe(camera);
        expect(group.targetedAnimations[0].target).not.toBe(cameraRecord);
        expect(group.targetedAnimations[0].animation.targetProperty).toBe(property);
        group.goToFrame(30);
        expect(camera[property]).toBeCloseTo((initial + target) / 2);
        group.goToFrame(60);
        expect(camera[property]).toBeCloseTo(target);
    });

    it("routes an invalid off-scene morph-weight index to err without changing weights or activating out", async () => {
        const log = vi.spyOn(Logger, "Log");
        await AppendSceneAsync(
            asset(
                {
                    types: [{ signature: "float" }],
                    variables: [{ type: 0, value: [-1] }],
                    declarations: [{ op: "pointer/get" }, { op: "event/onStart" }, { op: "pointer/set" }, { op: "debug/log" }, { op: "variable/set" }],
                    nodes: [
                        { declaration: 0, configuration: { pointer: { value: ["/nodes/0/weights/0"] }, type: { value: [0] } } },
                        { declaration: 1, flows: { out: { node: 2 } } },
                        {
                            declaration: 2,
                            configuration: { pointer: { value: ["/nodes/0/weights/1"] }, type: { value: [0] } },
                            values: { value: { type: 0, value: [0.9] } },
                            flows: { err: { node: 3 }, out: { node: 4 } },
                        },
                        { declaration: 3, configuration: { severity: { value: [0] }, message: { value: ["err"] } }, flows: { out: { node: 5 } } },
                        { declaration: 3, configuration: { severity: { value: [0] }, message: { value: ["out"] } } },
                        { declaration: 4, configuration: { variables: { value: [0] } }, values: { "0": { node: 0 } } },
                    ],
                },
                ["KHR_interactivity"],
                {
                    scenes: [{ nodes: [] }],
                    nodes: [{ mesh: 0, weights: [0.25] }],
                    meshes: [{ primitives: [{ attributes: {}, targets: [{}] }] }],
                }
            ),
            scene
        );
        const result = GetKHRInteractivityImportResult(scene)!;
        expect(result.glTF.nodes![0]._morphTargetWeights).toEqual([0.25]);
        expect(result.graphs[0].flowGraph!.getContext(0).getVariable("staticVariable_0")).toBe(0.25);
        expect(log).toHaveBeenCalledWith("err");
        expect(log).not.toHaveBeenCalledWith("out");
        expect(result.glTF.nodes![0]._babylonTransformNode).toBeUndefined();
        expect(result.glTF.nodes![0]._primitiveBabylonMeshes).toBeUndefined();
    });

    it("keeps malformed inactive socket sources isolated from the selected graph", async () => {
        const log = vi.spyOn(Logger, "Log");
        await AppendSceneAsync(
            `data:${JSON.stringify({
                asset: { version: "2.0" },
                extensionsUsed: ["KHR_interactivity"],
                extensions: {
                    KHR_interactivity: {
                        graph: 0,
                        graphs: [
                            {
                                declarations: [{ op: "event/onStart" }, { op: "debug/log" }],
                                nodes: [
                                    { declaration: 0, flows: { out: { node: 1 } } },
                                    { declaration: 1, configuration: { severity: { value: [0] }, message: { value: ["selected started"] } } },
                                ],
                            },
                            { types: [{ signature: "float" }], declarations: [{ op: "math/sin" }], nodes: [{ declaration: 0, values: { a: 1 } }] },
                        ],
                    },
                },
            })}`,
            scene
        );
        const result = GetKHRInteractivityImportResult(scene)!;
        expect(result.graphs[0].graph.valid).toBe(true);
        expect(result.graphs[0].flowGraph).toBeDefined();
        expect(result.graphs[1].graph.valid).toBe(false);
        expect(result.graphs[1].flowGraph).toBeUndefined();
        expect(result.graphs[1].graph.diagnostics).toContainEqual(expect.objectContaining({ path: "/extensions/KHR_interactivity/graphs/1/nodes/0/values/a" }));
        expect(log).toHaveBeenCalledWith("selected started");
        scene.render();
    });

    it("preserves a delay handle through connected pointer/get and ref/eq, then returns null after cancellation", async () => {
        await AppendSceneAsync(
            asset({
                types: [{ signature: "ref" }, { signature: "float" }, { signature: "bool" }],
                variables: [{ type: 0 }, { type: 0 }, { type: 2 }, { type: 2 }, { type: 0 }, { type: 2 }, { type: 2 }],
                declarations: [
                    { op: "event/onStart" },
                    { op: "flow/setDelay" },
                    { op: "variable/set" },
                    { op: "variable/get" },
                    { op: "pointer/get" },
                    { op: "ref/eq" },
                    { op: "flow/cancelDelay" },
                ],
                nodes: [
                    { declaration: 0, flows: { out: { node: 1 } } },
                    { declaration: 1, values: { duration: { type: 1, value: [60] } }, flows: { out: { node: 2 } } },
                    {
                        declaration: 2,
                        configuration: { variables: { value: [0] } },
                        values: { "0": { node: 1, socket: "lastDelay" } },
                        flows: { out: { node: 6 } },
                    },
                    { declaration: 3, configuration: { variable: { value: [0] } } },
                    {
                        declaration: 4,
                        configuration: { pointer: { value: ["/extensions/KHR_interactivity/delays/{delay}"] }, type: { value: [0] } },
                        values: { delay: { node: 3 } },
                    },
                    { declaration: 5, values: { a: { node: 3 }, b: { node: 4 } } },
                    {
                        declaration: 2,
                        configuration: { variables: { value: [1, 2, 3] } },
                        values: { "1": { node: 4 }, "2": { node: 4, socket: "isValid" }, "3": { node: 5 } },
                        flows: { out: { node: 7 } },
                    },
                    { declaration: 6, values: { delay: { node: 3 } }, flows: { out: { node: 8 } } },
                    {
                        declaration: 2,
                        configuration: { variables: { value: [4, 5, 6] } },
                        values: { "4": { node: 4 }, "5": { node: 4, socket: "isValid" }, "6": { node: 5 } },
                    },
                ],
            }),
            scene
        );
        const context = GetKHRInteractivityImportResult(scene)!.graphs[0].flowGraph!.getContext(0);
        expect(Array.from({ length: 7 }, (_, index) => context.getVariable(`staticVariable_${index}`))).toEqual([
            `${DelayReferencePrefix}0`,
            `${DelayReferencePrefix}0`,
            true,
            true,
            "",
            false,
            false,
        ]);
    });

    it.each([-1, 7])("reports an invalid pointer/get index without throwing (%s)", async (index) => {
        await AppendSceneAsync(
            asset({
                types: [{ signature: "float3" }, { signature: "int" }],
                declarations: [{ op: "pointer/get" }],
                nodes: [
                    {
                        declaration: 0,
                        configuration: { pointer: { value: ["/nodes/[index]/translation"] }, type: { value: [0] } },
                        values: { index: { type: 1, value: [index] } },
                    },
                ],
            }),
            scene
        );
        const graph = GetKHRInteractivityImportResult(scene)!.graphs[0].flowGraph!;
        const get = graph.getAllBlocks().find((block) => block.getClassName() === "FlowGraphGetPropertyBlock")!;
        expect(() => get.getDataOutput("value")!.getValue(graph.getContext(0))).not.toThrow();
        expect(get.getDataOutput("isValid")!.getValue(graph.getContext(0))).toBe(false);
    });

    it.each([
        ["/nodes/240/translation", "float3", [1, 2, 3]],
        ["/nodes/0/globalMatrix", "float4x4", Array(16).fill(1)],
        ["/nodes/0/translation", "float", [1]],
    ] as const)("routes invalid interpolation targets to err without rejecting import (%s)", async (pointer, signature, value) => {
        const log = vi.spyOn(Logger, "Log");
        await AppendSceneAsync(
            asset({
                types: [{ signature }, { signature: "float2" }, ...(signature === "float" ? [] : [{ signature: "float" as const }])],
                declarations: [{ op: "event/onStart" }, { op: "pointer/interpolate" }, { op: "debug/log" }],
                nodes: [
                    { declaration: 0, flows: { out: { node: 1 } } },
                    {
                        declaration: 1,
                        configuration: { pointer: { value: [pointer] }, type: { value: [0] } },
                        values: {
                            value: { type: 0, value: [...value] },
                            duration: { type: signature === "float" ? 0 : 2, value: [1] },
                            p1: { type: 1, value: [0, 0] },
                            p2: { type: 1, value: [1, 1] },
                        },
                        flows: { err: { node: 2 } },
                    },
                    { declaration: 2, configuration: { severity: { value: [0] }, message: { value: ["interpolation error"] } } },
                ],
            } as IKHRInteractivity_Graph),
            scene
        );
        expect(log).toHaveBeenCalledWith("interpolation error");
    });

    it("variable/set cancels an interpolation on the user-variable dictionary without done", async () => {
        await AppendSceneAsync(
            asset({
                types: [{ signature: "float" }, { signature: "float2" }],
                variables: [{ type: 0, value: [0] }],
                declarations: [{ op: "event/onStart" }, { op: "variable/interpolate" }, { op: "variable/set" }],
                nodes: [
                    { declaration: 0, flows: { out: { node: 1 } } },
                    {
                        declaration: 1,
                        configuration: { variable: { value: [0] }, useSlerp: { value: [false] } },
                        values: { value: { type: 0, value: [10] }, duration: { type: 0, value: [1] }, p1: { type: 1, value: [0, 0] }, p2: { type: 1, value: [1, 1] } },
                    },
                    { declaration: 2, configuration: { variables: { value: [0] } }, values: { "0": { type: 0, value: [4] } } },
                ],
            }),
            scene
        );
        const graph = GetKHRInteractivityImportResult(scene)!.graphs[0].flowGraph!;
        const context = graph.getContext(0);
        const play = graph.getAllBlocks().find((block) => block.getClassName() === "FlowGraphPlayAnimationBlock")! as FlowGraphExecutionBlock;
        const set = graph.getAllBlocks().find((block) => block.getClassName() === "FlowGraphSetVariableBlock")! as FlowGraphExecutionBlock;
        const group = play.getDataOutput("currentAnimationGroup")!.getValue(context) as AnimationGroup;
        const done = vi.spyOn(play.getSignalOutput("done")!, "_activateSignal");
        group.goToFrame(30);
        expect(context.getVariable("staticVariable_0")).toBeGreaterThan(0);
        set._execute(context, set.in);
        scene.render();
        expect(context.getVariable("staticVariable_0")).toBe(4);
        expect(done).not.toHaveBeenCalled();
        expect(group.isStarted).toBe(false);
    });

    it.each([
        ["event/onHoverIn", "KHR_node_hoverability", { hoveredNode: { type: 0 }, controllerIndex: { type: 1 } }, "FlowGraphPointerOverEventBlock"],
        ["event/onHoverOut", "KHR_node_hoverability", { hoveredNode: { type: 0 }, controllerIndex: { type: 1 } }, "FlowGraphPointerOutEventBlock"],
        [
            "event/onSelect",
            "KHR_node_selectability",
            { selectedNode: { type: 0 }, rayOrigin: { type: 2 }, selectionPoint: { type: 2 }, controllerIndex: { type: 1 } },
            "FlowGraphMeshPickEventBlock",
        ],
    ] as const)("preserves the explicitly supported legacy interaction contract (%s)", async (op, extension, outputValueSockets, className) => {
        await AppendSceneAsync(
            asset(
                {
                    types: [{ signature: "ref" }, { signature: "int" }, { signature: "float3" }],
                    declarations: [{ op, extension, outputValueSockets }],
                    nodes: [{ declaration: 0, configuration: { nodeIndex: { value: [0] } } }],
                },
                ["KHR_interactivity", extension]
            ),
            scene
        );
        const result = GetKHRInteractivityImportResult(scene)!.graphs[0];
        expect(result.graph.declarations[0].support).toBe("extension");
        expect(result.flowGraph!.getAllBlocks().some((block) => block.getClassName() === className)).toBe(true);
        expect(result.flowGraph!.getAllBlocks().some((block) => block.getClassName().includes("UnsupportedInteractivity"))).toBe(false);
    });

    it("executes the supplemental selection handler on a descendant mesh with ray information", async () => {
        const log = vi.spyOn(Logger, "Log");
        await AppendSceneAsync(
            asset(
                {
                    types: [{ signature: "ref" }, { signature: "int" }, { signature: "float3" }],
                    declarations: [
                        {
                            op: "event/onSelect",
                            extension: "KHR_node_selectability",
                            outputValueSockets: { selectedNode: { type: 0 }, selectionRayOrigin: { type: 2 }, selectionPoint: { type: 2 }, controllerIndex: { type: 1 } },
                        },
                        { op: "debug/log" },
                    ],
                    nodes: [
                        { declaration: 0, configuration: { nodeIndex: { value: [0] } }, flows: { out: { node: 1 } } },
                        {
                            declaration: 1,
                            configuration: { severity: { value: [0] }, message: { value: ["picked={picked} controller={controller}"] } },
                            values: { picked: { node: 0, socket: "selectedNode" }, controller: { node: 0, socket: "controllerIndex" } },
                        },
                    ],
                },
                ["KHR_interactivity", "KHR_node_selectability"]
            ),
            scene
        );
        const result = GetKHRInteractivityImportResult(scene)!;
        const picked = new Mesh("picked", scene);
        picked.parent = result.glTF.nodes![0]._babylonTransformNode!;
        const info = new PickingInfo();
        info.hit = true;
        info.pickedMesh = picked;
        info.pickedPoint = new Vector3(1, 2, 3);
        scene.onPointerObservable.notifyObservers(new PointerInfo(PointerEventTypes.POINTERPICK, { pointerId: 1 } as PointerEvent, info));
        expect(log).toHaveBeenCalledWith("picked=/nodes/0 controller=0");
    });

    it.each([
        ["bool", false],
        ["int", 0],
        ["ref", ""],
        ["float", NaN],
    ] as const)("returns the configured %s type-default for a missing capability", async (signature, expected) => {
        await AppendSceneAsync(
            asset({
                types: [{ signature }],
                declarations: [{ op: "pointer/get" }],
                nodes: [
                    {
                        declaration: 0,
                        configuration: { pointer: { value: ["/extensions/KHR_interactivity/asset/extensions/EXT_unknown/enabled"] }, type: { value: [0] } },
                    },
                ],
            }),
            scene
        );
        const graph = GetKHRInteractivityImportResult(scene)!.graphs[0].flowGraph!;
        const context = graph.getContext(0);
        const get = graph.getAllBlocks().find((block) => block.getClassName() === "FlowGraphGetPropertyBlock")!;
        const value = get.getDataOutput("value")!.getValue(context);
        if (signature === "int") {
            expect(value).toBeInstanceOf(FlowGraphInteger);
            expect(value.value).toBe(expected);
        } else {
            expect(value).toBe(expected);
        }
        expect(get.getDataOutput("isValid")!.getValue(context)).toBe(false);
    });

    it("preserves an invalid integer pointer-read default through a connected math operation", async () => {
        await AppendSceneAsync(
            asset({
                types: [{ signature: "int" }],
                variables: [{ type: 0, value: [-1] }],
                declarations: [{ op: "pointer/get" }, { op: "math/neg" }, { op: "event/onStart" }, { op: "variable/set" }],
                nodes: [
                    {
                        declaration: 0,
                        configuration: { pointer: { value: ["/extensions/KHR_interactivity/asset/extensions/EXT_unknown/enabled"] }, type: { value: [0] } },
                    },
                    { declaration: 1, values: { a: { node: 0 } } },
                    { declaration: 2, flows: { out: { node: 3 } } },
                    { declaration: 3, configuration: { variables: { value: [0] } }, values: { "0": { node: 1 } } },
                ],
            }),
            scene
        );
        const graph = GetKHRInteractivityImportResult(scene)!.graphs[0].flowGraph!;
        const value = graph.getContext(0).getVariable("staticVariable_0");
        expect(value).toBeInstanceOf(FlowGraphInteger);
        expect(value).toEqual(new FlowGraphInteger(0));
    });
});
