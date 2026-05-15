import { type Engine, NullEngine } from "core/Engines";
import { FlowGraphCoordinator, ParseFlowGraphContext } from "core/FlowGraph";
import { type FlowGraph } from "core/FlowGraph/flowGraph";
import { Logger } from "core/Misc/logger";
import { Scene } from "core/scene";

describe("FlowGraphContext", () => {
    let engine: Engine;
    let scene: Scene;
    let coordinator: FlowGraphCoordinator;
    let flowGraph: FlowGraph;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        Logger.Log = vi.fn();
        scene = new Scene(engine);
        coordinator = new FlowGraphCoordinator({ scene });
        flowGraph = coordinator.createGraph();
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    describe("name property", () => {
        it("defaults to an empty string", () => {
            const ctx = flowGraph.createContext();
            expect(ctx.name).toBe("");
        });

        it("can be set and read back", () => {
            const ctx = flowGraph.createContext();
            ctx.name = "My Context";
            expect(ctx.name).toBe("My Context");
        });

        it("serializes and deserializes the name", () => {
            const ctx = flowGraph.createContext();
            ctx.name = "Test Context";
            ctx.setVariable("score", 42);

            const serialized: any = {};
            ctx.serialize(serialized);

            expect(serialized.name).toBe("Test Context");

            // Parse back
            const restored = ParseFlowGraphContext(serialized, { graph: flowGraph });
            expect(restored.name).toBe("Test Context");
            expect(restored.userVariables["score"]).toBe(42);
        });

        it("defaults to empty string when name is absent in serialized data", () => {
            const ctx = flowGraph.createContext();
            const serialized: any = {};
            ctx.serialize(serialized);
            delete serialized.name; // Simulate old format without name

            const restored = ParseFlowGraphContext(serialized, { graph: flowGraph });
            expect(restored.name).toBe("");
        });
    });

    describe("contextCount", () => {
        it("returns 0 when no contexts are created", () => {
            expect(flowGraph.contextCount).toBe(0);
        });

        it("increments when contexts are created", () => {
            flowGraph.createContext();
            expect(flowGraph.contextCount).toBe(1);
            flowGraph.createContext();
            expect(flowGraph.contextCount).toBe(2);
        });
    });

    describe("removeContext", () => {
        it("removes a context at the given index", () => {
            const ctx0 = flowGraph.createContext();
            ctx0.name = "First";
            const ctx1 = flowGraph.createContext();
            ctx1.name = "Second";
            const ctx2 = flowGraph.createContext();
            ctx2.name = "Third";

            expect(flowGraph.contextCount).toBe(3);

            const removed = flowGraph.removeContext(1);
            expect(removed).toBe(ctx1);
            expect(removed!.name).toBe("Second");
            expect(flowGraph.contextCount).toBe(2);

            // Remaining contexts shifted
            expect(flowGraph.getContext(0).name).toBe("First");
            expect(flowGraph.getContext(1).name).toBe("Third");
        });

        it("returns undefined for out of range index", () => {
            flowGraph.createContext();
            expect(flowGraph.removeContext(-1)).toBeUndefined();
            expect(flowGraph.removeContext(5)).toBeUndefined();
            expect(flowGraph.contextCount).toBe(1);
        });

        it("removes the first context", () => {
            const ctx0 = flowGraph.createContext();
            ctx0.name = "A";
            const ctx1 = flowGraph.createContext();
            ctx1.name = "B";

            flowGraph.removeContext(0);
            expect(flowGraph.contextCount).toBe(1);
            expect(flowGraph.getContext(0).name).toBe("B");
        });

        it("removes the last context", () => {
            const ctx0 = flowGraph.createContext();
            ctx0.name = "A";
            const ctx1 = flowGraph.createContext();
            ctx1.name = "B";

            flowGraph.removeContext(1);
            expect(flowGraph.contextCount).toBe(1);
            expect(flowGraph.getContext(0).name).toBe("A");
        });
    });

    describe("name round-trip via full graph serialize/parse", () => {
        it("preserves context names through graph serialization", async () => {
            const ctx0 = flowGraph.createContext();
            ctx0.name = "Player 1";
            ctx0.setVariable("health", 100);

            const ctx1 = flowGraph.createContext();
            ctx1.name = "Player 2";
            ctx1.setVariable("health", 80);

            const serialized: any = {};
            flowGraph.serialize(serialized);

            expect(serialized.executionContexts).toHaveLength(2);
            expect(serialized.executionContexts[0].name).toBe("Player 1");
            expect(serialized.executionContexts[1].name).toBe("Player 2");

            // Parse into a new graph — use ParseFlowGraph (sync) since there are no blocks to resolve
            const newCoordinator = new FlowGraphCoordinator({ scene });
            const newGraph = newCoordinator.createGraph();
            for (const ctxData of serialized.executionContexts) {
                ParseFlowGraphContext(ctxData, { graph: newGraph });
            }
            expect(newGraph.contextCount).toBe(2);
            expect(newGraph.getContext(0).name).toBe("Player 1");
            expect(newGraph.getContext(0).userVariables["health"]).toBe(100);
            expect(newGraph.getContext(1).name).toBe("Player 2");
            expect(newGraph.getContext(1).userVariables["health"]).toBe(80);
        });
    });

    describe("independent variable state per context", () => {
        it("contexts have independent user variable namespaces", () => {
            const ctx0 = flowGraph.createContext();
            const ctx1 = flowGraph.createContext();

            ctx0.setVariable("score", 10);
            ctx1.setVariable("score", 20);

            expect(ctx0.getVariable("score")).toBe(10);
            expect(ctx1.getVariable("score")).toBe(20);

            ctx0.setVariable("score", 15);
            expect(ctx0.getVariable("score")).toBe(15);
            expect(ctx1.getVariable("score")).toBe(20);
        });
    });
});
