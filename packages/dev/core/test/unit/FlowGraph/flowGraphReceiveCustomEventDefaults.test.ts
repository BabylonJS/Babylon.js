import { type Engine, NullEngine } from "core/Engines";
import { type FlowGraph, type FlowGraphContext, FlowGraphCoordinator, FlowGraphReceiveCustomEventBlock } from "core/FlowGraph";
import { RichTypeNumber, RichTypeString } from "core/FlowGraph/flowGraphRichTypes";
import { Scene } from "core/scene";

/**
 * A custom event receiver drives its outputs from the payload schema it was configured with, so a
 * key the sender omits resets to its default rather than retaining the value from a previous
 * dispatch.
 */
describe("FlowGraphReceiveCustomEventBlock payload defaults", () => {
    let engine: Engine;
    let scene: Scene;
    let coordinator: FlowGraphCoordinator;
    let graph: FlowGraph;
    let context: FlowGraphContext;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        coordinator = new FlowGraphCoordinator({ scene });
        coordinator.dispatchEventsSynchronously = true;
        graph = coordinator.createGraph();
        context = graph.createContext();
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    const createReceiver = (eventData: any) => {
        const block = new FlowGraphReceiveCustomEventBlock({ eventId: "myEvent", eventData });
        graph.addEventBlock(block);
        graph.start();
        return block;
    };

    it("keeps values the sender provides", () => {
        const block = createReceiver({ amount: { type: RichTypeNumber } });

        coordinator.notifyCustomEvent("myEvent", { amount: 42 }, false);

        expect(block.getDataOutput("amount")!.getValue(context)).toBe(42);
    });

    it("resets an omitted key to its schema default instead of retaining the previous value", () => {
        const block = createReceiver({ amount: { type: RichTypeNumber, value: 7 } });

        coordinator.notifyCustomEvent("myEvent", { amount: 42 }, false);
        expect(block.getDataOutput("amount")!.getValue(context)).toBe(42);

        // The sender omits the key entirely on the second dispatch.
        coordinator.notifyCustomEvent("myEvent", {}, false);
        expect(block.getDataOutput("amount")!.getValue(context)).toBe(7);
    });

    it("does not write an explicit undefined over the configured default", () => {
        const block = createReceiver({ label: { type: RichTypeString, value: "idle" } });

        coordinator.notifyCustomEvent("myEvent", { label: undefined }, false);

        expect(block.getDataOutput("label")!.getValue(context)).toBe("idle");
    });

    it("falls back to the socket type default when the schema declares none", () => {
        const block = createReceiver({ amount: { type: RichTypeNumber } });

        coordinator.notifyCustomEvent("myEvent", { amount: 5 }, false);
        expect(block.getDataOutput("amount")!.getValue(context)).toBe(5);

        coordinator.notifyCustomEvent("myEvent", {}, false);
        expect(block.getDataOutput("amount")!.getValue(context)).toBe(0);
    });

    it("resets only the omitted keys of a multi-value payload", () => {
        const block = createReceiver({
            amount: { type: RichTypeNumber, value: 1 },
            label: { type: RichTypeString, value: "idle" },
        });

        coordinator.notifyCustomEvent("myEvent", { amount: 9, label: "running" }, false);
        expect(block.getDataOutput("amount")!.getValue(context)).toBe(9);
        expect(block.getDataOutput("label")!.getValue(context)).toBe("running");

        coordinator.notifyCustomEvent("myEvent", { amount: 10 }, false);
        expect(block.getDataOutput("amount")!.getValue(context)).toBe(10);
        expect(block.getDataOutput("label")!.getValue(context)).toBe("idle");
    });
});
