import type { Engine } from "core/Engines";
import { NullEngine } from "core/Engines";
import type { FlowGraph, FlowGraphContext } from "core/FlowGraph";
import { FlowGraphCoordinator, FlowGraphGetVariableBlock, FlowGraphSceneReadyEventBlock, FlowGraphConsoleLogBlock, FlowGraphAddBlock, FlowGraphRandomBlock } from "core/FlowGraph";
import { Logger } from "core/Misc/logger";
import { Scene } from "core/scene";

describe("Flow Graph Data Nodes", () => {
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
        Logger.Log = jest.fn();

        scene = new Scene(engine);
        flowGraphCoordinator = new FlowGraphCoordinator({ scene });
        flowGraph = flowGraphCoordinator.createGraph();
        flowGraphContext = flowGraph.createContext();
    });

    it("Variable Block", () => {
        const sceneReady = new FlowGraphSceneReadyEventBlock({ name: "SceneReady" });
        flowGraph.addEventBlock(sceneReady);

        const consoleLog = new FlowGraphConsoleLogBlock({ name: "Log" });
        sceneReady.out.connectTo(consoleLog.in);

        const getVariable = new FlowGraphGetVariableBlock({ variableName: "testVariable" });

        flowGraphContext.setVariable("testVariable", 42);
        consoleLog.message.connectTo(getVariable.output);

        // Test in a different context
        const flowGraphContext2 = flowGraph.createContext();
        flowGraphContext2.setVariable("testVariable", 43);

        flowGraph.start();
        scene.onReadyObservable.notifyObservers(scene);

        expect(Logger.Log).toHaveBeenCalledWith(42);
        expect(Logger.Log).toHaveBeenCalledWith(43);
    });

    it("Values are cached for the same execution id", () => {
        const sceneReady = new FlowGraphSceneReadyEventBlock({ name: "SceneReady" });
        flowGraph.addEventBlock(sceneReady);

        const add = new FlowGraphAddBlock();

        const rnd = new FlowGraphRandomBlock();

        // add a number to itself, which should only trigger the random number block once and cache the result
        add.a.connectTo(rnd.value);
        add.b.connectTo(rnd.value);

        // log ther result
        const log = new FlowGraphConsoleLogBlock();
        log.message.connectTo(add.value);
        sceneReady.out.connectTo(log.in);

        flowGraph.start();

        let mockRandomIndex = 1;
        const mockedRandom = (): number => {
            return mockRandomIndex++;
        };

        // clear the random mock before calling
        const random = jest.spyOn(global.Math, "random").mockImplementation(mockedRandom);

        scene.onReadyObservable.notifyObservers(scene);

        expect(random).toHaveBeenCalledTimes(1);
        expect(Logger.Log).toHaveBeenCalledWith(2); // 1 + 1

        random.mockRestore();
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });
});
