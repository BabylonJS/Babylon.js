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

function asset(graph: IKHRInteractivity_Graph, extensionsUsed: string[] = ["KHR_interactivity"], contents: Record<string, unknown> = {}): string {
    return `data:${JSON.stringify({
        asset: { version: "2.0" },
        scenes: [{ nodes: [0] }],
        nodes: [{ translation: [0, 0, 0] }],
        scene: 0,
        ...contents,
        extensionsUsed,
        extensions: { KHR_interactivity: { graphs: [graph] } },
    })}`;
}

function scalarInterpolation(pointer: string, value: number): IKHRInteractivity_Graph {
    return {
        types: [{ signature: "float" }, { signature: "float2" }],
        declarations: [{ op: "event/onStart" }, { op: "pointer/interpolate" }, { op: "debug/log" }],
        nodes: [
            { declaration: 0, flows: { out: { node: 1 } } },
            {
                declaration: 1,
                configuration: { pointer: { value: [pointer] }, type: { value: [0] } },
                values: {
                    value: { type: 0, value: [value] },
                    duration: { type: 0, value: [1] },
                    p1: { type: 1, value: [0, 0] },
                    p2: { type: 1, value: [1, 1] },
                },
                flows: { err: { node: 2 } },
            },
            { declaration: 2, configuration: { severity: { value: [0] }, message: { value: ["interpolation error"] } } },
        ],
    };
}

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
