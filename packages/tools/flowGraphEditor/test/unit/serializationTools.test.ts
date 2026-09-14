import { FlowGraphState } from "core/FlowGraph/flowGraph";
import { FlowGraphCoordinator } from "core/FlowGraph/flowGraphCoordinator";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { GlobalState } from "flow-graph-editor/globalState";
import { SerializationTools } from "flow-graph-editor/serializationTools";
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

        const importedState = await SerializationTools.DeserializeToStateAsync(serializedGraph, scene, undefined, { sourceFormat: "KHR_interactivity" });
        SerializationTools.ApplyDeserializedState(importedState, globalState);
        expect(globalState.hasImportScopedRuntime).toBe(true);

        const ordinaryState = await SerializationTools.DeserializeToStateAsync(serializedGraph, scene);
        SerializationTools.ApplyDeserializedState(ordinaryState, globalState);
        expect(globalState.hasImportScopedRuntime).toBe(false);

        ordinaryState.coordinator.dispose();
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
});
