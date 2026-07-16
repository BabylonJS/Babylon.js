import { type Engine, NullEngine } from "core/Engines";
import { FlowGraphCoordinator } from "core/FlowGraph";
import { GetEventReference } from "core/FlowGraph/flowGraphEventReference";
import { FlowGraphConsoleLogBlock } from "core/FlowGraph/Blocks/Execution/flowGraphConsoleLogBlock";
import { Scene } from "core/scene";

describe("FlowGraphCoordinator", () => {
    let engine: Engine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(engine);
        // Clear the static map to isolate tests
        FlowGraphCoordinator.SceneCoordinators.clear();
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
        FlowGraphCoordinator.SceneCoordinators.clear();
    });

    describe("SceneCoordinators registration", () => {
        it("should register a coordinator in SceneCoordinators on construction", () => {
            const coordinator = new FlowGraphCoordinator({ scene });

            const registered = FlowGraphCoordinator.SceneCoordinators.get(scene);
            expect(registered).toBeDefined();
            expect(registered).toContain(coordinator);
        });

        it("should register multiple coordinators for the same scene", () => {
            const coordinator1 = new FlowGraphCoordinator({ scene });
            const coordinator2 = new FlowGraphCoordinator({ scene });

            const registered = FlowGraphCoordinator.SceneCoordinators.get(scene);
            expect(registered).toBeDefined();
            expect(registered).toHaveLength(2);
            expect(registered).toContain(coordinator1);
            expect(registered).toContain(coordinator2);
        });

        it("should keep coordinators for different scenes separate", () => {
            const scene2 = new Scene(engine);
            const coordinator1 = new FlowGraphCoordinator({ scene });
            const coordinator2 = new FlowGraphCoordinator({ scene: scene2 });

            const forScene1 = FlowGraphCoordinator.SceneCoordinators.get(scene);
            const forScene2 = FlowGraphCoordinator.SceneCoordinators.get(scene2);

            expect(forScene1).toHaveLength(1);
            expect(forScene1).toContain(coordinator1);
            expect(forScene2).toHaveLength(1);
            expect(forScene2).toContain(coordinator2);

            scene2.dispose();
        });

        it("should remove coordinator from SceneCoordinators on dispose", () => {
            const coordinator = new FlowGraphCoordinator({ scene });

            expect(FlowGraphCoordinator.SceneCoordinators.get(scene)).toContain(coordinator);

            coordinator.dispose();

            const registered = FlowGraphCoordinator.SceneCoordinators.get(scene);
            expect(registered).not.toContain(coordinator);
        });

        it("should only remove the disposed coordinator, leaving others intact", () => {
            const coordinator1 = new FlowGraphCoordinator({ scene });
            const coordinator2 = new FlowGraphCoordinator({ scene });

            coordinator1.dispose();

            const registered = FlowGraphCoordinator.SceneCoordinators.get(scene);
            expect(registered).toHaveLength(1);
            expect(registered).toContain(coordinator2);
        });
    });

    describe("custom event propagation", () => {
        it("should keep activating immediate handlers when stopImmediate is false", () => {
            const coordinator = new FlowGraphCoordinator({ scene });
            const eventId = "test";
            const calls: string[] = [];
            const observable = coordinator.getCustomEventObservable(eventId);

            observable.add((_data, state) => {
                calls.push("A");
                coordinator._beginEventDispatch(eventId, state);
                try {
                    coordinator.stopEventPropagation(GetEventReference(eventId), false);
                } finally {
                    coordinator._endEventDispatch();
                }
            });
            observable.add(() => calls.push("B"));

            coordinator.notifyCustomEvent(eventId, {}, false);

            expect(calls).toEqual(["A", "B"]);
        });

        it("should stop remaining immediate handlers when stopImmediate is true", () => {
            const coordinator = new FlowGraphCoordinator({ scene });
            const eventId = "test";
            const calls: string[] = [];
            const observable = coordinator.getCustomEventObservable(eventId);

            observable.add((_data, state) => {
                calls.push("A");
                coordinator._beginEventDispatch(eventId, state);
                try {
                    coordinator.stopEventPropagation(GetEventReference(eventId), true);
                } finally {
                    coordinator._endEventDispatch();
                }
            });
            observable.add(() => calls.push("B"));

            coordinator.notifyCustomEvent(eventId, {}, false);

            expect(calls).toEqual(["A"]);
        });
    });

    describe("Flow graph add/remove observables", () => {
        it("should notify OnFlowGraphAddedObservable when a graph is created", () => {
            const coordinator = new FlowGraphCoordinator({ scene });
            const added: unknown[] = [];
            const observer = FlowGraphCoordinator.OnFlowGraphAddedObservable.add((graph) => added.push(graph));

            const graph = coordinator.createGraph();

            expect(added).toHaveLength(1);
            expect(added[0]).toBe(graph);

            observer.remove();
        });

        it("should notify OnFlowGraphRemovedObservable when a graph is removed", () => {
            const coordinator = new FlowGraphCoordinator({ scene });
            const graph = coordinator.createGraph();
            const removed: unknown[] = [];
            const observer = FlowGraphCoordinator.OnFlowGraphRemovedObservable.add((g) => removed.push(g));

            coordinator.removeGraph(graph);

            expect(removed).toHaveLength(1);
            expect(removed[0]).toBe(graph);

            observer.remove();
        });

        it("should notify OnFlowGraphRemovedObservable for each graph on dispose", () => {
            const coordinator = new FlowGraphCoordinator({ scene });
            const graph1 = coordinator.createGraph();
            const graph2 = coordinator.createGraph();
            const removed: unknown[] = [];
            const observer = FlowGraphCoordinator.OnFlowGraphRemovedObservable.add((g) => removed.push(g));

            coordinator.dispose();

            expect(removed).toHaveLength(2);
            expect(removed).toContain(graph1);
            expect(removed).toContain(graph2);

            observer.remove();
        });
    });

    describe("Graph disposal teardown", () => {
        it("should tear down scene event observers when a never-started graph is removed", () => {
            const coordinator = new FlowGraphCoordinator({ scene });
            const before = scene.onBeforeRenderObservable.observers.length;

            // A freshly created graph is in the Stopped state but its scene event
            // coordinator already attached per-frame/pointer/keyboard observers.
            const graph = coordinator.createGraph();
            expect(scene.onBeforeRenderObservable.observers.length).toBeGreaterThan(before);

            // Removing it (without ever starting it) must dispose those observers.
            coordinator.removeGraph(graph);
            expect(scene.onBeforeRenderObservable.observers.length).toBe(before);
        });

        it("should preserve authored blocks when a stopped graph is disposed", () => {
            // The editor re-points a stopped graph across preview scenes; each preview scene
            // disposal raises a SceneDispose event that calls dispose(). That must release the
            // scene wiring without destroying the user's authored blocks.
            const coordinator = new FlowGraphCoordinator({ scene });
            const graph = coordinator.createGraph();
            graph.addBlock(new FlowGraphConsoleLogBlock());
            expect(graph.getAllBlocks().length).toBe(1);

            const before = scene.onBeforeRenderObservable.observers.length;
            graph.dispose();

            // Scene wiring released, but the authored block survives.
            expect(scene.onBeforeRenderObservable.observers.length).toBeLessThan(before);
            expect(graph.getAllBlocks().length).toBe(1);
        });

        it("should be safe to dispose a graph twice", () => {
            const coordinator = new FlowGraphCoordinator({ scene });
            const graph = coordinator.createGraph();
            graph.dispose();
            expect(() => graph.dispose()).not.toThrow();
        });
    });
});
