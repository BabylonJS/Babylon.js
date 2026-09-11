import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { AppendSceneAsync } from "core/Loading/sceneLoader";
import { FlowGraphState } from "core/FlowGraph/flowGraph";
import { GetKHRInteractivityImportResult, GetKHRInteractivityImportResults } from "../../../src/glTF/2.0/Extensions/KHR_interactivity.pure";

function buildAsset(defaultGraph: number): string {
    return JSON.stringify({
        asset: { version: "2.0" },
        scene: 0,
        scenes: [{ nodes: [] }],
        extensionsUsed: ["KHR_interactivity"],
        extensions: {
            KHR_interactivity: {
                graph: defaultGraph,
                graphs: [
                    {
                        name: "First",
                        declarations: [{ op: "event/onStart" }],
                        nodes: [{ declaration: 0 }],
                    },
                    {
                        name: "Second",
                        declarations: [{ op: "event/onStart" }],
                        nodes: [{ declaration: 0 }],
                    },
                    {
                        name: "Invalid",
                        declarations: [{ op: "core/doesNotExist" }],
                        nodes: [{ declaration: 0 }],
                    },
                ],
            },
        },
    });
}

describe("KHR_interactivity loader lifecycle", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(async () => {
        engine = new NullEngine();
        scene = new Scene(engine);
        await import("loaders/glTF/2.0");
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it("awaits parse-only import and preserves all source graphs without constructing coordinators", async () => {
        await AppendSceneAsync(`data:${buildAsset(1)}`, scene, {
            pluginOptions: {
                gltf: {
                    extensionOptions: {
                        KHR_interactivity: {
                            autoStart: false,
                            parseOnly: true,
                        },
                    },
                },
            },
        });

        const result = GetKHRInteractivityImportResult(scene);
        expect(result).toBeDefined();
        expect(result!.document.defaultGraphIndex).toBe(1);
        expect(result!.graphs.map((graph) => graph.graph.name)).toEqual(["First", "Second", "Invalid"]);
        expect(result!.graphs[0].serializedFlowGraph?.name).toBe("First");
        expect(result!.graphs[1].serializedFlowGraph?.name).toBe("Second");
        expect(result!.graphs[2].serializedFlowGraph).toBeUndefined();
        expect(result!.graphs[2].diagnostics[0].message).toContain("Unknown core operation");
        expect(result!.graphs.every((graph) => graph.coordinator === undefined)).toBe(true);
    });

    it("starts only the selected valid default graph", async () => {
        await AppendSceneAsync(`data:${buildAsset(1)}`, scene);

        const result = GetKHRInteractivityImportResult(scene)!;
        expect(result.graphs[0].flowGraph?.state).toBe(FlowGraphState.Stopped);
        expect(result.graphs[1].flowGraph?.state).toBe(FlowGraphState.Started);
        expect(result.graphs[2].flowGraph).toBeUndefined();
    });

    it("retains every appended asset result with stable per-scene identities", async () => {
        await AppendSceneAsync(`data:${buildAsset(0)}`, scene);
        const firstResult = GetKHRInteractivityImportResult(scene)!;
        await AppendSceneAsync(`data:${buildAsset(1)}`, scene);

        const results = GetKHRInteractivityImportResults(scene);
        expect(results).toHaveLength(2);
        expect(results[0]).toBe(firstResult);
        expect(results.map((result) => result.assetIndex)).toEqual([0, 1]);
        expect(results.map((result) => result.document.defaultGraphIndex)).toEqual([0, 1]);
        expect(GetKHRInteractivityImportResult(scene)).toBe(results[1]);
    });

    it("starts no graph when the selected graph is invalid", async () => {
        await AppendSceneAsync(`data:${buildAsset(2)}`, scene);

        const result = GetKHRInteractivityImportResult(scene)!;
        expect(result.graphs[0].flowGraph?.state).toBe(FlowGraphState.Stopped);
        expect(result.graphs[1].flowGraph?.state).toBe(FlowGraphState.Stopped);
        expect(result.graphs[2].flowGraph).toBeUndefined();
    });

    it("defaults to ratified validation but can parse pre-ratification assets explicitly", async () => {
        const legacyAsset = JSON.stringify({
            asset: { version: "2.0" },
            scene: 0,
            scenes: [{ nodes: [] }],
            extensionsUsed: ["KHR_interactivity"],
            extensions: {
                KHR_interactivity: {
                    graphs: [
                        {
                            types: [{ signature: "float" }],
                            variables: [{ type: 0, value: ["1"] }],
                        },
                    ],
                },
            },
        });
        await AppendSceneAsync(`data:${legacyAsset}`, scene);
        expect(GetKHRInteractivityImportResult(scene)!.graphs[0].serializedFlowGraph).toBeUndefined();

        const compatibilityScene = new Scene(engine);
        await AppendSceneAsync(`data:${legacyAsset}`, compatibilityScene, {
            pluginOptions: {
                gltf: {
                    extensionOptions: {
                        KHR_interactivity: {
                            strictValidation: false,
                        },
                    },
                },
            },
        });
        expect(GetKHRInteractivityImportResult(compatibilityScene)!.graphs[0].serializedFlowGraph).toBeDefined();
        compatibilityScene.dispose();
    });

    it("uses production strict contracts and effective configuration during loader lowering", async () => {
        const asset = JSON.stringify({
            asset: { version: "2.0" },
            scene: 0,
            scenes: [{ nodes: [] }],
            extensionsUsed: ["KHR_interactivity"],
            extensions: {
                KHR_interactivity: {
                    graphs: [
                        {
                            types: [{ signature: "bool" }, { signature: "int" }],
                            declarations: [{ op: "event/onStart" }, { op: "flow/branch" }, { op: "flow/for" }, { op: "flow/sequence" }],
                            nodes: [
                                { declaration: 0, flows: { out: { node: 1 } } },
                                {
                                    declaration: 1,
                                    values: { condition: { type: 0, value: [true] } },
                                    flows: { true: { node: 2 }, false: { node: 3 } },
                                },
                                {
                                    declaration: 2,
                                    configuration: { initialIndex: { value: [0.5] } },
                                    values: { startIndex: { type: 1, value: [0] }, endIndex: { type: 1, value: [1] } },
                                    flows: { loopBody: { node: 3 }, completed: { node: 3 } },
                                },
                                { declaration: 3 },
                            ],
                        },
                    ],
                },
            },
        });

        await AppendSceneAsync(`data:${asset}`, scene, {
            pluginOptions: {
                gltf: {
                    extensionOptions: {
                        KHR_interactivity: {
                            parseOnly: true,
                        },
                    },
                },
            },
        });

        const result = GetKHRInteractivityImportResult(scene)!.graphs[0];
        expect(result.graph.valid).toBe(true);
        expect(result.diagnostics).toContainEqual(expect.objectContaining({ severity: "warning", path: expect.stringContaining("/configuration/initialIndex") }));
        const branch = result.serializedFlowGraph!.allBlocks.find((block) => block.className === "FlowGraphBranchBlock")!;
        const forLoop = result.serializedFlowGraph!.allBlocks.find((block) => block.className === "FlowGraphForLoopBlock")!;
        expect(branch.dataInputs.map((socket) => socket.name)).toContain("condition");
        expect(forLoop.signalOutputs.map((socket) => socket.name)).toContain("completed");
        expect(forLoop.config.initialIndex.value).toBe(0);

        const compatibilityScene = new Scene(engine);
        await AppendSceneAsync(`data:${asset}`, compatibilityScene, {
            pluginOptions: {
                gltf: {
                    extensionOptions: {
                        KHR_interactivity: {
                            parseOnly: true,
                            strictValidation: false,
                        },
                    },
                },
            },
        });
        const compatibilityForLoop = GetKHRInteractivityImportResult(compatibilityScene)!.graphs[0].serializedFlowGraph!.allBlocks.find(
            (block) => block.className === "FlowGraphForLoopBlock"
        )!;
        expect(compatibilityForLoop.config.initialIndex.value).toBe(0.5);
        compatibilityScene.dispose();
    });

    it("strictly lowers ratified debug log templates, defaults, escapes, and parameters", async () => {
        const debugGraph = (configuration?: Record<string, { value: unknown[] }>, values?: Record<string, any>) => ({
            types: [{ signature: "float" }],
            declarations: [{ op: "debug/log" }],
            nodes: [{ declaration: 0, configuration, values }],
        });
        const asset = JSON.stringify({
            asset: { version: "2.0" },
            scene: 0,
            scenes: [{ nodes: [] }],
            extensionsUsed: ["KHR_interactivity"],
            extensions: {
                KHR_interactivity: {
                    graphs: [
                        debugGraph(
                            {
                                severity: { value: [2] },
                                message: { value: ["value={value}; literal={{escaped}}"] },
                            },
                            { value: { type: 0, value: [3] } }
                        ),
                        debugGraph(),
                        debugGraph({
                            severity: { value: [1] },
                            message: { value: ["malformed {message"] },
                        }),
                        debugGraph({
                            severity: { value: [0] },
                            message: { value: ["{{literal only}}"] },
                        }),
                        debugGraph({
                            severity: { value: [0] },
                            message: { value: ["missing {parameter}"] },
                        }),
                        debugGraph(
                            {
                                severity: { value: [1.5] },
                                message: { value: ["ignored {value}"] },
                            },
                            { value: { type: 0, value: [4] } }
                        ),
                        debugGraph(
                            {
                                severity: { value: [0] },
                                message: { value: ["prototype={__proto__}"] },
                            },
                            JSON.parse('{"__proto__":{"type":0,"value":[5]}}')
                        ),
                        {
                            types: [{ signature: "float" }],
                            events: [{ id: "prototype-event", values: { constructor: { type: 0 } } }],
                            declarations: [{ op: "event/receive" }, { op: "math/abs" }],
                            nodes: [
                                { declaration: 0, configuration: { event: { value: [0] } } },
                                { declaration: 1, values: { a: { node: 0, socket: "constructor", type: 0 } } },
                            ],
                        },
                    ],
                },
            },
        });

        await AppendSceneAsync(`data:${asset}`, scene, {
            pluginOptions: {
                gltf: {
                    extensionOptions: {
                        KHR_interactivity: { parseOnly: true },
                    },
                },
            },
        });

        const results = GetKHRInteractivityImportResult(scene)!.graphs;
        const getLogBlock = (graphIndex: number) => results[graphIndex].serializedFlowGraph!.allBlocks.find((block) => block.className === "FlowGraphConsoleLogBlock")!;
        expect(getLogBlock(0).dataInputs.map((socket) => socket.name)).toEqual(["value"]);
        expect(results[0].graph.effectiveSource.nodes![0].configuration!.severity.value).toEqual([2]);
        expect(results[1].graph.effectiveSource.nodes![0].configuration).toEqual({
            severity: { value: [0] },
            message: { value: [""] },
        });
        expect(results[2].diagnostics).toContainEqual(expect.objectContaining({ severity: "warning", path: expect.stringContaining("/configuration/message/value/0") }));
        expect(getLogBlock(2).dataInputs).toEqual([]);
        expect(getLogBlock(3).dataInputs).toEqual([]);
        expect(results[4].serializedFlowGraph).toBeUndefined();
        expect(results[4].diagnostics).toContainEqual(expect.objectContaining({ path: expect.stringContaining("/values/parameter"), severity: "error" }));
        expect(results[5].diagnostics).toContainEqual(expect.objectContaining({ severity: "warning", path: expect.stringContaining("/configuration/severity") }));
        expect(getLogBlock(5).dataInputs).toEqual([]);
        expect(getLogBlock(6).dataInputs.map((socket) => socket.name)).toEqual(["__proto__"]);
        const receiveBlock = results[7].serializedFlowGraph!.allBlocks.find((block) => block.className === "FlowGraphReceiveCustomEventBlock")!;
        expect(receiveBlock.dataOutputs.map((socket) => socket.name)).toContain("constructor");
        const absBlock = results[7].serializedFlowGraph!.allBlocks.find((block) => block.className === "FlowGraphAbsBlock")!;
        expect(absBlock.dataInputs.find((socket) => socket.name === "a")?.connectedPointIds).toHaveLength(1);

        const runtimeAsset = JSON.stringify({
            asset: { version: "2.0" },
            scene: 0,
            scenes: [{ nodes: [] }],
            extensionsUsed: ["KHR_interactivity"],
            extensions: {
                KHR_interactivity: {
                    graphs: [
                        {
                            declarations: [{ op: "event/onStart" }, { op: "debug/log" }],
                            nodes: [{ declaration: 0, flows: { out: { node: 1 } } }, { declaration: 1 }],
                        },
                    ],
                },
            },
        });
        await AppendSceneAsync(`data:${runtimeAsset}`, scene, {
            pluginOptions: {
                gltf: {
                    extensionOptions: {
                        KHR_interactivity: { parseOnly: true },
                    },
                },
            },
        });
        const runtimeGraph = GetKHRInteractivityImportResult(scene)!.graphs[0].serializedFlowGraph!;
        const startBlock = runtimeGraph.allBlocks.find((block) => block.className === "FlowGraphSceneReadyEventBlock")!;
        const runtimeLogBlock = runtimeGraph.allBlocks.find((block) => block.className === "FlowGraphConsoleLogBlock")!;
        expect(runtimeLogBlock.config.messageTemplate.value).toBe("");
        expect(runtimeLogBlock.signalInputs.map((socket) => socket.name)).toEqual(["in"]);
        expect(runtimeLogBlock.signalInputs[0].connectedPointIds).toHaveLength(1);
        expect(startBlock.signalOutputs.find((socket) => socket.name === "done")?.connectedPointIds).toContain(runtimeLogBlock.signalInputs[0].uniqueId);
    });
});
