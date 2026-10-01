import { FlowGraphState } from "core/FlowGraph/flowGraph";
import { FlowGraphCoordinator } from "core/FlowGraph/flowGraphCoordinator";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { type IKHRInteractivity_Graph } from "babylonjs-gltf2interface";
import { SetVariableAuthoringValue, RenameVariable, DeleteVariable } from "flow-graph-editor/variableUtils";
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

describe("contact audio source graph baseline", () => {
    it("detects a reparsed legacy graph even when its serialized graph ID and block definitions are unchanged", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const state = new GlobalState(scene);
        const serialized = {
            uniqueId: "same-graph-id",
            name: "legacy",
            rightHanded: true,
            allBlocks: [],
            executionContexts: [{ _userVariables: { speed: 1 }, _connectionValues: {} }],
        };
        const original = await SerializationTools.DeserializeToStateAsync(serialized, scene);
        SerializationTools.ApplyDeserializedState(original, state);
        const source = { file: new Blob(["original legacy source"]), nodeCount: 0 } as any;
        state.sourceGlb = source;
        const baseline = SerializationTools.CaptureSourceGraphState(state);
        const replacement = await SerializationTools.DeserializeToStateAsync(
            { ...serialized, executionContexts: [{ _userVariables: { speed: 2 }, _connectionValues: {} }] },
            scene
        );
        SerializationTools.ApplyDeserializedState(replacement, state);
        try {
            expect(state.flowGraph.uniqueId).toBe("same-graph-id");
            expect(state.sourceGlb).toBe(source);
            await expect(SerializationTools.BuildSourceForContactAudioAsync(state, baseline), "reparsing must not erase the legacy edit guard").rejects.toThrow(
                "canonical KHR_interactivity"
            );
            expect(state.flowGraph.getContext(0).getVariable("speed")).toBe(2);
        } finally {
            replacement.coordinator.dispose();
            original.coordinator.dispose();
            scene.dispose();
            engine.dispose();
        }
    });
    it("retains authored edit detection through playback context recreation", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const state = new GlobalState(scene);
        const coordinator = new FlowGraphCoordinator({ scene });
        state.coordinator = coordinator;
        state.flowGraph = coordinator.createGraph();
        const context = state.flowGraph.createContext();
        context.setVariable("speed", 1);
        const baseline = SerializationTools.CaptureSourceGraphState(state);
        SetVariableAuthoringValue(state.flowGraph, context, "speed", 2);
        const authored = SerializationTools.CaptureSourceGraphState(state);
        try {
            state.flowGraph.start();
            state.flowGraph.getContext(0).setVariable("speed", 99);
            state.snapshotUserVariables();
            state.flowGraph.stop();
            state.restoreSavedContexts();
            expect(SerializationTools.CaptureSourceGraphState(state), "stop/reset must not clear the explicit authored revision").toEqual(authored);
            expect(authored).not.toEqual(baseline);
        } finally {
            coordinator.dispose();
            scene.dispose();
            engine.dispose();
        }
    });
    it("captures an empty editor deterministically", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        try {
            expect(SerializationTools.CaptureSourceGraphState(new GlobalState(scene))).toEqual({ definition: "[]", canonical: null });
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });

    it.each(["value", "type", "add", "rename", "delete"])("retains a legacy source and rejects an unsupported %s-only edit", async (edit) => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const state = new GlobalState(scene);
        const coordinator = new FlowGraphCoordinator({ scene });
        state.coordinator = coordinator;
        state.flowGraph = coordinator.createGraph();
        const inactive = coordinator.createGraph();
        inactive.createContext();
        const context = inactive.createContext();
        context.setVariable("speed", 1);
        context.setVariableType("speed", "number");
        const source = { file: new Blob(["original legacy graph"]), nodeCount: 0 } as any;
        state.sourceGlb = source;
        const baseline = SerializationTools.CaptureSourceGraphState(state);
        expect(baseline.canonical).toBeNull();
        if (edit === "value") SetVariableAuthoringValue(inactive, context, "speed", 2);
        if (edit === "type") {
            context.setVariableType("speed", "string");
            SetVariableAuthoringValue(inactive, context, "speed", "1");
        }
        if (edit === "add") SetVariableAuthoringValue(inactive, context, "new", 3);
        if (edit === "rename") RenameVariable(inactive, "speed", "velocity");
        if (edit === "delete") DeleteVariable(inactive, "speed");
        try {
            await expect(
                SerializationTools.BuildSourceForContactAudioAsync(state, baseline),
                "legacy authored variables must not be silently replaced by source bytes"
            ).rejects.toThrow("graph imported from a canonical KHR_interactivity glTF or GLB");
            expect(state.sourceGlb).toBe(source);
            expect(state.coordinator).toBe(coordinator);
            expect(SerializationTools.CaptureSourceGraphState(state)).not.toEqual(baseline);
        } finally {
            coordinator.dispose();
            scene.dispose();
            engine.dispose();
        }
    });
    it("tracks an active graph without a coordinator and ignores execution-only variable changes", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const state = new GlobalState(scene);
        const coordinator = new FlowGraphCoordinator({ scene });
        state.flowGraph = coordinator.createGraph();
        state.coordinator = null;
        const context = state.flowGraph.createContext();
        context.setVariable("speed", 1);
        const baseline = SerializationTools.CaptureSourceGraphState(state);
        try {
            expect(typeof baseline.definition, "an active graph always has a deterministic string baseline").toBe("string");
            context.setVariable("speed", 10);
            expect(SerializationTools.CaptureSourceGraphState(state)).toEqual(baseline);
            SetVariableAuthoringValue(state.flowGraph, context, "speed", 2);
            expect(SerializationTools.CaptureSourceGraphState(state), "coordinator-less authoring must be detected").not.toEqual(baseline);
        } finally {
            coordinator.dispose();
            scene.dispose();
            engine.dispose();
        }
    });
});
