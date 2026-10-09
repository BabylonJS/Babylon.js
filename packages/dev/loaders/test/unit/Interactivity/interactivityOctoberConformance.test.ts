import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { type IKHRInteractivity_Graph } from "babylonjs-gltf2interface";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { TransformNode } from "core/Meshes/transformNode";
import { Vector3 } from "core/Maths/math.vector.pure";
import { FlowGraphCoordinator } from "core/FlowGraph/flowGraphCoordinator";
import { ParseFlowGraphAsync } from "core/FlowGraph/flowGraphParser";
import { FlowGraphBlockNames } from "core/FlowGraph/Blocks/flowGraphBlockNames";
import { type FlowGraphExecutionBlock } from "core/FlowGraph/flowGraphExecutionBlock";
import { type FlowGraphSetDelayBlock } from "core/FlowGraph/Blocks/Execution/ControlFlow/flowGraphSetDelayBlock.pure";
import { IsDelayActive } from "core/FlowGraph/flowGraphDelayRegistry";
import { Logger } from "core/Misc/logger";
import { AppendSceneAsync } from "core/Loading/sceneLoader";
import { type IGLTF } from "../../../src/glTF/2.0/glTFLoaderInterfaces";
import { CreateKHRInteractivityGraphModel } from "../../../src/glTF/2.0/Extensions/KHR_interactivity/interactivityGraphModel";
import { InteractivityGraphToFlowGraphParser } from "../../../src/glTF/2.0/Extensions/KHR_interactivity/interactivityGraphParser";
import { _RegisterKHRInteractivityRuntime } from "../../../src/glTF/2.0/Extensions/KHR_interactivity.pure";
import { GetPathToObjectConverter } from "../../../src/glTF/2.0/Extensions/objectModelMapping";
import { InteractivityHostResolver } from "../../../src/glTF/2.0/Extensions/KHR_interactivity/interactivityHostResolver";
import { DelayReferencePrefix } from "../../../src/glTF/2.0/Extensions/KHR_interactivity/interactivityReferences";

