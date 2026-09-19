import { FlowGraphState } from "core/FlowGraph/flowGraph";
import { FlowGraphCoordinator } from "core/FlowGraph/flowGraphCoordinator";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { type IKHRInteractivity_Graph } from "babylonjs-gltf2interface";
import { GlobalState } from "flow-graph-editor/globalState";
import { SerializationTools } from "flow-graph-editor/serializationTools";
import { _RegisterKHRInteractivityRuntime } from "loaders/glTF/2.0/Extensions/KHR_interactivity.pure";
import {
    _CaptureKHRInteractivityRuntimeInputDefaults,
    CreateKHRInteractivityDocument,
    CreateKHRInteractivityExportPlan,
    InteractivityGraphToFlowGraphParser,
} from "loaders/glTF/2.0/Extensions/KHR_interactivity/pure";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("SerializationTools coordinator ownership", () => {
    it("detaches a borrowed host coordinator without disposing its graphs", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const hostCoordinator = new FlowGraphCoordinator({ scene });
        const hostGraph = hostCoordinator.createGraph();
        hostGraph.createContext();
        hostCoordinator.start();
        const globalState = new GlobalState(scene);
        globalState.hostScene = scene;
        globalState.coordinator = hostCoordinator;

        const firstReplacement = await SerializationTools.DeserializeToStateAsync({ rightHanded: true, allBlocks: [], executionContexts: [] }, scene);
        SerializationTools.ApplyDeserializedState(firstReplacement, globalState);

        expect(globalState.coordinator).toBe(firstReplacement.coordinator);
        expect(globalState.isCoordinatorEditorOwned(firstReplacement.coordinator)).toBe(true);
        expect(hostCoordinator.flowGraphs).toEqual([hostGraph]);
        expect(hostGraph.state).toBe(FlowGraphState.Started);

        hostGraph.stop();
        hostGraph.start();
        expect(hostGraph.state).toBe(FlowGraphState.Started);

        const secondReplacement = await SerializationTools.DeserializeToStateAsync({ rightHanded: true, allBlocks: [], executionContexts: [] }, scene);
        SerializationTools.ApplyDeserializedState(secondReplacement, globalState);

        expect(firstReplacement.coordinator.flowGraphs).toHaveLength(0);
        secondReplacement.coordinator.dispose();
        hostCoordinator.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("tracks whether installed runtime services are scoped to an imported asset", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const globalState = new GlobalState(scene);
        const serializedGraph = { rightHanded: true, allBlocks: [], executionContexts: [] };
        vi.stubGlobal("BABYLON", {
            GLTF2: {
                Loader: {
                    Extensions: {
                        _CaptureKHRInteractivityRuntimeInputDefaults,
                    },
                },
            },
        });

        const importedState = await SerializationTools.DeserializeToStateAsync(serializedGraph, scene, undefined, { sourceFormat: "KHR_interactivity" });
        SerializationTools.ApplyDeserializedState(importedState, globalState);
        expect(globalState.hasImportScopedRuntime).toBe(true);
        await expect(SerializationTools.ExportBabylonFlowGraphGlbAsync(globalState.flowGraph, globalState, scene)).rejects.toThrow(
            "KHR_interactivity graphs use import-scoped runtime services"
        );

        const ordinaryState = await SerializationTools.DeserializeToStateAsync(serializedGraph, scene);
        SerializationTools.ApplyDeserializedState(ordinaryState, globalState);
        expect(globalState.hasImportScopedRuntime).toBe(false);

        ordinaryState.coordinator.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("captures generated defaults for KHR parse-only imports without rebaselining later edits", async () => {
        _RegisterKHRInteractivityRuntime();
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const sourceGLTF = {};
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
        const graphModel = document.graphs[0];
        expect(graphModel.valid).toBe(true);
        const serializedGraph = new InteractivityGraphToFlowGraphParser(
            graphModel.effectiveSource,
            sourceGLTF,
            60,
            graphModel.index,
            undefined,
            graphModel.declarations,
            graphModel.source
        ).serializeToFlowGraph();
        vi.stubGlobal("BABYLON", {
            GLTF2: {
                Loader: {
                    Extensions: {
                        _CaptureKHRInteractivityRuntimeInputDefaults,
                        CreateKHRInteractivityExportPlan,
                    },
                },
            },
        });

        const state = await SerializationTools.DeserializeToStateAsync(serializedGraph, scene, undefined, { sourceFormat: "KHR_interactivity" });
        const globalState = new GlobalState(scene);
        globalState.coordinator = state.coordinator;
        globalState.khrInteractivityImportResult = { document, glTF: sourceGLTF } as any;
        const playAnimation = state.coordinator.flowGraphs[0]
            .getAllBlocks()
            .find((block) => block.metadata?.khrInteractivity?.operation === "variable/interpolate" && block.metadata?.khrInteractivity?.role === 2)!;
        const importedSnapshot = playAnimation.metadata.khrInteractivity.generatedInputDefaults.speed;

        expect(importedSnapshot).toBeDefined();
        expect(SerializationTools.AnalyzeKhrInteractivityExport(globalState)).toMatchObject({
            representable: true,
            nodes: [expect.objectContaining({ operation: "variable/interpolate", classification: "inverse-composite" })],
        });

        (playAnimation.getDataInput("speed") as any)._defaultValue = 2;

        expect(SerializationTools.AnalyzeKhrInteractivityExport(globalState)).toMatchObject({
            representable: false,
            diagnostics: [expect.objectContaining({ code: "INPUT_DEFAULT_UNREPRESENTABLE", socket: "speed" })],
        });
        expect(playAnimation.metadata.khrInteractivity.generatedInputDefaults.speed).toBe(importedSnapshot);

        state.coordinator.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("rejects graph-level KHR provenance without import-scoped runtime services", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const globalState = new GlobalState(scene);
        const serializedGraph = {
            metadata: {
                khrInteractivity: {
                    graphIndex: 0,
                    source: {},
                },
            },
            rightHanded: true,
            allBlocks: [],
            executionContexts: [],
        };

        await expect(SerializationTools.DeserializeToStateAsync(serializedGraph, scene)).rejects.toThrow(
            "KHR_interactivity graphs use import-scoped runtime services and cannot be saved to or reloaded from Flow Graph JSON."
        );

        scene.dispose();
        engine.dispose();
    });

    it("resolves the KHR export plan from the loader UMD namespace", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const globalState = new GlobalState(scene);
        const coordinator = new FlowGraphCoordinator({ scene });
        coordinator.createGraph();
        globalState.coordinator = coordinator;
        globalState.khrInteractivityImportResult = {
            document: { defaultGraphIndex: 0 },
            glTF: {
                extensionsRequired: ["KHR_interactivity", "KHR_draco_mesh_compression", "KHR_node_hoverability"],
            },
        } as any;
        const analysis = { representable: true, nodes: [], diagnostics: [] };
        const plan = { additionalExtensionsUsed: ["KHR_node_hoverability"], analyze: () => analysis };
        const createPlan = vi.fn(() => plan);
        vi.stubGlobal("BABYLON", {
            GLTF2: {
                Loader: {
                    Extensions: {
                        CreateKHRInteractivityExportPlan: createPlan,
                    },
                },
            },
        });

        expect(SerializationTools.AnalyzeKhrInteractivityExport(globalState)).toBe(analysis);
        expect(createPlan).toHaveBeenNthCalledWith(
            1,
            coordinator.flowGraphs,
            expect.objectContaining({
                document: globalState.khrInteractivityImportResult.document,
                sourceGLTF: globalState.khrInteractivityImportResult.glTF,
                required: true,
            })
        );
        expect(createPlan).toHaveBeenNthCalledWith(
            2,
            coordinator.flowGraphs,
            expect.objectContaining({
                additionalExtensionsRequired: ["KHR_node_hoverability"],
            })
        );

        coordinator.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("does not promote optional KHR data or unrelated source requirements", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const globalState = new GlobalState(scene);
        const coordinator = new FlowGraphCoordinator({ scene });
        coordinator.createGraph();
        globalState.coordinator = coordinator;
        globalState.khrInteractivityImportResult = {
            document: { defaultGraphIndex: 0 },
            glTF: { extensionsRequired: ["KHR_draco_mesh_compression"] },
        } as any;
        const analysis = { representable: true, nodes: [], diagnostics: [] };
        const createPlan = vi.fn(() => ({ additionalExtensionsUsed: [], analyze: () => analysis }));
        vi.stubGlobal("BABYLON", {
            GLTF2: {
                Loader: {
                    Extensions: {
                        CreateKHRInteractivityExportPlan: createPlan,
                    },
                },
            },
        });

        expect(SerializationTools.AnalyzeKhrInteractivityExport(globalState)).toBe(analysis);
        expect(createPlan).toHaveBeenCalledTimes(1);
        expect(createPlan).toHaveBeenCalledWith(
            coordinator.flowGraphs,
            expect.objectContaining({
                required: false,
            })
        );
        expect(createPlan.mock.calls[0][1].additionalExtensionsRequired).toBeUndefined();

        coordinator.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("rejects KHR export when the active preview scene no longer owns the import", () => {
        const engine = new NullEngine();
        const importedScene = new Scene(engine);
        const replacementScene = new Scene(engine);
        const globalState = new GlobalState(replacementScene);
        globalState.khrInteractivityImportResult = {
            document: { defaultGraphIndex: 0 },
            glTF: {},
            scene: importedScene,
        } as any;
        (globalState as any).sceneContext = { scene: replacementScene };

        expect(SerializationTools.AnalyzeKhrInteractivityExport(globalState)).toMatchObject({
            representable: false,
            diagnostics: [expect.objectContaining({ message: expect.stringContaining("not the scene that owns") })],
        });

        importedScene.dispose();
        replacementScene.dispose();
        engine.dispose();
    });
});
