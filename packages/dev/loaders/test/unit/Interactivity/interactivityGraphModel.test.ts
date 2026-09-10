import { describe, expect, it } from "vitest";
import { type IKHRInteractivity, type IKHRInteractivity_Graph } from "babylonjs-gltf2interface";
import {
    CloneKHRInteractivityGraph,
    CreateKHRInteractivityDocument,
    CreateKHRInteractivityGraphModel,
    KHR_INTERACTIVITY_SPECIFICATION_COMMIT,
} from "../../../src/glTF/2.0/Extensions/KHR_interactivity/interactivityGraphModel";
import { InteractivityGraphToFlowGraphParser } from "../../../src/glTF/2.0/Extensions/KHR_interactivity/interactivityGraphParser";
import { FlowGraphUnsupportedInteractivityBlock } from "../../../src/glTF/2.0/Extensions/KHR_interactivity/flowGraphUnsupportedInteractivityBlock";
import { _RegisterKHRNodeSelectabilityRuntime } from "../../../src/glTF/2.0/Extensions/KHR_node_selectability.pure";

describe("KHR_interactivity canonical import model", () => {
    it("preserves graph names, extensions, extras, and the selected default graph", () => {
        const extension: IKHRInteractivity = {
            graph: 1,
            extras: { authoringTool: "test" },
            extensions: { EXT_vendor_root: { enabled: true } },
            graphs: [
                { name: "Idle", extras: { tab: 0 } },
                {
                    name: "Interactive",
                    extensions: { EXT_vendor_graph: { value: 42 } },
                    types: [{ signature: "float" }],
                    variables: [{ name: "Speed", type: 0, value: [1], extras: { unit: "m/s" } }],
                },
            ],
        };

        const document = CreateKHRInteractivityDocument(extension);

        expect(document.specificationCommit).toBe(KHR_INTERACTIVITY_SPECIFICATION_COMMIT);
        expect(document.defaultGraphIndex).toBe(1);
        expect(document.graphs.map((graph) => graph.name)).toEqual(["Idle", "Interactive"]);
        expect(document.source).toEqual(extension);
        expect(document.source).not.toBe(extension);
        expect(document.graphs[1].source.variables?.[0].name).toBe("Speed");
        expect(document.graphs[1].source.extensions).toEqual({ EXT_vendor_graph: { value: 42 } });
    });

    it("rejects duplicate built-in types but permits repeated custom types", () => {
        const duplicateBuiltIn = CreateKHRInteractivityGraphModel({
            types: [{ signature: "float" }, { signature: "float" }],
        });
        const duplicateCustom = CreateKHRInteractivityGraphModel({
            types: [
                { signature: "custom", extensions: { EXT_a: { type: "first" } } },
                { signature: "custom", extensions: { EXT_b: { type: "second" } } },
            ],
        });

        expect(duplicateBuiltIn.valid).toBe(false);
        expect(duplicateBuiltIn.diagnostics[0].path).toContain("/types/1/signature");
        expect(duplicateCustom.valid).toBe(true);
    });

    it("rejects unknown core operations and preserves unsupported extension operations", () => {
        const model = CreateKHRInteractivityGraphModel({
            types: [{ signature: "float" }],
            declarations: [
                { op: "core/doesNotExist" },
                {
                    op: "vendor/doThing",
                    extension: "EXT_vendor_interactivity",
                    inputValueSockets: { amount: { type: 0 } },
                    outputValueSockets: { result: { type: 0 } },
                    extras: { documentation: "retained" },
                },
            ],
        });

        expect(model.valid).toBe(false);
        expect(model.declarations[0].support).toBe("unknown-core");
        expect(model.declarations[1].support).toBe("unsupported-extension");
        expect(model.declarations[1].source.extras).toEqual({ documentation: "retained" });
        expect(() => new InteractivityGraphToFlowGraphParser({ declarations: [{ op: "core/doesNotExist" }] }, {} as any)).toThrow(
            'Unknown core KHR_interactivity operation "core/doesNotExist".'
        );
    });

    it("reports invalid type, declaration, node, and socket references with source paths", () => {
        const model = CreateKHRInteractivityGraphModel({
            types: [{ signature: "float" }],
            variables: [{ type: 4, value: [1] }],
            declarations: [
                {
                    op: "vendor/doThing",
                    extension: "EXT_vendor_interactivity",
                    inputValueSockets: { amount: { type: 3 } },
                },
            ],
            nodes: [
                {
                    declaration: 0,
                    values: { missing: { node: 9, socket: "value" } },
                    flows: { out: { node: 8 } },
                },
                { declaration: 7 },
            ],
        });

        expect(model.valid).toBe(false);
        expect(model.diagnostics.map((diagnostic) => diagnostic.path)).toEqual(
            expect.arrayContaining([
                expect.stringContaining("/variables/0/type"),
                expect.stringContaining("/inputValueSockets/amount/type"),
                expect.stringContaining("/nodes/0/values/missing"),
                expect.stringContaining("/nodes/0/values/missing/node"),
                expect.stringContaining("/nodes/0/flows/out/node"),
                expect.stringContaining("/nodes/1/declaration"),
            ])
        );
    });

    it("validates literal component types and RFC 6901 references", () => {
        const model = CreateKHRInteractivityGraphModel({
            types: [{ signature: "bool" }, { signature: "int" }, { signature: "ref" }, { signature: "float" }],
            declarations: [{ op: "math/not" }, { op: "flow/branch" }],
            nodes: [
                {
                    declaration: 0,
                    values: { a: { type: 0, value: [1] } },
                    flows: { out: { node: 0 } },
                },
                {
                    declaration: 1,
                    values: {
                        condition: { type: 1, value: [1.5] },
                        invalidReference: { type: 2, value: ["/invalid/~2escape"] },
                        numericString: { type: 3, value: ["1"] },
                        nonFinite: { type: 3, value: [NaN] },
                        futureValue: { node: 1 },
                    },
                },
            ],
        });

        expect(model.valid).toBe(false);
        expect(model.diagnostics.map((diagnostic) => diagnostic.message)).toEqual(
            expect.arrayContaining([
                'Value component is invalid for type "bool".',
                'Value component is invalid for type "int".',
                'Value component is invalid for type "ref".',
                'Value component is invalid for type "float".',
                'Value component is invalid for type "float".',
            ])
        );
    });

    it("rejects forward and self value dependencies and backward and self flow dependencies", () => {
        const model = CreateKHRInteractivityGraphModel({
            types: [{ signature: "float" }],
            declarations: [{ op: "math/abs" }, { op: "flow/sequence" }],
            nodes: [
                { declaration: 0, values: { a: { node: 0 } } },
                { declaration: 0, values: { a: { node: 2 } } },
                { declaration: 1, flows: { self: { node: 2 }, backwards: { node: 1 } } },
            ],
        });

        expect(model.diagnostics.map((diagnostic) => diagnostic.message)).toEqual(
            expect.arrayContaining(["Value connections must reference an earlier node.", "Flow connections must reference a later node."])
        );
    });

    it("requires declared operation inputs and semantic configuration", () => {
        const missingMathInput = CreateKHRInteractivityGraphModel({
            types: [{ signature: "float" }],
            declarations: [{ op: "math/add" }],
            nodes: [{ declaration: 0, values: { a: { type: 0, value: [1] } } }],
        });
        const missingPointerConfiguration = CreateKHRInteractivityGraphModel({
            declarations: [{ op: "pointer/get" }],
            nodes: [{ declaration: 0 }],
        });
        const mismatchedMathTypes = CreateKHRInteractivityGraphModel({
            types: [{ signature: "float" }, { signature: "int" }],
            declarations: [{ op: "math/add" }],
            nodes: [
                {
                    declaration: 0,
                    values: {
                        a: { type: 0, value: [1] },
                        b: { type: 1, value: [1] },
                    },
                },
            ],
        });
        const mismatchedConnectedMathTypes = CreateKHRInteractivityGraphModel({
            types: [{ signature: "float" }, { signature: "int" }],
            declarations: [{ op: "math/abs" }, { op: "math/add" }],
            nodes: [
                { declaration: 0, values: { a: { type: 0, value: [1] } } },
                {
                    declaration: 1,
                    values: {
                        a: { node: 0 },
                        b: { type: 1, value: [1] },
                    },
                },
            ],
        });

        expect(missingMathInput.diagnostics).toContainEqual(
            expect.objectContaining({
                path: expect.stringContaining("/values/b"),
                message: 'Required input value socket "b" is missing.',
            })
        );
        expect(missingPointerConfiguration.diagnostics.map((diagnostic) => diagnostic.path)).toEqual(
            expect.arrayContaining([expect.stringContaining("/configuration/pointer"), expect.stringContaining("/configuration/type")])
        );
        expect(mismatchedMathTypes.diagnostics).toContainEqual(expect.objectContaining({ message: "All inputs must be of the same type" }));
        expect(mismatchedConnectedMathTypes.diagnostics).toContainEqual(expect.objectContaining({ message: "All inputs must be of the same type" }));
    });

    it("validates configuration-derived indices and sockets", () => {
        const variableGet = CreateKHRInteractivityGraphModel({
            types: [{ signature: "float" }],
            declarations: [{ op: "variable/get" }],
            nodes: [{ declaration: 0, configuration: { variable: { value: [0] } } }],
        });
        const variableSet = CreateKHRInteractivityGraphModel({
            declarations: [{ op: "variable/set" }],
            nodes: [{ declaration: 0, configuration: { variables: { value: [] } } }],
        });
        const pointer = CreateKHRInteractivityGraphModel({
            types: [{ signature: "float3" }, { signature: "int" }],
            declarations: [{ op: "pointer/get" }],
            nodes: [
                {
                    declaration: 0,
                    configuration: {
                        pointer: { value: ["/nodes/[i]/translation"] },
                        type: { value: [4] },
                    },
                },
            ],
        });
        const variableInterpolate = CreateKHRInteractivityGraphModel({
            variables: [],
            declarations: [{ op: "variable/interpolate" }],
            nodes: [
                {
                    declaration: 0,
                    configuration: {
                        variable: { value: [0] },
                        useSlerp: { value: ["not-a-bool"] },
                    },
                },
            ],
        });
        const mathSwitch = CreateKHRInteractivityGraphModel({
            types: [{ signature: "int" }],
            declarations: [{ op: "math/switch" }],
            nodes: [
                {
                    declaration: 0,
                    configuration: { cases: { value: [1] } },
                    values: { selection: { type: 0, value: [1] } },
                },
            ],
        });
        const wrongQuaternionInput = CreateKHRInteractivityGraphModel({
            types: [{ signature: "float" }],
            declarations: [{ op: "math/quatToAxisAngle" }],
            nodes: [{ declaration: 0, values: { a: { type: 0, value: [1] } } }],
        });
        const invalidPointerInterpolationType = CreateKHRInteractivityGraphModel({
            types: [{ signature: "bool" }],
            declarations: [{ op: "pointer/interpolate" }],
            nodes: [
                {
                    declaration: 0,
                    configuration: { pointer: { value: ["/nodes/0/translation"] }, type: { value: [0] } },
                },
            ],
        });

        expect(variableGet.diagnostics).toContainEqual(expect.objectContaining({ path: expect.stringContaining("/configuration/variable/value/0") }));
        expect(variableSet.diagnostics).toContainEqual(expect.objectContaining({ path: expect.stringContaining("/configuration/variables/value") }));
        expect(pointer.diagnostics.map((diagnostic) => diagnostic.path)).toEqual(
            expect.arrayContaining([expect.stringContaining("/configuration/type/value/0"), expect.stringContaining("/values/i")])
        );
        expect(variableInterpolate.diagnostics).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ path: expect.stringContaining("/configuration/variable/value/0"), severity: "error" }),
                expect.objectContaining({ path: expect.stringContaining("/configuration/useSlerp"), severity: "error" }),
            ])
        );
        expect(mathSwitch.diagnostics.map((diagnostic) => diagnostic.path)).toEqual(
            expect.arrayContaining([expect.stringContaining("/values/default"), expect.stringContaining("/values/1")])
        );
        expect(wrongQuaternionInput.diagnostics).toContainEqual(expect.objectContaining({ message: 'Input value socket "a" must have type "float4".' }));
        expect(invalidPointerInterpolationType.diagnostics).toContainEqual(
            expect.objectContaining({ path: expect.stringContaining("/configuration/type/value/0"), message: expect.stringContaining("not supported") })
        );
    });

    it("rejects invalid core output sockets and dual value sources", () => {
        const model = CreateKHRInteractivityGraphModel({
            types: [{ signature: "float" }],
            declarations: [{ op: "math/abs" }],
            nodes: [
                { declaration: 0, values: { a: { type: 0, value: [1] } } },
                {
                    declaration: 0,
                    values: {
                        a: { node: 0, socket: "bogus", type: 0, value: [2] },
                    },
                },
            ],
        });

        expect(model.diagnostics.map((diagnostic) => diagnostic.message)).toEqual(
            expect.arrayContaining(['Output value socket "bogus" does not exist on node 0.', "An input value socket cannot define both inline and node sources."])
        );
        const implicitValue = CreateKHRInteractivityGraphModel({
            types: [{ signature: "float4" }],
            declarations: [{ op: "math/quatToAxisAngle" }, { op: "math/abs" }],
            nodes: [
                { declaration: 0, values: { a: { type: 0, value: [0, 0, 0, 1] } } },
                { declaration: 1, values: { a: { node: 0 } } },
            ],
        });
        expect(implicitValue.diagnostics).toContainEqual(expect.objectContaining({ message: 'Output value socket "value" does not exist on node 0.' }));
    });

    it("accepts canonical value outputs from variable/get and math/switch", () => {
        const variableGraph = CreateKHRInteractivityGraphModel({
            types: [{ signature: "float" }],
            variables: [{ type: 0, value: [1] }],
            declarations: [{ op: "variable/get" }, { op: "math/abs" }],
            nodes: [
                { declaration: 0, configuration: { variable: { value: [0] } } },
                { declaration: 1, values: { a: { node: 0 } } },
            ],
        });
        const switchGraph = CreateKHRInteractivityGraphModel({
            types: [{ signature: "int" }, { signature: "float" }],
            declarations: [{ op: "math/switch" }, { op: "math/abs" }],
            nodes: [
                {
                    declaration: 0,
                    values: {
                        selection: { type: 0, value: [0] },
                        default: { type: 1, value: [1] },
                    },
                },
                { declaration: 1, values: { a: { node: 0 } } },
            ],
        });

        expect(variableGraph.valid).toBe(true);
        expect(switchGraph.valid).toBe(true);
    });

    it("validates explicit core output type assertions independently", () => {
        const model = CreateKHRInteractivityGraphModel({
            types: [{ signature: "float" }, { signature: "int" }],
            declarations: [{ op: "math/abs" }, { op: "math/abs" }],
            nodes: [
                { declaration: 0, values: { a: { type: 0, value: [1] } } },
                { declaration: 1, values: { a: { node: 0, type: 1 } } },
            ],
        });

        expect(model.diagnostics).toContainEqual(
            expect.objectContaining({
                path: expect.stringContaining("/nodes/1/values/a/type"),
                message: 'Type assertion does not match output socket "value".',
            })
        );
    });

    it("keeps spec-allowed extra sockets and configuration out of strict lowering", () => {
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "float" }],
            declarations: [{ op: "event/onStart" }, { op: "math/abs" }],
            nodes: [
                { declaration: 0, flows: { extra: { node: 1, socket: "unknown" } } },
                {
                    declaration: 1,
                    configuration: { unknown: { value: ["ignored"] } },
                    values: {
                        a: { type: 0, value: [1] },
                        extra: { type: 0, value: [2] },
                    },
                },
            ],
        };
        const model = CreateKHRInteractivityGraphModel(graph);
        const serialized = new InteractivityGraphToFlowGraphParser(graph, {}, 60, 0, undefined, model.declarations).serializeToFlowGraph();
        const start = serialized.allBlocks.find((block) => block.className === "FlowGraphSceneReadyEventBlock")!;
        const absolute = serialized.allBlocks.find((block) => block.className === "FlowGraphAbsBlock")!;

        expect(model.valid).toBe(true);
        expect(start.signalOutputs.some((socket) => socket.name === "extra")).toBe(false);
        expect(absolute.dataInputs.map((socket) => socket.name)).toEqual(["a"]);
        expect(absolute.config.unknown).toBeUndefined();

        const compatibility = new InteractivityGraphToFlowGraphParser(graph, {}).serializeToFlowGraph();
        const compatibilityAbsolute = compatibility.allBlocks.find((block) => block.className === "FlowGraphAbsBlock")!;
        expect(compatibilityAbsolute.config.unknown.value).toBe("ignored");
    });

    it("ignores unknown configuration while lowering custom event operations", () => {
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "int" }],
            events: [{ id: "external", values: { payload: { type: 0 } } }],
            declarations: [{ op: "event/send" }, { op: "flow/log", extension: "BABYLON" }],
            nodes: [
                {
                    declaration: 0,
                    configuration: {
                        event: { value: [0] },
                        unknown: { value: ["ignored"] },
                    },
                    values: {
                        payload: { type: 0, value: [7] },
                        extra: { type: 0, value: [8] },
                    },
                    flows: { out: { node: 1 } },
                },
                { declaration: 1, values: { message: { type: 0, value: [1] } } },
            ],
        };
        const model = CreateKHRInteractivityGraphModel(graph);
        const serialized = new InteractivityGraphToFlowGraphParser(graph, {}, 60, 0, undefined, model.declarations).serializeToFlowGraph();
        const send = serialized.allBlocks[0];

        expect(send.config.eventId).toBe("external");
        expect(send.config.unknown).toBeUndefined();
        expect(send.dataInputs.map((socket) => socket.name)).toContain("payload");
        expect(send.dataInputs.map((socket) => socket.name)).not.toContain("extra");
        expect(send.signalOutputs.find((socket) => socket.name === "out")?.connectedPointIds).toHaveLength(1);
    });

    it("enforces schema non-empty arrays and objects when present", () => {
        const emptyArrays = CreateKHRInteractivityGraphModel({
            types: [],
            variables: [],
            events: [],
            declarations: [],
            nodes: [],
        });
        const emptyObjects = CreateKHRInteractivityGraphModel({
            types: [{ signature: "float" }],
            events: [{ values: {} }],
            declarations: [{ op: "vendor/op", extension: "EXT_vendor", inputValueSockets: {}, outputValueSockets: {} }],
            nodes: [
                { declaration: 0, configuration: {}, values: {}, flows: {} },
                { declaration: 0, configuration: { unknown: { value: [] } } },
            ],
        });

        expect(emptyArrays.diagnostics).toHaveLength(5);
        expect(emptyObjects.diagnostics.map((diagnostic) => diagnostic.path)).toEqual(
            expect.arrayContaining([
                expect.stringContaining("/events/0/values"),
                expect.stringContaining("/declarations/0/inputValueSockets"),
                expect.stringContaining("/declarations/0/outputValueSockets"),
                expect.stringContaining("/nodes/0/configuration"),
                expect.stringContaining("/nodes/0/values"),
                expect.stringContaining("/nodes/0/flows"),
                expect.stringContaining("/nodes/1/configuration/unknown/value"),
            ])
        );
    });

    it("bounds configuration-derived waitAll input flow sockets", () => {
        const create = (inputFlows: number | undefined, socket: string) => {
            const graph: IKHRInteractivity_Graph = {
                declarations: [{ op: "event/onStart" }, { op: "flow/waitAll" }],
                nodes: [
                    { declaration: 0, flows: { out: { node: 1, socket } } },
                    {
                        declaration: 1,
                        configuration: inputFlows === undefined ? undefined : { inputFlows: { value: [inputFlows] } },
                    },
                ],
            };
            const model = CreateKHRInteractivityGraphModel(graph);
            const serialized = new InteractivityGraphToFlowGraphParser(graph, {}, 60, 0, undefined, model.declarations).serializeToFlowGraph();
            return { model, block: serialized.allBlocks.find((block) => block.className === "FlowGraphWaitAllBlock")! };
        };

        const bounded = create(2, "9");
        expect(bounded.model.valid).toBe(true);
        expect(bounded.block.signalInputs.some((socket) => socket.name === "in_9")).toBe(false);
        expect(bounded.block.config.inputSignalCount.value).toBe(2);

        for (const socket of ["0", "1"]) {
            expect(create(2, socket).block.signalInputs.some((input) => input.name === `in_${socket}`)).toBe(true);
        }

        const zero = create(0, "0");
        expect(zero.block.config.inputSignalCount.value).toBe(0);
        expect(zero.block.signalInputs.some((socket) => socket.name === "in_0")).toBe(false);

        const boundary = create(64, "63");
        expect(boundary.block.signalInputs.some((socket) => socket.name === "in_63")).toBe(true);

        const defaulted = create(undefined, "0");
        expect(defaulted.block.signalInputs.some((socket) => socket.name === "in_0")).toBe(false);

        for (const invalid of [-1, 1.5, 1_000_000]) {
            const fallback = create(invalid, "0");
            expect(fallback.model.diagnostics).toContainEqual(expect.objectContaining({ severity: "warning", path: expect.stringContaining("/configuration/inputFlows") }));
            expect(fallback.block.config.inputSignalCount.value).toBe(0);
            expect(fallback.block.signalInputs.some((socket) => socket.name === "in_0")).toBe(false);
        }
    });

    it("filters flow/switch outputs to effective configured cases", () => {
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "int" }],
            declarations: [{ op: "flow/switch" }, { op: "flow/sequence" }],
            nodes: [
                {
                    declaration: 0,
                    configuration: { cases: { value: [1, 2] } },
                    values: {
                        selection: { type: 0, value: [1] },
                        default: { type: 0, value: [0] },
                    },
                    flows: {
                        "1": { node: 1 },
                        "9": { node: 2 },
                        default: { node: 3 },
                    },
                },
                { declaration: 1 },
                { declaration: 1 },
                { declaration: 1 },
            ],
        };
        const model = CreateKHRInteractivityGraphModel(graph);
        const serialized = new InteractivityGraphToFlowGraphParser(graph, {}, 60, 0, undefined, model.declarations).serializeToFlowGraph();
        const block = serialized.allBlocks.find((candidate) => candidate.className === "FlowGraphSwitchBlock")!;

        expect(block.signalOutputs.map((socket) => socket.name)).toEqual(expect.arrayContaining(["out_1", "default"]));
        expect(block.signalOutputs.some((socket) => socket.name === "out_9")).toBe(false);

        const invalidGraph = CloneKHRInteractivityGraph(graph);
        invalidGraph.nodes![0].configuration!.cases!.value = [2147483648];
        const invalidModel = CreateKHRInteractivityGraphModel(invalidGraph);
        const invalidSerialized = new InteractivityGraphToFlowGraphParser(invalidGraph, {}, 60, 0, undefined, invalidModel.declarations).serializeToFlowGraph();
        const invalidBlock = invalidSerialized.allBlocks.find((candidate) => candidate.className === "FlowGraphSwitchBlock")!;
        expect(invalidModel.diagnostics).toContainEqual(expect.objectContaining({ severity: "warning", path: expect.stringContaining("/configuration/cases") }));
        expect(invalidBlock.signalOutputs.map((socket) => socket.name)).toEqual(["default"]);
    });

    it("lowers every ratified same-name control-flow socket in strict mode", () => {
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "bool" }, { signature: "int" }, { signature: "float" }, { signature: "ref" }],
            declarations: [
                { op: "event/onStart" },
                { op: "flow/branch" },
                { op: "flow/while" },
                { op: "flow/for" },
                { op: "flow/doN" },
                { op: "flow/throttle" },
                { op: "flow/setDelay" },
                { op: "flow/cancelDelay" },
                { op: "math/abs" },
                { op: "flow/sequence" },
            ],
            nodes: [
                { declaration: 0, flows: { out: { node: 1 } } },
                {
                    declaration: 1,
                    values: { condition: { type: 0, value: [true] } },
                    flows: { true: { node: 2 }, false: { node: 9 } },
                },
                {
                    declaration: 2,
                    values: { condition: { type: 0, value: [false] } },
                    flows: { loopBody: { node: 9 }, completed: { node: 3 } },
                },
                {
                    declaration: 3,
                    values: { startIndex: { type: 1, value: [0] }, endIndex: { type: 1, value: [1] } },
                    flows: { loopBody: { node: 9 }, completed: { node: 4 } },
                },
                { declaration: 4, values: { n: { type: 1, value: [1] } }, flows: { out: { node: 5 } } },
                { declaration: 5, values: { duration: { type: 2, value: [0] } }, flows: { out: { node: 6 } } },
                {
                    declaration: 6,
                    values: { duration: { type: 2, value: [0] } },
                    flows: { out: { node: 9 }, done: { node: 7 } },
                },
                {
                    declaration: 7,
                    values: { delay: { node: 6, socket: "lastDelay", type: 3 } },
                    flows: { out: { node: 9 } },
                },
                { declaration: 8, values: { a: { node: 5, socket: "lastRemainingTime", type: 2 } } },
                { declaration: 9 },
            ],
        };
        const model = CreateKHRInteractivityGraphModel(graph);
        expect(model.valid, model.diagnostics.map((diagnostic) => diagnostic.message).join("\n")).toBe(true);
        const serialized = new InteractivityGraphToFlowGraphParser(model.effectiveSource, {}, 60, 0, undefined, model.declarations).serializeToFlowGraph();
        const block = (className: string) => serialized.allBlocks.find((candidate) => candidate.className === className)!;

        expect(block("FlowGraphBranchBlock").dataInputs.map((socket) => socket.name)).toContain("condition");
        expect(block("FlowGraphWhileLoopBlock").signalOutputs.map((socket) => socket.name)).toContain("completed");
        expect(block("FlowGraphForLoopBlock").signalOutputs.map((socket) => socket.name)).toContain("completed");
        expect(block("FlowGraphForLoopBlock").config.initialIndex.value).toBe(0);
        expect(block("FlowGraphDoNBlock").signalOutputs.map((socket) => socket.name)).toContain("out");
        expect(block("FlowGraphThrottleBlock").dataInputs.map((socket) => socket.name)).toContain("duration");
        expect(block("FlowGraphThrottleBlock").dataOutputs.map((socket) => socket.name)).toContain("lastRemainingTime");
        expect(block("FlowGraphSetDelayBlock").signalOutputs.map((socket) => socket.name)).toEqual(expect.arrayContaining(["out", "done"]));
        expect(block("FlowGraphCancelDelayBlock").signalOutputs.map((socket) => socket.name)).toContain("out");
    });

    it("requires ratified integer input types for for and doN", () => {
        const model = CreateKHRInteractivityGraphModel({
            types: [{ signature: "float" }, { signature: "int" }],
            declarations: [{ op: "flow/for" }, { op: "flow/doN" }],
            nodes: [
                {
                    declaration: 0,
                    values: { startIndex: { type: 0, value: [0] }, endIndex: { type: 1, value: [1] } },
                },
                { declaration: 1, values: { n: { type: 0, value: [1] } } },
            ],
        });

        expect(model.diagnostics.map((diagnostic) => diagnostic.path)).toEqual(
            expect.arrayContaining([expect.stringContaining("/nodes/0/values/startIndex/type"), expect.stringContaining("/nodes/1/values/n/type")])
        );
    });

    it("normalizes all-or-default configurations before lowering", () => {
        const model = CreateKHRInteractivityGraphModel({
            types: [{ signature: "int" }, { signature: "float" }],
            declarations: [{ op: "flow/for" }, { op: "flow/multiGate" }, { op: "math/switch" }],
            nodes: [
                {
                    declaration: 0,
                    configuration: { initialIndex: { value: [0.5] } },
                    values: { startIndex: { type: 0, value: [0] }, endIndex: { type: 0, value: [1] } },
                },
                { declaration: 1, configuration: { isRandom: { value: [true] } } },
                {
                    declaration: 2,
                    configuration: { cases: { value: [2147483648] } },
                    values: { selection: { type: 0, value: [0] }, default: { type: 1, value: [1] } },
                },
            ],
        });

        expect(model.valid).toBe(true);
        expect(model.effectiveSource.nodes![0].configuration!.initialIndex.value).toEqual([0]);
        expect(model.effectiveSource.nodes![1].configuration).toMatchObject({ isRandom: { value: [false] }, isLoop: { value: [false] } });
        expect(model.effectiveSource.nodes![2].configuration!.cases.value).toEqual([]);
    });

    it("allows zero-output multiGate and exposes lastIndex", () => {
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "int" }],
            declarations: [{ op: "flow/multiGate" }, { op: "math/abs" }],
            nodes: [{ declaration: 0 }, { declaration: 1, values: { a: { node: 0, socket: "lastIndex", type: 0 } } }],
        };
        const model = CreateKHRInteractivityGraphModel(graph);
        expect(model.valid).toBe(true);
        const serialized = new InteractivityGraphToFlowGraphParser(model.effectiveSource, {}, 60, 0, undefined, model.declarations).serializeToFlowGraph();
        const multiGate = serialized.allBlocks.find((block) => block.className === "FlowGraphMultiGateBlock")!;

        expect(multiGate.config.outputSignalCount).toBe(0);
        expect(multiGate.signalOutputs).toEqual([]);
        expect(multiGate.dataOutputs.map((socket) => socket.name)).toContain("lastIndex");
    });

    it("null-normalizes unresolved and fabricated static references", () => {
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "ref" }],
            variables: [
                { type: 0, value: ["/nodes/0"] },
                { type: 0, value: ["/nodes/999"] },
                { type: 0, value: ["/extensions/KHR_interactivity/events/fabricated"] },
            ],
        };
        const model = CreateKHRInteractivityGraphModel(graph);
        const serialized = new InteractivityGraphToFlowGraphParser(model.effectiveSource, { nodes: [{}] } as any, 60, 0, undefined, model.declarations).serializeToFlowGraph();
        const values = Object.values(serialized.executionContexts[0]._userVariables).map((entry) => entry.value[0]);

        expect(values).toEqual(["/nodes/0", "", ""]);
    });

    it("preserves empty custom event ids and avoids generated-key collisions", () => {
        const graph: IKHRInteractivity_Graph = {
            events: [{ id: "" }, { id: "__babylon_khr_internal_0_0" }, {}],
        };
        const model = CreateKHRInteractivityGraphModel(graph);
        const parser = new InteractivityGraphToFlowGraphParser(model.effectiveSource, {}, 60, 0, undefined, model.declarations);

        expect(parser.arrays.events.map((event) => event.eventId)).toEqual(["", "__babylon_khr_internal_0_0", "__babylon_khr_internal_0_1"]);
    });

    it("rejects the reserved custom event value socket", () => {
        const model = CreateKHRInteractivityGraphModel({
            types: [{ signature: "int" }],
            events: [{ values: { event: { type: 0, value: [1] } } }],
        });

        expect(model.diagnostics).toContainEqual(expect.objectContaining({ path: expect.stringContaining("/events/0/values/event"), severity: "error" }));
    });

    it("derives fixed core output types for assertions", () => {
        const valid = CreateKHRInteractivityGraphModel({
            types: [{ signature: "float" }, { signature: "bool" }],
            declarations: [{ op: "math/eq" }, { op: "math/not" }],
            nodes: [
                {
                    declaration: 0,
                    values: {
                        a: { type: 0, value: [1] },
                        b: { type: 0, value: [1] },
                    },
                },
                { declaration: 1, values: { a: { node: 0, type: 1 } } },
            ],
        });
        const invalid = CreateKHRInteractivityGraphModel({
            types: [{ signature: "float" }, { signature: "bool" }],
            declarations: [{ op: "math/eq" }, { op: "math/abs" }],
            nodes: [
                {
                    declaration: 0,
                    values: {
                        a: { type: 0, value: [1] },
                        b: { type: 0, value: [1] },
                    },
                },
                { declaration: 1, values: { a: { node: 0, type: 0 } } },
            ],
        });

        expect(valid.valid).toBe(true);
        expect(invalid.diagnostics).toContainEqual(expect.objectContaining({ message: 'Type assertion does not match output socket "value".' }));
    });

    it("derives shape-changing and non-leading polymorphic output assertions", () => {
        const composed = CreateKHRInteractivityGraphModel({
            types: [{ signature: "float3" }, { signature: "float4" }, { signature: "float4x4" }],
            declarations: [{ op: "math/matCompose" }, { op: "math/transpose" }],
            nodes: [
                {
                    declaration: 0,
                    values: {
                        translation: { type: 0, value: [0, 0, 0] },
                        rotation: { type: 1, value: [0, 0, 0, 1] },
                        scale: { type: 0, value: [1, 1, 1] },
                    },
                },
                { declaration: 1, values: { a: { node: 0, type: 2 } } },
            ],
        });
        const selected = CreateKHRInteractivityGraphModel({
            types: [{ signature: "bool" }, { signature: "float3" }],
            declarations: [{ op: "math/select" }, { op: "math/length" }],
            nodes: [
                {
                    declaration: 0,
                    values: {
                        condition: { type: 0, value: [true] },
                        a: { type: 1, value: [1, 2, 3] },
                        b: { type: 1, value: [4, 5, 6] },
                    },
                },
                { declaration: 1, values: { a: { node: 0, type: 1 } } },
            ],
        });

        expect(composed.valid).toBe(true);
        expect(selected.valid).toBe(true);
    });

    it("rejects wrong assertions on fixed named output sockets", () => {
        const model = CreateKHRInteractivityGraphModel({
            types: [{ signature: "float" }, { signature: "int" }],
            declarations: [{ op: "math/rgbToOkLCh" }, { op: "math/abs" }],
            nodes: [
                {
                    declaration: 0,
                    values: {
                        r: { type: 0, value: [1] },
                        g: { type: 0, value: [0] },
                        b: { type: 0, value: [0] },
                    },
                },
                { declaration: 1, values: { a: { node: 0, socket: "l", type: 1 } } },
            ],
        });

        expect(model.diagnostics).toContainEqual(
            expect.objectContaining({
                path: expect.stringContaining("/nodes/1/values/a/type"),
                message: 'Type assertion does not match output socket "l".',
            })
        );
    });

    it("accepts constant operations without synthetic inputs", () => {
        for (const operation of ["math/E", "math/Pi", "math/Tau", "math/Inf", "math/NaN"]) {
            expect(CreateKHRInteractivityGraphModel({ declarations: [{ op: operation }], nodes: [{ declaration: 0 }] }).valid).toBe(true);
        }
    });

    it("rejects duplicate external event ids and equivalent declarations", () => {
        const model = CreateKHRInteractivityGraphModel({
            types: [{ signature: "float" }],
            events: [{ id: "external" }, { id: "external" }, {}, {}],
            declarations: [
                { op: "vendor/op", extension: "EXT_vendor", inputValueSockets: { b: { type: 0 }, a: { type: 0 } } },
                {
                    op: "vendor/op",
                    extension: "EXT_vendor",
                    inputValueSockets: { a: { type: 0 }, b: { type: 0 } },
                    outputValueSockets: { ignoredForEquality: { type: 0 } },
                },
            ],
        });

        expect(model.diagnostics.map((diagnostic) => diagnostic.message)).toEqual(expect.arrayContaining(['Duplicate event id "external".', "Duplicate equivalent declaration."]));
    });

    it("preserves prototype-sensitive JSON keys without polluting prototypes", () => {
        const extension = JSON.parse(
            '{"graphs":[{"extras":{"__proto__":{"polluted":true},"constructor":"constructor-value","prototype":"prototype-value"}}]}'
        ) as IKHRInteractivity;

        const document = CreateKHRInteractivityDocument(extension);
        const extras = document.graphs[0].source.extras;

        expect(Object.prototype.hasOwnProperty.call(extras, "__proto__")).toBe(true);
        expect(extras.__proto__).toEqual({ polluted: true });
        expect(extras.constructor).toBe("constructor-value");
        expect(extras.prototype).toBe("prototype-value");
        expect((Object.prototype as any).polluted).toBeUndefined();
    });

    it("demotes incompatible known extension declarations to typed no-ops", () => {
        _RegisterKHRNodeSelectabilityRuntime();
        const types = [{ signature: "int" as const }, { signature: "ref" as const }, { signature: "float3" as const }];
        const validDeclaration = {
            op: "event/onSelect",
            extension: "KHR_node_selectability",
            outputValueSockets: {
                selectedNode: { type: 1 },
                selectionRayOrigin: { type: 2 },
                selectionPoint: { type: 2 },
                controllerIndex: { type: 0 },
                event: { type: 1 },
            },
        };
        const { event: _event, ...withoutEvent } = validDeclaration.outputValueSockets;
        const valid = CreateKHRInteractivityGraphModel({ types, declarations: [validDeclaration] });
        const missingEvent = CreateKHRInteractivityGraphModel({
            types,
            declarations: [{ ...validDeclaration, outputValueSockets: withoutEvent }],
        });
        const wrongTypeGraph: IKHRInteractivity_Graph = {
            types,
            declarations: [{ ...validDeclaration, outputValueSockets: { ...validDeclaration.outputValueSockets, selectedNode: { type: 0 } } }],
            nodes: [{ declaration: 0 }],
        };
        const wrongType = CreateKHRInteractivityGraphModel(wrongTypeGraph);
        const serialized = new InteractivityGraphToFlowGraphParser(wrongTypeGraph, {} as any, 60, 0, undefined, wrongType.declarations).serializeToFlowGraph();

        expect(valid.declarations[0].support).toBe("extension");
        expect(missingEvent.declarations[0].support).toBe("unsupported-extension");
        expect(wrongType.declarations[0].support).toBe("unsupported-extension");
        expect(serialized.allBlocks[0].className).toBe("KHR_interactivity/FlowGraphUnsupportedInteractivityBlock");
    });

    it("uses the non-firing default configuration for missing or invalid selection targets", () => {
        _RegisterKHRNodeSelectabilityRuntime();
        const types = [{ signature: "int" as const }, { signature: "ref" as const }, { signature: "float3" as const }];
        const declaration = {
            op: "event/onSelect",
            extension: "KHR_node_selectability",
            outputValueSockets: {
                selectedNode: { type: 1 },
                selectionRayOrigin: { type: 2 },
                selectionPoint: { type: 2 },
                controllerIndex: { type: 0 },
                event: { type: 1 },
            },
        };
        const missing = CreateKHRInteractivityGraphModel({ types, declarations: [declaration], nodes: [{ declaration: 0 }] });
        const outOfRange = CreateKHRInteractivityGraphModel(
            {
                types,
                declarations: [declaration],
                nodes: [{ declaration: 0, configuration: { nodeIndex: { value: [7] } } }],
            },
            0,
            undefined,
            1
        );

        expect(missing.valid).toBe(true);
        expect(outOfRange.valid).toBe(true);
        expect(outOfRange.diagnostics).toContainEqual(expect.objectContaining({ severity: "warning", path: expect.stringContaining("/configuration/nodeIndex/value/0") }));
    });

    it("treats globally registered mappings as unsupported when their extension is disabled", () => {
        _RegisterKHRNodeSelectabilityRuntime();
        const graph: IKHRInteractivity_Graph = {
            declarations: [{ op: "event/onSelect", extension: "KHR_node_selectability" }],
            nodes: [{ declaration: 0 }],
        };

        const model = CreateKHRInteractivityGraphModel(graph, 0, new Set());
        const serialized = new InteractivityGraphToFlowGraphParser(graph, {} as any, 60, 0, new Set()).serializeToFlowGraph();

        expect(model.declarations[0].support).toBe("unsupported-extension");
        expect(serialized.allBlocks[0].className).toBe("KHR_interactivity/FlowGraphUnsupportedInteractivityBlock");
    });

    it("does not mutate source data and attaches stable source provenance to generated blocks", () => {
        const graph: IKHRInteractivity_Graph = {
            name: "Named graph",
            types: [{ signature: "float" }],
            declarations: [{ op: "math/abs" }],
            nodes: [{ declaration: 0, values: { a: { type: 0, value: [1] } } }],
        };
        const before = JSON.stringify(graph);

        const serialized = new InteractivityGraphToFlowGraphParser(graph, {} as any, 60, 3).serializeToFlowGraph();

        expect(JSON.stringify(graph)).toBe(before);
        expect(serialized.name).toBe("Named graph");
        expect(serialized.allBlocks[0].metadata.khrInteractivity).toEqual({
            graphIndex: 3,
            nodeIndex: 0,
            declarationIndex: 0,
            operation: "math/abs",
            role: 0,
            sourcePath: "/extensions/KHR_interactivity/graphs/3/nodes/0",
        });
    });

    it("lowers an unsupported extension operation to an inspectable no-op block", () => {
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "float" }],
            declarations: [
                {
                    op: "vendor/doThing",
                    extension: "EXT_vendor_interactivity",
                    inputValueSockets: { amount: { type: 0 } },
                    outputValueSockets: { result: { type: 0 } },
                },
            ],
            nodes: [{ declaration: 0, values: { amount: { type: 0, value: [2] } }, flows: { done: { node: 1, socket: "again" } } }, { declaration: 0 }],
        };

        const serialized = new InteractivityGraphToFlowGraphParser(graph, {} as any).serializeToFlowGraph();
        const block = serialized.allBlocks[0];
        const targetBlock = serialized.allBlocks[1];

        expect(block.className).toBe("KHR_interactivity/FlowGraphUnsupportedInteractivityBlock");
        expect(block.dataInputs.map((socket) => socket.name)).toEqual(["amount"]);
        expect(block.dataOutputs.map((socket) => socket.name)).toEqual(["result"]);
        expect(targetBlock.signalInputs.map((socket) => socket.name)).toEqual(["again"]);
        expect(block.signalOutputs.map((socket) => socket.name)).toEqual(["done"]);
    });

    it("uses KHR defaults for unsupported extension output sockets", () => {
        const block = new FlowGraphUnsupportedInteractivityBlock({
            operation: "vendor/defaults",
            inputValueSockets: [],
            outputValueSockets: [
                { name: "floatValue", type: "number", signature: "float" },
                { name: "boolValue", type: "boolean", signature: "bool" },
                { name: "refValue", type: "string", signature: "ref" },
            ],
            inputFlowSockets: [],
            outputFlowSockets: [],
        });

        expect((block.getDataOutput("floatValue") as any)._defaultValue).toBeNaN();
        expect((block.getDataOutput("boolValue") as any)._defaultValue).toBe(false);
        expect((block.getDataOutput("refValue") as any)._defaultValue).toBe("");
    });
});
