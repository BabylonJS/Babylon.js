import { describe, expect, it } from "vitest";
import { type IKHRInteractivity, type IKHRInteractivity_Graph } from "babylonjs-gltf2interface";
import {
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
            types: [{ signature: "custom", extensions: { EXT_a: { type: "first" } } }, { signature: "custom", extensions: { EXT_b: { type: "second" } } }],
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

    it("validates literal component types", () => {
        const model = CreateKHRInteractivityGraphModel({
            types: [{ signature: "bool" }, { signature: "int" }, { signature: "ref" }],
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
                        invalidReference: { type: 2, value: ["not-a-pointer"] },
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
            ])
        );
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
            nodes: [{ declaration: 0, values: { a: { type: 0, value: ["NaN"] } } }],
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
            nodes: [
                { declaration: 0, values: { amount: { type: 0, value: [2] } }, flows: { done: { node: 1, socket: "again" } } },
                { declaration: 0 },
            ],
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
