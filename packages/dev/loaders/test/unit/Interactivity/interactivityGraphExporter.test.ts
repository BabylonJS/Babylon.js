import { FlowGraphInteger } from "core/FlowGraph/CustomTypes/flowGraphInteger";
import { FlowGraphTypes } from "core/FlowGraph/flowGraphRichTypes";
import { ParseFlowGraphAsync } from "core/FlowGraph/flowGraphParser";
import { FlowGraphCoordinator } from "core/FlowGraph/flowGraphCoordinator";
import { FlowGraphPlayAnimationBlock } from "core/FlowGraph/Blocks/Execution/Animation/flowGraphPlayAnimationBlock.pure";
import { AnimationGroup } from "core/Animations/animationGroup";
import { NullEngine } from "core/Engines/nullEngine";
import { TransformNode } from "core/Meshes/transformNode";
import { FreeCamera } from "core/Cameras/freeCamera";
import { Matrix, Vector3 } from "core/Maths/math.vector";
import { Scene } from "core/scene";
import { type IKHRInteractivity, type IKHRInteractivity_Graph } from "babylonjs-gltf2interface";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { _AddInteractivityObjectModel, _RegisterKHRInteractivityRuntime } from "../../../src/glTF/2.0/Extensions/KHR_interactivity.pure";
import { _CaptureKHRInteractivityRuntimeInputDefaults, InteractivityGraphToFlowGraphParser } from "../../../src/glTF/2.0/Extensions/KHR_interactivity/interactivityGraphParser";
import { _CreateKHRInteractivityRuntimeValueSnapshot, CreateKHRInteractivityDocument } from "../../../src/glTF/2.0/Extensions/KHR_interactivity/interactivityGraphModel";
import { GetPathToObjectConverter } from "../../../src/glTF/2.0/Extensions/objectModelMapping";
import { _RegisterKHRNodeSelectabilityRuntime } from "../../../src/glTF/2.0/Extensions/KHR_node_selectability.pure";
import {
    CreateKHRInteractivityExportPlan,
    KHRInteractivityExportError,
    type IKHRInteractivitySerializerContext,
} from "../../../src/glTF/2.0/Extensions/KHR_interactivity/interactivityGraphExporter";

function CreateCoreGraph(): IKHRInteractivity_Graph {
    return {
        name: "Core",
        extras: { preserved: true },
        types: [{ signature: "int" }],
        declarations: [{ op: "math/add" }, { op: "event/onStart" }, { op: "flow/doN" }],
        nodes: [
            {
                declaration: 0,
                values: {
                    a: { type: 0, value: [1] },
                    b: { type: 0, value: [2] },
                },
            },
            { declaration: 1, flows: { out: { node: 2 } } },
            { declaration: 2, values: { n: { node: 0 } } },
        ],
    };
}

