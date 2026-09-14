import { FlowGraphInteger } from "core/FlowGraph/CustomTypes/flowGraphInteger";
import { ParseFlowGraphAsync } from "core/FlowGraph/flowGraphParser";
import { FlowGraphCoordinator } from "core/FlowGraph/flowGraphCoordinator";
import { NullEngine } from "core/Engines/nullEngine";
import { TransformNode } from "core/Meshes/transformNode";
import { Scene } from "core/scene";
import { type IKHRInteractivity, type IKHRInteractivity_Graph } from "babylonjs-gltf2interface";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { _RegisterKHRInteractivityRuntime } from "../../../src/glTF/2.0/Extensions/KHR_interactivity.pure";
import { InteractivityGraphToFlowGraphParser } from "../../../src/glTF/2.0/Extensions/KHR_interactivity/interactivityGraphParser";
import { CreateKHRInteractivityDocument } from "../../../src/glTF/2.0/Extensions/KHR_interactivity/interactivityGraphModel";
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
        const document = CreateKHRInteractivityDocument(extension, new Set(["KHR_node_selectability", "KHR_node_hoverability", "EXT_vendor_interactivity"]), sourceGLTF.nodes?.length);
        expect(document.diagnostics).toEqual([]);
        const flowGraphs = [];
        for (const graph of document.graphs) {
            expect(graph.valid).toBe(true);
            const serialized = new InteractivityGraphToFlowGraphParser(graph.effectiveSource, sourceGLTF, 60, graph.index, undefined, graph.declarations).serializeToFlowGraph();
            flowGraphs.push(await ParseFlowGraphAsync(serialized, { coordinator }));
        }
        return CreateKHRInteractivityExportPlan(flowGraphs, { document, sourceGLTF });
    }

    const context: IKHRInteractivitySerializerContext = {
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
        addBlock.getDataInput("a")!.setValue(new FlowGraphInteger(9), coordinator.flowGraphs[0].getContext(0)!);

        const edited = plan.build(context);
        expect(edited.graphs[0].nodes![0].values!.a).toEqual({ type: 0, value: [9] });
        expect(CreateKHRInteractivityDocument(edited).graphs[0].valid).toBe(true);
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
        const extension = { graphs: [graph] };
        const plan = await CreatePlan(extension);

        expect(plan.analyze()).toMatchObject({
            representable: true,
            nodes: [{ operation: "vendor/doThing:EXT_vendor_interactivity", classification: "exact" }],
        });
        expect(plan.additionalExtensionsUsed).toContain("EXT_vendor_interactivity");
        expect(plan.build(context)).toEqual(extension);
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
        const plan = await CreatePlan({ graphs: [graph] });
        const blocks = coordinator.flowGraphs[0].getAllBlocks();
        const getSignal = (nodeIndex: number, direction: "input" | "output") => {
            const block = blocks.find((candidate) => candidate.metadata?.khrInteractivity?.nodeIndex === nodeIndex) as any;
            return (direction === "input" ? block.signalInputs : block.signalOutputs).find(
                (connection: any) => connection.metadata?.khrInteractivity?.direction === direction
            );
        };
        const eventOutput = getSignal(0, "output");
        const firstInput = getSignal(1, "input");
        const secondOutput = getSignal(2, "output");
        const sinkInput = getSignal(3, "input");
        eventOutput.disconnectFrom(firstInput);
        secondOutput.disconnectFrom(sinkInput);
        eventOutput.connectTo(sinkInput);
        secondOutput.connectTo(firstInput);

        expect(() => plan.build(context)).toThrowError(KHRInteractivityExportError);
        try {
            plan.build(context);
        } catch (error) {
            expect((error as KHRInteractivityExportError).diagnostics).toContainEqual(expect.objectContaining({ code: "DEPENDENCY_CYCLE" }));
        }
    });
});
