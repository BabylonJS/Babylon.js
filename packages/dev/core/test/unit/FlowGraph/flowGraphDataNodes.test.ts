import type { Engine } from "core/Engines";
import { NullEngine } from "core/Engines";
import type { FlowGraph, FlowGraphContext } from "core/FlowGraph";
import { FlowGraphCoordinator, FlowGraphGetVariableBlock, FlowGraphReceiveCustomEventBlock, FlowGraphSceneReadyEventBlock, FlowGraphSendCustomEventBlock } from "core/FlowGraph";
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

    it("Variable Block", () => {
        const customFunction = jest.fn();

        const sceneReady = new FlowGraphSceneReadyEventBlock();
        flowGraph.addEventBlock(sceneReady);

        const runCustomFunction = new FlowGraphCustomFunctionBlock({ customFunction });
        sceneReady.onDone.connectTo(runCustomFunction.onStart);

        const getVariable = new FlowGraphGetVariableBlock();
        getVariable.variableName.setValue("testVariable", flowGraphContext);

        flowGraphContext.setVariable("testVariable", 42);
        runCustomFunction.input.connectTo(getVariable.output);

        // Test in a different context
        const flowGraphContext2 = flowGraph.createContext();
        getVariable.variableName.setValue("testVariable", flowGraphContext2);
        flowGraphContext2.setVariable("testVariable", 43);

        flowGraph.start();
        scene.onReadyObservable.notifyObservers(scene);

        expect(customFunction).toHaveBeenCalledWith(42);
        expect(customFunction).toHaveBeenCalledWith(43);
    });
});