describe("KHR_interactivity FlowGraph export", () => {
    let engine: NullEngine;
    let scene: Scene;
    let coordinator: FlowGraphCoordinator;

    beforeEach(() => {
        _RegisterKHRInteractivityRuntime();
        engine = new NullEngine();
        scene = new Scene(engine);
        coordinator = new FlowGraphCoordinator({ scene });
    });

    afterEach(() => {
        coordinator.dispose();
        scene.dispose();
        engine.dispose();
    });

    async function CreatePlan(extension: IKHRInteractivity, sourceGLTF: any = {}) {
        const document = CreateKHRInteractivityDocument(
            extension,
            new Set(["KHR_node_selectability", "KHR_node_hoverability", "EXT_vendor_interactivity", "BABYLON"]),
            sourceGLTF.nodes?.length
        );
        expect(document.diagnostics).toEqual([]);
        const flowGraphs = [];
        const pathConverter = GetPathToObjectConverter(sourceGLTF, (mapping) => _AddInteractivityObjectModel(scene, 60, mapping));
        for (const graph of document.graphs) {
            expect(graph.valid, JSON.stringify(graph.diagnostics)).toBe(true);
            const serialized = new InteractivityGraphToFlowGraphParser(
                graph.effectiveSource,
                sourceGLTF,
                60,
                graph.index,
                undefined,
                graph.declarations,
                graph.source
            ).serializeToFlowGraph();
            const flowGraph = await ParseFlowGraphAsync(serialized, { coordinator, pathConverter });
            _CaptureKHRInteractivityRuntimeInputDefaults(flowGraph);
            flowGraphs.push(flowGraph);
        }
        return CreateKHRInteractivityExportPlan(flowGraphs, { document, sourceGLTF });
    }

    const context: IKHRInteractivitySerializerContext = {
        getNodeCount: () => 0,
        getNodeIndex: () => undefined,
        getAnimationIndex: () => undefined,
        getCameraIndex: () => undefined,
        getMaterialIndex: () => undefined,
        setNodeExtension: () => {},
    };

    it("round-trips canonical graphs deterministically and preserves a representable literal edit", async () => {
        const extension: IKHRInteractivity = {
            extras: { authoringTool: "test" },
            graphs: [CreateCoreGraph()],
        };
        const plan = await CreatePlan(extension);

        expect(plan.analyze()).toMatchObject({
            representable: true,
            nodes: [
                { operation: "math/add", classification: "exact" },
                { operation: "event/onStart", classification: "exact" },
                { operation: "flow/doN", classification: "exact" },
            ],
        });
        expect(plan.build(context)).toEqual(extension);
        expect(plan.build(context)).toEqual(plan.build(context));

        const addBlock = coordinator.flowGraphs[0].getAllBlocks().find((block) => block.metadata?.khrInteractivity?.operation === "math/add")!;
        (addBlock.getDataInput("a") as any)._defaultValue = new FlowGraphInteger(9);

        const edited = plan.build(context);
        expect(edited.graphs[0].nodes![0].values!.a).toEqual({ type: 0, value: [9] });
        expect(CreateKHRInteractivityDocument(edited).graphs[0].valid).toBe(true);
    });

    it("serializes edited matrix literals as ordinary JSON arrays", async () => {
        const source = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
        const editedValue = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
        const plan = await CreatePlan({
            graphs: [
                {
                    types: [{ signature: "float4x4" }],
                    declarations: [{ op: "math/transpose" }],
                    nodes: [{ declaration: 0, values: { a: { type: 0, value: source } } }],
                },
            ],
        });
        const transpose = coordinator.flowGraphs[0].getAllBlocks().find((block) => block.metadata?.khrInteractivity?.operation === "math/transpose")!;
        (transpose.getDataInput("a") as any)._defaultValue = Matrix.FromArray(editedValue);

        const edited = plan.build(context);
        const value = edited.graphs[0].nodes![0].values!.a;

        expect("value" in value && Array.isArray(value.value)).toBe(true);
        expect(value).toEqual({ type: 0, value: editedValue });
        expect(CreateKHRInteractivityDocument(edited).graphs[0].valid).toBe(true);
    });

    it("detects non-finite generated defaults corrupted by a FlowGraph JSON round trip", async () => {
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "float" }, { signature: "float2" }],
            variables: [{ type: 0, value: [1] }],
            declarations: [{ op: "variable/interpolate" }],
            nodes: [
                {
                    declaration: 0,
                    configuration: { variable: { value: [0] }, useSlerp: { value: [false] } },
                    values: {
                        value: { type: 0, value: [5] },
                        duration: { type: 0, value: [1] },
                        p1: { type: 1, value: [0, 0] },
                        p2: { type: 1, value: [1, 1] },
                    },
                },
            ],
        };
        const document = CreateKHRInteractivityDocument({ graphs: [graph] });
        const plan = await CreatePlan({ graphs: [graph] });
        const importedReference = coordinator.flowGraphs[0].getAllBlocks().find((block) => block.metadata?.khrInteractivity?.role === 2)!;
        const importedInput = importedReference.getDataInput("speed")!;
        delete importedReference.metadata.khrInteractivity.generatedInputDefaults.speed;
        (importedInput as any)._defaultValue = NaN;
        _CaptureKHRInteractivityRuntimeInputDefaults(coordinator.flowGraphs[0]);
        expect(plan.analyze().representable).toBe(true);
        const expectedSnapshot = importedReference.metadata.khrInteractivity.generatedInputDefaults.speed;
        expect(expectedSnapshot.runtimeValueFingerprint).toContain("NaN");

        const serialized: any = {};
        coordinator.flowGraphs[0].serialize(serialized);
        const persisted = JSON.parse(JSON.stringify(serialized));
        const reloadedCoordinator = new FlowGraphCoordinator({ scene });
        const reloaded = await ParseFlowGraphAsync(persisted, { coordinator: reloadedCoordinator });
        const reloadedReference = reloaded.getAllBlocks().find((block) => block.metadata?.khrInteractivity?.role === 2)!;
        const reloadedInput = reloadedReference.getDataInput("speed")!;
        expect(reloadedInput.isConnected()).toBe(false);
        expect(reloadedInput.metadata?.khrInteractivity).toBeUndefined();
        expect(_CreateKHRInteractivityRuntimeValueSnapshot((reloadedInput as any)._defaultValue)).not.toEqual(expectedSnapshot);
        const reloadedPlan = CreateKHRInteractivityExportPlan([reloaded], { document });

        expect(reloadedPlan.analyze()).toMatchObject({
            representable: false,
            diagnostics: expect.arrayContaining([
                expect.objectContaining({
                    code: "INPUT_DEFAULT_UNREPRESENTABLE",
                    socket: "speed",
                }),
            ]),
        });
        reloadedCoordinator.dispose();
    });

    it("does not rebaseline generated input defaults that could not be fingerprinted", () => {
        const graph = coordinator.createGraph();
        const block = new FlowGraphPlayAnimationBlock();
        block.metadata = {
            khrInteractivity: {
                graphIndex: 0,
                nodeIndex: 0,
                declarationIndex: 0,
                operation: "variable/interpolate",
                role: 2,
                sourcePath: "/extensions/KHR_interactivity/graphs/0/nodes/0",
            },
        };
        graph.addBlock(block);
        const cyclic: Record<string, unknown> = {};
        cyclic.self = cyclic;
        (block.speed as any)._defaultValue = cyclic;

        _CaptureKHRInteractivityRuntimeInputDefaults(graph);
        const provenance = block.metadata.khrInteractivity.generatedInputDefaults.speed;
        expect(provenance).toEqual({ unrepresentable: true });

        (block.speed as any)._defaultValue = 42;
        _CaptureKHRInteractivityRuntimeInputDefaults(graph);
        expect(block.metadata.khrInteractivity.generatedInputDefaults.speed).toBe(provenance);
    });

    it("strictly round-trips representative operations from every ratified category", async () => {
        const sourceNode = new TransformNode("source", scene);
        const animationGroup = new AnimationGroup("animation", scene);
        const sourceGLTF = {
            nodes: [{ index: 0, _babylonTransformNode: sourceNode }],
            animations: [{ index: 0, channels: [], samplers: [], _babylonAnimationGroup: animationGroup }],
        };
        const representativeGraph: IKHRInteractivity_Graph = {
            name: "Representative operations",
            types: [{ signature: "int" }, { signature: "float" }, { signature: "bool" }, { signature: "ref" }, { signature: "float3" }, { signature: "float2" }],
            variables: [{ type: 0, value: [4] }],
            events: [{ id: "test-event", values: { payload: { type: 0, value: [1] } } }],
            declarations: [
                { op: "math/abs" },
                { op: "type/intToFloat" },
                { op: "variable/get" },
                { op: "pointer/get" },
                { op: "animation/start" },
                { op: "event/onStart" },
                { op: "event/send" },
                { op: "flow/branch" },
                { op: "debug/log" },
                { op: "event/receive" },
            ],
            nodes: [
                { declaration: 0, values: { a: { type: 0, value: [-2] } } },
                { declaration: 1, values: { a: { node: 0 } } },
                { declaration: 2, configuration: { variable: { value: [0] } } },
                {
                    declaration: 3,
                    configuration: { pointer: { value: ["/nodes/[target]/translation"] }, type: { value: [4] } },
                    values: { target: { type: 0, value: [0] } },
                },
                {
                    declaration: 4,
                    values: {
                        animation: { type: 3, value: ["/animations/0"] },
                        speed: { type: 1, value: [1] },
                        startTime: { type: 1, value: [0] },
                        endTime: { type: 1, value: [1] },
                    },
                },
                { declaration: 5, flows: { out: { node: 6 } } },
                { declaration: 6, configuration: { event: { value: [0] } }, values: { payload: { node: 0 } }, flows: { out: { node: 7 } } },
                {
                    declaration: 7,
                    values: { condition: { type: 2, value: [true] } },
                    flows: { true: { node: 8 } },
                },
                {
                    declaration: 8,
                    configuration: { severity: { value: [0] }, message: { value: ["value={value}"] } },
                    values: { value: { node: 1 } },
                },
                { declaration: 9, configuration: { event: { value: [0] } } },
            ],
        };
        const extension: IKHRInteractivity = {
            graph: 1,
            graphs: [{ name: "Idle", declarations: [{ op: "event/onStart" }], nodes: [{ declaration: 0 }] }, representativeGraph],
        };
        const plan = await CreatePlan(extension, sourceGLTF);

        expect(plan.analyze().diagnostics).toEqual([]);
        const exported = plan.build({
            ...context,
            getNodeIndex: (node) => (node === sourceNode ? 2 : undefined),
            getAnimationIndex: (animation) => (animation === animationGroup ? 3 : undefined),
        });
        expect(exported.graph).toBe(1);
        expect(exported.graphs[1].nodes![3].values!.target).toEqual({ type: 0, value: [2] });
        expect(exported.graphs[1].nodes![4].values!.animation).toEqual({ type: 3, value: ["/animations/3"] });
        expect(exported.graphs[1].nodes![8].configuration!.message.value).toEqual(["value={value}"]);

        const strictDocument = CreateKHRInteractivityDocument(exported, undefined, 3);
        expect(strictDocument.diagnostics).toEqual([]);
        expect(strictDocument.graphs.every((graph) => graph.valid)).toBe(true);
        for (const graph of strictDocument.graphs) {
            expect(() => new InteractivityGraphToFlowGraphParser(graph.effectiveSource, sourceGLTF, 60, graph.index, undefined, graph.declarations)).not.toThrow();
        }
    });

    it("remaps pointer paths exactly once without interpreting unrelated configuration strings", async () => {
        const sourceNode = new TransformNode("source", scene);
        const sourceGLTF = { nodes: [{ index: 0, _babylonTransformNode: sourceNode }] };
        const extension: IKHRInteractivity = {
            graphs: [
                {
                    types: [{ signature: "float3" }],
                    declarations: [{ op: "pointer/get" }, { op: "debug/log" }],
                    nodes: [
                        {
                            declaration: 0,
                            configuration: { pointer: { value: ["/nodes/0/translation"] }, type: { value: [0] } },
                        },
                        {
                            declaration: 1,
                            configuration: { severity: { value: [0] }, message: { value: ["/nodes/0"] } },
                        },
                    ],
                },
            ],
        };
        const plan = await CreatePlan(extension, sourceGLTF);
        const exported = plan.build({
            ...context,
            getNodeCount: () => 5,
            getNodeIndex: (node) => (node === sourceNode ? 4 : undefined),
        });

        expect(exported.graphs[0].nodes![0].configuration!.pointer.value).toEqual(["/nodes/4/translation"]);
        expect(exported.graphs[0].nodes![1].configuration!.message.value).toEqual(["/nodes/0"]);
        expect(plan.analyze().diagnostics).toEqual([]);
    });

    it("rejects computed pointer indices that cannot be remapped statically", async () => {
        const sourceNode = new TransformNode("source", scene);
        const sourceGLTF = { nodes: [{ index: 0, _babylonTransformNode: sourceNode }] };
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "int" }, { signature: "float3" }],
            declarations: [{ op: "math/abs" }, { op: "pointer/get" }],
            nodes: [
                { declaration: 0, values: { a: { type: 0, value: [0] } } },
                {
                    declaration: 1,
                    configuration: { pointer: { value: ["/nodes/[target]/translation"] }, type: { value: [1] } },
                    values: { target: { node: 0 } },
                },
            ],
        };
        const plan = await CreatePlan({ graphs: [graph] }, sourceGLTF);

        expect(plan.analyze()).toMatchObject({
            representable: false,
            nodes: [
                expect.anything(),
                expect.objectContaining({ nodeIndex: 1, classification: "lossy", diagnostics: [expect.objectContaining({ code: "REFERENCE_UNRESOLVED" })] }),
            ],
            diagnostics: [expect.objectContaining({ code: "REFERENCE_UNRESOLVED", socket: "target" })],
        });
    });

    it("remaps a static index behind a dynamic root collection", async () => {
        const sourceNode = new TransformNode("source", scene);
        const sourceGLTF = { nodes: [{ index: 0, _babylonTransformNode: sourceNode }] };
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "ref" }, { signature: "float3" }],
            declarations: [{ op: "pointer/get" }],
            nodes: [
                {
                    declaration: 0,
                    configuration: { pointer: { value: ["/{root}/0/translation"] }, type: { value: [1] } },
                    values: { root: { type: 0, value: ["/nodes"] } },
                },
            ],
        };
        const plan = await CreatePlan({ graphs: [graph] }, sourceGLTF);
        const exported = plan.build({
            ...context,
            getNodeCount: () => 5,
            getNodeIndex: (node) => (node === sourceNode ? 4 : undefined),
        });

        expect(exported.graphs[0].nodes![0].configuration!.pointer.value).toEqual(["/{root}/4/translation"]);
        expect(exported.graphs[0].nodes![0].values!.root).toEqual({ type: 0, value: ["/nodes"] });
    });

    it("does not remap nested application-owned index segments", async () => {
        const sourceNode = new TransformNode("source", scene);
        const sourceGLTF = { nodes: [{ index: 0, _babylonTransformNode: sourceNode }] };
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "int" }, { signature: "float" }],
            declarations: [{ op: "pointer/get" }],
            nodes: [
                {
                    declaration: 0,
                    configuration: { pointer: { value: ["/extras/nodes/[target]"] }, type: { value: [1] } },
                    values: { target: { type: 0, value: [0] } },
                },
            ],
        };
        const plan = await CreatePlan({ graphs: [graph] }, sourceGLTF);
        const exported = plan.build({
            ...context,
            getNodeCount: () => 5,
            getNodeIndex: (node) => (node === sourceNode ? 4 : undefined),
        });

        expect(exported.graphs[0].nodes![0].values!.target).toEqual({ type: 0, value: [0] });
    });

    it("rejects indexed extension references without a serializer index mapping", async () => {
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "float3" }],
            declarations: [{ op: "pointer/get" }],
            nodes: [
                {
                    declaration: 0,
                    configuration: {
                        pointer: { value: ["/extensions/KHR_lights_punctual/lights/1/color"] },
                        type: { value: [0] },
                    },
                },
            ],
        };
        const plan = await CreatePlan({ graphs: [graph] });

        expect(plan.additionalExtensionsUsed).toContain("KHR_lights_punctual");
        expect(plan.analyze()).toMatchObject({
            representable: false,
            diagnostics: [expect.objectContaining({ code: "REFERENCE_UNRESOLVED", message: expect.stringContaining("KHR_lights_punctual") })],
        });
    });

    it("rejects extension-backed material pointers whose observable value may change during serialization", async () => {
        for (const extensionPayload of [{}, { emissiveStrength: 10 }]) {
            const graph: IKHRInteractivity_Graph = {
                types: [{ signature: "float" }],
                declarations: [{ op: "pointer/get" }],
                nodes: [
                    {
                        declaration: 0,
                        configuration: {
                            pointer: { value: ["/materials/0/extensions/KHR_materials_emissive_strength/emissiveStrength"] },
                            type: { value: [0] },
                        },
                    },
                ],
            };
            const sourceGLTF = {
                materials: [{ index: 0, extensions: { KHR_materials_emissive_strength: extensionPayload } }],
            };
            const plan = await CreatePlan({ graphs: [graph] }, sourceGLTF);

            expect(plan.additionalExtensionsUsed).toContain("KHR_materials_emissive_strength");
            expect(plan.analyze()).toMatchObject({
                representable: false,
                diagnostics: [
                    expect.objectContaining({
                        code: "REFERENCE_UNRESOLVED",
                        message: expect.stringContaining("KHR_materials_emissive_strength"),
                    }),
                ],
            });
        }
    });

    it("rejects an extension-backed pointer with a dynamic material index", async () => {
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "int" }, { signature: "float" }],
            declarations: [{ op: "pointer/get" }],
            nodes: [
                {
                    declaration: 0,
                    configuration: {
                        pointer: { value: ["/materials/[target]/extensions/KHR_materials_emissive_strength/emissiveStrength"] },
                        type: { value: [1] },
                    },
                    values: { target: { type: 0, value: [0] } },
                },
            ],
        };
        const plan = await CreatePlan({ graphs: [graph] });

        expect(plan.additionalExtensionsUsed).toContain("KHR_materials_emissive_strength");
        expect(plan.analyze()).toMatchObject({
            representable: false,
            diagnostics: [
                expect.objectContaining({
                    code: "REFERENCE_UNRESOLVED",
                    path: "/graphs/0/nodes/0/configuration/pointer",
                }),
            ],
        });
        expect(() => plan.build(context)).toThrowError(KHRInteractivityExportError);
    });

    it("rejects an extension-backed pointer with a ref-style material index", async () => {
        const material = {};
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "ref" }, { signature: "float" }],
            declarations: [{ op: "pointer/get" }],
            nodes: [
                {
                    declaration: 0,
                    configuration: {
                        pointer: { value: ["/materials/{target}/extensions/KHR_materials_emissive_strength/emissiveStrength"] },
                        type: { value: [1] },
                    },
                    values: { target: { type: 0, value: ["/materials/0"] } },
                },
            ],
        };
        const sourceGLTF = {
            materials: [
                {
                    index: 0,
                    _data: {
                        0: {
                            babylonMaterial: material,
                            babylonMeshes: [],
                            promise: Promise.resolve(),
                        },
                    },
                },
            ],
        };
        const plan = await CreatePlan({ graphs: [graph] }, sourceGLTF);

        expect(plan.additionalExtensionsUsed).toContain("KHR_materials_emissive_strength");
        expect(plan.analyze()).toMatchObject({
            representable: false,
            diagnostics: [
                expect.objectContaining({
                    code: "REFERENCE_UNRESOLVED",
                    path: "/graphs/0/nodes/0/configuration/pointer",
                }),
            ],
        });
        expect(() => plan.build(context)).toThrowError(KHRInteractivityExportError);
    });

    it("remaps a static node index behind a dynamic root for a preserved companion extension", async () => {
        const sourceNode = new TransformNode("source", scene);
        const sourceGLTF = {
            nodes: [{ index: 0, _babylonTransformNode: sourceNode, extensions: { KHR_node_visibility: { visible: true } } }],
        };
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "ref" }, { signature: "bool" }],
            declarations: [{ op: "pointer/get" }],
            nodes: [
                {
                    declaration: 0,
                    configuration: {
                        pointer: { value: ["/{root}/0/extensions/KHR_node_visibility/visible"] },
                        type: { value: [1] },
                    },
                    values: { root: { type: 0, value: ["/nodes"] } },
                },
            ],
        };
        const plan = await CreatePlan({ graphs: [graph] }, sourceGLTF);
        const exported = plan.build({
            ...context,
            getNodeCount: () => 5,
            getNodeIndex: (node) => (node === sourceNode ? 4 : undefined),
        });

        expect(plan.additionalExtensionsUsed).toContain("KHR_node_visibility");
        expect(exported.graphs[0].nodes![0].configuration!.pointer.value).toEqual(["/{root}/4/extensions/KHR_node_visibility/visible"]);
    });

    it("rejects an extension-backed ref variable reached through a collection hint", async () => {
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "ref" }, { signature: "float" }],
            variables: [{ type: 0, value: ["/materials/0/extensions/KHR_materials_emissive_strength/emissiveStrength"] }],
            declarations: [{ op: "variable/get" }, { op: "pointer/get" }],
            nodes: [
                { declaration: 0, configuration: { variable: { value: [0] } } },
                {
                    declaration: 1,
                    configuration: { pointer: { value: ["/{target}"] }, type: { value: [1] } },
                    values: { target: { node: 0 } },
                },
            ],
        };
        const plan = await CreatePlan({ graphs: [graph] });

        expect(plan.additionalExtensionsUsed).toContain("KHR_materials_emissive_strength");
        expect(plan.analyze()).toMatchObject({
            representable: false,
            diagnostics: [
                expect.objectContaining({
                    code: "REFERENCE_UNRESOLVED",
                    message: expect.stringContaining("KHR_materials_emissive_strength"),
                }),
            ],
        });
        expect(() => plan.build(context)).toThrowError(KHRInteractivityExportError);
    });

    it("uses a pointer template collection hint when an object has multiple glTF identities", async () => {
        const sourceNode = new TransformNode("source", scene);
        const camera = new FreeCamera("camera", Vector3.Zero(), scene);
        const sourceGLTF = {
            nodes: [{ index: 0, _babylonTransformNode: sourceNode }],
            cameras: [{ index: 0, _babylonCamera: camera }],
        };
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "ref" }, { signature: "float3" }],
            declarations: [{ op: "pointer/get" }],
            nodes: [
                {
                    declaration: 0,
                    configuration: { pointer: { value: ["/nodes/{target}/translation"] }, type: { value: [1] } },
                    values: { target: { type: 0, value: ["/nodes/0"] } },
                },
            ],
        };
        await CreatePlan({ graphs: [graph] }, sourceGLTF);
        const pointerBlock = coordinator.flowGraphs[0].getAllBlocks().find((block) => block.metadata?.khrInteractivity?.nodeIndex === 0 && block.getDataInput("target"))!;
        (pointerBlock.getDataInput("target") as any)._defaultValue = camera;
        const plan = CreateKHRInteractivityExportPlan(coordinator.flowGraphs, {
            document: CreateKHRInteractivityDocument({ graphs: [graph] }, undefined, 1),
            sourceGLTF,
        });
        const exported = plan.build({
            ...context,
            getNodeCount: () => 5,
            getNodeIndex: (node) => (node === camera ? 4 : undefined),
            getCameraIndex: (value) => (value === camera ? 1 : undefined),
        });

        expect(exported.graphs[0].nodes![0].values!.target).toEqual({ type: 0, value: ["/nodes/4"] });
    });

    it("uses the pointer template collection when an edited string reference has another prefix", async () => {
        const camera = new FreeCamera("camera", Vector3.Zero(), scene);
        const sourceGLTF = {
            nodes: [{ index: 0, _babylonTransformNode: camera }],
            cameras: [{ index: 0, _babylonCamera: camera }],
        };
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "ref" }, { signature: "float3" }],
            declarations: [{ op: "pointer/get" }],
            nodes: [
                {
                    declaration: 0,
                    configuration: { pointer: { value: ["/nodes/{target}/translation"] }, type: { value: [1] } },
                    values: { target: { type: 0, value: ["/nodes/0"] } },
                },
            ],
        };
        await CreatePlan({ graphs: [graph] }, sourceGLTF);
        const pointerBlock = coordinator.flowGraphs[0].getAllBlocks().find((block) => block.metadata?.khrInteractivity?.nodeIndex === 0 && block.getDataInput("target"))!;
        // String template references contribute only the segment at the placeholder position.
        (pointerBlock.getDataInput("target") as any)._defaultValue = "/cameras/0";
        const plan = CreateKHRInteractivityExportPlan(coordinator.flowGraphs, {
            document: CreateKHRInteractivityDocument({ graphs: [graph] }, undefined, 1),
            sourceGLTF,
        });
        const exported = plan.build({
            ...context,
            getNodeCount: () => 5,
            getNodeIndex: (node) => (node === camera ? 4 : undefined),
            getCameraIndex: (value) => (value === camera ? 1 : undefined),
        });

        expect(exported.graphs[0].nodes![0].values!.target).toEqual({ type: 0, value: ["/nodes/4"] });
    });

    it("uses the edited dynamic root collection when remapping a target reference", async () => {
        const sourceNode = new TransformNode("source", scene);
        const camera = new FreeCamera("camera", Vector3.Zero(), scene);
        const sourceGLTF = {
            nodes: [{ index: 0, _babylonTransformNode: sourceNode }],
            cameras: [{ index: 0, _babylonCamera: camera }],
        };
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "ref" }, { signature: "float" }],
            declarations: [{ op: "pointer/get" }],
            nodes: [
                {
                    declaration: 0,
                    configuration: { pointer: { value: ["/{root}/{target}/extras/value"] }, type: { value: [1] } },
                    values: {
                        root: { type: 0, value: ["/nodes"] },
                        target: { type: 0, value: ["/nodes/0"] },
                    },
                },
            ],
        };
        await CreatePlan({ graphs: [graph] }, sourceGLTF);
        const pointerBlock = coordinator.flowGraphs[0].getAllBlocks().find((block) => block.metadata?.khrInteractivity?.nodeIndex === 0 && block.getDataInput("target"))!;
        (pointerBlock.getDataInput("root") as any)._defaultValue = "/cameras";
        const plan = CreateKHRInteractivityExportPlan(coordinator.flowGraphs, {
            document: CreateKHRInteractivityDocument({ graphs: [graph] }, undefined, 1),
            sourceGLTF,
        });
        const exported = plan.build({
            ...context,
            getNodeCount: () => 5,
            getNodeIndex: (node) => (node === sourceNode ? 4 : undefined),
            getCameraIndex: (value) => (value === camera ? 1 : undefined),
        });

        expect(exported.graphs[0].nodes![0].values!.root).toEqual({ type: 0, value: ["/cameras"] });
        expect(exported.graphs[0].nodes![0].values!.target).toEqual({ type: 0, value: ["/cameras/1"] });
    });

    it("defers newly authored scene-object references to the final serializer context", async () => {
        const sourceNode = new TransformNode("source", scene);
        const addedNode = new TransformNode("added", scene);
        const sourceGLTF = { nodes: [{ index: 0, _babylonTransformNode: sourceNode }] };
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "ref" }, { signature: "float3" }],
            declarations: [{ op: "pointer/get" }],
            nodes: [
                {
                    declaration: 0,
                    configuration: { pointer: { value: ["/nodes/{target}/translation"] }, type: { value: [1] } },
                    values: { target: { type: 0, value: ["/nodes/0"] } },
                },
            ],
        };
        await CreatePlan({ graphs: [graph] }, sourceGLTF);
        const pointerBlock = coordinator.flowGraphs[0].getAllBlocks().find((block) => block.metadata?.khrInteractivity?.nodeIndex === 0 && block.getDataInput("target"))!;
        (pointerBlock.getDataInput("target") as any)._defaultValue = addedNode;
        const plan = CreateKHRInteractivityExportPlan(coordinator.flowGraphs, {
            document: CreateKHRInteractivityDocument({ graphs: [graph] }, undefined, 1),
            sourceGLTF,
        });

        expect(plan.analyze().diagnostics).toEqual([]);
        expect(
            plan.build({
                ...context,
                getNodeCount: () => 2,
                getNodeIndex: (node) => (node === sourceNode ? 0 : node === addedNode ? 1 : undefined),
            }).graphs[0].nodes![0].values!.target
        ).toEqual({ type: 0, value: ["/nodes/1"] });
    });

    it("keeps runtime-mutated variables separate from explicit authored defaults", async () => {
        const extension: IKHRInteractivity = {
            graphs: [
                {
                    types: [{ signature: "int" }],
                    variables: [{ type: 0, value: [1] }],
                    declarations: [{ op: "variable/get" }],
                    nodes: [{ declaration: 0, configuration: { variable: { value: [0] } } }],
                },
            ],
        };
        const plan = await CreatePlan(extension);
        coordinator.flowGraphs[0].getContext(0)!.setVariable("staticVariable_0", new FlowGraphInteger(9));

        expect(plan.build(context).graphs[0].variables![0].value).toEqual([1]);

        coordinator.flowGraphs[0].metadata.khrInteractivity.authoredVariableValues = { 0: [3] };
        expect(plan.build(context).graphs[0].variables![0].value).toEqual([3]);
    });

    it("exports an explicitly authored KHR variable type change", async () => {
        const extension: IKHRInteractivity = {
            graphs: [
                {
                    types: [{ signature: "int" }],
                    variables: [{ type: 0, value: [1] }],
                    declarations: [{ op: "variable/get" }],
                    nodes: [{ declaration: 0, configuration: { variable: { value: [0] } } }],
                },
            ],
        };
        const plan = await CreatePlan(extension);
        coordinator.flowGraphs[0].metadata.khrInteractivity.authoredVariableTypes = { 0: FlowGraphTypes.Number };
        coordinator.flowGraphs[0].metadata.khrInteractivity.authoredVariableValues = { 0: [2] };
        const exported = plan.build(context);

        expect(exported.graphs[0].types).toEqual([{ signature: "int" }, { signature: "float" }]);
        expect(exported.graphs[0].variables![0]).toEqual({ type: 1, value: [2] });
    });

    it("uses downstream pointer consumers to disambiguate authored object references", async () => {
        const sourceNode = new TransformNode("source", scene);
        const camera = new FreeCamera("camera", Vector3.Zero(), scene);
        const sourceGLTF = {
            nodes: [
                { index: 0, _babylonTransformNode: sourceNode },
                { index: 1, _babylonTransformNode: camera },
            ],
            cameras: [{ index: 0, _babylonCamera: camera }],
        };
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "ref" }, { signature: "float3" }],
            variables: [{ type: 0 }],
            declarations: [{ op: "variable/get" }, { op: "pointer/get" }],
            nodes: [
                { declaration: 0, configuration: { variable: { value: [0] } } },
                {
                    declaration: 1,
                    configuration: { pointer: { value: ["/nodes/{target}/translation"] }, type: { value: [1] } },
                    values: { target: { node: 0 } },
                },
            ],
        };
        await CreatePlan({ graphs: [graph] }, sourceGLTF);
        coordinator.flowGraphs[0].metadata.khrInteractivity.authoredVariableValues = { 0: [camera] };
        const plan = CreateKHRInteractivityExportPlan(coordinator.flowGraphs, {
            document: CreateKHRInteractivityDocument({ graphs: [graph] }, undefined, 2),
            sourceGLTF,
        });
        const exported = plan.build({
            ...context,
            getNodeCount: () => 5,
            getNodeIndex: (node) => (node === sourceNode ? 3 : node === camera ? 4 : undefined),
            getCameraIndex: (value) => (value === camera ? 1 : undefined),
        });

        expect(exported.graphs[0].variables![0].value).toEqual(["/nodes/4"]);
    });

    it("rejects edits to importer-generated semantic configuration", async () => {
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "float" }],
            declarations: [{ op: "math/round" }],
            nodes: [{ declaration: 0, values: { a: { type: 0, value: [-1.5] } } }],
        };
        await CreatePlan({ graphs: [graph] });
        const block = coordinator.flowGraphs[0].getAllBlocks()[0];
        expect(block.config!.roundHalfAwayFromZero).toBe(true);
        block.config!.roundHalfAwayFromZero = false;
        const plan = CreateKHRInteractivityExportPlan(coordinator.flowGraphs, {
            document: CreateKHRInteractivityDocument({ graphs: [graph] }),
        });

        expect(plan.analyze()).toMatchObject({
            representable: false,
            diagnostics: [
                expect.objectContaining({
                    code: "CONFIGURATION_UNREPRESENTABLE",
                    path: expect.stringContaining("/config/roundHalfAwayFromZero"),
                }),
            ],
        });
    });

    it("preserves authored fallback configuration while reporting its source warning", async () => {
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "int" }],
            declarations: [{ op: "flow/for" }],
            nodes: [
                {
                    declaration: 0,
                    configuration: {
                        initialIndex: { value: ["invalid"], extras: { preserved: true } },
                    },
                    values: {
                        startIndex: { type: 0, value: [0] },
                        endIndex: { type: 0, value: [1] },
                    },
                },
            ],
        };
        const plan = await CreatePlan({ graphs: [graph] });

        expect(plan.analyze()).toMatchObject({
            representable: true,
            diagnostics: [expect.objectContaining({ code: "GRAPH_INVALID", severity: "warning" })],
        });
        expect(plan.build(context).graphs[0].nodes![0].configuration!.initialIndex).toEqual(graph.nodes![0].configuration!.initialIndex);
    });

    it("uses effective fallback configuration when classifying dynamic sockets", async () => {
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "int" }],
            declarations: [{ op: "event/onStart" }, { op: "flow/waitAll" }, { op: "debug/log" }],
            nodes: [
                { declaration: 0, flows: { out: { node: 1, socket: "64" } } },
                { declaration: 1, configuration: { inputFlows: { value: [65], extras: { preserved: true } } } },
                {
                    declaration: 2,
                    configuration: { message: { value: ["x={x}"] } },
                    values: { x: { type: 0, value: [1] } },
                },
            ],
        };
        const plan = await CreatePlan({ graphs: [graph] });
        const analysis = plan.analyze();

        expect(analysis.representable).toBe(true);
        expect(analysis.diagnostics).toContainEqual(
            expect.objectContaining({ code: "GRAPH_INVALID", severity: "warning", path: expect.stringContaining("/configuration/inputFlows") })
        );
        const exported = plan.build(context).graphs[0];
        expect(exported.nodes![0].flows).toEqual({ out: { node: 1, socket: "64" } });
        expect(exported.nodes![1].configuration!.inputFlows).toEqual(graph.nodes![1].configuration!.inputFlows);
        expect(exported.nodes![2].values!.x).toEqual(graph.nodes![2].values!.x);
    });

    it("rebuilds an edited fallback group atomically from runtime values", async () => {
        const graph: IKHRInteractivity_Graph = {
            declarations: [{ op: "flow/multiGate" }],
            nodes: [
                {
                    declaration: 0,
                    configuration: {
                        isRandom: { value: [true] },
                        isLoop: { value: ["invalid"], extras: { preserved: true } },
                    },
                },
            ],
        };
        await CreatePlan({ graphs: [graph] });
        const block = coordinator.flowGraphs[0].getAllBlocks()[0];
        expect(block.config).toMatchObject({ isRandom: false, isLoop: false });
        block.config!.isRandom = true;
        const plan = CreateKHRInteractivityExportPlan(coordinator.flowGraphs, {
            document: CreateKHRInteractivityDocument({ graphs: [graph] }),
        });
        const exported = plan.build(context);

        expect(exported.graphs[0].nodes![0].configuration).toEqual({
            isRandom: { value: [true] },
            isLoop: { value: [false], extras: { preserved: true } },
        });
        expect(CreateKHRInteractivityDocument(exported).graphs[0].effectiveSource.nodes![0].configuration).toEqual(exported.graphs[0].nodes![0].configuration);
    });

    it("preserves an unchanged validation-only group member when another member is edited", async () => {
        const graph: IKHRInteractivity_Graph = {
            declarations: [{ op: "debug/log" }],
            nodes: [
                {
                    declaration: 0,
                    configuration: {
                        severity: { value: [2] },
                        message: { value: ["old"] },
                    },
                },
            ],
        };
        await CreatePlan({ graphs: [graph] });
        coordinator.flowGraphs[0].getAllBlocks()[0].config!.messageTemplate = "new";
        const plan = CreateKHRInteractivityExportPlan(coordinator.flowGraphs, {
            document: CreateKHRInteractivityDocument({ graphs: [graph] }),
        });

        expect(plan.build(context).graphs[0].nodes![0].configuration).toEqual({
            severity: { value: [2] },
            message: { value: ["new"] },
        });
    });

    it("round-trips connected animation-time helpers as their owning KHR operation", async () => {
        const animationGroup = new AnimationGroup("animation", scene);
        const sourceGLTF = {
            animations: [{ index: 0, channels: [], samplers: [], _babylonAnimationGroup: animationGroup }],
        };
        const extension: IKHRInteractivity = {
            graphs: [
                {
                    types: [{ signature: "float" }, { signature: "ref" }],
                    declarations: [{ op: "pointer/get" }, { op: "animation/start" }],
                    nodes: [
                        {
                            declaration: 0,
                            configuration: {
                                pointer: { value: ["/animations/0/extensions/KHR_interactivity/maxTime"] },
                                type: { value: [0] },
                            },
                        },
                        {
                            declaration: 1,
                            values: {
                                animation: { type: 1, value: ["/animations/0"] },
                                speed: { type: 0, value: [1] },
                                startTime: { type: 0, value: [0] },
                                endTime: { node: 0 },
                            },
                        },
                    ],
                },
            ],
        };
        const plan = await CreatePlan(extension, sourceGLTF);

        expect(plan.analyze().diagnostics).toEqual([]);
        expect(
            plan.build({
                ...context,
                getAnimationIndex: (animation) => (animation === animationGroup ? 0 : undefined),
            })
        ).toEqual(extension);
    });

    it("emits added and removed mapped flow connections from the edited graph", async () => {
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "int" }],
            declarations: [{ op: "event/onStart" }, { op: "flow/doN" }],
            nodes: [{ declaration: 0 }, { declaration: 1, values: { n: { type: 0, value: [1] } } }],
        };
        await CreatePlan({ graphs: [graph] });
        const source = coordinator.flowGraphs[0].getAllBlocks().find((block) => block.metadata?.khrInteractivity?.nodeIndex === 0) as any;
        const target = coordinator.flowGraphs[0].getAllBlocks().find((block) => block.metadata?.khrInteractivity?.nodeIndex === 1) as any;
        source.getSignalOutput("done").connectTo(target.getSignalInput("in"));

        const connectedPlan = CreateKHRInteractivityExportPlan(coordinator.flowGraphs, {
            document: CreateKHRInteractivityDocument({ graphs: [graph] }),
        });
        expect(connectedPlan.analyze().diagnostics).toEqual([]);
        expect(connectedPlan.build(context).graphs[0].nodes![0].flows).toEqual({ out: { node: 1 } });

        source.getSignalOutput("done").disconnectFrom(target.getSignalInput("in"));
        const disconnectedPlan = CreateKHRInteractivityExportPlan(coordinator.flowGraphs, {
            document: CreateKHRInteractivityDocument({ graphs: [graph] }),
        });
        expect(disconnectedPlan.analyze().diagnostics).toEqual([]);
        expect(disconnectedPlan.build(context).graphs[0].nodes![0].flows).toBeUndefined();
    });

    it("converts a typeless connected input to a typed literal", async () => {
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "int" }],
            declarations: [{ op: "math/abs" }, { op: "flow/doN" }],
            nodes: [
                { declaration: 0, values: { a: { type: 0, value: [-1] } } },
                { declaration: 1, values: { n: { node: 0 } } },
            ],
        };
        await CreatePlan({ graphs: [graph] });
        const source = coordinator.flowGraphs[0].getAllBlocks().find((block) => block.metadata?.khrInteractivity?.nodeIndex === 0)!;
        const target = coordinator.flowGraphs[0].getAllBlocks().find((block) => block.metadata?.khrInteractivity?.nodeIndex === 1)!;
        target.getDataInput("maxExecutions")!.disconnectFrom(source.getDataOutput("value")!);
        (target.getDataInput("maxExecutions") as any)._defaultValue = new FlowGraphInteger(7);
        const plan = CreateKHRInteractivityExportPlan(coordinator.flowGraphs, {
            document: CreateKHRInteractivityDocument({ graphs: [graph] }),
        });

        expect(plan.analyze().diagnostics).toEqual([]);
        expect(plan.build(context).graphs[0].nodes![1].values!.n).toEqual({ type: 0, value: [7] });
    });

    it("recovers a dynamic variable input type after disconnecting it", async () => {
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "int" }],
            variables: [{ type: 0, value: [1] }],
            declarations: [{ op: "math/abs" }, { op: "variable/set" }],
            nodes: [
                { declaration: 0, values: { a: { type: 0, value: [-1] } } },
                { declaration: 1, configuration: { variables: { value: [0] } }, values: { "0": { node: 0 } } },
            ],
        };
        await CreatePlan({ graphs: [graph] });
        const source = coordinator.flowGraphs[0].getAllBlocks().find((block) => block.metadata?.khrInteractivity?.nodeIndex === 0)!;
        const target = coordinator.flowGraphs[0].getAllBlocks().find((block) => block.metadata?.khrInteractivity?.nodeIndex === 1)!;
        target.getDataInput("staticVariable_0")!.disconnectFrom(source.getDataOutput("value")!);
        (target.getDataInput("staticVariable_0") as any)._defaultValue = new FlowGraphInteger(7);
        const plan = CreateKHRInteractivityExportPlan(coordinator.flowGraphs, {
            document: CreateKHRInteractivityDocument({ graphs: [graph] }),
        });

        expect(plan.analyze().diagnostics).toEqual([]);
        expect(plan.build(context).graphs[0].nodes![1].values!["0"]).toEqual({ type: 0, value: [7] });
    });

    it("rejects a newly connected dynamic flow socket whose KHR id is ambiguous", async () => {
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "int" }],
            declarations: [{ op: "flow/sequence" }, { op: "flow/doN" }],
            nodes: [
                {
                    declaration: 0,
                    flows: { "0": { node: 1 } },
                },
                { declaration: 1, values: { n: { type: 0, value: [1] } } },
                { declaration: 1, values: { n: { type: 0, value: [1] } } },
            ],
        };
        await CreatePlan({ graphs: [graph] });
        const sequenceBlock = coordinator.flowGraphs[0].getAllBlocks().find((block) => block.metadata?.khrInteractivity?.nodeIndex === 0) as any;
        const target = coordinator.flowGraphs[0].getAllBlocks().find((block) => block.metadata?.khrInteractivity?.nodeIndex === 2) as any;
        sequenceBlock.setNumberOfOutputSignals(2);
        sequenceBlock.getSignalOutput("out_1").connectTo(target.getSignalInput("in"));
        const plan = CreateKHRInteractivityExportPlan(coordinator.flowGraphs, {
            document: CreateKHRInteractivityDocument({ graphs: [graph] }),
        });

        expect(plan.analyze().representable).toBe(false);
        expect(plan.analyze().diagnostics).toContainEqual(
            expect.objectContaining({
                code: "SOCKET_PROVENANCE_MISSING",
                socket: "out_1",
            })
        );
    });

    it("rejects multi-gate output-count edits that change runtime behavior", async () => {
        const graph: IKHRInteractivity_Graph = {
            declarations: [{ op: "flow/multiGate" }],
            nodes: [{ declaration: 0 }],
        };
        await CreatePlan({ graphs: [graph] });
        const block = coordinator.flowGraphs[0].getAllBlocks()[0] as any;
        block.setNumberOfOutputSignals(2);
        const plan = CreateKHRInteractivityExportPlan(coordinator.flowGraphs, {
            document: CreateKHRInteractivityDocument({ graphs: [graph] }),
        });

        expect(plan.analyze().diagnostics).toContainEqual(
            expect.objectContaining({
                code: "CONFIGURATION_UNREPRESENTABLE",
                path: expect.stringContaining("/config/outputSignalCount"),
            })
        );
    });

    it("preserves a specification-defined no-op flow target", async () => {
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "int" }],
            declarations: [{ op: "event/onStart" }, { op: "math/abs" }],
            nodes: [
                { declaration: 0, flows: { out: { node: 1, socket: "missing" } } },
                { declaration: 1, values: { a: { type: 0, value: [1] } } },
            ],
        };
        const plan = await CreatePlan({ graphs: [graph] });

        expect(plan.analyze().diagnostics).toEqual([]);
        expect(plan.build(context).graphs[0].nodes![0].flows).toEqual({ out: { node: 1, socket: "missing" } });
    });

    it("preserves an out-of-range dynamic input flow as a no-op", async () => {
        const graph: IKHRInteractivity_Graph = {
            declarations: [{ op: "event/onStart" }, { op: "flow/waitAll" }],
            nodes: [
                { declaration: 0, flows: { out: { node: 1, socket: "2" } } },
                { declaration: 1, configuration: { inputFlows: { value: [1] } } },
            ],
        };
        const plan = await CreatePlan({ graphs: [graph] });

        expect(plan.analyze().diagnostics).toEqual([]);
        expect(plan.build(context).graphs[0].nodes![0].flows).toEqual({ out: { node: 1, socket: "2" } });

        const waitAll = coordinator.flowGraphs[0].getAllBlocks().find((block) => block.metadata?.khrInteractivity?.nodeIndex === 1)!;
        waitAll.config!.inputSignalCount = 3;
        const editedPlan = CreateKHRInteractivityExportPlan(coordinator.flowGraphs, {
            document: CreateKHRInteractivityDocument({ graphs: [graph] }),
        });
        expect(editedPlan.analyze().diagnostics).toContainEqual(
            expect.objectContaining({
                code: "CONFIGURATION_UNREPRESENTABLE",
                socket: "out",
                message: expect.stringContaining("formerly ignored flow target"),
            })
        );
    });

    it("rejects a connected dynamic input disabled by an edited configuration", async () => {
        const graph: IKHRInteractivity_Graph = {
            declarations: [{ op: "event/onStart" }, { op: "flow/waitAll" }],
            nodes: [
                { declaration: 0, flows: { out: { node: 1, socket: "0" } } },
                { declaration: 1, configuration: { inputFlows: { value: [1] } } },
            ],
        };
        await CreatePlan({ graphs: [graph] });
        const waitAll = coordinator.flowGraphs[0].getAllBlocks().find((block) => block.metadata?.khrInteractivity?.nodeIndex === 1)!;
        waitAll.config!.inputSignalCount = 0;
        const plan = CreateKHRInteractivityExportPlan(coordinator.flowGraphs, {
            document: CreateKHRInteractivityDocument({ graphs: [graph] }),
        });

        expect(plan.analyze().diagnostics).toContainEqual(
            expect.objectContaining({
                code: "CONFIGURATION_UNREPRESENTABLE",
                message: expect.stringContaining("disabled by the target node's edited configuration"),
            })
        );
    });

    it("inverts an unambiguous newly connected dynamic input socket", async () => {
        const graph: IKHRInteractivity_Graph = {
            declarations: [{ op: "event/onStart" }, { op: "flow/waitAll" }],
            nodes: [{ declaration: 0 }, { declaration: 1, configuration: { inputFlows: { value: [2] } } }],
        };
        await CreatePlan({ graphs: [graph] });
        const source = coordinator.flowGraphs[0].getAllBlocks().find((block) => block.metadata?.khrInteractivity?.nodeIndex === 0) as any;
        const target = coordinator.flowGraphs[0].getAllBlocks().find((block) => block.metadata?.khrInteractivity?.nodeIndex === 1) as any;
        source.getSignalOutput("done").connectTo(target.getSignalInput("in_0"));
        const plan = CreateKHRInteractivityExportPlan(coordinator.flowGraphs, {
            document: CreateKHRInteractivityDocument({ graphs: [graph] }),
        });

        expect(plan.analyze().diagnostics).toEqual([]);
        expect(plan.build(context).graphs[0].nodes![0].flows).toEqual({ out: { node: 1, socket: "0" } });
    });

    it("preserves specification-permitted no-op input values and output flows", async () => {
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "int" }],
            declarations: [{ op: "event/onStart" }, { op: "math/abs" }],
            nodes: [
                {
                    declaration: 0,
                    flows: { unused: { node: 1, extras: { preserved: true } } },
                },
                {
                    declaration: 1,
                    values: {
                        a: { type: 0, value: [1] },
                        unused: { type: 0, value: [2], extras: { preserved: true } },
                    },
                },
            ],
        };
        const plan = await CreatePlan({ graphs: [graph] });

        expect(plan.analyze().diagnostics).toEqual([]);
        const exported = plan.build(context);
        expect(exported.graphs[0].nodes![0].flows).toEqual(graph.nodes![0].flows);
        expect(exported.graphs[0].nodes![1].values!.unused).toEqual(graph.nodes![1].values!.unused);
    });

    it("removes an empty values dictionary after a dynamic socket is disabled", async () => {
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "int" }],
            declarations: [{ op: "debug/log" }],
            nodes: [
                {
                    declaration: 0,
                    configuration: { severity: { value: [0] }, message: { value: ["x={x}"] } },
                    values: { x: { type: 0, value: [1] } },
                },
            ],
        };
        await CreatePlan({ graphs: [graph] });
        const block = coordinator.flowGraphs[0].getAllBlocks()[0];
        block.config!.messageTemplate = "";
        expect(block.metadata.khrInteractivity.configuration.message).toEqual({
            sourceValue: ["x={x}"],
            runtimeValue: "x={x}",
        });
        const plan = CreateKHRInteractivityExportPlan(coordinator.flowGraphs, {
            document: CreateKHRInteractivityDocument({ graphs: [graph] }),
        });

        expect(plan.analyze().diagnostics).toEqual([]);
        expect(plan.build(context).graphs[0].nodes![0].values).toBeUndefined();
    });

    it("preserves prototype-like flow socket ids", async () => {
        const flows = Object.create(null) as NonNullable<IKHRInteractivity_Graph["nodes"]>[number]["flows"];
        Object.defineProperty(flows, "__proto__", {
            enumerable: true,
            value: { node: 1 },
        });
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "int" }],
            declarations: [{ op: "flow/sequence" }, { op: "flow/doN" }],
            nodes: [
                { declaration: 0, flows },
                { declaration: 1, values: { n: { type: 0, value: [1] } } },
            ],
        };
        const plan = await CreatePlan({ graphs: [graph] });
        const exportedFlows = plan.build(context).graphs[0].nodes![0].flows!;

        expect(Object.prototype.hasOwnProperty.call(exportedFlows, "__proto__")).toBe(true);
        expect(exportedFlows["__proto__"]).toEqual({ node: 1 });
    });

    it("preserves prototype-like no-op sockets on fixed operations", async () => {
        const flows = Object.create(null) as NonNullable<IKHRInteractivity_Graph["nodes"]>[number]["flows"];
        Object.defineProperty(flows, "__proto__", {
            enumerable: true,
            value: { node: 1 },
        });
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "int" }],
            declarations: [{ op: "event/onStart" }, { op: "math/abs" }],
            nodes: [
                { declaration: 0, flows },
                { declaration: 1, values: { a: { type: 0, value: [1] } } },
            ],
        };
        const plan = await CreatePlan({ graphs: [graph] });
        const exportedFlows = plan.build(context).graphs[0].nodes![0].flows!;

        expect(Object.prototype.hasOwnProperty.call(exportedFlows, "__proto__")).toBe(true);
        expect(exportedFlows["__proto__"]).toEqual({ node: 1 });
    });

    it("preserves prototype-like sockets on unsupported extension operations", async () => {
        const inputSockets = Object.create(null);
        Object.defineProperty(inputSockets, "__proto__", {
            enumerable: true,
            value: { type: 0 },
        });
        const values = Object.create(null);
        Object.defineProperty(values, "__proto__", {
            enumerable: true,
            value: { type: 0, value: [7], extras: { preserved: true } },
        });
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "int" }],
            declarations: [{ op: "vendor/doThing", extension: "EXT_vendor_interactivity", inputValueSockets: inputSockets }],
            nodes: [{ declaration: 0, values }],
        };
        const plan = await CreatePlan({ graphs: [graph] });
        const exportedValues = plan.build(context).graphs[0].nodes![0].values!;

        expect(Object.prototype.hasOwnProperty.call(exportedValues, "__proto__")).toBe(true);
        expect(exportedValues["__proto__"]).toEqual({ type: 0, value: [7], extras: { preserved: true } });
    });

    it("preserves property extensions and extras while rebuilding values, flows, and configuration", async () => {
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "int" }, { signature: "float3" }],
            declarations: [{ op: "math/abs" }, { op: "event/onStart" }, { op: "flow/doN" }, { op: "pointer/get" }],
            nodes: [
                { declaration: 0, values: { a: { type: 0, value: [1] } } },
                {
                    declaration: 1,
                    flows: { out: { node: 2, extras: { flow: true }, extensions: { EXT_flow: { enabled: true } } } },
                },
                {
                    declaration: 2,
                    values: { n: { node: 0, extras: { value: true }, extensions: { EXT_value: { enabled: true } } } },
                },
                {
                    declaration: 3,
                    configuration: {
                        pointer: {
                            value: ["/nodes/0/translation"],
                            extras: { configuration: true },
                            extensions: { EXT_configuration: { enabled: true } },
                        },
                        type: { value: [1] },
                    },
                },
            ],
        };
        const sourceNode = new TransformNode("source", scene);
        const plan = await CreatePlan({ graphs: [graph] }, { nodes: [{ index: 0, _babylonTransformNode: sourceNode }] });
        const exported = plan.build({
            ...context,
            getNodeCount: () => 2,
            getNodeIndex: (node) => (node === sourceNode ? 1 : undefined),
        });

        expect(exported.graphs[0].nodes![1].flows!.out).toEqual(graph.nodes![1].flows!.out);
        expect(exported.graphs[0].nodes![2].values!.n).toEqual(graph.nodes![2].values!.n);
        expect(exported.graphs[0].nodes![3].configuration!.pointer).toEqual({
            ...graph.nodes![3].configuration!.pointer,
            value: ["/nodes/1/translation"],
        });
    });

    it("preserves prototype-like extension keys as own JSON properties", async () => {
        const extension: IKHRInteractivity = {
            graphs: [{ declarations: [{ op: "event/onStart" }], nodes: [{ declaration: 0 }] }],
        };
        const extras: Record<string, unknown> = {};
        Object.defineProperty(extras, "__proto__", {
            enumerable: true,
            value: { preserved: true },
        });
        extension.extras = extras;
        const plan = await CreatePlan(extension);
        const exported = plan.build(context);

        expect(Object.prototype.hasOwnProperty.call(exported.extras, "__proto__")).toBe(true);
        expect((exported.extras as any).__proto__).toEqual({ preserved: true });
        expect(({} as any).preserved).toBeUndefined();
    });

    it("reports an empty graph set without throwing during analysis", () => {
        const plan = CreateKHRInteractivityExportPlan([]);

        expect(plan.analyze().representable).toBe(false);
        expect(plan.analyze().diagnostics).toContainEqual(expect.objectContaining({ code: "GRAPH_COUNT_MISMATCH" }));
        expect(() => plan.build(context)).toThrowError(KHRInteractivityExportError);
    });

    it("requires the canonical root document for lossless export", async () => {
        await CreatePlan({
            extras: { root: true },
            graph: 0,
            graphs: [{ declarations: [{ op: "event/onStart" }], nodes: [{ declaration: 0 }] }],
        });
        const plan = CreateKHRInteractivityExportPlan(coordinator.flowGraphs);

        expect(plan.analyze()).toMatchObject({
            representable: false,
            diagnostics: [expect.objectContaining({ code: "GRAPH_SOURCE_MISSING", path: "/extensions/KHR_interactivity" })],
        });
    });

    it("preserves omission of the optional nodes collection", async () => {
        const plan = await CreatePlan({ graphs: [{}] });

        expect(plan.analyze().diagnostics).toEqual([]);
        expect(plan.build(context)).toEqual({ graphs: [{}] });
    });

    it("refreshes structural analysis before reuse", async () => {
        const extension: IKHRInteractivity = {
            graphs: [{ declarations: [{ op: "event/onStart" }], nodes: [{ declaration: 0 }] }],
        };
        const plan = await CreatePlan(extension);
        expect(plan.analyze().representable).toBe(true);

        coordinator.flowGraphs[0].removeBlock(coordinator.flowGraphs[0].getAllBlocks()[0]);

        expect(plan.analyze().representable).toBe(false);
        expect(plan.analyze().diagnostics).toContainEqual(expect.objectContaining({ code: "BLOCK_ROLE_MISSING" }));
        expect(() => plan.build(context)).toThrowError(KHRInteractivityExportError);
    });

    it("recognizes intact inverse composites and rejects an edited internal composite connection", async () => {
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "float" }, { signature: "float2" }],
            variables: [{ type: 0, value: [1] }],
            declarations: [{ op: "event/onStart" }, { op: "variable/interpolate" }],
            nodes: [
                { declaration: 0, flows: { out: { node: 1 } } },
                {
                    declaration: 1,
                    configuration: { variable: { value: [0] }, useSlerp: { value: [false] } },
                    values: {
                        value: { type: 0, value: [5] },
                        duration: { type: 0, value: [1] },
                        p1: { type: 1, value: [0, 0] },
                        p2: { type: 1, value: [1, 1] },
                    },
                },
            ],
        };
        const plan = await CreatePlan({ graphs: [graph] });

        expect(plan.analyze().nodes[1]).toMatchObject({ operation: "variable/interpolate", classification: "inverse-composite", diagnostics: [] });

        const interpolationBlocks = coordinator.flowGraphs[0].getAllBlocks().filter((block) => block.metadata?.khrInteractivity?.nodeIndex === 1);
        const valueInterpolation = interpolationBlocks.find((block) => block.metadata?.khrInteractivity?.role === 0)!;
        const playAnimation = interpolationBlocks.find((block) => block.metadata?.khrInteractivity?.role === 2)!;
        const getVariable = interpolationBlocks.find((block) => block.metadata?.khrInteractivity?.role === 4)!;
        (playAnimation.getDataInput("speed") as any)._defaultValue = 2;

        expect(plan.analyze()).toMatchObject({
            representable: false,
            nodes: [expect.anything(), expect.objectContaining({ nodeIndex: 1, classification: "lossy" })],
            diagnostics: [expect.objectContaining({ code: "INPUT_DEFAULT_UNREPRESENTABLE", nodeIndex: 1, socket: "speed" })],
        });

        (playAnimation.getDataInput("speed") as any)._defaultValue = 0;
        getVariable.getDataOutput("value")!.connectTo(playAnimation.getDataInput("speed")!);

        expect(plan.analyze()).toMatchObject({
            representable: false,
            nodes: [expect.anything(), expect.objectContaining({ nodeIndex: 1, classification: "lossy" })],
            diagnostics: [expect.objectContaining({ code: "SOCKET_PROVENANCE_MISSING", nodeIndex: 1, socket: "speed" })],
        });

        getVariable.getDataOutput("value")!.disconnectFrom(playAnimation.getDataInput("speed")!);
        valueInterpolation.getDataInput("value_0")!.disconnectFrom(getVariable.getDataOutput("value")!);

        const editedPlan = CreateKHRInteractivityExportPlan(coordinator.flowGraphs, {
            document: CreateKHRInteractivityDocument({ graphs: [graph] }),
        });
        expect(editedPlan.analyze()).toMatchObject({
            representable: false,
            nodes: [expect.anything(), expect.objectContaining({ nodeIndex: 1, classification: "lossy" })],
            diagnostics: expect.arrayContaining([expect.objectContaining({ code: "COMPOSITE_CONNECTION_CHANGED", nodeIndex: 1 })]),
        });
    });

    it("preserves unknown additional-extension declarations through typed no-op blocks", async () => {
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "float" }],
            declarations: [
                {
                    op: "vendor/doThing",
                    extension: "EXT_vendor_interactivity",
                    inputValueSockets: { amount: { type: 0 } },
                    outputValueSockets: { result: { type: 0 } },
                    extras: { declaration: true },
                },
                { op: "debug/log" },
            ],
            nodes: [{ declaration: 0, values: { amount: { type: 0, value: [2] } }, flows: { out: { node: 1 } }, extras: { node: true } }, { declaration: 1 }],
        };
        const extension = {
            extensions: { EXT_vendor_root: { child: { extensions: { EXT_child: { enabled: true } } } } },
            extras: { extensions: { ACME_ui: { theme: "dark" } } },
            graphs: [graph],
        };
        const plan = await CreatePlan(extension);

        expect(plan.analyze()).toMatchObject({
            representable: true,
            nodes: [
                { operation: "vendor/doThing:EXT_vendor_interactivity", classification: "exact" },
                { operation: "debug/log", classification: "exact" },
            ],
        });
        expect(plan.additionalExtensionsUsed).toEqual(["EXT_child", "EXT_vendor_interactivity", "EXT_vendor_root"]);
        expect(plan.build(context)).toEqual(extension);

        const input = coordinator.flowGraphs[0].getAllBlocks()[0].getDataInput("amount")!;
        (input as any)._defaultValue = 7;
        expect(plan.build(context).graphs[0].nodes![0].values!.amount).toEqual({ type: 0, value: [7] });
        expect(plan.build(context).graphs[0].nodes![0].flows).toEqual({ out: { node: 1 } });

        const noOp = coordinator.flowGraphs[0].getAllBlocks().find((block) => block.metadata?.khrInteractivity?.nodeIndex === 0)!;
        const target = coordinator.flowGraphs[0].getAllBlocks().find((block) => block.metadata?.khrInteractivity?.nodeIndex === 1)!;
        noOp.getSignalOutput("out")!.disconnectFrom(target.getSignalInput("in")!);
        expect(plan.build(context).graphs[0].nodes![0].flows).toBeUndefined();

        (noOp.config.outputFlowSockets as string[]).push("edited");
        expect(plan.analyze()).toEqual(
            expect.objectContaining({
                representable: false,
                nodes: expect.arrayContaining([expect.objectContaining({ nodeIndex: 0, classification: "lossy" })]),
                diagnostics: expect.arrayContaining([expect.objectContaining({ code: "BLOCK_TYPE_MISMATCH", nodeIndex: 0 })]),
            })
        );
    });

    it("remaps references to every supported indexed glTF root collection", async () => {
        const sourceEntity = new TransformNode("source", scene);
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "ref" }],
            variables: ["meshes", "textures", "images", "samplers", "skins", "scenes"].map((collection) => ({
                type: 0,
                value: [`/${collection}/0`],
            })),
        };
        const sourceGLTF = {
            scene: 0,
            scenes: [{ index: 0, nodes: [0] }],
            nodes: [{ index: 0, mesh: 0, _babylonTransformNode: sourceEntity, _primitiveBabylonMeshes: [sourceEntity] }],
            meshes: [{ index: 0, primitives: [{ index: 0, _instanceData: { babylonSourceMesh: sourceEntity, promise: Promise.resolve() } }] }],
            textures: [
                {
                    index: 0,
                    source: 0,
                    sampler: 0,
                    _textureInfo: { index: 0 },
                    _babylonTextures: [sourceEntity],
                    _babylonTextureSources: [{ babylonTexture: sourceEntity, imageIndex: 0, samplerIndex: 0 }],
                },
            ],
            images: [{ index: 0 }],
            samplers: [{ index: 0 }],
            skins: [{ index: 0, joints: [], _data: { babylonSkeleton: sourceEntity, promise: Promise.resolve() } }],
        };
        const plan = await CreatePlan({ graphs: [graph] }, sourceGLTF);
        const indices: Record<string, number> = {
            meshes: 4,
            textures: 5,
            images: 6,
            samplers: 7,
            skins: 8,
            scenes: 9,
        };
        const exported = plan.build({
            ...context,
            getNodeCount: () => 1,
            getNodeIndex: (node) => (node === sourceEntity ? 0 : undefined),
            getRootIndex: (collection, entity) => (entity === (collection === "scenes" ? scene : sourceEntity) ? indices[collection] : undefined),
        });

        expect(exported.graphs[0].variables?.map((variable) => variable.value?.[0])).toEqual(["/meshes/4", "/textures/5", "/images/6", "/samplers/7", "/skins/8", "/scenes/9"]);
    });

    it("remaps the image selected by a texture source extension instead of its fallback", async () => {
        const texture = {};
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "ref" }],
            variables: [{ type: 0, value: ["/images/1"] }],
        };
        const sourceGLTF = {
            textures: [
                {
                    index: 0,
                    source: 0,
                    extensions: { KHR_texture_basisu: { source: 1 } },
                    _textureInfo: { index: 0 },
                    _babylonTextures: [texture],
                    _babylonTextureSources: [{ babylonTexture: texture, imageIndex: 1 }],
                },
            ],
            images: [{ index: 0 }, { index: 1 }],
        };
        const plan = await CreatePlan({ graphs: [graph] }, sourceGLTF);
        const exported = plan.build({
            ...context,
            getRootIndex: (collection, entity) => (collection === "images" && entity === texture ? 7 : undefined),
        });

        expect(exported.graphs[0].variables).toEqual([{ type: 0, value: ["/images/7"] }]);
    });

    it("rejects a fallback image that was replaced by a texture source extension", async () => {
        const texture = {};
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "ref" }],
            variables: [{ type: 0, value: ["/images/0"] }],
        };
        const sourceGLTF = {
            textures: [
                {
                    index: 0,
                    source: 0,
                    extensions: { EXT_texture_webp: { source: 1 } },
                    _textureInfo: { index: 0 },
                    _babylonTextures: [texture],
                    _babylonTextureSources: [{ babylonTexture: texture, imageIndex: 1 }],
                },
            ],
            images: [{ index: 0 }, { index: 1 }],
        };
        const plan = await CreatePlan({ graphs: [graph] }, sourceGLTF);

        expect(plan.analyze()).toMatchObject({
            representable: false,
            diagnostics: [expect.objectContaining({ code: "REFERENCE_UNRESOLVED", message: expect.stringContaining("/images/0") })],
        });
    });

    it("updates connected output type assertions after an authored variable type edit", async () => {
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "int" }, { signature: "float" }],
            variables: [{ type: 0, value: [2] }],
            declarations: [{ op: "variable/get" }, { op: "math/abs" }],
            nodes: [
                { declaration: 0, configuration: { variable: { value: [0] } } },
                { declaration: 1, values: { a: { node: 0, type: 0 } } },
            ],
        };
        const plan = await CreatePlan({ graphs: [graph] });
        coordinator.flowGraphs[0].metadata!.khrInteractivity!.authoredVariableTypes = { 0: "number" };

        const exported = plan.build(context).graphs[0];
        expect(exported.variables![0].type).toBe(1);
        expect(exported.nodes![1].values!.a).toEqual({ node: 0, type: 1 });
    });

    it("exports an editor-authored scene object variable as a ref", async () => {
        const sourceNode = new TransformNode("source", scene);
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "ref" }],
            variables: [{ type: 0, value: ["/nodes/0"] }],
        };
        const sourceGLTF = { nodes: [{ index: 0, _babylonTransformNode: sourceNode }] };
        const plan = await CreatePlan({ graphs: [graph] }, sourceGLTF);
        coordinator.flowGraphs[0].metadata!.khrInteractivity!.authoredVariableTypes = { 0: "TransformNode" };
        coordinator.flowGraphs[0].metadata!.khrInteractivity!.authoredVariableValues = { 0: [sourceNode] };

        const exported = plan.build({
            ...context,
            getNodeCount: () => 1,
            getNodeIndex: (node) => (node === sourceNode ? 3 : undefined),
        });

        expect(exported.graphs[0].variables).toEqual([{ type: 0, value: ["/nodes/3"] }]);
    });

    it("exports a primitive variable changed to an empty scene-object ref", async () => {
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "float" }],
            variables: [{ type: 0, value: [1] }],
        };
        const plan = await CreatePlan({ graphs: [graph] });
        coordinator.flowGraphs[0].metadata!.khrInteractivity!.authoredVariableTypes = { 0: "TransformNode" };
        coordinator.flowGraphs[0].metadata!.khrInteractivity!.authoredVariableValues = { 0: [""] };

        const exported = plan.build(context);

        expect(exported.graphs[0].types).toEqual([{ signature: "float" }, { signature: "ref" }]);
        expect(exported.graphs[0].variables).toEqual([{ type: 1, value: [""] }]);
        expect(CreateKHRInteractivityDocument(exported).graphs[0].valid).toBe(true);
    });

    it("rejects structural edits to imported variables", async () => {
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "float" }],
            variables: [{ type: 0, value: [1], name: "source" }],
        };
        const plan = await CreatePlan({ graphs: [graph] });
        coordinator.flowGraphs[0].metadata!.khrInteractivity!.authoredVariableStructureChanged = true;

        expect(plan.analyze()).toMatchObject({
            representable: false,
            diagnostics: [
                expect.objectContaining({
                    code: "VALUE_UNREPRESENTABLE",
                    path: "/graphs/0/variables",
                    message: expect.stringContaining("Adding, renaming, or deleting"),
                }),
            ],
        });
        expect(() => plan.build(context)).toThrowError(KHRInteractivityExportError);
    });

    it("rejects pre-ratification Babylon compatibility operations", async () => {
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "int" }],
            declarations: [{ op: "flow/log", extension: "BABYLON" }],
            nodes: [{ declaration: 0, values: { message: { type: 0, value: [1] } } }],
        };
        const plan = await CreatePlan({ graphs: [graph] });

        expect(plan.analyze()).toMatchObject({
            representable: false,
            diagnostics: [
                expect.objectContaining({
                    code: "BLOCK_UNSUPPORTED",
                    message: expect.stringContaining("not part of ratified KHR_interactivity"),
                }),
            ],
        });
    });

    it("preserves an extension operation imported as an unsupported typed no-op", async () => {
        _RegisterKHRNodeSelectabilityRuntime();
        const sourceNode = new TransformNode("source", scene);
        const sourceGLTF = { nodes: [{ index: 0, _babylonTransformNode: sourceNode }] };
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "ref" }, { signature: "float3" }, { signature: "int" }],
            declarations: [
                {
                    op: "event/onSelect",
                    extension: "KHR_node_selectability",
                    outputValueSockets: {
                        selectedNode: { type: 0 },
                        selectionRayOrigin: { type: 1 },
                        selectionPoint: { type: 1 },
                        controllerIndex: { type: 2 },
                        event: { type: 0 },
                    },
                },
            ],
            nodes: [{ declaration: 0, configuration: { nodeIndex: { value: [0] } } }],
        };
        const document = CreateKHRInteractivityDocument({ graphs: [graph] }, new Set(), 1);
        const serialized = new InteractivityGraphToFlowGraphParser(graph, sourceGLTF, 60, 0, new Set(), document.graphs[0].declarations, graph).serializeToFlowGraph();
        const flowGraph = await ParseFlowGraphAsync(serialized, { coordinator, pathConverter: GetPathToObjectConverter(sourceGLTF) });
        _CaptureKHRInteractivityRuntimeInputDefaults(flowGraph);
        const plan = CreateKHRInteractivityExportPlan([flowGraph], { document, sourceGLTF });

        expect(flowGraph.getAllBlocks()[0].getClassName()).toBe("FlowGraphUnsupportedInteractivityBlock");
        expect(plan.analyze()).toMatchObject({
            representable: true,
            nodes: [{ operation: "event/onSelect:KHR_node_selectability", classification: "exact", diagnostics: [] }],
        });
        expect(
            plan.build({
                ...context,
                getNodeCount: () => 1,
                getNodeIndex: (node) => (node === sourceNode ? 0 : undefined),
            })
        ).toEqual({ graphs: [graph] });
    });

    it("preserves an unchanged fallback-only node selection configuration", async () => {
        _RegisterKHRNodeSelectabilityRuntime();
        const sourceNode = new TransformNode("source", scene);
        const sourceGLTF = { nodes: [{ index: 0, _babylonTransformNode: sourceNode }] };
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "ref" }, { signature: "float3" }, { signature: "int" }],
            declarations: [
                {
                    op: "event/onSelect",
                    extension: "KHR_node_selectability",
                    outputValueSockets: {
                        selectedNode: { type: 0 },
                        selectionRayOrigin: { type: 1 },
                        selectionPoint: { type: 1 },
                        controllerIndex: { type: 2 },
                        event: { type: 0 },
                    },
                },
            ],
            nodes: [{ declaration: 0, configuration: { nodeIndex: { value: [7], extras: { preserved: true } } } }],
        };
        const plan = await CreatePlan({ graphs: [graph] }, sourceGLTF);

        expect(plan.analyze().representable).toBe(true);
        expect(plan.analyze().diagnostics).toContainEqual(expect.objectContaining({ severity: "warning", path: expect.stringContaining("/configuration/nodeIndex") }));
        expect(
            plan.build({
                ...context,
                getNodeCount: () => 1,
                getNodeIndex: (node) => (node === sourceNode ? 0 : undefined),
            })
        ).toEqual({ graphs: [graph] });
    });

    it("rejects an edited generated event id that has no canonical event index", async () => {
        const graph: IKHRInteractivity_Graph = {
            events: [{}],
            declarations: [{ op: "event/send" }],
            nodes: [{ declaration: 0, configuration: { event: { value: [0] } } }],
        };
        await CreatePlan({ graphs: [graph] });
        const block = coordinator.flowGraphs[0].getAllBlocks()[0];
        block.config!.eventId = "__babylon_khr_internal_0_99";
        expect(block.metadata.khrInteractivity.configuration.event).toEqual({
            sourceValue: [0],
            runtimeValue: "__babylon_khr_internal_0_0",
        });
        const plan = CreateKHRInteractivityExportPlan(coordinator.flowGraphs, {
            document: CreateKHRInteractivityDocument({ graphs: [graph] }),
        });

        expect(plan.analyze()).toMatchObject({
            representable: false,
            diagnostics: [expect.objectContaining({ code: "CONFIGURATION_UNREPRESENTABLE", path: expect.stringContaining("/configuration/event") })],
        });
    });

    it("rejects custom-event payload schema edits that cannot be represented canonically", async () => {
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "int" }],
            events: [{ id: "event", values: { payload: { type: 0, value: [1] } } }],
            declarations: [{ op: "event/send" }],
            nodes: [
                {
                    declaration: 0,
                    configuration: { event: { value: [0] } },
                    values: { payload: { type: 0, value: [2] } },
                },
            ],
        };
        await CreatePlan({ graphs: [graph] });
        const block = coordinator.flowGraphs[0].getAllBlocks()[0];
        block.config!.eventData.extra = {
            type: block.config!.eventData.payload.type,
            value: 5,
        };
        const plan = CreateKHRInteractivityExportPlan(coordinator.flowGraphs, {
            document: CreateKHRInteractivityDocument({ graphs: [graph] }),
        });

        expect(plan.analyze().representable).toBe(false);
        expect(plan.analyze().diagnostics).toContainEqual(
            expect.objectContaining({
                code: "CONFIGURATION_UNREPRESENTABLE",
                path: expect.stringContaining("/config/eventData"),
            })
        );
    });

    it("reports malformed custom-event payload configuration without throwing", async () => {
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "int" }],
            events: [{ id: "event", values: { payload: { type: 0 } } }],
            declarations: [{ op: "event/send" }],
            nodes: [{ declaration: 0, configuration: { event: { value: [0] } }, values: { payload: { type: 0, value: [2] } } }],
        };
        await CreatePlan({ graphs: [graph] });
        coordinator.flowGraphs[0].getAllBlocks()[0].config!.eventData.payload = null;
        const plan = CreateKHRInteractivityExportPlan(coordinator.flowGraphs, {
            document: CreateKHRInteractivityDocument({ graphs: [graph] }),
        });

        expect(() => plan.analyze()).not.toThrow();
        expect(plan.analyze().diagnostics).toContainEqual(
            expect.objectContaining({
                code: "CONFIGURATION_UNREPRESENTABLE",
                path: expect.stringContaining("/config/eventData"),
            })
        );
    });

    it("round-trips custom event defaults without adding an array dimension", async () => {
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "custom" }],
            events: [{ id: "event", values: { payload: { type: 0, value: [1, 2, 3] } } }],
            declarations: [{ op: "event/send" }],
            nodes: [
                {
                    declaration: 0,
                    configuration: { event: { value: [0] } },
                    values: { payload: { type: 0, value: [4, 5, 6] } },
                },
            ],
        };
        const plan = await CreatePlan({ graphs: [graph] });

        expect(plan.analyze().diagnostics).toEqual([]);
        expect(plan.build(context)).toEqual({ graphs: [graph] });
    });

    it("rejects selecting a custom event whose payload schema does not match the runtime block", async () => {
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "int" }],
            events: [
                { id: "a", values: { payload: { type: 0, value: [1] } } },
                { id: "b", values: { payload: { type: 0, value: [2] } } },
            ],
            declarations: [{ op: "event/receive" }],
            nodes: [{ declaration: 0, configuration: { event: { value: [0] } } }],
        };
        await CreatePlan({ graphs: [graph] });
        const block = coordinator.flowGraphs[0].getAllBlocks()[0];
        block.config!.eventId = "b";
        const plan = CreateKHRInteractivityExportPlan(coordinator.flowGraphs, {
            document: CreateKHRInteractivityDocument({ graphs: [graph] }),
        });

        expect(plan.analyze()).toMatchObject({
            representable: false,
            diagnostics: [
                expect.objectContaining({
                    code: "CONFIGURATION_UNREPRESENTABLE",
                    message: expect.stringContaining("payload schema"),
                }),
            ],
        });
    });

    it("remaps node references and companion extensions to final serializer indices", async () => {
        const sourceNode = new TransformNode("source", scene);
        const sourceGLTF = {
            nodes: [
                {
                    _babylonTransformNode: sourceNode,
                    extensions: {
                        KHR_node_selectability: { selectable: true, extensions: { EXT_nested: { enabled: true } } },
                        KHR_node_hoverability: { hoverable: false },
                        KHR_node_visibility: { visible: false },
                    },
                },
            ],
        };
        const extension: IKHRInteractivity = {
            graphs: [
                {
                    types: [{ signature: "ref" }],
                    variables: [{ type: 0, value: ["/nodes/0"] }],
                    declarations: [{ op: "event/onStart" }],
                    nodes: [{ declaration: 0 }],
                },
            ],
        };
        const plan = await CreatePlan(extension, sourceGLTF);
        const nodeExtensions: Record<string, unknown> = {};
        const remappingContext: IKHRInteractivitySerializerContext = {
            ...context,
            getNodeCount: () => 5,
            getNodeIndex: (node) => (node === sourceNode ? 4 : undefined),
            setNodeExtension: (nodeIndex, extensionName, value) => {
                nodeExtensions[`${nodeIndex}:${extensionName}`] = value;
            },
        };

        const exported = plan.build(remappingContext);
        expect(exported.graphs[0].variables![0].value).toEqual(["/nodes/4"]);
        expect(nodeExtensions).toEqual({
            "4:KHR_node_selectability": { selectable: true, extensions: { EXT_nested: { enabled: true } } },
            "4:KHR_node_hoverability": { hoverable: false },
            "4:KHR_node_visibility": { visible: false },
        });
        expect(plan.additionalExtensionsUsed).toEqual(["EXT_nested", "KHR_node_hoverability", "KHR_node_selectability", "KHR_node_visibility"]);
    });

    it("reports impossible dependency cycles instead of reordering ambiguously", async () => {
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "int" }],
            declarations: [{ op: "event/onStart" }, { op: "flow/sequence" }, { op: "flow/doN" }],
            nodes: [
                { declaration: 0, flows: { out: { node: 1 } } },
                { declaration: 1, flows: { "0": { node: 2 } } },
                { declaration: 1, flows: { "0": { node: 3 } } },
                { declaration: 2, values: { n: { type: 0, value: [1] } } },
            ],
        };
        await CreatePlan({ graphs: [graph] });
        const blocks = coordinator.flowGraphs[0].getAllBlocks();
        const getSignal = (nodeIndex: number, direction: "input" | "output") => {
            const block = blocks.find((candidate) => candidate.metadata?.khrInteractivity?.nodeIndex === nodeIndex) as any;
            return (direction === "input" ? block.signalInputs : block.signalOutputs).find((connection: any) => connection.metadata?.khrInteractivity?.direction === direction);
        };
        const eventOutput = getSignal(0, "output");
        const firstInput = getSignal(1, "input");
        const secondOutput = getSignal(2, "output");
        const sinkInput = getSignal(3, "input");
        eventOutput.disconnectFrom(firstInput);
        secondOutput.disconnectFrom(sinkInput);
        eventOutput.connectTo(sinkInput);
        secondOutput.connectTo(firstInput);

        const editedPlan = CreateKHRInteractivityExportPlan(coordinator.flowGraphs, {
            document: CreateKHRInteractivityDocument({ graphs: [graph] }),
        });
        expect(editedPlan.analyze().diagnostics).toContainEqual(expect.objectContaining({ code: "DEPENDENCY_CYCLE" }));
        expect(() => editedPlan.build(context)).toThrowError(KHRInteractivityExportError);
        try {
            editedPlan.build(context);
        } catch (error) {
            expect((error as KHRInteractivityExportError).diagnostics).toContainEqual(expect.objectContaining({ code: "DEPENDENCY_CYCLE" }));
        }
    });

    it("rejects a self-referencing flow as a dependency cycle", async () => {
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "int" }],
            declarations: [{ op: "flow/doN" }],
            nodes: [{ declaration: 0, values: { n: { type: 0, value: [1] } } }],
        };
        await CreatePlan({ graphs: [graph] });
        const block = coordinator.flowGraphs[0].getAllBlocks()[0] as any;
        block.getSignalOutput("out").connectTo(block.getSignalInput("in"));
        const plan = CreateKHRInteractivityExportPlan(coordinator.flowGraphs, {
            document: CreateKHRInteractivityDocument({ graphs: [graph] }),
        });

        expect(plan.analyze().diagnostics).toContainEqual(expect.objectContaining({ code: "DEPENDENCY_CYCLE", nodeIndex: 0 }));
    });

    it("assigns post-ordering diagnostics to the original logical node", async () => {
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "float" }, { signature: "ref" }, { signature: "int" }],
            declarations: [{ op: "animation/start" }, { op: "math/abs" }, { op: "event/onStart" }],
            nodes: [
                {
                    declaration: 0,
                    values: {
                        animation: { type: 1, value: ["/animations/0"] },
                        speed: { type: 0, value: [1] },
                        startTime: { type: 0, value: [0] },
                        endTime: { type: 0, value: [1] },
                    },
                },
                { declaration: 1, values: { a: { type: 2, value: [1] } } },
                { declaration: 2 },
            ],
        };
        await CreatePlan({ graphs: [graph] }, { animations: [{ index: 0, channels: [], samplers: [] }] });
        const eventBlock = coordinator.flowGraphs[0].getAllBlocks().find((block) => block.metadata?.khrInteractivity?.nodeIndex === 2) as any;
        const animationBlock = coordinator.flowGraphs[0]
            .getAllBlocks()
            .find((block) => block.metadata?.khrInteractivity?.nodeIndex === 0 && block.metadata.khrInteractivity.role === 0) as any;
        eventBlock.getSignalOutput("done").connectTo(animationBlock.getSignalInput("in"));
        const plan = CreateKHRInteractivityExportPlan(coordinator.flowGraphs, {
            document: CreateKHRInteractivityDocument({ graphs: [graph] }),
            sourceGLTF: { animations: [{ index: 0, channels: [], samplers: [] }] },
        });
        const analysis = plan.analyze();

        expect(analysis.nodes.find((node) => node.nodeIndex === 0)).toMatchObject({
            classification: "lossy",
            diagnostics: [expect.objectContaining({ code: "REFERENCE_UNRESOLVED", nodeIndex: 0 })],
        });
        expect(analysis.nodes.find((node) => node.nodeIndex === 2)).toMatchObject({
            classification: "exact",
            diagnostics: [],
        });
    });
});
