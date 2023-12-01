import type { Engine } from "core/Engines";
import { NullEngine } from "core/Engines";
import type { FlowGraph, FlowGraphContext } from "core/FlowGraph";
import { FlowGraphCoordinator, FlowGraphConsoleLogBlock, FlowGraphReceiveCustomEventBlock, FlowGraphSceneReadyEventBlock, FlowGraphSendCustomEventBlock } from "core/FlowGraph";
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

        const sendEvent = new FlowGraphSendCustomEventBlock({ eventId: "testEvent", eventData: ["testData"] });
        const sendEventDataNode = sendEvent.getDataInput("testData");
        expect(sendEventDataNode).toBeDefined();
        sendEventDataNode?.setValue(42, flowGraphContext);
        sceneReady.out.connectTo(sendEvent.in);

        const receiveEvent = new FlowGraphReceiveCustomEventBlock({ eventId: "testEvent", eventData: ["testData"] });
        receiverGraph.addEventBlock(receiveEvent);

        const consoleLogBlock = new FlowGraphConsoleLogBlock({ name: "Log" });
        receiveEvent.out.connectTo(consoleLogBlock.in);
        const receiveEventDataNode = receiveEvent.getDataOutput("testData");
        expect(receiveEventDataNode).toBeDefined();
        receiveEventDataNode?.connectTo(consoleLogBlock.message);

        flowGraph.start();
        receiverGraph.start();

        // This will activate the sendEvent block and send the event to the receiverGraph
        scene.onReadyObservable.notifyObservers(scene);

        expect(console.log).toHaveBeenCalledWith(42);
    });
});
