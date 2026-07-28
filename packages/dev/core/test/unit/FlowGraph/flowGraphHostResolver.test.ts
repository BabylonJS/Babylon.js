import { type Engine, NullEngine } from "core/Engines";
import {
    type FlowGraph,
    type FlowGraphContext,
    FlowGraphCoordinator,
    FlowGraphSceneReadyEventBlock,
    FlowGraphSceneTickEventBlock,
    FlowGraphReceiveCustomEventBlock,
} from "core/FlowGraph";
import { type IFlowGraphHostResolver, FlowGraphDefaultEventReferencePrefix } from "core/FlowGraph/flowGraphHostResolver";
import { RichTypeNumber } from "core/FlowGraph/flowGraphRichTypes";
import { Scene } from "core/scene";

/**
 * The flow graph engine must stay agnostic of how the environment hosting it represents runtime
 * entities as opaque references. Without a host resolver it uses a neutral built-in representation;
 * a host (e.g. the glTF KHR_interactivity loader) can replace it entirely.
 */
describe("FlowGraph host resolver", () => {
    let engine: Engine;
    let scene: Scene;

    const createGraph = (hostResolver?: IFlowGraphHostResolver): { graph: FlowGraph; context: FlowGraphContext } => {
        const coordinator = new FlowGraphCoordinator({ scene, hostResolver });
        const graph = coordinator.createGraph();
        return { graph, context: graph.createContext() };
    };

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    describe("without a host resolver", () => {
        it("uses a neutral event reference that names no specific consumer", () => {
            const { context } = createGraph();
            const reference = context.getEventReference("sceneReady");

            expect(reference.startsWith(FlowGraphDefaultEventReferencePrefix)).toBe(true);
            expect(reference).not.toContain("KHR");
            expect(reference).not.toContain("extensions");
        });

        it("produces equal references for the same event source and different ones otherwise", () => {
            const { context } = createGraph();

            expect(context.getEventReference("sceneTick")).toBe(context.getEventReference("sceneTick"));
            expect(context.getEventReference("sceneTick")).not.toBe(context.getEventReference("sceneReady"));
        });

        it("cannot address a runtime object", () => {
            const { context } = createGraph();
            expect(context.getObjectReference({})).toBeUndefined();
        });

        it.each([
            ["scene ready", () => new FlowGraphSceneReadyEventBlock()],
            ["scene tick", () => new FlowGraphSceneTickEventBlock()],
            ["custom event receiver", () => new FlowGraphReceiveCustomEventBlock({ eventId: "myEvent", eventData: {} })],
        ])("exposes a neutral event output on the %s block", (_name, createBlock) => {
            const { graph, context } = createGraph();
            const block = createBlock();
            graph.addEventBlock(block as FlowGraphSceneReadyEventBlock);

            expect(block.eventRef.getValue(context)).not.toContain("KHR");
        });
    });

    describe("with a host resolver", () => {
        const hostResolver: IFlowGraphHostResolver = {
            encodeEventReference: (key) => `/host/events/${key}`,
            decodeEventReference: (reference) => (reference.startsWith("/host/events/") ? reference.substring("/host/events/".length) : undefined),
            getObjectReference: (_object, hint) => (hint ? `/${hint}/7` : "/things/7"),
        };

        it("delegates event references to the host", () => {
            const { context } = createGraph(hostResolver);
            expect(context.getEventReference("sceneReady")).toBe("/host/events/sceneReady");
        });

        it("uses the host reference on an event block output", () => {
            const { graph, context } = createGraph(hostResolver);
            const block = new FlowGraphSceneReadyEventBlock();
            graph.addEventBlock(block);

            expect(block.eventRef.getValue(context)).toBe("/host/events/sceneReady");
        });

        it("delegates custom event receiver references to the host", () => {
            const { graph, context } = createGraph(hostResolver);
            const block = new FlowGraphReceiveCustomEventBlock({ eventId: "myEvent", eventData: { amount: { type: RichTypeNumber } } });
            graph.addEventBlock(block);

            expect(block.eventRef.getValue(context)).toBe("/host/events/myEvent");
        });

        it("delegates object references to the host, forwarding the disambiguation hint", () => {
            const { context } = createGraph(hostResolver);

            expect(context.getObjectReference({})).toBe("/things/7");
            expect(context.getObjectReference({}, "nodes")).toBe("/nodes/7");
        });

        it("decodes a host event reference when stopping propagation", () => {
            const { graph } = createGraph(hostResolver);
            // An unknown reference format must be ignored rather than throwing.
            expect(() => graph.coordinator.stopEventPropagation("/not/an/event", true)).not.toThrow();
            expect(() => graph.coordinator.stopEventPropagation("/host/events/myEvent", true)).not.toThrow();
        });
    });
});
