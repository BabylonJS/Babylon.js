import type { Engine } from "core/Engines";
import { NullEngine } from "core/Engines";
import type { FlowGraph, FlowGraphContext } from "core/FlowGraph";
import { FlowGraphCoordinator, FlowGraphReceiveCustomEventBlock, FlowGraphSceneReadyEventBlock, FlowGraphSendCustomEventBlock } from "core/FlowGraph";
import { FlowGraphCustomFunctionBlock } from "core/FlowGraph/Blocks/Execution/flowGraphCustomFunctionBlock";
import { Scene } from "core/scene";

describe("Flow Graph Event Nodes", () => {
    let engine: Engine;
    let scene: Scene;
    let flowGraphCoordinator: FlowGraphCoordinator;
    let flowGraph: FlowGraph;
    let flowGraphContext: FlowGraphContext;

    beforeEach(() => {
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

        const customFunction = jest.fn();

        const sceneReady = new FlowGraphSceneReadyEventBlock();
        flowGraph.addEventBlock(sceneReady);

        const sendEvent = new FlowGraphSendCustomEventBlock();
        sendEvent.eventId.setValue("testEvent", flowGraphContext);
        sendEvent.eventData.setValue(42, flowGraphContext);
        sceneReady.onDone.connectTo(sendEvent.onStart);

        const receiveEvent = new FlowGraphReceiveCustomEventBlock({ eventId: "testEvent" });
        receiverGraph.addEventBlock(receiveEvent);

        const runCustomFunction = new FlowGraphCustomFunctionBlock({ customFunction });
        receiveEvent.onDone.connectTo(runCustomFunction.onStart);
        receiveEvent.eventData.connectTo(runCustomFunction.input);

        flowGraph.start();
        receiverGraph.start();

        // This will activate the sendEvent block and send the event to the receiverGraph
        scene.onReadyObservable.notifyObservers(scene);

        expect(customFunction).toHaveBeenCalledWith(42);
    });
});
