import { FlowGraphState } from "core/FlowGraph/flowGraph";
import { FlowGraphMeshIntersectionEventBlock } from "core/FlowGraph/Blocks/Event/flowGraphMeshIntersectionEventBlock.pure";
import { FlowGraphCoordinator } from "core/FlowGraph/flowGraphCoordinator";
import { FlowGraphValidationSeverity } from "core/FlowGraph/flowGraphValidator";
import { NullEngine } from "core/Engines/nullEngine";
import { Mesh } from "core/Meshes/mesh";
import { Scene } from "core/scene";
import { type IKHRInteractivity_Graph } from "babylonjs-gltf2interface";
import { GlobalState } from "flow-graph-editor/globalState";
import { SerializationTools } from "flow-graph-editor/serializationTools";
import { SceneContext } from "flow-graph-editor/sceneContext";
import { _RegisterKHRInteractivityRuntime } from "loaders/glTF/2.0/Extensions/KHR_interactivity.pure";
import { CompositePathToObjectConverter } from "loaders/glTF/2.0/Extensions/compositePathToObjectConverter";
import { InteractivityHostResolver } from "loaders/glTF/2.0/Extensions/KHR_interactivity/interactivityHostResolver";
import { FlowGraphUnsupportedInteractivityBlock } from "loaders/glTF/2.0/Extensions/KHR_interactivity/flowGraphUnsupportedInteractivityBlock";
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
    it("surfaces unsupported KHR blocks and export diagnostics through validation", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const globalState = new GlobalState(scene);
        const coordinator = new FlowGraphCoordinator({ scene });
        const graph = coordinator.createGraph();
        globalState.coordinator = coordinator;
        const unsupported = new FlowGraphUnsupportedInteractivityBlock({
            operation: "EXT_example/event",
            inputValueSockets: [],
            outputValueSockets: [],
            inputFlowSockets: [],
            outputFlowSockets: [],
        });
        graph.addBlock(unsupported);
        globalState.registerEditorBlocksProvider(() => [unsupported]);

        globalState.runValidation();
        expect(globalState.validationResult?.issues).toContainEqual(
            expect.objectContaining({
                severity: FlowGraphValidationSeverity.Warning,
                message: 'KHR_interactivity operation "EXT_example/event" has no runtime implementation and is preserved as an unsupported block.',
                block: unsupported,
            })
        );

        globalState.setExportValidationDiagnostics([{ path: "/graphs/0/nodes/1", message: "Unsupported edit" }]);
        expect(globalState.validationResult?.issues).toContainEqual(
            expect.objectContaining({
                message: "KHR_interactivity export error at /graphs/0/nodes/1: Unsupported edit",
            })
        );

        const replacementCoordinator = new FlowGraphCoordinator({ scene });
        replacementCoordinator.createGraph();
        globalState.coordinator = replacementCoordinator;
        expect(globalState.validationResult).toBeNull();

        coordinator.dispose();
        replacementCoordinator.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("persists coordinator sound asset declarations in editor JSON", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const globalState = new GlobalState(scene);
        const coordinator = new FlowGraphCoordinator({ scene });
        const graph = coordinator.createGraph();
        globalState.coordinator = coordinator;
        (globalState.stateManager as any).storeEditorData = vi.fn();
        vi.spyOn(coordinator, "soundAssets", "get").mockReturnValue([{ name: "click", url: "data:audio/wav;base64,UklGRg==" }]);

        const serialized = JSON.parse(SerializationTools.Serialize(graph, globalState));

        expect(serialized.soundAssets).toEqual([{ name: "click", url: "data:audio/wav;base64,UklGRg==" }]);
        coordinator.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("restores sound assets before parsing editor graphs", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const addSoundAsset = vi.spyOn(FlowGraphCoordinator.prototype, "addSoundAssetAsync").mockResolvedValue({} as any);
        const serialized = {
            soundAssets: [{ name: "click", url: "data:audio/wav;base64,UklGRg==" }],
            _flowGraphs: [{ rightHanded: true, allBlocks: [], executionContexts: [] }],
        };

        const state = await SerializationTools.DeserializeToStateAsync(serialized, scene);

        expect(addSoundAsset).toHaveBeenCalledWith(serialized.soundAssets[0]);
        addSoundAsset.mockRestore();
        state.coordinator.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("reports sound asset load failures without rejecting graph deserialization", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const loadError = new Error("Unsupported audio format");
        const addSoundAsset = vi.spyOn(FlowGraphCoordinator.prototype, "addSoundAssetAsync").mockRejectedValue(loadError);
        const serialized = {
            soundAssets: [{ name: "click", url: "data:audio/invalid;base64,AA==" }],
            _flowGraphs: [{ rightHanded: true, allBlocks: [], executionContexts: [] }],
        };
        const globalState = new GlobalState(scene);
        const showError = vi.fn();
        globalState.stateManager.onErrorMessageDialogRequiredObservable.add(showError);

        const state = await SerializationTools.DeserializeToStateAsync(serialized, scene);
        SerializationTools.ApplyDeserializedState(state, globalState);

        expect(showError).toHaveBeenCalledWith('Could not load sound asset "click": Unsupported audio format', expect.anything());
        addSoundAsset.mockRestore();
        state.coordinator.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("includes sound asset declarations in BABYLON_flow_graph GLB exports", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const globalState = new GlobalState(scene);
        const coordinator = new FlowGraphCoordinator({ scene });
        const graph = coordinator.createGraph();
        const firstMesh = new Mesh("part", scene);
        const secondMesh = new Mesh("part", scene);
        secondMesh.id = firstMesh.id;
        const block = new FlowGraphMeshIntersectionEventBlock();
        const missingBlock = new FlowGraphMeshIntersectionEventBlock();
        const liveBlock = new FlowGraphMeshIntersectionEventBlock();
        graph.addEventBlock(block);
        graph.addEventBlock(missingBlock);
        graph.addEventBlock(liveBlock);
        (block.targetMeshes as any)._defaultValue = [secondMesh];
        const missingReference = { id: "missing", name: "missing", className: "Mesh", uniqueId: firstMesh.uniqueId };
        (missingBlock.targetMeshes as any)._defaultValue = [missingReference];
        (liveBlock.targetMeshes as any)._defaultValue = [firstMesh];
        const context = graph.createContext();
        missingBlock.targetMeshes.setValue([missingReference as any], context);
        globalState.coordinator = coordinator;
        globalState.restoreReferenceProvenance([[firstMesh.uniqueId, { id: "missing", name: "missing", className: "Mesh", idIndex: 0, nameIndex: 0 }]]);
        (globalState.stateManager as any).storeEditorData = vi.fn();
        vi.spyOn(coordinator, "soundAssets", "get").mockReturnValue([{ name: "click", url: "data:audio/wav;base64,UklGRg==" }]);
        const download = vi.spyOn(SerializationTools as any, "_DownloadBlob").mockImplementation(() => {});
        graph.start();
        globalState.snapshotUserVariables();
        graph.stop();
        expect(graph.contextCount).toBe(0);

        await SerializationTools.ExportBabylonFlowGraphGlbAsync(graph, globalState, null);

        const blob = download.mock.calls[0][0] as Blob;
        const file = new File([blob], "flowGraph.glb");
        const serialized = await SerializationTools.ReadFlowGraphFromGlbAsync(file);
        expect(serialized.soundAssets).toEqual([{ name: "click", url: "data:audio/wav;base64,UklGRg==" }]);
        const serializedMissingBlock = serialized.allBlocks.find((candidate: any) => candidate.uniqueId === missingBlock.uniqueId);
        const serializedMissing = serializedMissingBlock.dataInputs.find((input: any) => input.name === "targetMeshes").defaultValue[0];
        expect(serializedMissing.uniqueId).toBeLessThan(0);
        expect(serialized.executionContexts[0]._connectionValues[missingBlock.targetMeshes.uniqueId][0].uniqueId).toBe(serializedMissing.uniqueId);
        expect(serialized.referenceProvenance).toContainEqual([serializedMissing.uniqueId, expect.objectContaining({ id: "missing", name: "missing" })]);
        expect(serialized.referenceProvenance).toContainEqual([firstMesh.uniqueId, expect.objectContaining({ id: "part", name: "part" })]);
        expect((missingBlock.targetMeshes as any)._defaultValue[0].uniqueId).toBe(firstMesh.uniqueId);
        const restoredScene = new Scene(engine);
        const restoredMissing = new Mesh("missing", restoredScene);
        restoredMissing.id = "missing";
        const restoredFirst = new Mesh("part", restoredScene);
        const restoredSecond = new Mesh("part", restoredScene);
        restoredSecond.id = restoredFirst.id;
        const restored = await SerializationTools.DeserializeToStateAsync(serialized, restoredScene);
        const restoredBlock = restored.coordinator.flowGraphs[0].getAllBlocks().find((candidate) => candidate.uniqueId === block.uniqueId) as FlowGraphMeshIntersectionEventBlock;
        const restoredMissingBlock = restored.coordinator.flowGraphs[0]
            .getAllBlocks()
            .find((candidate) => candidate.uniqueId === missingBlock.uniqueId) as FlowGraphMeshIntersectionEventBlock;
        const restoredLiveBlock = restored.coordinator.flowGraphs[0]
            .getAllBlocks()
            .find((candidate) => candidate.uniqueId === liveBlock.uniqueId) as FlowGraphMeshIntersectionEventBlock;
        expect((restoredBlock.targetMeshes as any)._defaultValue).toEqual([restoredSecond]);
        expect((restoredMissingBlock.targetMeshes as any)._defaultValue).toEqual([restoredMissing]);
        expect(restoredMissingBlock.targetMeshes.getValue(restored.coordinator.flowGraphs[0].getContext(0)!)).toEqual([restoredMissing]);
        expect((restoredLiveBlock.targetMeshes as any)._defaultValue).toEqual([restoredFirst]);

        download.mockRestore();
        restored.coordinator.dispose();
        restoredScene.dispose();
        coordinator.dispose();
        scene.dispose();
        engine.dispose();
    });

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

    it("keeps the retained source format stable while reading the file asynchronously", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const globalState = new GlobalState(scene);
        globalState.sceneContext = new SceneContext(scene, false);
        const coordinator = new FlowGraphCoordinator({ scene });
        coordinator.createGraph();
        globalState.coordinator = coordinator;
        const extension = { graphs: [{}] };
        const asset = { asset: { version: "2.0" }, extensionsUsed: ["KHR_interactivity"], extensions: { KHR_interactivity: extension } };
        globalState.khrInteractivityImportResult = {
            assetIndex: 0,
            document: CreateKHRInteractivityDocument(extension),
            graphs: [],
            glTF: asset,
            pathConverter: new CompositePathToObjectConverter([], {
                convert: () => {
                    throw new Error("This graph has no pointer inputs.");
                },
            }),
            hostResolver: new InteractivityHostResolver(),
        };
        const bytes = new TextEncoder().encode(JSON.stringify(asset));
        const file = new File([bytes], "original.gltf");
        globalState.sourceGltf = { file, externalResourceUris: [] };
        vi.spyOn(file, "arrayBuffer").mockImplementation(async () => {
            globalState.sourceGltf = null;
            globalState.sourceGlb = {
                file: new File([], "replacement.glb"),
                nodeCount: 0,
                hasAnimations: false,
                authoredBehavior: false,
                externalResourceUris: [],
            };
            return bytes.buffer;
        });
        const analysis = { representable: true, nodes: [], diagnostics: [] };
        vi.stubGlobal("BABYLON", {
            GLTF2: {
                Loader: {
                    Extensions: {
                        CreateKHRInteractivityExportPlan: () => ({
                            additionalExtensionsUsed: [],
                            additionalExtensionsRequired: [],
                            analyze: () => analysis,
                            buildWithSourceIndices: () => extension,
                        }),
                    },
                },
            },
        });
        const captureDownload = vi.fn((_blob: Blob) => {
            throw new Error("Download captured.");
        });
        vi.stubGlobal("URL", { createObjectURL: captureDownload });

        await expect(SerializationTools.ExportKhrInteractivityAsync(globalState, "gltf")).rejects.toThrow("Download captured.");
        expect(captureDownload).toHaveBeenCalledTimes(1);
        expect(await captureDownload.mock.calls[0][0].text()).toBe(JSON.stringify(asset));

        globalState.sceneContext.dispose();
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
