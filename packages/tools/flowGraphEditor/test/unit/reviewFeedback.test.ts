import { NullEngine } from "core/Engines/nullEngine";
import { FlowGraphMeshIntersectionEventBlock } from "core/FlowGraph/Blocks/Event/flowGraphMeshIntersectionEventBlock.pure";
import { FlowGraphSceneReadyEventBlock } from "core/FlowGraph/Blocks/Event/flowGraphSceneReadyEventBlock.pure";
import { FlowGraphSoundEndedEventBlock } from "core/FlowGraph/Blocks/Event/flowGraphSoundEndedEventBlock.pure";
import { FlowGraphPlaySoundBlock } from "core/FlowGraph/Blocks/Execution/Audio/flowGraphPlaySoundBlock.pure";
import { FlowGraphCoordinator } from "core/FlowGraph/flowGraphCoordinator";
import { type AbstractMesh } from "core/Meshes/abstractMesh";
import { Observable } from "core/Misc/observable";
import { Mesh } from "core/Meshes/mesh";
import { Scene } from "core/scene";
import { LogEntry, LogEntryBuffer } from "flow-graph-editor/components/log/logComponent";
import { ImportSoundAssetFileAsync } from "flow-graph-editor/components/soundAssets/soundAssetsPanelComponent";
import { CreateIntersectionPlaySoundTemplate } from "flow-graph-editor/compositeTemplates";
import { ApplyFlowGraphHistorySnapshot, CreateFlowGraphHistorySnapshot, GraphEditor } from "flow-graph-editor/graphEditor";
import {
    GetSourceMeshPickerOptions,
    GetTargetMeshPickerOptions,
    MeshIntersectionPropertyComponent,
} from "flow-graph-editor/graphSystem/properties/meshIntersectionPropertyComponent";
import { PointerEventPropertyComponent } from "flow-graph-editor/graphSystem/properties/pointerEventPropertyComponent";
import { GlobalState } from "flow-graph-editor/globalState";
import { SceneContext } from "flow-graph-editor/sceneContext";
import { SerializationTools } from "flow-graph-editor/serializationTools";
import { HistoryStack } from "shared-ui-components/historyStack";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("review feedback regressions", () => {
    it("does not replace unresolved intersection defaults when the property panel renders", () => {
        const source = { name: "part", uniqueId: 1 } as AbstractMesh;
        const target = { name: "part", uniqueId: 2 } as AbstractMesh;
        const sameNameMesh = { name: "part", uniqueId: 3 } as AbstractMesh;
        const block = new FlowGraphMeshIntersectionEventBlock();
        (block.sourceMesh as any)._defaultValue = source;
        (block.targetMeshes as any)._defaultValue = [target];
        const component = new MeshIntersectionPropertyComponent({
            nodeData: { data: block },
            stateManager: { data: { sceneContext: { meshes: [sameNameMesh] } } },
        } as any);

        component.render();

        expect((block.sourceMesh as any)._defaultValue).toBe(source);
        expect((block.targetMeshes as any)._defaultValue).toEqual([target]);
    });

    it("keeps unresolved intersection targets when adding a live target", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const collidingLive = new Mesh("part", scene);
        const addedLive = new Mesh("added", scene);
        const unresolved = { id: collidingLive.id, name: collidingLive.name, className: "Mesh", uniqueId: collidingLive.uniqueId } as AbstractMesh;
        const coordinator = new FlowGraphCoordinator({ scene });
        const graph = coordinator.createGraph();
        const block = new FlowGraphMeshIntersectionEventBlock();
        graph.addEventBlock(block);
        (block.targetMeshes as any)._defaultValue = [unresolved];
        const globalState = new GlobalState(scene);
        globalState.sceneContext = new SceneContext(scene, false);
        globalState.coordinator = coordinator;
        const options = GetTargetMeshPickerOptions([collidingLive, addedLive], [unresolved]);
        const selected = new Set([`unresolved:0:${unresolved.uniqueId}`, `live:${addedLive.uniqueId}`]);
        const nextValue = options.filter((option) => selected.has(option.key)).map((option) => option.mesh);
        globalState.setUnconnectedInputValue(block.targetMeshes, nextValue);

        expect((block.targetMeshes as any)._defaultValue).toEqual([unresolved, addedLive]);

        globalState.dispose();
        coordinator.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("keeps an unresolved source distinct from a colliding live mesh", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const live = new Mesh("part", scene);
        const unresolved = { id: live.id, name: live.name, className: "Mesh", uniqueId: live.uniqueId } as AbstractMesh;

        const options = GetSourceMeshPickerOptions([live], unresolved);

        expect(options).toEqual([
            { key: "none", label: "(none)" },
            { key: `unresolved:${unresolved.uniqueId}`, mesh: unresolved, label: "part (unavailable)" },
            { key: `live:${live.uniqueId}`, mesh: live, label: "part" },
        ]);

        scene.dispose();
        engine.dispose();
    });

    it("distinguishes live mesh picker labels when names collide", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const first = new Mesh("part", scene);
        const second = new Mesh("part", scene);

        const sourceOptions = GetSourceMeshPickerOptions([first, second], first);
        const targetOptions = GetTargetMeshPickerOptions([first, second], [second]);

        expect(sourceOptions.find((option) => option.mesh === first)?.label).toBe(`part (id ${first.uniqueId})`);
        expect(sourceOptions.find((option) => option.mesh === second)?.label).toBe(`part (id ${second.uniqueId})`);
        expect(targetOptions.find((option) => option.mesh === first)?.label).toBe(`part (id ${first.uniqueId})`);
        expect(targetOptions.find((option) => option.mesh === second)?.label).toBe(`part (id ${second.uniqueId})`);

        scene.dispose();
        engine.dispose();
    });

    it("refreshes the intersection property panel when the scene context changes in place", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const sceneContext = new SceneContext(scene, false);
        const globalState = new GlobalState(scene);
        globalState.sceneContext = sceneContext;
        const component = new MeshIntersectionPropertyComponent({
            nodeData: { data: new FlowGraphMeshIntersectionEventBlock() },
            stateManager: { data: globalState },
        } as any);
        const forceUpdate = vi.spyOn(component, "forceUpdate").mockImplementation(() => {});
        component.componentDidMount();

        sceneContext.refresh();

        expect(forceUpdate).toHaveBeenCalledOnce();
        component.componentWillUnmount();
        globalState.dispose();
        sceneContext.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("keeps live context provenance when serialized snapshots contain the same reference", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const first = new Mesh("part", scene);
        const second = new Mesh("part", scene);
        second.id = first.id;
        const coordinator = new FlowGraphCoordinator({ scene });
        const graph = coordinator.createGraph();
        const block = new FlowGraphMeshIntersectionEventBlock();
        graph.addEventBlock(block);
        const context = graph.createContext();
        block.targetMeshes.setValue([second], context);
        const globalState = new GlobalState(scene);
        globalState.coordinator = coordinator;
        (globalState.stateManager as any).storeEditorData = vi.fn();

        const serialized = JSON.parse(SerializationTools.Serialize(graph, globalState));
        const newScene = new Scene(engine);
        const newFirst = new Mesh("part", newScene);
        const newSecond = new Mesh("part", newScene);
        newSecond.id = newFirst.id;
        const restored = await SerializationTools.DeserializeToStateAsync(serialized, newScene);
        const restoredBlock = restored.coordinator.flowGraphs[0]
            .getAllBlocks()
            .find((candidate) => candidate.getClassName() === block.getClassName()) as FlowGraphMeshIntersectionEventBlock;

        expect(restoredBlock.targetMeshes.getValue(restored.coordinator.flowGraphs[0].getContext(0)!)).toEqual([newSecond]);

        restored.coordinator.dispose();
        globalState.dispose();
        coordinator.dispose();
        newScene.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("keeps inactive context snapshots serialized after scene replacement", () => {
        const engine = new NullEngine();
        const oldScene = new Scene(engine);
        const oldFirst = new Mesh("part", oldScene);
        const oldSecond = new Mesh("part", oldScene);
        oldSecond.id = oldFirst.id;
        const coordinator = new FlowGraphCoordinator({ scene: oldScene });
        const activeGraph = coordinator.createGraph();
        const inactiveGraph = coordinator.createGraph();
        const inactiveBlock = new FlowGraphMeshIntersectionEventBlock();
        inactiveGraph.addEventBlock(inactiveBlock);
        const context = inactiveGraph.createContext();
        inactiveBlock.targetMeshes.setValue([oldSecond], context);
        const globalState = new GlobalState(oldScene);
        globalState.sceneContext = new SceneContext(oldScene, false);
        globalState.coordinator = coordinator;
        globalState.activeGraphIndex = 1;
        globalState.snapshotUserVariables();
        globalState.activeGraphIndex = 0;
        (globalState.stateManager as any).storeEditorData = vi.fn();

        const newScene = new Scene(engine);
        const newFirst = new Mesh("part", newScene);
        const newSecond = new Mesh("part", newScene);
        newSecond.id = newFirst.id;
        const replacementContext = new SceneContext(newScene, false);
        globalState.sceneContext = replacementContext;
        globalState.onSceneContextChanged.notifyObservers(replacementContext);

        expect(() => SerializationTools.Serialize(activeGraph, globalState)).not.toThrow();
        const snapshots = globalState.getContextSnapshotsForGraph(inactiveGraph.uniqueId)!;
        expect(snapshots[0]._connectionValues[inactiveBlock.targetMeshes.uniqueId][0]).toMatchObject({
            uniqueId: newSecond.uniqueId,
            className: newSecond.getClassName(),
        });
        expect(snapshots[0]._connectionValues[inactiveBlock.targetMeshes.uniqueId][0]).not.toBe(newSecond);

        globalState.dispose();
        replacementContext.dispose();
        coordinator.dispose();
        newScene.dispose();
        oldScene.dispose();
        engine.dispose();
    });

    it("uses cached provenance after old referenced nodes are disposed", async () => {
        const engine = new NullEngine();
        const oldScene = new Scene(engine);
        const oldFirst = new Mesh("part", oldScene);
        const oldSecond = new Mesh("part", oldScene);
        oldSecond.id = oldFirst.id;
        const coordinator = new FlowGraphCoordinator({ scene: oldScene });
        const graph = coordinator.createGraph();
        const block = new FlowGraphMeshIntersectionEventBlock();
        graph.addEventBlock(block);
        (block.targetMeshes as any)._defaultValue = [oldSecond];
        const globalState = new GlobalState(oldScene);
        globalState.sceneContext = new SceneContext(oldScene, false);
        globalState.coordinator = coordinator;
        (globalState.stateManager as any).storeEditorData = vi.fn();

        const intermediateScene = new Scene(engine);
        const intermediateFirst = new Mesh("part", intermediateScene);
        intermediateFirst.id = oldFirst.id;
        const intermediateContext = new SceneContext(intermediateScene, false);
        globalState.sceneContext = intermediateContext;
        globalState.onSceneContextChanged.notifyObservers(intermediateContext);
        oldFirst.dispose();
        oldSecond.dispose();
        const serialized = JSON.parse(SerializationTools.Serialize(graph, globalState));

        const restoredScene = new Scene(engine);
        const restoredFirst = new Mesh("part", restoredScene);
        const restoredSecond = new Mesh("part", restoredScene);
        restoredSecond.id = restoredFirst.id;
        const restored = await SerializationTools.DeserializeToStateAsync(serialized, restoredScene);
        const restoredBlock = restored.coordinator.flowGraphs[0]
            .getAllBlocks()
            .find((candidate) => candidate.getClassName() === block.getClassName()) as FlowGraphMeshIntersectionEventBlock;

        expect((restoredBlock.targetMeshes as any)._defaultValue).toEqual([restoredSecond]);

        restored.coordinator.dispose();
        globalState.dispose();
        coordinator.dispose();
        intermediateContext.dispose();
        restoredScene.dispose();
        intermediateScene.dispose();
        engine.dispose();
    });

    it("rebinds and saves disconnected block references", async () => {
        const engine = new NullEngine();
        const oldScene = new Scene(engine);
        const oldFirst = new Mesh("part", oldScene);
        const oldSecond = new Mesh("part", oldScene);
        oldSecond.id = oldFirst.id;
        const coordinator = new FlowGraphCoordinator({ scene: oldScene });
        const graph = coordinator.createGraph();
        const block = new FlowGraphGetPropertyBlock<any, any>({ object: oldSecond, propertyName: "name" });
        graph.addBlock(block);
        const globalState = new GlobalState(oldScene);
        globalState.sceneContext = new SceneContext(oldScene, false);
        globalState.coordinator = coordinator;
        (globalState.stateManager as any).storeEditorData = vi.fn();

        const newScene = new Scene(engine);
        const newFirst = new Mesh("part", newScene);
        const newSecond = new Mesh("part", newScene);
        newSecond.id = newFirst.id;
        const replacementContext = new SceneContext(newScene, false);
        globalState.sceneContext = replacementContext;
        globalState.onSceneContextChanged.notifyObservers(replacementContext);
        expect((block.object as any)._defaultValue).toBe(newSecond);

        const serialized = JSON.parse(SerializationTools.Serialize(graph, globalState));
        const restoredScene = new Scene(engine);
        const restoredFirst = new Mesh("part", restoredScene);
        const restoredSecond = new Mesh("part", restoredScene);
        restoredSecond.id = restoredFirst.id;
        const restored = await SerializationTools.DeserializeToStateAsync(serialized, restoredScene);
        const restoredBlock = restored.coordinator.flowGraphs[0].getAllBlocks().find((candidate) => candidate.getClassName() === block.getClassName()) as FlowGraphGetPropertyBlock<
            any,
            any
        >;

        expect((restoredBlock.object as any)._defaultValue).toBe(restoredSecond);

        restored.coordinator.dispose();
        globalState.dispose();
        coordinator.dispose();
        replacementContext.dispose();
        restoredScene.dispose();
        newScene.dispose();
        oldScene.dispose();
        engine.dispose();
    });

    it("rebinds connected blocks that were not explicitly registered", () => {
        const engine = new NullEngine();
        const oldScene = new Scene(engine);
        const oldFirst = new Mesh("part", oldScene);
        const oldSecond = new Mesh("part", oldScene);
        oldSecond.id = oldFirst.id;
        const coordinator = new FlowGraphCoordinator({ scene: oldScene });
        const graph = coordinator.createGraph();
        const eventBlock = new FlowGraphSceneReadyEventBlock();
        const playBlock = new FlowGraphPlaySoundBlock();
        const getBlock = new FlowGraphGetPropertyBlock<string, any>({ object: oldSecond, propertyName: "name" });
        graph.addEventBlock(eventBlock);
        eventBlock.out.connectTo(playBlock.in);
        getBlock.value.connectTo(playBlock.sound);
        const globalState = new GlobalState(oldScene);
        globalState.sceneContext = new SceneContext(oldScene, false);
        globalState.coordinator = coordinator;
        (globalState.stateManager as any).storeEditorData = vi.fn();

        const newScene = new Scene(engine);
        const newFirst = new Mesh("part", newScene);
        const newSecond = new Mesh("part", newScene);
        newSecond.id = newFirst.id;
        const replacementContext = new SceneContext(newScene, false);
        globalState.sceneContext = replacementContext;
        globalState.onSceneContextChanged.notifyObservers(replacementContext);

        expect((getBlock.object as any)._defaultValue).toBe(newSecond);
        const serialized = JSON.parse(SerializationTools.Serialize(graph, globalState));
        expect(serialized.referenceProvenance).toContainEqual([newSecond.uniqueId, expect.objectContaining({ idIndex: 1, nameIndex: 1 })]);

        globalState.dispose();
        replacementContext.dispose();
        coordinator.dispose();
        newScene.dispose();
        oldScene.dispose();
        engine.dispose();
    });

    it("keeps distinct provenance entries when restored and live references share a unique id", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const liveMesh = new Mesh("live", scene);
        const sharedUniqueId = liveMesh.uniqueId;
        const coordinator = new FlowGraphCoordinator({ scene });
        const graph = coordinator.createGraph();
        const missingBlock = new FlowGraphMeshIntersectionEventBlock();
        const secondMissingBlock = new FlowGraphMeshIntersectionEventBlock();
        const liveBlock = new FlowGraphMeshIntersectionEventBlock();
        graph.addEventBlock(missingBlock);
        graph.addEventBlock(secondMissingBlock);
        graph.addEventBlock(liveBlock);
        (missingBlock.targetMeshes as any)._defaultValue = [{ id: "missing", name: "missing", className: "Mesh", uniqueId: sharedUniqueId }];
        (secondMissingBlock.targetMeshes as any)._defaultValue = [{ id: "missing", name: "missing", className: "Mesh", uniqueId: sharedUniqueId }];
        (liveBlock.targetMeshes as any)._defaultValue = [liveMesh];
        const globalState = new GlobalState(scene);
        globalState.coordinator = coordinator;
        globalState.restoreReferenceProvenance([[sharedUniqueId, { id: "missing", name: "missing", className: "Mesh", idIndex: 0, nameIndex: 0 }]]);
        (globalState.stateManager as any).storeEditorData = vi.fn();

        const serialized = JSON.parse(SerializationTools.Serialize(graph, globalState));
        const serializedMissingBlock = serialized._flowGraphs[0].allBlocks.find((candidate: any) => candidate.uniqueId === missingBlock.uniqueId);
        const missingSerializedValue = serializedMissingBlock.dataInputs.find((input: any) => input.name === "targetMeshes").defaultValue[0];
        const serializedSecondMissingBlock = serialized._flowGraphs[0].allBlocks.find((candidate: any) => candidate.uniqueId === secondMissingBlock.uniqueId);
        const secondMissingSerializedValue = serializedSecondMissingBlock.dataInputs.find((input: any) => input.name === "targetMeshes").defaultValue[0];
        expect(missingSerializedValue.uniqueId).toBeLessThan(0);
        expect(missingSerializedValue.uniqueId).not.toBe(sharedUniqueId);
        expect(secondMissingSerializedValue.uniqueId).toBe(missingSerializedValue.uniqueId);
        expect((missingBlock.targetMeshes as any)._defaultValue[0].uniqueId).toBe(sharedUniqueId);
        expect((secondMissingBlock.targetMeshes as any)._defaultValue[0].uniqueId).toBe(sharedUniqueId);
        expect(serialized.referenceProvenance).toContainEqual([missingSerializedValue.uniqueId, expect.objectContaining({ id: "missing", name: "missing" })]);
        expect(serialized.referenceProvenance).toContainEqual([sharedUniqueId, expect.objectContaining({ id: "live", name: "live" })]);
        expect(serialized.referenceProvenance.filter(([uniqueId]: [number]) => uniqueId === sharedUniqueId)).toHaveLength(1);
        const restoredScene = new Scene(engine);
        const restoredMissing = new Mesh("missing", restoredScene);
        restoredMissing.id = "missing";
        const restoredLive = new Mesh("live", restoredScene);
        restoredLive.id = liveMesh.id;
        const restored = await SerializationTools.DeserializeToStateAsync(serialized, restoredScene);
        const restoredMissingBlock = restored.coordinator.flowGraphs[0]
            .getAllBlocks()
            .find((candidate) => candidate.uniqueId === missingBlock.uniqueId) as FlowGraphMeshIntersectionEventBlock;
        const restoredLiveBlock = restored.coordinator.flowGraphs[0]
            .getAllBlocks()
            .find((candidate) => candidate.uniqueId === liveBlock.uniqueId) as FlowGraphMeshIntersectionEventBlock;
        const restoredSecondMissingBlock = restored.coordinator.flowGraphs[0]
            .getAllBlocks()
            .find((candidate) => candidate.uniqueId === secondMissingBlock.uniqueId) as FlowGraphMeshIntersectionEventBlock;

        expect((restoredMissingBlock.targetMeshes as any)._defaultValue).toEqual([restoredMissing]);
        expect((restoredSecondMissingBlock.targetMeshes as any)._defaultValue).toEqual([restoredMissing]);
        expect((restoredLiveBlock.targetMeshes as any)._defaultValue).toEqual([restoredLive]);

        restored.coordinator.dispose();
        globalState.dispose();
        coordinator.dispose();
        restoredScene.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("does not overwrite a restored context override that shares a live numeric id", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const liveDefault = new Mesh("live-default", scene);
        const replacement = new Mesh("replacement", scene);
        const coordinator = new FlowGraphCoordinator({ scene });
        const graph = coordinator.createGraph();
        const block = new FlowGraphMeshIntersectionEventBlock();
        graph.addEventBlock(block);
        (block.targetMeshes as any)._defaultValue = [liveDefault];
        const inheritedContext = graph.createContext();
        const overrideContext = graph.createContext();
        block.targetMeshes.setValue([liveDefault], inheritedContext);
        const unresolvedOverride = { id: "missing", name: "missing", className: "Mesh", uniqueId: liveDefault.uniqueId };
        block.targetMeshes.setValue([unresolvedOverride as any], overrideContext);
        const globalState = new GlobalState(scene);
        globalState.coordinator = coordinator;
        globalState.restoreReferenceProvenance([[liveDefault.uniqueId, { id: "missing", name: "missing", className: "Mesh", idIndex: 0, nameIndex: 0 }]]);

        globalState.setUnconnectedInputValue(block.targetMeshes, [replacement]);

        expect(block.targetMeshes.getValue(inheritedContext)).toEqual([replacement]);
        expect(block.targetMeshes.getValue(overrideContext)).toEqual([unresolvedOverride]);

        globalState.dispose();
        coordinator.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("uses occurrence identity when editing stopped context snapshots", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const liveDefault = new Mesh("part", scene);
        const replacement = new Mesh("replacement", scene);
        const coordinator = new FlowGraphCoordinator({ scene });
        const graph = coordinator.createGraph();
        const block = new FlowGraphMeshIntersectionEventBlock();
        graph.addEventBlock(block);
        (block.targetMeshes as any)._defaultValue = [liveDefault];
        const inheritedContext = graph.createContext();
        const overrideContext = graph.createContext();
        block.targetMeshes.setValue([liveDefault], inheritedContext);
        const unresolvedOverride = { id: liveDefault.id, name: liveDefault.name, className: "Mesh", uniqueId: liveDefault.uniqueId };
        block.targetMeshes.setValue([unresolvedOverride as any], overrideContext);
        const globalState = new GlobalState(scene);
        globalState.coordinator = coordinator;
        (globalState.stateManager as any).storeEditorData = vi.fn();
        globalState.restoreReferenceProvenance([[liveDefault.uniqueId, { id: liveDefault.id, name: liveDefault.name, className: "Mesh", idIndex: 1, nameIndex: 1 }]]);
        graph.start();
        globalState.snapshotUserVariables();
        graph.stop();
        expect(graph.contextCount).toBe(0);

        globalState.setUnconnectedInputValue(block.targetMeshes, [replacement]);

        const snapshots = globalState.getContextSnapshotsForGraph(graph.uniqueId)!;
        expect(snapshots[0]._connectionValues[block.targetMeshes.uniqueId]).toEqual([expect.objectContaining({ uniqueId: replacement.uniqueId, name: replacement.name })]);
        expect(snapshots[1]._connectionValues[block.targetMeshes.uniqueId]).toEqual([unresolvedOverride]);

        const serialized = JSON.parse(SerializationTools.Serialize(graph, globalState));
        const restoredScene = new Scene(engine);
        const restoredFirst = new Mesh("part", restoredScene);
        const restoredSecond = new Mesh("part", restoredScene);
        restoredSecond.id = restoredFirst.id;
        const restoredReplacement = new Mesh("replacement", restoredScene);
        const restored = await SerializationTools.DeserializeToStateAsync(serialized, restoredScene);
        const restoredBlock = restored.coordinator.flowGraphs[0].getAllBlocks().find((candidate) => candidate.uniqueId === block.uniqueId) as FlowGraphMeshIntersectionEventBlock;
        expect(restoredBlock.targetMeshes.getValue(restored.coordinator.flowGraphs[0].getContext(0)!)).toEqual([restoredReplacement]);
        expect(restoredBlock.targetMeshes.getValue(restored.coordinator.flowGraphs[0].getContext(1)!)).toEqual([restoredSecond]);

        restored.coordinator.dispose();
        restoredScene.dispose();
        globalState.dispose();
        coordinator.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("registers captured context reference occurrences inside connection dictionaries", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const liveFirst = new Mesh("part", scene);
        const liveSecond = new Mesh("part", scene);
        liveSecond.id = liveFirst.id;
        const coordinator = new FlowGraphCoordinator({ scene });
        const graph = coordinator.createGraph();
        const block = new FlowGraphMeshIntersectionEventBlock();
        graph.addEventBlock(block);
        (block.targetMeshes as any)._defaultValue = [liveFirst];
        const context = graph.createContext();
        block.targetMeshes.setValue([liveFirst], context);
        const globalState = new GlobalState(scene);
        globalState.coordinator = coordinator;
        globalState.restoreReferenceProvenance([[liveFirst.uniqueId, { id: liveSecond.id, name: liveSecond.name, className: "Mesh", idIndex: 1, nameIndex: 1 }]]);
        (globalState.stateManager as any).storeEditorData = vi.fn();
        graph.start();
        globalState.snapshotUserVariables();
        graph.stop();

        const serialized = JSON.parse(SerializationTools.Serialize(graph, globalState));
        const restoredScene = new Scene(engine);
        const restoredFirst = new Mesh("part", restoredScene);
        const restoredSecond = new Mesh("part", restoredScene);
        restoredSecond.id = restoredFirst.id;
        const restored = await SerializationTools.DeserializeToStateAsync(serialized, restoredScene);
        const restoredBlock = restored.coordinator.flowGraphs[0].getAllBlocks().find((candidate) => candidate.uniqueId === block.uniqueId) as FlowGraphMeshIntersectionEventBlock;

        expect(restoredBlock.targetMeshes.getValue(restored.coordinator.flowGraphs[0].getContext(0)!)).toEqual([restoredFirst]);

        restored.coordinator.dispose();
        restoredScene.dispose();
        globalState.dispose();
        coordinator.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("refreshes captured context provenance after duplicate ordinals change", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const first = new Mesh("part", scene);
        const second = new Mesh("part", scene);
        second.id = first.id;
        const coordinator = new FlowGraphCoordinator({ scene });
        const graph = coordinator.createGraph();
        const block = new FlowGraphMeshIntersectionEventBlock();
        graph.addEventBlock(block);
        const context = graph.createContext();
        block.targetMeshes.setValue([second], context);
        const globalState = new GlobalState(scene);
        globalState.coordinator = coordinator;
        (globalState.stateManager as any).storeEditorData = vi.fn();
        graph.start();
        globalState.snapshotUserVariables();
        graph.stop();
        first.dispose();
        const appended = new Mesh("part", scene);
        appended.id = second.id;

        const serialized = JSON.parse(SerializationTools.Serialize(graph, globalState));
        const restored = await SerializationTools.DeserializeToStateAsync(serialized, scene);
        const restoredBlock = restored.coordinator.flowGraphs[0].getAllBlocks().find((candidate) => candidate.uniqueId === block.uniqueId) as FlowGraphMeshIntersectionEventBlock;

        expect(restoredBlock.targetMeshes.getValue(restored.coordinator.flowGraphs[0].getContext(0)!)).toEqual([second]);
        expect(restoredBlock.targetMeshes.getValue(restored.coordinator.flowGraphs[0].getContext(0)!)).not.toEqual([appended]);

        restored.coordinator.dispose();
        globalState.dispose();
        coordinator.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("uses runtime snapshot decisions from the graph being edited", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const coordinator = new FlowGraphCoordinator({ scene });
        const firstGraph = coordinator.createGraph();
        const secondGraph = coordinator.createGraph();
        const firstBlock = new FlowGraphPlaySoundBlock();
        const secondBlock = new FlowGraphPlaySoundBlock();
        firstGraph.addBlock(firstBlock);
        secondGraph.addBlock(secondBlock);
        (firstBlock.sound as any)._defaultValue = "first-old";
        (secondBlock.sound as any)._defaultValue = "second-old";
        const firstContext = firstGraph.createContext();
        const secondContext = secondGraph.createContext();
        firstBlock.sound.setValue("first-old", firstContext);
        secondBlock.sound.setValue("second-old", secondContext);
        const globalState = new GlobalState(scene);
        globalState.coordinator = coordinator;
        firstGraph.start();
        secondGraph.start();

        globalState.activeGraphIndex = 1;
        globalState.activeGraphIndex = 0;
        expect(firstGraph.contextCount).toBe(0);

        globalState.setUnconnectedInputValue(firstBlock.sound, "first-new");

        const firstSnapshots = globalState.getContextSnapshotsForGraph(firstGraph.uniqueId)!;
        const secondSnapshots = globalState.getContextSnapshotsForGraph(secondGraph.uniqueId)!;
        expect(firstSnapshots[0]._connectionValues[firstBlock.sound.uniqueId]).toBe("first-new");
        expect(secondSnapshots[0]._connectionValues[secondBlock.sound.uniqueId]).toBe("second-old");

        globalState.dispose();
        coordinator.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("round-trips unresolved and live occurrences that share a numeric id", async () => {
        const engine = new NullEngine();
        const sourceScene = new Scene(engine);
        const sourceFirst = new Mesh("part", sourceScene);
        const sourceSecond = new Mesh("part", sourceScene);
        sourceSecond.id = sourceFirst.id;
        const sourceCoordinator = new FlowGraphCoordinator({ scene: sourceScene });
        const sourceGraph = sourceCoordinator.createGraph();
        const missingBlock = new FlowGraphMeshIntersectionEventBlock();
        sourceGraph.addEventBlock(missingBlock);
        (missingBlock.targetMeshes as any)._defaultValue = [sourceSecond];
        const sourceState = new GlobalState(sourceScene);
        sourceState.coordinator = sourceCoordinator;
        (sourceState.stateManager as any).storeEditorData = vi.fn();
        const initial = JSON.parse(SerializationTools.Serialize(sourceGraph, sourceState));

        const editScene = new Scene(engine);
        const liveFirst = new Mesh("part", editScene);
        (liveFirst as any).uniqueId = sourceSecond.uniqueId;
        const editState = new GlobalState(editScene);
        const loaded = await SerializationTools.DeserializeToStateAsync(initial, editScene);
        SerializationTools.ApplyDeserializedState(loaded, editState);
        (editState.stateManager as any).storeEditorData = vi.fn();
        const loadedGraph = loaded.coordinator.flowGraphs[0];
        const loadedMissingBlock = loadedGraph.getAllBlocks().find((candidate) => candidate.uniqueId === missingBlock.uniqueId) as FlowGraphMeshIntersectionEventBlock;
        const unresolved = (loadedMissingBlock.targetMeshes as any)._defaultValue[0];
        expect(unresolved).not.toBe(liveFirst);
        const liveBlock = new FlowGraphMeshIntersectionEventBlock();
        loadedGraph.addEventBlock(liveBlock);
        (liveBlock.targetMeshes as any)._defaultValue = [liveFirst];

        const saved = JSON.parse(SerializationTools.Serialize(loadedGraph, editState));
        const savedMissingBlock = saved._flowGraphs[0].allBlocks.find((candidate: any) => candidate.uniqueId === missingBlock.uniqueId);
        const savedLiveBlock = saved._flowGraphs[0].allBlocks.find((candidate: any) => candidate.uniqueId === liveBlock.uniqueId);
        const savedMissingId = savedMissingBlock.dataInputs.find((input: any) => input.name === "targetMeshes").defaultValue[0].uniqueId;
        const savedLiveId = savedLiveBlock.dataInputs.find((input: any) => input.name === "targetMeshes").defaultValue[0].uniqueId;
        expect(savedMissingId).not.toBe(savedLiveId);

        const restoredScene = new Scene(engine);
        const restoredFirst = new Mesh("part", restoredScene);
        const restoredSecond = new Mesh("part", restoredScene);
        restoredSecond.id = restoredFirst.id;
        const restored = await SerializationTools.DeserializeToStateAsync(saved, restoredScene);
        const restoredMissingBlock = restored.coordinator.flowGraphs[0]
            .getAllBlocks()
            .find((candidate) => candidate.uniqueId === missingBlock.uniqueId) as FlowGraphMeshIntersectionEventBlock;
        const restoredLiveBlock = restored.coordinator.flowGraphs[0]
            .getAllBlocks()
            .find((candidate) => candidate.uniqueId === liveBlock.uniqueId) as FlowGraphMeshIntersectionEventBlock;
        expect((restoredMissingBlock.targetMeshes as any)._defaultValue).toEqual([restoredSecond]);
        expect((restoredLiveBlock.targetMeshes as any)._defaultValue).toEqual([restoredFirst]);

        restored.coordinator.dispose();
        restoredScene.dispose();
        editState.dispose();
        loaded.coordinator.dispose();
        editScene.dispose();
        sourceState.dispose();
        sourceCoordinator.dispose();
        sourceScene.dispose();
        engine.dispose();
    });

    it("keeps a surviving same-scene duplicate when its ordinal changes", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const source = new Mesh("source", scene);
        const firstTarget = new Mesh("part", scene);
        const secondTarget = new Mesh("part", scene);
        secondTarget.id = firstTarget.id;
        const coordinator = new FlowGraphCoordinator({ scene });
        const graph = coordinator.createGraph();
        const block = new FlowGraphMeshIntersectionEventBlock();
        graph.addEventBlock(block);
        (block.sourceMesh as any)._defaultValue = source;
        (block.targetMeshes as any)._defaultValue = [secondTarget];
        graph.createContext();
        const globalState = new GlobalState(scene);
        globalState.coordinator = coordinator;
        (globalState.stateManager as any).storeEditorData = vi.fn();
        const serialized = JSON.parse(SerializationTools.Serialize(graph, globalState));
        firstTarget.dispose();
        secondTarget.name = "renamed";
        const appendedTarget = new Mesh("part", scene);
        appendedTarget.id = secondTarget.id;

        const restored = await SerializationTools.DeserializeToStateAsync(serialized, scene);
        const restoredGraph = restored.coordinator.flowGraphs[0];
        const restoredBlock = restoredGraph.getAllBlocks().find((candidate) => candidate.uniqueId === block.uniqueId) as FlowGraphMeshIntersectionEventBlock;
        expect((restoredBlock.targetMeshes as any)._defaultValue).toEqual([secondTarget]);
        expect((restoredBlock.targetMeshes as any)._defaultValue).not.toEqual([appendedTarget]);
        const context = restoredGraph.getContext(0)!;
        vi.spyOn(source, "intersectsMesh").mockReturnValue(true);
        const activate = vi.spyOn(restoredBlock.onEnter as any, "_activateSignal");

        restoredBlock._executeEvent(context, null);

        expect(activate).toHaveBeenCalledWith(context);
        expect(restoredBlock.otherMesh.getValue(context)).toBe(secondTarget);

        restored.coordinator.dispose();
        globalState.dispose();
        coordinator.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("preserves an unavailable duplicate through undo and redo", async () => {
        const engine = new NullEngine();
        const hostScene = new Scene(engine);
        const sourceScene = new Scene(engine);
        const sourceFirst = new Mesh("part", sourceScene);
        const sourceSecond = new Mesh("part", sourceScene);
        sourceSecond.id = sourceFirst.id;
        const sourceCoordinator = new FlowGraphCoordinator({ scene: sourceScene });
        const sourceGraph = sourceCoordinator.createGraph();
        const intersectionBlock = new FlowGraphMeshIntersectionEventBlock();
        const soundBlock = new FlowGraphPlaySoundBlock();
        sourceGraph.addEventBlock(intersectionBlock);
        sourceGraph.addBlock(soundBlock);
        (intersectionBlock.targetMeshes as any)._defaultValue = [sourceSecond];
        (soundBlock.sound as any)._defaultValue = "old";
        sourceGraph.createContext().setVariable("savedValue", 42);
        const sourceState = new GlobalState(sourceScene);
        sourceState.coordinator = sourceCoordinator;
        (sourceState.stateManager as any).storeEditorData = vi.fn();
        const serialized = JSON.parse(SerializationTools.Serialize(sourceGraph, sourceState));

        const editScene = new Scene(engine);
        const collidingLive = new Mesh("part", editScene);
        (collidingLive as any).uniqueId = sourceSecond.uniqueId;
        const editState = new GlobalState(hostScene);
        editState.sceneContext = new SceneContext(editScene, false);
        const loaded = await SerializationTools.DeserializeToStateAsync(serialized, editScene);
        SerializationTools.ApplyDeserializedState(loaded, editState);
        (editState.stateManager as any).storeEditorData = vi.fn();
        const registry = new Map<string, typeof FlowGraphPlaySoundBlock>();
        const history = new HistoryStack(
            () => CreateFlowGraphHistorySnapshot(editState, registry as any),
            (data) => ApplyFlowGraphHistorySnapshot(data, editState, registry as any)
        );
        await history.storeAsync();
        const loadedSoundBlock = editState.flowGraph.getAllBlocks().find((candidate) => candidate.uniqueId === soundBlock.uniqueId) as FlowGraphPlaySoundBlock;
        editState.setUnconnectedInputValue(loadedSoundBlock.sound, "new");
        await history.storeAsync();

        history.undo();

        let restoredIntersection = editState.flowGraph.getAllBlocks().find((candidate) => candidate.uniqueId === intersectionBlock.uniqueId) as FlowGraphMeshIntersectionEventBlock;
        let restoredTarget = (restoredIntersection.targetMeshes as any)._defaultValue[0];
        expect(restoredTarget).not.toBe(collidingLive);
        expect(restoredTarget).toEqual(expect.objectContaining({ id: sourceSecond.id, name: sourceSecond.name, uniqueId: sourceSecond.uniqueId }));
        expect(editState.getContextSnapshotsForGraph(editState.flowGraph.uniqueId)?.[0]._userVariables.savedValue).toBe(42);

        history.redo();

        restoredIntersection = editState.flowGraph.getAllBlocks().find((candidate) => candidate.uniqueId === intersectionBlock.uniqueId) as FlowGraphMeshIntersectionEventBlock;
        restoredTarget = (restoredIntersection.targetMeshes as any)._defaultValue[0];
        expect(restoredTarget).not.toBe(collidingLive);
        expect(restoredTarget).toEqual(expect.objectContaining({ id: sourceSecond.id, name: sourceSecond.name, uniqueId: sourceSecond.uniqueId }));

        history.dispose();
        editState.dispose();
        sourceState.dispose();
        sourceCoordinator.dispose();
        sourceScene.dispose();
        editScene.dispose();
        hostScene.dispose();
        engine.dispose();
    });

    it("restores history reference provenance against the preview scene", () => {
        const engine = new NullEngine();
        const hostScene = new Scene(engine);
        const previewScene = new Scene(engine);
        const first = new Mesh("part", previewScene);
        const second = new Mesh("part", previewScene);
        second.id = first.id;
        const coordinator = new FlowGraphCoordinator({ scene: hostScene });
        const graph = coordinator.createGraph();
        const intersectionBlock = new FlowGraphMeshIntersectionEventBlock();
        const soundBlock = new FlowGraphPlaySoundBlock();
        graph.addEventBlock(intersectionBlock);
        graph.addBlock(soundBlock);
        (intersectionBlock.targetMeshes as any)._defaultValue = [second];
        (soundBlock.sound as any)._defaultValue = "old";
        const globalState = new GlobalState(hostScene);
        globalState.sceneContext = new SceneContext(previewScene, false);
        globalState.coordinator = coordinator;
        (globalState.stateManager as any).storeEditorData = vi.fn();
        const registry = new Map<string, typeof FlowGraphPlaySoundBlock>();
        const snapshot = CreateFlowGraphHistorySnapshot(globalState, registry as any);
        first.dispose();
        const appended = new Mesh("part", previewScene);
        appended.id = second.id;
        globalState.setUnconnectedInputValue(soundBlock.sound, "new");

        ApplyFlowGraphHistorySnapshot(snapshot, globalState, registry as any);

        const restoredBlock = globalState.flowGraph.getAllBlocks().find((candidate) => candidate.uniqueId === intersectionBlock.uniqueId) as FlowGraphMeshIntersectionEventBlock;
        expect((restoredBlock.targetMeshes as any)._defaultValue).toEqual([second]);
        expect((restoredBlock.targetMeshes as any)._defaultValue).not.toEqual([appended]);

        globalState.dispose();
        coordinator.dispose();
        previewScene.dispose();
        hostScene.dispose();
        engine.dispose();
    });

    it("treats an empty history context list as authoritative", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const coordinator = new FlowGraphCoordinator({ scene });
        const graph = coordinator.createGraph();
        const block = new FlowGraphPlaySoundBlock();
        graph.addBlock(block);
        const globalState = new GlobalState(scene);
        globalState.coordinator = coordinator;
        (globalState.stateManager as any).storeEditorData = vi.fn();
        const registry = new Map<string, typeof FlowGraphPlaySoundBlock>();
        const emptySnapshot = CreateFlowGraphHistorySnapshot(globalState, registry as any);
        graph.createContext().setVariable("newer", 42);
        globalState.snapshotUserVariables();

        ApplyFlowGraphHistorySnapshot(emptySnapshot, globalState, registry as any);

        expect(globalState.flowGraph.contextCount).toBe(0);
        expect(globalState.getContextSnapshotsForGraph(globalState.flowGraph.uniqueId) ?? []).toEqual([]);
        const recreated = globalState.flowGraph.createContext();
        expect(recreated.hasVariable("newer")).toBe(false);

        globalState.dispose();
        coordinator.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("clears legacy flat context values when the coordinator changes", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const firstCoordinator = new FlowGraphCoordinator({ scene });
        firstCoordinator.createGraph();
        const globalState = new GlobalState(scene);
        globalState.coordinator = firstCoordinator;
        (globalState as any)._savedUserVariables = { stale: 42 };
        (globalState as any)._savedConnectionValues = { staleConnection: "old" };
        const replacement = new FlowGraphCoordinator({ scene });
        const replacementGraph = replacement.createGraph();

        globalState.coordinator = replacement;
        const context = replacementGraph.createContext();

        expect(context.hasVariable("stale")).toBe(false);
        expect((context as any)._connectionValues.staleConnection).toBeUndefined();

        globalState.dispose();
        firstCoordinator.dispose();
        replacement.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("preserves inactive graph provenance when undo restores the active graph", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const live = new Mesh("part", scene);
        const unresolved = { id: live.id, name: live.name, className: "Mesh", uniqueId: live.uniqueId };
        const coordinator = new FlowGraphCoordinator({ scene });
        const activeGraph = coordinator.createGraph();
        const inactiveGraph = coordinator.createGraph();
        const soundBlock = new FlowGraphPlaySoundBlock();
        const liveReferenceBlock = new FlowGraphMeshIntersectionEventBlock();
        const intersectionBlock = new FlowGraphMeshIntersectionEventBlock();
        activeGraph.addBlock(soundBlock);
        activeGraph.addEventBlock(liveReferenceBlock);
        inactiveGraph.addEventBlock(intersectionBlock);
        (soundBlock.sound as any)._defaultValue = "old";
        (liveReferenceBlock.targetMeshes as any)._defaultValue = [live];
        (intersectionBlock.targetMeshes as any)._defaultValue = [unresolved];
        const globalState = new GlobalState(scene);
        globalState.coordinator = coordinator;
        globalState.restoreReferenceProvenance(
            [[live.uniqueId, { id: live.id, name: live.name, className: "Mesh", idIndex: 1, nameIndex: 1 }]],
            [[unresolved, { id: live.id, name: live.name, className: "Mesh", idIndex: 1, nameIndex: 1 }]]
        );
        (globalState.stateManager as any).storeEditorData = vi.fn();
        const registry = new Map<string, typeof FlowGraphPlaySoundBlock>();
        const history = new HistoryStack(
            () => CreateFlowGraphHistorySnapshot(globalState, registry as any),
            (data) => ApplyFlowGraphHistorySnapshot(data, globalState, registry as any)
        );
        await history.storeAsync();
        globalState.setUnconnectedInputValue(soundBlock.sound, "new");
        await history.storeAsync();

        history.undo();

        const serialized = JSON.parse(SerializationTools.Serialize(globalState.flowGraph, globalState));
        const serializedInactive = serialized._flowGraphs.find((graph: any) => graph.uniqueId === inactiveGraph.uniqueId);
        const serializedIntersection = serializedInactive.allBlocks.find((block: any) => block.uniqueId === intersectionBlock.uniqueId);
        const savedTarget = serializedIntersection.dataInputs.find((input: any) => input.name === "targetMeshes").defaultValue[0];
        expect(savedTarget.uniqueId).not.toBe(live.uniqueId);
        expect(serialized.referenceProvenance).toContainEqual([savedTarget.uniqueId, expect.objectContaining({ idIndex: 1, nameIndex: 1 })]);

        history.dispose();
        globalState.dispose();
        coordinator.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("prunes retired graph runtime snapshots", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const coordinator = new FlowGraphCoordinator({ scene });
        const retainedGraph = coordinator.createGraph();
        const removedGraph = coordinator.createGraph();
        removedGraph.createContext();
        const globalState = new GlobalState(scene);
        globalState.coordinator = coordinator;
        globalState.activeGraphIndex = 1;
        globalState.snapshotUserVariables();
        expect((globalState as any)._perGraphContextRuntimeData.has(removedGraph.uniqueId)).toBe(true);

        globalState.removeGraph(1);

        expect((globalState as any)._perGraphContextRuntimeData.has(removedGraph.uniqueId)).toBe(false);
        const replacement = new FlowGraphCoordinator({ scene });
        replacement.createGraph();
        globalState.coordinator = replacement;
        expect((globalState as any)._perGraphContextRuntimeData.size).toBe(0);
        expect(globalState.flowGraph).not.toBe(retainedGraph);

        globalState.dispose();
        coordinator.dispose();
        replacement.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("keeps restored reference provenance idempotent across history merges", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const globalState = new GlobalState(scene);
        const location = { id: "part", name: "part", className: "Mesh", idIndex: 1, nameIndex: 1, sceneUid: scene.uid };

        globalState.restoreReferenceProvenance([[42, location]], [], false);
        globalState.restoreReferenceProvenance([[42, location]], [], false);

        expect((globalState as any)._restoredReferenceProvenance.get(42)).toEqual([location]);

        globalState.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("drops obsolete restored provenance after an explicit reference edit", async () => {
        const engine = new NullEngine();
        const sourceScene = new Scene(engine);
        const sourceFirst = new Mesh("part", sourceScene);
        const sourceSecond = new Mesh("part", sourceScene);
        sourceSecond.id = sourceFirst.id;
        const sourceCoordinator = new FlowGraphCoordinator({ scene: sourceScene });
        const sourceGraph = sourceCoordinator.createGraph();
        const sourceBlock = new FlowGraphMeshIntersectionEventBlock();
        sourceGraph.addEventBlock(sourceBlock);
        (sourceBlock.targetMeshes as any)._defaultValue = [sourceSecond];
        const sourceState = new GlobalState(sourceScene);
        sourceState.coordinator = sourceCoordinator;
        (sourceState.stateManager as any).storeEditorData = vi.fn();
        const initialSerialization = JSON.parse(SerializationTools.Serialize(sourceGraph, sourceState));

        const editScene = new Scene(engine);
        const editFirst = new Mesh("part", editScene);
        const editSecond = new Mesh("part", editScene);
        editSecond.id = editFirst.id;
        (editFirst as any).uniqueId = sourceSecond.uniqueId;
        const editorState = new GlobalState(editScene);
        const loaded = await SerializationTools.DeserializeToStateAsync(initialSerialization, editScene);
        SerializationTools.ApplyDeserializedState(loaded, editorState);
        (editorState.stateManager as any).storeEditorData = vi.fn();
        const loadedBlock = loaded.coordinator.flowGraphs[0]
            .getAllBlocks()
            .find((candidate) => candidate.getClassName() === sourceBlock.getClassName()) as FlowGraphMeshIntersectionEventBlock;
        editorState.setUnconnectedInputValue(loadedBlock.targetMeshes, [editFirst]);
        const editedSerialization = JSON.parse(SerializationTools.Serialize(loaded.coordinator.flowGraphs[0], editorState));
        expect(editedSerialization.referenceProvenance).toContainEqual([editFirst.uniqueId, expect.objectContaining({ idIndex: 0, nameIndex: 0 })]);
        expect(editedSerialization.referenceProvenance).not.toContainEqual([editFirst.uniqueId, expect.objectContaining({ idIndex: 1, nameIndex: 1 })]);

        const restoredScene = new Scene(engine);
        const restoredFirst = new Mesh("part", restoredScene);
        const restoredSecond = new Mesh("part", restoredScene);
        restoredSecond.id = restoredFirst.id;
        const restored = await SerializationTools.DeserializeToStateAsync(editedSerialization, restoredScene);
        const restoredBlock = restored.coordinator.flowGraphs[0]
            .getAllBlocks()
            .find((candidate) => candidate.getClassName() === sourceBlock.getClassName()) as FlowGraphMeshIntersectionEventBlock;
        expect((restoredBlock.targetMeshes as any)._defaultValue).toEqual([restoredFirst]);

        restored.coordinator.dispose();
        editorState.dispose();
        sourceState.dispose();
        sourceCoordinator.dispose();
        restoredScene.dispose();
        editScene.dispose();
        sourceScene.dispose();
        engine.dispose();
    });

    it("prefers a captured live location over stale restored provenance", async () => {
        const engine = new NullEngine();
        const sourceScene = new Scene(engine);
        const sourceFirst = new Mesh("part", sourceScene);
        const sourceSecond = new Mesh("part", sourceScene);
        sourceSecond.id = sourceFirst.id;
        const sourceCoordinator = new FlowGraphCoordinator({ scene: sourceScene });
        const sourceGraph = sourceCoordinator.createGraph();
        const sourceBlock = new FlowGraphMeshIntersectionEventBlock();
        sourceGraph.addEventBlock(sourceBlock);
        (sourceBlock.targetMeshes as any)._defaultValue = [sourceSecond];
        const sourceState = new GlobalState(sourceScene);
        sourceState.coordinator = sourceCoordinator;
        (sourceState.stateManager as any).storeEditorData = vi.fn();
        const initialSerialization = JSON.parse(SerializationTools.Serialize(sourceGraph, sourceState));

        const editScene = new Scene(engine);
        const editFirst = new Mesh("part", editScene);
        const editSecond = new Mesh("part", editScene);
        editSecond.id = editFirst.id;
        const loaded = await SerializationTools.DeserializeToStateAsync(initialSerialization, editScene);
        const editorState = new GlobalState(editScene);
        SerializationTools.ApplyDeserializedState(loaded, editorState);
        (editorState.stateManager as any).storeEditorData = vi.fn();
        const loadedGraph = loaded.coordinator.flowGraphs[0];
        const loadedBlock = loadedGraph.getAllBlocks().find((candidate) => candidate.getClassName() === sourceBlock.getClassName()) as FlowGraphMeshIntersectionEventBlock;
        const context = loadedGraph.createContext();
        loadedBlock.targetMeshes.setValue([editSecond], context);
        editFirst.dispose();
        const appended = new Mesh("part", editScene);
        appended.id = editSecond.id;
        editorState.snapshotUserVariables();
        loadedGraph.stop();
        const serialized = JSON.parse(SerializationTools.Serialize(loadedGraph, editorState));
        expect(serialized.referenceProvenance).toContainEqual([editSecond.uniqueId, expect.objectContaining({ idIndex: 0, nameIndex: 0 })]);

        const restoredScene = new Scene(engine);
        const restoredFirst = new Mesh("part", restoredScene);
        const restoredSecond = new Mesh("part", restoredScene);
        restoredSecond.id = restoredFirst.id;
        const restored = await SerializationTools.DeserializeToStateAsync(serialized, restoredScene);
        const restoredBlock = restored.coordinator.flowGraphs[0]
            .getAllBlocks()
            .find((candidate) => candidate.getClassName() === sourceBlock.getClassName()) as FlowGraphMeshIntersectionEventBlock;
        expect(restoredBlock.targetMeshes.getValue(restored.coordinator.flowGraphs[0].getContext(0)!)).toEqual([restoredFirst]);

        restored.coordinator.dispose();
        editorState.dispose();
        sourceState.dispose();
        sourceCoordinator.dispose();
        restoredScene.dispose();
        editScene.dispose();
        sourceScene.dispose();
        engine.dispose();
    });

    it("updates precise intersection context values through the custom property control", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const coordinator = new FlowGraphCoordinator({ scene });
        const graph = coordinator.createGraph();
        const block = new FlowGraphMeshIntersectionEventBlock();
        graph.addEventBlock(block);
        (block.usePreciseIntersection as any)._defaultValue = false;
        const context = graph.createContext();
        block.usePreciseIntersection.setValue(false, context);
        const globalState = new GlobalState(scene);
        globalState.coordinator = coordinator;
        const component = new MeshIntersectionPropertyComponent({
            nodeData: { data: block },
            stateManager: { data: globalState, onUpdateRequiredObservable: new Observable() },
        } as any);
        vi.spyOn(component, "forceUpdate").mockImplementation(() => {});

        (component as any)._setInputValue("usePreciseIntersection", true);

        expect(block.usePreciseIntersection.getValue(context)).toBe(true);
        expect(globalState.getContextSnapshotsForGraph(graph.uniqueId)?.[0]._connectionValues[block.usePreciseIntersection.uniqueId]).toBe(true);

        globalState.dispose();
        coordinator.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("does not resolve a missing duplicate pick target while rendering its property panel", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        new Mesh("part", scene);
        const unresolved = { id: "part", name: "part", className: "Mesh", uniqueId: 1234 };
        const block = new FlowGraphMeshPickEventBlock({ targetMesh: undefined });
        (block.asset as any)._defaultValue = unresolved;
        (block.config as any)._meshName = "part";
        (block.config as any).targetMesh = unresolved;
        const globalState = new GlobalState(scene);
        globalState.sceneContext = new SceneContext(scene, false);
        const component = new PointerEventPropertyComponent({
            nodeData: { data: block },
            stateManager: { data: globalState, onUpdateRequiredObservable: new Observable() },
        } as any);

        component.render();

        expect((block.asset as any)._defaultValue).toBe(unresolved);
        expect((block.config as any).targetMesh).toBe(unresolved);

        globalState.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("publishes buffered log entries once per frame in arrival order", () => {
        const callbacks: FrameRequestCallback[] = [];
        const published: LogEntry[][] = [];
        const buffer = new LogEntryBuffer(
            (entries) => published.push(entries),
            (callback) => {
                callbacks.push(callback);
                return callbacks.length;
            },
            vi.fn()
        );
        const first = new LogEntry("first", false);
        const second = new LogEntry("second", false);

        buffer.enqueue(first);
        buffer.enqueue(second);

        expect(callbacks).toHaveLength(1);
        expect(published).toHaveLength(0);
        callbacks[0](0);
        expect(published).toEqual([[first, second]]);
    });

    it("invokes the browser frame methods with the global receiver", () => {
        const requestFrame = vi.fn(function (this: typeof globalThis, _callback: FrameRequestCallback) {
            expect(this).toBe(globalThis);
            return 1;
        });
        const cancelFrame = vi.fn(function (this: typeof globalThis, handle: number) {
            expect(this).toBe(globalThis);
            expect(handle).toBe(1);
        });
        vi.stubGlobal("requestAnimationFrame", requestFrame);
        vi.stubGlobal("cancelAnimationFrame", cancelFrame);
        const buffer = new LogEntryBuffer(vi.fn());

        buffer.enqueue(new LogEntry("event", false));
        buffer.dispose();

        expect(requestFrame).toHaveBeenCalledOnce();
        expect(cancelFrame).toHaveBeenCalledOnce();
    });

    it("keeps only the newest buffered entries in arrival order", () => {
        const callbacks: FrameRequestCallback[] = [];
        const published: LogEntry[][] = [];
        const buffer = new LogEntryBuffer(
            (entries) => published.push(entries),
            (callback) => {
                callbacks.push(callback);
                return callbacks.length;
            },
            vi.fn()
        );

        for (let index = 0; index < 1005; index++) {
            buffer.enqueue(new LogEntry(String(index), false));
        }
        callbacks[0](0);

        expect(published[0]).toHaveLength(1000);
        expect(published[0][0].message).toBe("5");
        expect(published[0][999].message).toBe("1004");
    });

    it("releases buffered block references after publishing", () => {
        const callbacks: FrameRequestCallback[] = [];
        const block = new FlowGraphSceneReadyEventBlock();
        const buffer = new LogEntryBuffer(
            vi.fn(),
            (callback) => {
                callbacks.push(callback);
                return callbacks.length;
            },
            vi.fn()
        );

        buffer.enqueue(new LogEntry("event", false, block));
        callbacks[0](0);

        expect((buffer as any)._pending.every((entry: LogEntry | undefined) => entry === undefined)).toBe(true);
    });

    it("logs event signal activation but not subsequent event data-output reads", () => {
        vi.stubGlobal(
            "requestAnimationFrame",
            vi.fn(() => 1)
        );
        vi.stubGlobal("cancelAnimationFrame", vi.fn());
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const coordinator = new FlowGraphCoordinator({ scene });
        const graph = coordinator.createGraph();
        const eventBlock = new FlowGraphMeshIntersectionEventBlock();
        const ordinaryEventBlock = new FlowGraphSceneReadyEventBlock();
        graph.addEventBlock(eventBlock);
        graph.addEventBlock(ordinaryEventBlock);
        const context = graph.createContext();
        const globalState = new GlobalState(scene);
        globalState.coordinator = coordinator;
        const messages: string[] = [];
        globalState.onDebugLogRequiredObservable.add(({ message }) => messages.push(message));

        (globalState as any)._attachContextExecutionObserver();
        ordinaryEventBlock.out._activateSignal(context);
        eventBlock.onEnter._activateSignal(context);
        eventBlock.otherMesh.getValue(context);

        expect(messages).toEqual([`Event fired: ${ordinaryEventBlock.name}`, `Event fired: ${eventBlock.name} (onEnter)`]);

        (globalState as any)._unsubscribeDebugObservers();
        coordinator.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("logs event activations only for the selected execution context", () => {
        vi.stubGlobal(
            "requestAnimationFrame",
            vi.fn(() => 1)
        );
        vi.stubGlobal("cancelAnimationFrame", vi.fn());
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const coordinator = new FlowGraphCoordinator({ scene });
        const graph = coordinator.createGraph();
        const eventBlock = new FlowGraphSceneReadyEventBlock();
        graph.addEventBlock(eventBlock);
        const selectedContext = graph.createContext();
        const otherContext = graph.createContext();
        const globalState = new GlobalState(scene);
        globalState.coordinator = coordinator;
        const messages: string[] = [];
        globalState.onDebugLogRequiredObservable.add(({ message }) => messages.push(message));

        (globalState as any)._attachContextExecutionObserver();
        eventBlock.out._activateSignal(otherContext);
        eventBlock.out._activateSignal(selectedContext);

        expect(messages).toEqual([`Event fired: ${eventBlock.name}`]);

        globalState.dispose();
        coordinator.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("restores patched event signals when the editor state is disposed", () => {
        vi.stubGlobal(
            "requestAnimationFrame",
            vi.fn(() => 1)
        );
        vi.stubGlobal("cancelAnimationFrame", vi.fn());
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const coordinator = new FlowGraphCoordinator({ scene });
        const graph = coordinator.createGraph();
        const eventBlock = new FlowGraphSceneReadyEventBlock();
        graph.addEventBlock(eventBlock);
        graph.createContext();
        const globalState = new GlobalState(scene);
        globalState.coordinator = coordinator;
        const originalActivateSignal = eventBlock.out._activateSignal;

        (globalState as any)._attachContextExecutionObserver();
        expect(eventBlock.out._activateSignal).not.toBe(originalActivateSignal);

        globalState.dispose();
        expect(eventBlock.out._activateSignal).toBe(originalActivateSignal);

        coordinator.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("updates context-backed sound input values without overwriting distinct context overrides", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const coordinator = new FlowGraphCoordinator({ scene });
        const graph = coordinator.createGraph();
        const block = new FlowGraphPlaySoundBlock();
        graph.addBlock(block);
        (block.sound as any)._defaultValue = "old";
        const firstContext = graph.createContext();
        const secondContext = graph.createContext();
        block.sound.setValue("old", firstContext);
        block.sound.setValue("custom", secondContext);
        const globalState = new GlobalState(scene);
        globalState.coordinator = coordinator;
        (globalState.stateManager as any).storeEditorData = vi.fn();

        globalState.setUnconnectedInputValue(block.sound, "new");

        expect(block.sound.getValue(firstContext)).toBe("new");
        expect(block.sound.getValue(secondContext)).toBe("custom");

        const serialized = JSON.parse(SerializationTools.Serialize(graph, globalState));
        const restored = await SerializationTools.DeserializeToStateAsync(serialized, scene);
        const restoredBlock = restored.coordinator.flowGraphs[0].getAllBlocks().find((candidate) => candidate.getClassName() === block.getClassName()) as FlowGraphPlaySoundBlock;
        expect(restoredBlock.sound.getValue(restored.coordinator.flowGraphs[0].getContext(0)!)).toBe("new");
        expect(restoredBlock.sound.getValue(restored.coordinator.flowGraphs[0].getContext(1)!)).toBe("custom");

        restored.coordinator.dispose();
        coordinator.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("updates context-backed mesh input values and round-trips the edited references", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const oldTarget = new Mesh("old", scene);
        const newTarget = new Mesh("new", scene);
        const customTarget = new Mesh("custom", scene);
        const coordinator = new FlowGraphCoordinator({ scene });
        const graph = coordinator.createGraph();
        const block = new FlowGraphMeshIntersectionEventBlock();
        graph.addEventBlock(block);
        (block.targetMeshes as any)._defaultValue = [oldTarget];
        const firstContext = graph.createContext();
        const secondContext = graph.createContext();
        block.targetMeshes.setValue([oldTarget], firstContext);
        block.targetMeshes.setValue([customTarget], secondContext);
        const globalState = new GlobalState(scene);
        globalState.coordinator = coordinator;
        (globalState.stateManager as any).storeEditorData = vi.fn();

        globalState.setUnconnectedInputValue(block.targetMeshes, [newTarget]);

        expect(block.targetMeshes.getValue(firstContext)).toEqual([newTarget]);
        expect(block.targetMeshes.getValue(secondContext)).toEqual([customTarget]);

        const serialized = JSON.parse(SerializationTools.Serialize(graph, globalState));
        const restored = await SerializationTools.DeserializeToStateAsync(serialized, scene);
        const restoredBlock = restored.coordinator.flowGraphs[0]
            .getAllBlocks()
            .find((candidate) => candidate.getClassName() === block.getClassName()) as FlowGraphMeshIntersectionEventBlock;
        expect(restoredBlock.targetMeshes.getValue(restored.coordinator.flowGraphs[0].getContext(0)!)).toEqual([newTarget]);
        expect(restoredBlock.targetMeshes.getValue(restored.coordinator.flowGraphs[0].getContext(1)!)).toEqual([customTarget]);

        restored.coordinator.dispose();
        coordinator.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("instruments event blocks added while debug mode is active and restores them on removal", () => {
        vi.stubGlobal(
            "requestAnimationFrame",
            vi.fn(() => 1)
        );
        vi.stubGlobal("cancelAnimationFrame", vi.fn());
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const coordinator = new FlowGraphCoordinator({ scene });
        const graph = coordinator.createGraph();
        const context = graph.createContext();
        const globalState = new GlobalState(scene);
        globalState.coordinator = coordinator;
        coordinator.start();
        globalState.isDebugMode = true;
        const eventBlock = new FlowGraphMeshIntersectionEventBlock();
        graph.addEventBlock(eventBlock);
        const originalActivateSignal = eventBlock.onEnter._activateSignal;
        const messages: string[] = [];
        globalState.onDebugLogRequiredObservable.add(({ message }) => messages.push(message));

        globalState.stateManager.onNewNodeCreatedObservable.notifyObservers({ content: { data: eventBlock } } as any);
        expect(eventBlock.onEnter._activateSignal).not.toBe(originalActivateSignal);
        eventBlock.onEnter._activateSignal(context);
        expect(messages).toEqual([`Event fired: ${eventBlock.name} (onEnter)`]);

        globalState.stateManager.onGraphNodeRemovalObservable.notifyObservers({ content: { data: eventBlock } } as any);
        expect(eventBlock.onEnter._activateSignal).toBe(originalActivateSignal);

        globalState.dispose();
        coordinator.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("rebinds context-backed intersection inputs when the preview scene is replaced", async () => {
        const engine = new NullEngine();
        const oldScene = new Scene(engine);
        const oldSource = new Mesh("source", oldScene);
        const oldTarget = new Mesh("part", oldScene);
        const oldOverride = new Mesh("part", oldScene);
        oldOverride.id = oldTarget.id;
        const coordinator = new FlowGraphCoordinator({ scene: oldScene });
        const graph = coordinator.createGraph();
        const block = new FlowGraphMeshIntersectionEventBlock();
        graph.addEventBlock(block);
        (block.sourceMesh as any)._defaultValue = oldSource;
        (block.targetMeshes as any)._defaultValue = [oldOverride];
        const firstContext = graph.createContext();
        const secondContext = graph.createContext();
        block.sourceMesh.setValue(oldSource, firstContext);
        block.targetMeshes.setValue([oldOverride], firstContext);
        block.sourceMesh.setValue(oldSource, secondContext);
        block.targetMeshes.setValue([oldTarget], secondContext);
        const globalState = new GlobalState(oldScene);
        globalState.sceneContext = new SceneContext(oldScene, false);
        globalState.coordinator = coordinator;
        (globalState.stateManager as any).storeEditorData = vi.fn();

        const newScene = new Scene(engine);
        const newSource = new Mesh("source", newScene);
        const newTarget = new Mesh("part", newScene);
        const newOverride = new Mesh("part", newScene);
        newOverride.id = newTarget.id;
        const replacementContext = new SceneContext(newScene, false);
        globalState.sceneContext = replacementContext;
        globalState.onSceneContextChanged.notifyObservers(replacementContext);

        const restoredFirstContext = graph.getContext(0)!;
        const restoredSecondContext = graph.getContext(1)!;
        expect(block.sourceMesh.getValue(restoredFirstContext)).toBe(newSource);
        expect((block.targetMeshes as any)._defaultValue).toEqual([newOverride]);
        expect(block.targetMeshes.getValue(restoredFirstContext)).toEqual([newOverride]);
        expect(block.targetMeshes.getValue(restoredSecondContext)).toEqual([newTarget]);

        const onEnter = vi.spyOn(block.onEnter, "_activateSignal");
        block._executeEvent(restoredFirstContext, null);
        expect(onEnter).toHaveBeenCalledWith(restoredFirstContext);
        expect(block.otherMesh.getValue(restoredFirstContext)).toBe(newOverride);

        const editedTarget = new Mesh("edited", newScene);
        globalState.setUnconnectedInputValue(block.targetMeshes, [editedTarget]);
        expect(block.targetMeshes.getValue(restoredFirstContext)).toEqual([editedTarget]);
        expect(block.targetMeshes.getValue(restoredSecondContext)).toEqual([newTarget]);

        const serialized = JSON.parse(SerializationTools.Serialize(graph, globalState));
        const restored = await SerializationTools.DeserializeToStateAsync(serialized, newScene);
        const restoredBlock = restored.coordinator.flowGraphs[0]
            .getAllBlocks()
            .find((candidate) => candidate.getClassName() === block.getClassName()) as FlowGraphMeshIntersectionEventBlock;
        expect(restoredBlock.targetMeshes.getValue(restored.coordinator.flowGraphs[0].getContext(0)!)).toEqual([editedTarget]);
        expect(restoredBlock.targetMeshes.getValue(restored.coordinator.flowGraphs[0].getContext(1)!)).toEqual([newTarget]);

        restored.coordinator.dispose();
        globalState.dispose();
        replacementContext.dispose();
        coordinator.dispose();
        newScene.dispose();
        oldScene.dispose();
        engine.dispose();
    });

    it("keeps a missing duplicate mesh default unresolved across repeated scene replacements and serialization", () => {
        const engine = new NullEngine();
        const oldScene = new Scene(engine);
        const oldTarget = new Mesh("part", oldScene);
        const missingOverride = new Mesh("part", oldScene);
        missingOverride.id = oldTarget.id;
        const coordinator = new FlowGraphCoordinator({ scene: oldScene });
        const graph = coordinator.createGraph();
        const block = new FlowGraphMeshIntersectionEventBlock();
        graph.addEventBlock(block);
        (block.targetMeshes as any)._defaultValue = [missingOverride];
        const defaultContext = graph.createContext();
        const overrideContext = graph.createContext();
        block.targetMeshes.setValue([missingOverride], overrideContext);
        const globalState = new GlobalState(oldScene);
        globalState.sceneContext = new SceneContext(oldScene, false);
        globalState.coordinator = coordinator;
        (globalState.stateManager as any).storeEditorData = vi.fn();

        const newScene = new Scene(engine);
        const newTarget = new Mesh("part", newScene);
        newTarget.id = oldTarget.id;
        const replacementContext = new SceneContext(newScene, false);
        globalState.sceneContext = replacementContext;
        globalState.onSceneContextChanged.notifyObservers(replacementContext);

        expect((block.targetMeshes as any)._defaultValue).toEqual([missingOverride]);
        expect(block.targetMeshes.getValue(graph.getContext(0)!)).toEqual([missingOverride]);
        expect(block.targetMeshes.getValue(graph.getContext(1)!)).toEqual([missingOverride]);
        const cachedLocations = (globalState as any)._cachedOldNodeLocations as Map<number, unknown>;
        expect(cachedLocations.has(missingOverride.uniqueId)).toBe(true);
        expect(cachedLocations.has(oldTarget.uniqueId)).toBe(false);
        expect(cachedLocations.size).toBeLessThanOrEqual(3);

        const secondScene = new Scene(engine);
        const secondTarget = new Mesh("part", secondScene);
        secondTarget.id = oldTarget.id;
        const secondReplacementContext = new SceneContext(secondScene, false);
        globalState.sceneContext = secondReplacementContext;
        globalState.onSceneContextChanged.notifyObservers(secondReplacementContext);

        expect((block.targetMeshes as any)._defaultValue).toEqual([missingOverride]);
        expect(block.targetMeshes.getValue(graph.getContext(0)!)).toEqual([missingOverride]);
        expect(block.targetMeshes.getValue(graph.getContext(1)!)).toEqual([missingOverride]);

        const serialized = JSON.parse(SerializationTools.Serialize(graph, globalState));
        const contexts = serialized._flowGraphs[0].executionContexts;
        expect(
            serialized._flowGraphs[0].allBlocks.find((candidate: any) => candidate.uniqueId === block.uniqueId).dataInputs.find((input: any) => input.name === "targetMeshes")
                .defaultValue[0]
        ).toMatchObject({
            id: missingOverride.id,
            name: missingOverride.name,
            uniqueId: missingOverride.uniqueId,
        });
        expect(contexts[1]._connectionValues[block.targetMeshes.uniqueId][0]).toMatchObject({
            id: missingOverride.id,
            name: missingOverride.name,
            uniqueId: missingOverride.uniqueId,
        });

        const laterScenes: Scene[] = [];
        const laterContexts: SceneContext[] = [];
        for (let index = 0; index < 3; index++) {
            const laterScene = new Scene(engine);
            const laterTarget = new Mesh("part", laterScene);
            laterTarget.id = oldTarget.id;
            const laterContext = new SceneContext(laterScene, false);
            laterScenes.push(laterScene);
            laterContexts.push(laterContext);
            globalState.sceneContext = laterContext;
            globalState.onSceneContextChanged.notifyObservers(laterContext);
            expect(((globalState as any)._cachedOldNodeLocations as Map<number, unknown>).size).toBeLessThanOrEqual(3);
        }

        globalState.dispose();
        laterContexts.forEach((context) => context.dispose());
        secondReplacementContext.dispose();
        replacementContext.dispose();
        coordinator.dispose();
        laterScenes.forEach((scene) => scene.dispose());
        secondScene.dispose();
        newScene.dispose();
        oldScene.dispose();
        engine.dispose();
    });

    it("cancels a deferred sound import when the active coordinator changes", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const firstCoordinator = new FlowGraphCoordinator({ scene });
        firstCoordinator.createGraph();
        const secondCoordinator = new FlowGraphCoordinator({ scene });
        secondCoordinator.createGraph();
        const globalState = new GlobalState(scene);
        globalState.coordinator = firstCoordinator;
        const addToFirst = vi.spyOn(firstCoordinator, "addSoundAssetAsync");
        const addToSecond = vi.spyOn(secondCoordinator, "addSoundAssetAsync");
        let finishRead: (url: string) => void = () => {};
        const read = vi.fn(
            async () =>
                await new Promise<string>((resolve) => {
                    finishRead = resolve;
                })
        );

        const importing = ImportSoundAssetFileAsync(globalState, firstCoordinator, { name: "replacement.wav" } as File, "shared", read);
        globalState.coordinator = secondCoordinator;
        finishRead("data:audio/wav;base64,UklGRg==");

        await expect(importing).resolves.toBe(false);
        expect(addToFirst).not.toHaveBeenCalled();
        expect(addToSecond).not.toHaveBeenCalled();

        globalState.dispose();
        firstCoordinator.dispose();
        secondCoordinator.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("rejects oversized embedded sound files before reading them", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const coordinator = new FlowGraphCoordinator({ scene });
        coordinator.createGraph();
        const globalState = new GlobalState(scene);
        globalState.coordinator = coordinator;
        const read = vi.fn(async () => "data:audio/wav;base64,UklGRg==");

        await expect(ImportSoundAssetFileAsync(globalState, coordinator, { name: "large.wav", size: 25 * 1024 * 1024 + 1 } as File, "large", read)).rejects.toThrow(
            "25 MB or smaller"
        );
        expect(read).not.toHaveBeenCalled();

        globalState.dispose();
        coordinator.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("restores the previous sound declaration when replacement loading fails", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const coordinator = new FlowGraphCoordinator({ scene });
        coordinator.createGraph();
        const globalState = new GlobalState(scene);
        globalState.coordinator = coordinator;
        const previousAsset = { name: "shared", url: "data:audio/wav;base64,OLD" };
        vi.spyOn(coordinator, "soundAssets", "get").mockReturnValue([previousAsset]);
        const addSoundAsset = vi
            .spyOn(coordinator, "addSoundAssetAsync")
            .mockRejectedValueOnce(new Error("Unsupported audio format"))
            .mockResolvedValueOnce({} as any);

        await expect(
            ImportSoundAssetFileAsync(globalState, coordinator, { name: "replacement.wav", size: 100 } as File, "shared", async () => "data:audio/wav;base64,NEW")
        ).rejects.toThrow("Unsupported audio format");

        expect(addSoundAsset).toHaveBeenNthCalledWith(1, { name: "shared", url: "data:audio/wav;base64,NEW" });
        expect(addSoundAsset).toHaveBeenNthCalledWith(2, previousAsset);

        globalState.dispose();
        coordinator.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("rolls a failed panel replacement back to a successful host replacement", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const coordinator = new FlowGraphCoordinator({ scene });
        coordinator.createGraph();
        const globalState = new GlobalState(scene);
        globalState.coordinator = coordinator;
        globalState.markSoundAssetLoaded({ name: "shared", url: "data:audio/wav;base64,OLD" });
        const hostAsset = { name: "shared", url: "data:audio/wav;base64,HOST" };
        vi.spyOn(coordinator, "soundAssets", "get").mockReturnValue([hostAsset]);
        vi.spyOn(coordinator, "getSoundAsset").mockReturnValue({} as any);
        const addSoundAsset = vi
            .spyOn(coordinator, "addSoundAssetAsync")
            .mockRejectedValueOnce(new Error("Unsupported audio format"))
            .mockResolvedValueOnce({} as any);

        await expect(
            ImportSoundAssetFileAsync(globalState, coordinator, { name: "replacement.wav", size: 100 } as File, "shared", async () => "data:audio/wav;base64,NEW")
        ).rejects.toThrow("Unsupported audio format");

        expect(addSoundAsset).toHaveBeenNthCalledWith(1, { name: "shared", url: "data:audio/wav;base64,NEW" });
        expect(addSoundAsset).toHaveBeenNthCalledWith(2, hostAsset);

        globalState.dispose();
        coordinator.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("rolls concurrent failed replacements back to the last successfully loaded sound", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const coordinator = new FlowGraphCoordinator({ scene });
        coordinator.createGraph();
        const globalState = new GlobalState(scene);
        globalState.coordinator = coordinator;
        const previousAsset = { name: "shared", url: "data:audio/wav;base64,OLD" };
        vi.spyOn(coordinator, "soundAssets", "get")
            .mockReturnValueOnce([previousAsset])
            .mockReturnValue([{ name: "shared", url: "data:audio/wav;base64,PENDING" }]);
        let failFirst: (error: Error) => void = () => {};
        const addSoundAsset = vi
            .spyOn(coordinator, "addSoundAssetAsync")
            .mockImplementationOnce(
                async () =>
                    await new Promise<any>((_, reject) => {
                        failFirst = reject;
                    })
            )
            .mockRejectedValueOnce(new Error("Second replacement failed"))
            .mockResolvedValueOnce({} as any);

        const first = ImportSoundAssetFileAsync(globalState, coordinator, { name: "first.wav" } as File, "shared", async () => "data:audio/wav;base64,FIRST");
        await vi.waitFor(() => expect(addSoundAsset).toHaveBeenCalledOnce());
        const second = ImportSoundAssetFileAsync(globalState, coordinator, { name: "second.wav" } as File, "shared", async () => "data:audio/wav;base64,SECOND");
        await expect(second).rejects.toThrow("Second replacement failed");
        failFirst(new Error("First replacement failed"));
        await expect(first).rejects.toThrow("First replacement failed");

        expect(addSoundAsset).toHaveBeenNthCalledWith(3, previousAsset);

        globalState.dispose();
        coordinator.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("does not cache a sound replacement that finishes after a coordinator change", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const firstCoordinator = new FlowGraphCoordinator({ scene });
        firstCoordinator.createGraph();
        const globalState = new GlobalState(scene);
        globalState.coordinator = firstCoordinator;
        let finishFirst: () => void = () => {};
        vi.spyOn(firstCoordinator, "addSoundAssetAsync").mockImplementation(
            async () =>
                await new Promise<any>((resolve) => {
                    finishFirst = () => resolve({});
                })
        );
        const first = ImportSoundAssetFileAsync(globalState, firstCoordinator, { name: "first.wav" } as File, "shared", async () => "data:audio/wav;base64,OLD");
        await vi.waitFor(() => expect(firstCoordinator.addSoundAssetAsync).toHaveBeenCalledOnce());
        const replacement = new FlowGraphCoordinator({ scene });
        replacement.createGraph();
        globalState.coordinator = replacement;
        finishFirst();
        await expect(first).resolves.toBe(false);
        const replacementAdd = vi.spyOn(replacement, "addSoundAssetAsync").mockRejectedValue(new Error("Replacement failed"));

        await expect(ImportSoundAssetFileAsync(globalState, replacement, { name: "second.wav" } as File, "shared", async () => "data:audio/wav;base64,NEW")).rejects.toThrow(
            "Replacement failed"
        );

        expect(replacementAdd).toHaveBeenCalledOnce();

        globalState.dispose();
        firstCoordinator.dispose();
        replacement.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("cancels a deferred sound import when the editor is disposed", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const coordinator = new FlowGraphCoordinator({ scene });
        coordinator.createGraph();
        const globalState = new GlobalState(scene);
        globalState.coordinator = coordinator;
        const addSoundAsset = vi.spyOn(coordinator, "addSoundAssetAsync");
        let finishRead: (url: string) => void = () => {};
        const read = vi.fn(
            async () =>
                await new Promise<string>((resolve) => {
                    finishRead = resolve;
                })
        );

        const importing = ImportSoundAssetFileAsync(globalState, coordinator, { name: "replacement.wav" } as File, "shared", read);
        globalState.dispose();
        finishRead("data:audio/wav;base64,UklGRg==");

        await expect(importing).resolves.toBe(false);
        expect(addSoundAsset).not.toHaveBeenCalled();

        coordinator.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("cancels a deferred sound import when the coordinator is disposed", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const coordinator = new FlowGraphCoordinator({ scene });
        coordinator.createGraph();
        const globalState = new GlobalState(scene);
        globalState.coordinator = coordinator;
        const addSoundAsset = vi.spyOn(coordinator, "addSoundAssetAsync");
        let finishRead: (url: string) => void = () => {};
        const read = vi.fn(
            async () =>
                await new Promise<string>((resolve) => {
                    finishRead = resolve;
                })
        );

        const importing = ImportSoundAssetFileAsync(globalState, coordinator, { name: "replacement.wav" } as File, "shared", read);
        coordinator.dispose();
        finishRead("data:audio/wav;base64,UklGRg==");

        await expect(importing).resolves.toBe(false);
        expect(addSoundAsset).not.toHaveBeenCalled();

        globalState.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("cancels a deferred sound import when an embedded host scene is disposed", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const coordinator = new FlowGraphCoordinator({ scene });
        coordinator.createGraph();
        const globalState = new GlobalState(scene);
        globalState.hostElement = {} as HTMLElement;
        globalState.hostScene = scene;
        globalState.sceneSource = "host";
        globalState.coordinator = coordinator;
        const addSoundAsset = vi.spyOn(coordinator, "addSoundAssetAsync");
        let finishRead: (url: string) => void = () => {};
        const read = vi.fn(
            async () =>
                await new Promise<string>((resolve) => {
                    finishRead = resolve;
                })
        );

        const importing = ImportSoundAssetFileAsync(globalState, coordinator, { name: "replacement.wav" } as File, "shared", read);
        scene.dispose();
        finishRead("data:audio/wav;base64,UklGRg==");

        await expect(importing).resolves.toBe(false);
        expect(addSoundAsset).not.toHaveBeenCalled();

        globalState.dispose();
        engine.dispose();
    });

    it("keeps a removed sound asset removed when an older replacement read finishes", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const coordinator = new FlowGraphCoordinator({ scene });
        coordinator.createGraph();
        const globalState = new GlobalState(scene);
        globalState.coordinator = coordinator;
        const addSoundAsset = vi.spyOn(coordinator, "addSoundAssetAsync");
        let finishRead: (url: string) => void = () => {};
        const read = vi.fn(
            async () =>
                await new Promise<string>((resolve) => {
                    finishRead = resolve;
                })
        );

        const replacing = ImportSoundAssetFileAsync(globalState, coordinator, { name: "replacement.wav" } as File, "shared", read);
        globalState.removeSoundAsset("shared");
        finishRead("data:audio/wav;base64,UklGRg==");

        await expect(replacing).resolves.toBe(false);
        expect(addSoundAsset).not.toHaveBeenCalled();

        globalState.dispose();
        coordinator.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("cleans up an older replacement that finishes after the asset is removed", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const coordinator = new FlowGraphCoordinator({ scene });
        coordinator.createGraph();
        const globalState = new GlobalState(scene);
        globalState.coordinator = coordinator;
        let finishAdd: () => void = () => {};
        vi.spyOn(coordinator, "addSoundAssetAsync").mockImplementation(
            async () =>
                await new Promise<any>((resolve) => {
                    finishAdd = () => resolve({});
                })
        );
        const removeSoundAsset = vi.spyOn(coordinator, "removeSoundAsset");

        const replacing = ImportSoundAssetFileAsync(globalState, coordinator, { name: "replacement.wav" } as File, "shared", async () => "data:audio/wav;base64,UklGRg==");
        await vi.waitFor(() => expect(coordinator.addSoundAssetAsync).toHaveBeenCalledOnce());
        globalState.removeSoundAsset("shared");
        finishAdd();

        await expect(replacing).resolves.toBe(false);
        expect(removeSoundAsset).toHaveBeenCalledTimes(2);

        globalState.dispose();
        coordinator.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("lets the newest sound replacement supersede an older pending read", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const coordinator = new FlowGraphCoordinator({ scene });
        coordinator.createGraph();
        const globalState = new GlobalState(scene);
        globalState.coordinator = coordinator;
        const addSoundAsset = vi.spyOn(coordinator, "addSoundAssetAsync").mockResolvedValue({} as any);
        const finishes: Array<(url: string) => void> = [];
        const read = vi.fn(
            async () =>
                await new Promise<string>((resolve) => {
                    finishes.push(resolve);
                })
        );

        const first = ImportSoundAssetFileAsync(globalState, coordinator, { name: "first.wav" } as File, "shared", read);
        const second = ImportSoundAssetFileAsync(globalState, coordinator, { name: "second.wav" } as File, "shared", read);
        finishes[1]("data:audio/wav;base64,UklGRg==");
        finishes[0]("data:audio/wav;base64,AAAA");

        await expect(second).resolves.toBe(true);
        await expect(first).resolves.toBe(false);
        expect(addSoundAsset).toHaveBeenCalledExactlyOnceWith({ name: "shared", url: "data:audio/wav;base64,UklGRg==" });

        globalState.dispose();
        coordinator.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("rebinds a running sound-ended event when its sound input changes", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const coordinator = new FlowGraphCoordinator({ scene });
        const graph = coordinator.createGraph();
        const block = new FlowGraphSoundEndedEventBlock();
        graph.addEventBlock(block);
        (block.sound as any)._defaultValue = "first";
        const context = graph.createContext();
        block.sound.setValue("first", context);
        const firstSound = { onEndedObservable: new Observable<any>() };
        const secondSound = { onEndedObservable: new Observable<any>() };
        vi.spyOn(coordinator, "getSoundAsset").mockImplementation((name) => (name === "first" ? firstSound : secondSound) as any);
        const globalState = new GlobalState(scene);
        globalState.coordinator = coordinator;
        graph.start();

        globalState.setUnconnectedInputValue(block.sound, "second");

        expect(firstSound.onEndedObservable.hasObservers()).toBe(false);
        expect(secondSound.onEndedObservable.hasObservers()).toBe(true);

        globalState.setUnconnectedInputValue(block.sound, "");
        expect(secondSound.onEndedObservable.hasObservers()).toBe(false);

        globalState.dispose();
        coordinator.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("does not rebind a running sound-ended event when only its connected default changes", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const coordinator = new FlowGraphCoordinator({ scene });
        const graph = coordinator.createGraph();
        const block = new FlowGraphSoundEndedEventBlock();
        const constant = new FlowGraphConstantBlock<string>({ value: "first" });
        graph.addEventBlock(block);
        graph.addBlock(constant);
        constant.output.connectTo(block.sound);
        graph.createContext();
        const firstSound = { onEndedObservable: new Observable<any>() };
        vi.spyOn(coordinator, "getSoundAsset").mockReturnValue(firstSound as any);
        const globalState = new GlobalState(scene);
        globalState.coordinator = coordinator;
        graph.start();
        expect(firstSound.onEndedObservable.hasObservers()).toBe(true);

        globalState.setUnconnectedInputValue(block.sound, "");

        expect(firstSound.onEndedObservable.hasObservers()).toBe(true);

        globalState.dispose();
        coordinator.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("rebinds a running sound-ended event when its context inherits the default", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const coordinator = new FlowGraphCoordinator({ scene });
        const graph = coordinator.createGraph();
        const block = new FlowGraphSoundEndedEventBlock();
        graph.addEventBlock(block);
        (block.sound as any)._defaultValue = "first";
        graph.createContext();
        const firstSound = { onEndedObservable: new Observable<any>() };
        const secondSound = { onEndedObservable: new Observable<any>() };
        vi.spyOn(coordinator, "getSoundAsset").mockImplementation((name) => (name === "first" ? firstSound : secondSound) as any);
        const globalState = new GlobalState(scene);
        globalState.coordinator = coordinator;
        graph.start();

        globalState.setUnconnectedInputValue(block.sound, "second");

        expect(firstSound.onEndedObservable.hasObservers()).toBe(false);
        expect(secondSound.onEndedObservable.hasObservers()).toBe(true);

        globalState.setUnconnectedInputValue(block.sound, "");
        expect(secondSound.onEndedObservable.hasObservers()).toBe(false);

        globalState.dispose();
        coordinator.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("updates saved-only context values after a host graph is stopped", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const coordinator = new FlowGraphCoordinator({ scene });
        const graph = coordinator.createGraph();
        const block = new FlowGraphPlaySoundBlock();
        graph.addBlock(block);
        (block.sound as any)._defaultValue = "old";
        const context = graph.createContext();
        block.sound.setValue("old", context);
        const globalState = new GlobalState(scene);
        globalState.hostScene = scene;
        globalState.sceneSource = "host";
        globalState.coordinator = coordinator;
        (globalState.stateManager as any).storeEditorData = vi.fn();
        graph.start();
        globalState.snapshotUserVariables();
        graph.stop();

        globalState.setUnconnectedInputValue(block.sound, "new");
        globalState.restoreSavedContexts();

        expect(block.sound.getValue(graph.getContext(0)!)).toBe("new");
        const serialized = JSON.parse(SerializationTools.Serialize(graph, globalState));
        const restored = await SerializationTools.DeserializeToStateAsync(serialized, scene);
        const restoredBlock = restored.coordinator.flowGraphs[0].getAllBlocks().find((candidate) => candidate.getClassName() === block.getClassName()) as FlowGraphPlaySoundBlock;
        expect(restoredBlock.sound.getValue(restored.coordinator.flowGraphs[0].getContext(0)!)).toBe("new");

        restored.coordinator.dispose();
        globalState.dispose();
        coordinator.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("does not rebind a sound-ended event while its graph is paused", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const coordinator = new FlowGraphCoordinator({ scene });
        const graph = coordinator.createGraph();
        const block = new FlowGraphSoundEndedEventBlock();
        graph.addEventBlock(block);
        (block.sound as any)._defaultValue = "first";
        const context = graph.createContext();
        block.sound.setValue("first", context);
        const firstSound = { onEndedObservable: new Observable<any>() };
        const secondSound = { onEndedObservable: new Observable<any>() };
        vi.spyOn(coordinator, "getSoundAsset").mockImplementation((name) => (name === "first" ? firstSound : secondSound) as any);
        const globalState = new GlobalState(scene);
        globalState.coordinator = coordinator;
        graph.start();
        expect(firstSound.onEndedObservable.hasObservers()).toBe(true);
        graph.pause();
        expect(firstSound.onEndedObservable.hasObservers()).toBe(false);

        globalState.setUnconnectedInputValue(block.sound, "second");

        expect(secondSound.onEndedObservable.hasObservers()).toBe(false);
        graph.start();
        expect(secondSound.onEndedObservable.hasObservers()).toBe(true);

        globalState.dispose();
        coordinator.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("rebinds saved runtime snapshots for an inactive graph", () => {
        const engine = new NullEngine();
        const oldScene = new Scene(engine);
        const oldFirst = new Mesh("part", oldScene);
        const oldSecond = new Mesh("part", oldScene);
        oldSecond.id = oldFirst.id;
        const coordinator = new FlowGraphCoordinator({ scene: oldScene });
        coordinator.createGraph();
        const inactiveGraph = coordinator.createGraph();
        const inactiveBlock = new FlowGraphMeshIntersectionEventBlock();
        inactiveGraph.addEventBlock(inactiveBlock);
        (inactiveBlock.targetMeshes as any)._defaultValue = [oldFirst];
        const inactiveContext = inactiveGraph.createContext();
        inactiveBlock.targetMeshes.setValue([oldSecond], inactiveContext);
        const globalState = new GlobalState(oldScene);
        globalState.sceneContext = new SceneContext(oldScene, false);
        globalState.coordinator = coordinator;
        (globalState.stateManager as any).storeEditorData = vi.fn();
        globalState.activeGraphIndex = 1;
        inactiveGraph.start();
        globalState.snapshotUserVariables();
        inactiveGraph.stop();
        expect(inactiveGraph.contextCount).toBe(0);
        globalState.activeGraphIndex = 0;

        const newScene = new Scene(engine);
        const newFirst = new Mesh("part", newScene);
        const newSecond = new Mesh("part", newScene);
        newFirst.id = oldFirst.id;
        newSecond.id = oldFirst.id;
        const replacementContext = new SceneContext(newScene, false);
        globalState.sceneContext = replacementContext;
        globalState.onSceneContextChanged.notifyObservers(replacementContext);
        expect((inactiveBlock.targetMeshes as any)._defaultValue).toEqual([newFirst]);

        globalState.activeGraphIndex = 1;
        globalState.restoreSavedContexts();

        expect(inactiveBlock.targetMeshes.getValue(inactiveGraph.getContext(0)!)).toEqual([newSecond]);

        globalState.dispose();
        replacementContext.dispose();
        coordinator.dispose();
        newScene.dispose();
        oldScene.dispose();
        engine.dispose();
    });

    it("round-trips duplicate mesh provenance into a fresh editor state", async () => {
        const engine = new NullEngine();
        const oldScene = new Scene(engine);
        const oldFirst = new Mesh("part", oldScene);
        const oldSecond = new Mesh("part", oldScene);
        oldSecond.id = oldFirst.id;
        const coordinator = new FlowGraphCoordinator({ scene: oldScene });
        const graph = coordinator.createGraph();
        const block = new FlowGraphMeshIntersectionEventBlock();
        graph.addEventBlock(block);
        (block.targetMeshes as any)._defaultValue = [oldSecond];
        const globalState = new GlobalState(oldScene);
        globalState.sceneContext = new SceneContext(oldScene, false);
        globalState.coordinator = coordinator;
        (globalState.stateManager as any).storeEditorData = vi.fn();
        const serialized = JSON.parse(SerializationTools.Serialize(graph, globalState));

        const newScene = new Scene(engine);
        const newFirst = new Mesh("part", newScene);
        const newSecond = new Mesh("part", newScene);
        newSecond.id = newFirst.id;
        (newFirst as any).uniqueId = oldSecond.uniqueId;
        const restored = await SerializationTools.DeserializeToStateAsync(serialized, newScene);
        const restoredBlock = restored.coordinator.flowGraphs[0]
            .getAllBlocks()
            .find((candidate) => candidate.getClassName() === block.getClassName()) as FlowGraphMeshIntersectionEventBlock;

        expect((restoredBlock.targetMeshes as any)._defaultValue).toEqual([newSecond]);

        restored.coordinator.dispose();
        oldFirst.dispose();
        const sameSceneRestored = await SerializationTools.DeserializeToStateAsync(serialized, oldScene);
        const sameSceneBlock = sameSceneRestored.coordinator.flowGraphs[0]
            .getAllBlocks()
            .find((candidate) => candidate.getClassName() === block.getClassName()) as FlowGraphMeshIntersectionEventBlock;
        expect((sameSceneBlock.targetMeshes as any)._defaultValue).toEqual([oldSecond]);

        sameSceneRestored.coordinator.dispose();
        const missingScene = new Scene(engine);
        const survivingFirst = new Mesh("part", missingScene);
        survivingFirst.id = oldFirst.id;
        const missingRestored = await SerializationTools.DeserializeToStateAsync(serialized, missingScene);
        const missingBlock = missingRestored.coordinator.flowGraphs[0]
            .getAllBlocks()
            .find((candidate) => candidate.getClassName() === block.getClassName()) as FlowGraphMeshIntersectionEventBlock;
        expect((missingBlock.targetMeshes as any)._defaultValue).toEqual([
            expect.objectContaining({ uniqueId: oldSecond.uniqueId, id: oldSecond.id, name: oldSecond.name, className: oldSecond.getClassName() }),
        ]);

        missingRestored.coordinator.dispose();
        globalState.dispose();
        coordinator.dispose();
        missingScene.dispose();
        newScene.dispose();
        oldScene.dispose();
        engine.dispose();
    });

    it("prefers same-scene identity when reopening through a host-scene coordinator", async () => {
        const engine = new NullEngine();
        const previewScene = new Scene(engine);
        const first = new Mesh("part", previewScene);
        const target = new Mesh("part", previewScene);
        target.id = first.id;
        const sourceCoordinator = new FlowGraphCoordinator({ scene: previewScene });
        const sourceGraph = sourceCoordinator.createGraph();
        const sourceBlock = new FlowGraphMeshIntersectionEventBlock();
        sourceGraph.addEventBlock(sourceBlock);
        (sourceBlock.targetMeshes as any)._defaultValue = [target];
        const sourceState = new GlobalState(previewScene);
        sourceState.sceneContext = new SceneContext(previewScene, false);
        sourceState.coordinator = sourceCoordinator;
        (sourceState.stateManager as any).storeEditorData = vi.fn();
        const serialized = JSON.parse(SerializationTools.Serialize(sourceGraph, sourceState));

        first.dispose();
        const appended = new Mesh("part", previewScene);
        appended.id = target.id;
        const hostScene = new Scene(engine);
        const loaded = await SerializationTools.DeserializeToStateAsync(serialized, hostScene);
        const restoredState = new GlobalState(hostScene);
        restoredState.sceneContext = new SceneContext(previewScene, false);
        SerializationTools.ApplyDeserializedState(loaded, restoredState);
        const restoredBlock = loaded.coordinator.flowGraphs[0]
            .getAllBlocks()
            .find((candidate) => candidate.getClassName() === sourceBlock.getClassName()) as FlowGraphMeshIntersectionEventBlock;

        expect((restoredBlock.targetMeshes as any)._defaultValue).toEqual([target]);
        expect((restoredBlock.targetMeshes as any)._defaultValue).not.toEqual([appended]);

        restoredState.dispose();
        loaded.coordinator.dispose();
        sourceState.dispose();
        sourceCoordinator.dispose();
        hostScene.dispose();
        previewScene.dispose();
        engine.dispose();
    });

    it("captures duplicate mesh provenance added after editor initialization", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const coordinator = new FlowGraphCoordinator({ scene });
        const graph = coordinator.createGraph();
        const block = new FlowGraphMeshIntersectionEventBlock();
        graph.addEventBlock(block);
        const globalState = new GlobalState(scene);
        globalState.hostScene = scene;
        globalState.sceneSource = "host";
        globalState.coordinator = coordinator;
        (globalState.stateManager as any).storeEditorData = vi.fn();
        const first = new Mesh("part", scene);
        const second = new Mesh("part", scene);
        second.id = first.id;
        const context = graph.createContext();
        block.targetMeshes.setValue([second], context);

        const serialized = JSON.parse(SerializationTools.Serialize(graph, globalState));
        const newScene = new Scene(engine);
        const newFirst = new Mesh("part", newScene);
        const newSecond = new Mesh("part", newScene);
        newSecond.id = newFirst.id;
        const restored = await SerializationTools.DeserializeToStateAsync(serialized, newScene);
        const restoredBlock = restored.coordinator.flowGraphs[0]
            .getAllBlocks()
            .find((candidate) => candidate.getClassName() === block.getClassName()) as FlowGraphMeshIntersectionEventBlock;

        expect(restoredBlock.targetMeshes.getValue(restored.coordinator.flowGraphs[0].getContext(0)!)).toEqual([newSecond]);

        restored.coordinator.dispose();
        globalState.dispose();
        coordinator.dispose();
        newScene.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("keeps a duplicate pick target across scene replacement", () => {
        const engine = new NullEngine();
        const oldScene = new Scene(engine);
        const oldFirst = new Mesh("part", oldScene);
        const oldSecond = new Mesh("part", oldScene);
        oldSecond.id = oldFirst.id;
        const coordinator = new FlowGraphCoordinator({ scene: oldScene });
        const graph = coordinator.createGraph();
        const block = new FlowGraphMeshPickEventBlock({ targetMesh: oldSecond });
        graph.addEventBlock(block);
        const globalState = new GlobalState(oldScene);
        globalState.sceneContext = new SceneContext(oldScene, false);
        globalState.coordinator = coordinator;
        (globalState.stateManager as any).storeEditorData = vi.fn();

        const newScene = new Scene(engine);
        const newFirst = new Mesh("part", newScene);
        const newSecond = new Mesh("part", newScene);
        newSecond.id = newFirst.id;
        const replacementContext = new SceneContext(newScene, false);
        globalState.sceneContext = replacementContext;
        globalState.onSceneContextChanged.notifyObservers(replacementContext);

        expect((block.asset as any)._defaultValue).toBe(newSecond);
        expect((block.config as any).targetMesh).toBe(newSecond);

        globalState.dispose();
        replacementContext.dispose();
        coordinator.dispose();
        newScene.dispose();
        oldScene.dispose();
        engine.dispose();
    });

    it("instruments event blocks created through the composite-template path", async () => {
        vi.stubGlobal(
            "requestAnimationFrame",
            vi.fn(() => 1)
        );
        vi.stubGlobal("cancelAnimationFrame", vi.fn());
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const coordinator = new FlowGraphCoordinator({ scene });
        const graph = coordinator.createGraph();
        const context = graph.createContext();
        const globalState = new GlobalState(scene);
        globalState.coordinator = coordinator;
        coordinator.start();
        globalState.isDebugMode = true;
        const messages: string[] = [];
        globalState.onDebugLogRequiredObservable.add(({ message }) => messages.push(message));
        const createdNodes: any[] = [];
        const editor = {
            props: { globalState },
            _graphCanvas: {
                zoom: 1,
                x: 0,
                y: 0,
                connectNodes: vi.fn(),
            },
            appendBlock: (block: any) => {
                const node = {
                    content: { data: block },
                    inputPorts: [...block.signalInputs, ...block.dataInputs].map((portData: any) => ({ portData })),
                    outputPorts: [...block.signalOutputs, ...block.dataOutputs].map((portData: any) => ({ portData })),
                    addClassToVisual: vi.fn(),
                    cleanAccumulation: vi.fn(),
                    x: 0,
                    y: 0,
                };
                createdNodes.push(node);
                return node;
            },
            setState: vi.fn(),
        };

        await (GraphEditor.prototype as any)._emitTemplateAsync.call(editor, CreateIntersectionPlaySoundTemplate(), 0, 0);

        const eventBlock = createdNodes.map((node) => node.content.data).find((block) => block instanceof FlowGraphMeshIntersectionEventBlock);
        expect(eventBlock).toBeInstanceOf(FlowGraphMeshIntersectionEventBlock);
        eventBlock.onEnter._activateSignal(context);
        expect(messages).toEqual([`Event fired: ${eventBlock.name} (onEnter)`]);

        globalState.dispose();
        coordinator.dispose();
        scene.dispose();
        engine.dispose();
    });
});
import { FlowGraphConstantBlock } from "core/FlowGraph/Blocks/Data/flowGraphConstantBlock";
import { FlowGraphGetPropertyBlock } from "core/FlowGraph/Blocks/Data/flowGraphGetPropertyBlock.pure";
import { FlowGraphMeshPickEventBlock } from "core/FlowGraph/Blocks/Event/flowGraphMeshPickEventBlock.pure";
