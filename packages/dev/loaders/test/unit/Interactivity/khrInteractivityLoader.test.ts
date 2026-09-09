import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { AppendSceneAsync } from "core/Loading/sceneLoader";
import { FlowGraphState } from "core/FlowGraph/flowGraph";
import { GetKHRInteractivityImportResult } from "../../../src/glTF/2.0/Extensions/KHR_interactivity.pure";

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
});
