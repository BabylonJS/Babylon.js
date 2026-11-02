import { NullEngine } from "core/Engines/nullEngine";
import { FlowGraphMeshIntersectionEventBlock } from "core/FlowGraph/Blocks/Event/flowGraphMeshIntersectionEventBlock.pure";
import { FlowGraphSceneReadyEventBlock } from "core/FlowGraph/Blocks/Event/flowGraphSceneReadyEventBlock.pure";
import { FlowGraphPlaySoundBlock } from "core/FlowGraph/Blocks/Execution/Audio/flowGraphPlaySoundBlock.pure";
import { FlowGraphCoordinator } from "core/FlowGraph/flowGraphCoordinator";
import { type AbstractMesh } from "core/Meshes/abstractMesh";
import { Mesh } from "core/Meshes/mesh";
import { Scene } from "core/scene";
import { LogEntry, LogEntryBuffer } from "flow-graph-editor/components/log/logComponent";
import { ResolveIntersectionMeshDefaults } from "flow-graph-editor/graphSystem/properties/meshIntersectionPropertyComponent";
import { GlobalState } from "flow-graph-editor/globalState";
import { SerializationTools } from "flow-graph-editor/serializationTools";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("review feedback regressions", () => {
    it("preserves unresolved intersection mesh defaults until all replacements are available", () => {
        const source = { name: "source", uniqueId: 1 } as AbstractMesh;
        const targetA = { name: "target-a", uniqueId: 2 } as AbstractMesh;
        const targetB = { name: "target-b", uniqueId: 3 } as AbstractMesh;
        const partialTargetA = { name: "target-a", uniqueId: 20 } as AbstractMesh;

        const partial = ResolveIntersectionMeshDefaults([partialTargetA], source, [targetA, targetB], source.name, [targetA.name, targetB.name]);
        expect(partial).toMatchObject({
            sourceMesh: source,
            targetMeshes: [targetA, targetB],
            resolvedSourceMesh: undefined,
            resolvedTargetMeshes: undefined,
        });

        const replacementSource = { name: "source", uniqueId: 10 } as AbstractMesh;
        const replacementTargetB = { name: "target-b", uniqueId: 30 } as AbstractMesh;
        const complete = ResolveIntersectionMeshDefaults([replacementSource, partialTargetA, replacementTargetB], source, [targetA, targetB], source.name, [
            targetA.name,
            targetB.name,
        ]);
        expect(complete).toMatchObject({
            sourceMesh: replacementSource,
            targetMeshes: [partialTargetA, replacementTargetB],
            resolvedSourceMesh: replacementSource,
            resolvedTargetMeshes: [partialTargetA, replacementTargetB],
        });
    });

    it("does not collapse duplicate target mesh names while one reference is unresolved", () => {
        const firstTarget = { name: "part", uniqueId: 1 } as AbstractMesh;
        const secondTarget = { name: "part", uniqueId: 2 } as AbstractMesh;
        const replacement = { name: "part", uniqueId: 10 } as AbstractMesh;

        const result = ResolveIntersectionMeshDefaults([replacement], undefined, [firstTarget, secondTarget], undefined, ["part", "part"]);

        expect(result.targetMeshes).toEqual([firstTarget, secondTarget]);
        expect(result.resolvedTargetMeshes).toBeUndefined();
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
});
