import type { Engine } from "core/Engines";
import { NullEngine } from "core/Engines";
import type { FlowGraph, FlowGraphContext } from "core/FlowGraph";
import { FlowGraphCoordinator, FlowGraphLogBlock, FlowGraphReceiveCustomEventBlock, FlowGraphSceneReadyEventBlock, FlowGraphSendCustomEventBlock } from "core/FlowGraph";
import { Scene } from "core/scene";

describe("Flow Graph Event Nodes", () => {
    let engine: Engine;
    let scene: Scene;
    let flowGraphCoordinator: FlowGraphCoordinator;
    let flowGraph: FlowGraph;
    let flowGraphContext: FlowGraphContext;

    beforeEach(() => {
        console.log = jest.fn();
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });

        scene = new Scene(engine);
        flowGraphCoordinator = new FlowGraphCoordinator({ scene });
        flowGraph = flowGraphCoordinator.createGraph();
        flowGraphContext = flowGraph.createContext();
    });

    it("Custom Event Block", () => {
        const receiverGraph = flowGraphCoordinator.createGraph();

        const sceneReady = new FlowGraphSceneReadyEventBlock({ name: "SceneReady" });
        flowGraph.addEventBlock(sceneReady);

        const sendEvent = new FlowGraphSendCustomEventBlock({ name: "SendEvent" });
        sendEvent.eventId.setValue("testEvent", flowGraphContext);
        sendEvent.eventData.setValue(42, flowGraphContext);
        sceneReady.onDone.connectTo(sendEvent.onStart);

        const receiveEvent = new FlowGraphReceiveCustomEventBlock({ eventId: "testEvent", name: "ReceiveEvent" });
        receiverGraph.addEventBlock(receiveEvent);

        const runCustomFunction = new FlowGraphLogBlock({ name: "Log" });
        receiveEvent.onDone.connectTo(runCustomFunction.onStart);
        receiveEvent.eventData.connectTo(runCustomFunction.message);

        flowGraph.start();
        receiverGraph.start();

        // This will activate the sendEvent block and send the event to the receiverGraph
        scene.onReadyObservable.notifyObservers(scene);

        expect(console.log).toHaveBeenCalledWith(42);
    });
});
