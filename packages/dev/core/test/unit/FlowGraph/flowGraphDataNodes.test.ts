import type { Engine } from "core/Engines";
import { NullEngine } from "core/Engines";
import type { FlowGraph, FlowGraphContext } from "core/FlowGraph";
import { FlowGraphCoordinator, FlowGraphGetVariableBlock, FlowGraphSceneReadyEventBlock, FlowGraphLogBlock } from "core/FlowGraph";
import { Scene } from "core/scene";

describe("Flow Graph Data Nodes", () => {
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

    it("Variable Block", () => {
        const sceneReady = new FlowGraphSceneReadyEventBlock({ name: "SceneReady" });
        flowGraph.addEventBlock(sceneReady);

        const runCustomFunction = new FlowGraphLogBlock({ name: "Log" });
        sceneReady.onDone.connectTo(runCustomFunction.onStart);

        const getVariable = new FlowGraphGetVariableBlock();
        getVariable.variableName.setValue("testVariable", flowGraphContext);

        flowGraphContext.setVariable("testVariable", 42);
        runCustomFunction.message.connectTo(getVariable.output);

        // Test in a different context
        const flowGraphContext2 = flowGraph.createContext();
        getVariable.variableName.setValue("testVariable", flowGraphContext2);
        flowGraphContext2.setVariable("testVariable", 43);

        flowGraph.start();
        scene.onReadyObservable.notifyObservers(scene);

        expect(console.log).toHaveBeenCalledWith(42);
        expect(console.log).toHaveBeenCalledWith(43);
    });
});