describe("KHR_interactivity October conformance", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeAll(async () => {
        await import("loaders/glTF/2.0");
    }, 30000);

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        _RegisterKHRInteractivityRuntime();
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
        vi.restoreAllMocks();
    });

    async function runtime(source: IKHRInteractivity_Graph, gltfData: Partial<IGLTF> = {}, strict = true) {
        const gltf: IGLTF = { asset: { version: "2.0" }, ...gltfData };
        const model = CreateKHRInteractivityGraphModel(source, 0, undefined, gltf.nodes?.length ?? 0);
        if (strict) {
            expect(model.valid, model.diagnostics.map((diagnostic) => diagnostic.message).join("\n")).toBe(true);
        }
        const parser = new InteractivityGraphToFlowGraphParser(source, gltf, 60, 0, undefined, strict ? model.declarations : undefined);
        const coordinator = new FlowGraphCoordinator({ scene, hostResolver: new InteractivityHostResolver() });
        const graph = await ParseFlowGraphAsync(parser.serializeToFlowGraph(), { coordinator, pathConverter: GetPathToObjectConverter(gltf) });
        return { coordinator, graph, context: graph.getContext(0) };
    }

    it("wires variable/set and pointer/set out in strict graphs", async () => {
        const node = new TransformNode("target", scene);
        const { coordinator, context } = await runtime(
            {
                types: [{ signature: "float3" }],
                variables: [{ type: 0 }],
                declarations: [{ op: "event/onStart" }, { op: "variable/set" }, { op: "pointer/set" }, { op: "debug/log" }],
                nodes: [
                    { declaration: 0, flows: { out: { node: 1 } } },
                    {
                        declaration: 1,
                        configuration: { variables: { value: [0] } },
                        values: { "0": { type: 0, value: [1, 2, 3] } },
                        flows: { out: { node: 2 } },
                    },
                    {
                        declaration: 2,
                        configuration: { pointer: { value: ["/nodes/0/translation"] }, type: { value: [0] } },
                        values: { value: { type: 0, value: [4, 5, 6] } },
                        flows: { out: { node: 3 } },
                    },
                    { declaration: 3, configuration: { severity: { value: [0] }, message: { value: ["after both writes"] } } },
                ],
            },
            { nodes: [{ index: 0, _babylonTransformNode: node }] }
        );
        const log = vi.spyOn(Logger, "Log");
        coordinator.start();
        expect(node.position).toEqual(new Vector3(4, 5, 6));
        expect(context.getVariable("staticVariable_0")).toEqual(new Vector3(1, 2, 3));
        expect(log).toHaveBeenCalledWith("after both writes");
    });

    it.each([
        ["math/extract2", "float2", 2],
        ["math/extract3", "float3", 3],
        ["math/extract4", "float4", 4],
        ["math/extract2x2", "float2x2", 4],
        ["math/extract3x3", "float3x3", 9],
        ["math/extract4x4", "float4x4", 16],
        ["math/matDecompose", "float4x4", 16],
    ] as const)("accepts the correct shape for %s and rejects scalar input", (op, signature, length) => {
        const source: IKHRInteractivity_Graph = {
            types: [{ signature }, { signature: "float" }],
            declarations: [{ op }],
            nodes: [{ declaration: 0, values: { a: { type: 0, value: Array.from({ length }, (_, index) => index + 1) } } }],
        };
        expect(CreateKHRInteractivityGraphModel(source).valid).toBe(true);
        source.nodes![0].values!.a = { type: 1, value: [1] };
        expect(CreateKHRInteractivityGraphModel(source).valid).toBe(false);
    });

    it.each(["math/transpose", "math/determinant", "math/inverse", "math/matMul"])("accepts matrix operands, not scalar operands for %s", (op) => {
        const source: IKHRInteractivity_Graph = {
            types: [{ signature: "float2x2" }, { signature: "float" }],
            declarations: [{ op }],
            nodes: [{ declaration: 0, values: { a: { type: 0, value: [1, 0, 0, 1] }, ...(op === "math/matMul" ? { b: { type: 0, value: [1, 0, 0, 1] } } : {}) } }],
        };
        expect(CreateKHRInteractivityGraphModel(source).valid).toBe(true);
        source.nodes![0].values!.a = { type: 1, value: [1] };
        expect(CreateKHRInteractivityGraphModel(source).valid).toBe(false);
    });

    it("routes flow/switch default without requiring a default input value", async () => {
        const { coordinator } = await runtime({
            types: [{ signature: "int" }],
            declarations: [{ op: "event/onStart" }, { op: "flow/switch" }, { op: "debug/log" }],
            nodes: [
                { declaration: 0, flows: { out: { node: 1 } } },
                { declaration: 1, values: { selection: { type: 0, value: [7] } }, flows: { default: { node: 2 } } },
                { declaration: 2, configuration: { severity: { value: [0] }, message: { value: ["default branch"] } } },
            ],
        });
        const log = vi.spyOn(Logger, "Log");
        coordinator.start();
        expect(log).toHaveBeenCalledWith("default branch");
    });

    it("evaluates a type-only float source as NaN", async () => {
        const { graph, context } = await runtime({
            types: [{ signature: "float" }],
            declarations: [{ op: "math/isNaN" }],
            nodes: [{ declaration: 0, values: { a: { type: 0 } } }],
        });
        expect(graph.getAllBlocks()[0].getDataOutput("value")!.getValue(context)).toBe(true);
    });

    it.each(["", "/nodes/0", `${DelayReferencePrefix}999`, `${DelayReferencePrefix}bad`])("ignores invalid or inactive cancellation references (%s)", async (reference) => {
        const { coordinator, graph } = await runtime({
            types: [{ signature: "ref" }],
            declarations: [{ op: "event/onStart" }, { op: "flow/cancelDelay" }, { op: "debug/log" }],
            nodes: [
                { declaration: 0, flows: { out: { node: 1 } } },
                { declaration: 1, values: { delay: { type: 0, value: [reference] } }, flows: { out: { node: 2 } } },
                { declaration: 2, configuration: { severity: { value: [0] }, message: { value: ["cancel complete"] } } },
            ],
        });
        const cancel = graph.getAllBlocks().find((block) => block.getClassName() === FlowGraphBlockNames.CancelDelay) as FlowGraphExecutionBlock;
        const error = vi.spyOn(cancel.error, "_activateSignal");
        const log = vi.spyOn(Logger, "Log");
        coordinator.start();
        expect(error).not.toHaveBeenCalled();
        expect(log).toHaveBeenCalledWith("cancel complete");
    });

    it("encodes active delays and resets lastDelay to the null reference on cancel", async () => {
        const { graph, context } = await runtime({
            types: [{ signature: "float" }],
            declarations: [{ op: "flow/setDelay" }],
            nodes: [{ declaration: 0, values: { duration: { type: 0, value: [1] } } }],
        });
        const blocks = graph.getAllBlocks();
        const delay = blocks.find((block) => block.getClassName() === FlowGraphBlockNames.SetDelay) as FlowGraphSetDelayBlock;
        const reference = blocks.find((block) => block.getClassName() === "KHR_interactivity/FlowGraphDelayReferenceBlock")!;
        expect(reference.getDataOutput("value")!.getValue(context)).toBe("");
        delay._execute(context, delay.in);
        expect(reference.getDataOutput("value")!.getValue(context)).toBe(`${DelayReferencePrefix}0`);
        expect(IsDelayActive(context, 0)).toBe(true);
        delay._execute(context, delay.cancel);
        expect(reference.getDataOutput("value")!.getValue(context)).toBe("");
        expect(IsDelayActive(context, 0)).toBe(false);
    });

    it.each([
        ["/nodes/0/translation", "float"],
        ["/nodes.length", "int"],
        ["/nodes/0/weights", "float3"],
    ] as const)("routes incompatible/read-only writes to err, not out (%s)", async (pointer, signature) => {
        const target = new TransformNode("target", scene);
        const { graph, context } = await runtime(
            {
                types: [{ signature }],
                declarations: [{ op: "pointer/set" }],
                nodes: [{ declaration: 0, configuration: { pointer: { value: [pointer] }, type: { value: [0] } }, values: { value: { type: 0 } } }],
            },
            { nodes: [{ index: 0, _babylonTransformNode: target }] }
        );
        const write = graph.getAllBlocks().find((block) => block.getClassName() === FlowGraphBlockNames.SetProperty) as FlowGraphExecutionBlock;
        const out = vi.spyOn(write.getSignalOutput("out")!, "_activateSignal");
        const error = vi.spyOn(write.error, "_activateSignal");
        write._execute(context, write.in);
        expect(error).toHaveBeenCalledOnce();
        expect(out).not.toHaveBeenCalled();
        expect(target.position).toEqual(Vector3.Zero());
    });

    it.each([true, false])("defaults invalid multiGate configuration in strict and compatibility imports (%s)", async (strict) => {
        const { coordinator, graph } = await runtime(
            {
                declarations: [{ op: "event/onStart" }, { op: "flow/multiGate" }, { op: "debug/log" }],
                nodes: [
                    { declaration: 0, flows: { out: { node: 1 } } },
                    {
                        declaration: 1,
                        configuration: { isRandom: { value: ["yes"] }, isLoop: { value: [true] } },
                        flows: { "0": { node: 2 }, "1": { node: 3 } },
                    },
                    { declaration: 2, configuration: { severity: { value: [0] }, message: { value: ["first"] } } },
                    { declaration: 2, configuration: { severity: { value: [0] }, message: { value: ["second"] } } },
                ],
            },
            {},
            strict
        );
        const random = vi.spyOn(Math, "random");
        const log = vi.spyOn(Logger, "Log");
        coordinator.start();
        expect(random).not.toHaveBeenCalled();
        expect(log).toHaveBeenCalledWith("first");
        expect(log).not.toHaveBeenCalledWith("second");
        const gate = graph.getAllBlocks().find((block) => block.getClassName() === FlowGraphBlockNames.MultiGate)!;
        expect(gate.config.isRandom).toBe(false);
        expect(gate.config.isLoop).toBe(false);
    });

    const invalidGraphs: [string, IKHRInteractivity_Graph][] = [
        ["declaration extension", { declarations: [{ op: "vendor/op", extension: 5 }] } as unknown as IKHRInteractivity_Graph],
        ["event id", { events: [{ id: 5 }] } as unknown as IKHRInteractivity_Graph],
        ["event name", { events: [{ name: true }] } as unknown as IKHRInteractivity_Graph],
        ["variable name", { types: [{ signature: "int" }], variables: [{ type: 0, name: 5 }] } as unknown as IKHRInteractivity_Graph],
        [
            "flow socket",
            {
                declarations: [{ op: "flow/sequence" }],
                nodes: [{ declaration: 0, flows: { "0": { node: 1, socket: 1 } } }, { declaration: 0 }],
            } as unknown as IKHRInteractivity_Graph,
        ],
        ["integer sine", { types: [{ signature: "int" }], declarations: [{ op: "math/sin" }], nodes: [{ declaration: 0, values: { a: { type: 0, value: [1] } } }] }],
    ];
    for (const signature of ["int", "bool", "float3"] as const) {
        invalidGraphs.push([
            `interpolation ${signature}`,
            {
                types: [{ signature }, { signature: "float" }, { signature: "float2" }],
                variables: [{ type: 0 }],
                declarations: [{ op: "variable/interpolate" }],
                nodes: [
                    {
                        declaration: 0,
                        configuration: { variable: { value: [0] }, useSlerp: { value: [signature === "float3"] } },
                        values: { value: { type: 0 }, duration: { type: 1, value: [1] }, p1: { type: 2 }, p2: { type: 2 } },
                    },
                ],
            },
        ]);
    }
    for (const op of ["variable/interpolate", "pointer/interpolate", "pointer/set"]) {
        invalidGraphs.push([
            `${op} value type`,
            {
                types: [{ signature: "float3" }, { signature: "float2" }, { signature: "float" }],
                variables: [{ type: 0 }],
                declarations: [{ op }],
                nodes: [
                    {
                        declaration: 0,
                        configuration:
                            op === "variable/interpolate"
                                ? { variable: { value: [0] }, useSlerp: { value: [false] } }
                                : { pointer: { value: ["/nodes/0/translation"] }, type: { value: [0] } },
                        values: {
                            value: { type: 1 },
                            ...(op.endsWith("interpolate") ? { duration: { type: 2, value: [1] }, p1: { type: 1 }, p2: { type: 1 } } : {}),
                        },
                    },
                ],
            },
        ]);
    }
    it.each(invalidGraphs)("diagnoses and rejects the selected invalid graph: %s", async (_name, graph) => {
        const model = CreateKHRInteractivityGraphModel(graph);
        expect(model.valid).toBe(false);
        expect(model.diagnostics.some((diagnostic) => diagnostic.severity === "error")).toBe(true);
        const asset = JSON.stringify({
            asset: { version: "2.0" },
            extensionsUsed: ["KHR_interactivity"],
            extensions: { KHR_interactivity: { graphs: [graph] } },
        });
        await expect(AppendSceneAsync(`data:${asset}`, scene)).rejects.toThrow(/KHR_interactivity/);
    });
});
