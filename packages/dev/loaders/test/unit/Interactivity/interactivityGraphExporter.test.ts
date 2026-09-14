import { FlowGraphInteger } from "core/FlowGraph/CustomTypes/flowGraphInteger";
import { ParseFlowGraphAsync } from "core/FlowGraph/flowGraphParser";
import { FlowGraphCoordinator } from "core/FlowGraph/flowGraphCoordinator";
import { AnimationGroup } from "core/Animations/animationGroup";
import { NullEngine } from "core/Engines/nullEngine";
import { TransformNode } from "core/Meshes/transformNode";
import { Scene } from "core/scene";
import { type IKHRInteractivity, type IKHRInteractivity_Graph } from "babylonjs-gltf2interface";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { _AddInteractivityObjectModel, _RegisterKHRInteractivityRuntime } from "../../../src/glTF/2.0/Extensions/KHR_interactivity.pure";
import { InteractivityGraphToFlowGraphParser } from "../../../src/glTF/2.0/Extensions/KHR_interactivity/interactivityGraphParser";
import { CreateKHRInteractivityDocument } from "../../../src/glTF/2.0/Extensions/KHR_interactivity/interactivityGraphModel";
import { GetPathToObjectConverter } from "../../../src/glTF/2.0/Extensions/objectModelMapping";
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
            expect(graph.valid).toBe(true);
            const serialized = new InteractivityGraphToFlowGraphParser(
                graph.effectiveSource,
                sourceGLTF,
                60,
                graph.index,
                undefined,
                graph.declarations,
                graph.source
            ).serializeToFlowGraph();
            flowGraphs.push(await ParseFlowGraphAsync(serialized, { coordinator, pathConverter }));
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
            diagnostics: [expect.objectContaining({ code: "REFERENCE_UNRESOLVED", socket: "target" })],
        });
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

    it("inverts a newly connected dynamic flow socket through the shared registry", async () => {
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

        expect(plan.analyze().diagnostics).toEqual([]);
        expect(plan.build(context).graphs[0].nodes![0].flows).toEqual({
            "0": { node: 1 },
            "1": { node: 2 },
        });
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

        expect(plan.analyze()).toMatchObject({
            representable: false,
            diagnostics: [expect.objectContaining({ code: "GRAPH_COUNT_MISMATCH" })],
        });
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
        const getVariable = interpolationBlocks.find((block) => block.metadata?.khrInteractivity?.role === 4)!;
        valueInterpolation.getDataInput("value_0")!.disconnectFrom(getVariable.getDataOutput("value")!);

        const editedPlan = CreateKHRInteractivityExportPlan(coordinator.flowGraphs, {
            document: CreateKHRInteractivityDocument({ graphs: [graph] }),
        });
        expect(editedPlan.analyze()).toMatchObject({
            representable: false,
            nodes: [expect.anything(), expect.objectContaining({ nodeIndex: 1, classification: "lossy" })],
            diagnostics: [expect.objectContaining({ code: "COMPOSITE_CONNECTION_CHANGED", nodeIndex: 1 })],
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
            ],
            nodes: [{ declaration: 0, values: { amount: { type: 0, value: [2] } }, extras: { node: true } }],
        };
        const extension = { extensions: { EXT_vendor_root: { enabled: true } }, graphs: [graph] };
        const plan = await CreatePlan(extension);

        expect(plan.analyze()).toMatchObject({
            representable: true,
            nodes: [{ operation: "vendor/doThing:EXT_vendor_interactivity", classification: "exact" }],
        });
        expect(plan.additionalExtensionsUsed).toEqual(["EXT_vendor_interactivity", "EXT_vendor_root"]);
        expect(plan.build(context)).toEqual(extension);

        const input = coordinator.flowGraphs[0].getAllBlocks()[0].getDataInput("amount")!;
        (input as any)._defaultValue = 7;
        expect(plan.build(context).graphs[0].nodes![0].values!.amount).toEqual({ type: 0, value: [7] });
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

    it("remaps node references and companion extensions to final serializer indices", async () => {
        const sourceNode = new TransformNode("source", scene);
        const sourceGLTF = {
            nodes: [
                {
                    _babylonTransformNode: sourceNode,
                    extensions: {
                        KHR_node_selectability: { selectable: true },
                        KHR_node_hoverability: { hoverable: false },
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
            "4:KHR_node_selectability": { selectable: true },
            "4:KHR_node_hoverability": { hoverable: false },
        });
        expect(plan.additionalExtensionsUsed).toEqual(["KHR_node_hoverability", "KHR_node_selectability"]);
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
});
