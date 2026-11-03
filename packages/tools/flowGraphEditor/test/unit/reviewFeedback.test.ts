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
import { GraphEditor } from "flow-graph-editor/graphEditor";
import { MeshIntersectionPropertyComponent } from "flow-graph-editor/graphSystem/properties/meshIntersectionPropertyComponent";
import { GlobalState } from "flow-graph-editor/globalState";
import { SceneContext } from "flow-graph-editor/sceneContext";
import { SerializationTools } from "flow-graph-editor/serializationTools";
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

    it("retains duplicate mesh provenance referenced by an inactive graph", () => {
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

        const newScene = new Scene(engine);
        const newFirst = new Mesh("part", newScene);
        newFirst.id = oldFirst.id;
        const replacementContext = new SceneContext(newScene, false);
        globalState.sceneContext = replacementContext;
        globalState.onSceneContextChanged.notifyObservers(replacementContext);
        expect(((globalState as any)._cachedOldNodeLocations as Map<number, unknown>).has(oldSecond.uniqueId)).toBe(true);

        globalState.activeGraphIndex = 1;

        expect(inactiveBlock.targetMeshes.getValue(inactiveGraph.getContext(0)!)).toEqual([oldSecond]);

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
        expect((missingBlock.targetMeshes as any)._defaultValue[0]).toBe(survivingFirst);

        missingRestored.coordinator.dispose();
        globalState.dispose();
        coordinator.dispose();
        missingScene.dispose();
        newScene.dispose();
        oldScene.dispose();
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
        (block.targetMeshes as any)._defaultValue = [second];

        const serialized = JSON.parse(SerializationTools.Serialize(graph, globalState));
        const newScene = new Scene(engine);
        const newFirst = new Mesh("part", newScene);
        const newSecond = new Mesh("part", newScene);
        newSecond.id = newFirst.id;
        const restored = await SerializationTools.DeserializeToStateAsync(serialized, newScene);
        const restoredBlock = restored.coordinator.flowGraphs[0]
            .getAllBlocks()
            .find((candidate) => candidate.getClassName() === block.getClassName()) as FlowGraphMeshIntersectionEventBlock;

        expect((restoredBlock.targetMeshes as any)._defaultValue).toEqual([newSecond]);

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
import { FlowGraphMeshPickEventBlock } from "core/FlowGraph/Blocks/Event/flowGraphMeshPickEventBlock.pure";
