import { ArcRotateCamera } from "core/Cameras";
import type { Engine } from "core/Engines";
import { NullEngine } from "core/Engines";
import type { FlowGraphContext, FlowGraph } from "core/FlowGraph";
import {
    FlowGraphCoordinator,
    FlowGraphDoNBlock,
    FlowGraphFlipFlopBlock,
    FlowGraphForLoopBlock,
    FlowGraphConsoleLogBlock,
    FlowGraphMultiGateBlock,
    FlowGraphSceneReadyEventBlock,
    FlowGraphSceneTickEventBlock,
    FlowGraphSwitchBlock,
    FlowGraphThrottleBlock,
    FlowGraphSetDelayBlock,
} from "core/FlowGraph";
import { FlowGraphBranchBlock } from "core/FlowGraph/Blocks/Execution/ControlFlow/flowGraphBranchBlock";
import { FlowGraphInteger } from "core/FlowGraph/CustomTypes/flowGraphInteger";
import { Vector3 } from "core/Maths/math.vector";
import { Logger } from "core/Misc/logger";
import { Scene } from "core/scene";

describe("Flow Graph Execution Nodes", () => {
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
        const cam = new ArcRotateCamera("cam", 0, 0, 0, new Vector3(0, 0, 0), scene);
    });

    it("Branch Block", () => {
        const sceneReady = new FlowGraphSceneReadyEventBlock({ name: "SceneReady" });
        flowGraph.addEventBlock(sceneReady);

        const branch = new FlowGraphBranchBlock();
        sceneReady.done.connectTo(branch.in);
        branch.condition.setValue(true, flowGraphContext); // will execute onTrue

        const onTrue = new FlowGraphConsoleLogBlock();
        onTrue.message.setValue("onTrue", flowGraphContext);
        branch.onTrue.connectTo(onTrue.in);
        const onFalse = new FlowGraphConsoleLogBlock();
        onFalse.message.setValue("onFalse", flowGraphContext);
        branch.onFalse.connectTo(onFalse.in);

        flowGraph.start();

        expect(Logger.Log).toHaveBeenCalledTimes(1);
        expect(Logger.Log).toHaveBeenCalledWith("onTrue");
    });

    it("DoN Block", () => {
        const sceneReady = new FlowGraphSceneReadyEventBlock();
        flowGraph.addEventBlock(sceneReady);

        const doN = new FlowGraphDoNBlock();
        sceneReady.done.connectTo(doN.in);

        const nIsDone = new FlowGraphConsoleLogBlock();
        doN.out.connectTo(nIsDone.in);
        doN.executionCount.connectTo(nIsDone.message);

        flowGraph.start();

        const numCalls = 5;
        doN.maxExecutions.setValue(new FlowGraphInteger(numCalls), flowGraphContext);

        const extraCalls = 2;

        for (let i = 1; i < numCalls + extraCalls; i++) {
            sceneReady.done._activateSignal(flowGraphContext);
        }

        expect(Logger.Log).toHaveBeenCalledTimes(numCalls);
    });

    it("ForLoop Block", () => {
        const sceneReady = new FlowGraphSceneReadyEventBlock();
        flowGraph.addEventBlock(sceneReady);

        const forLoop = new FlowGraphForLoopBlock();
        sceneReady.done.connectTo(forLoop.in);
        forLoop.startIndex.setValue(1, flowGraphContext);
        forLoop.endIndex.setValue(7, flowGraphContext);
        forLoop.step.setValue(2, flowGraphContext);

        const loop = new FlowGraphConsoleLogBlock();
        forLoop.executionFlow.connectTo(loop.in);
        forLoop.index.connectTo(loop.message);

        const done = new FlowGraphConsoleLogBlock();
        forLoop.completed.connectTo(done.in);
        done.message.setValue("done", flowGraphContext);

        flowGraph.start();

        expect(Logger.Log).toHaveBeenCalledTimes(4);
        expect(Logger.Log).toHaveBeenNthCalledWith(1, { value: 1 });
        expect(Logger.Log).toHaveBeenNthCalledWith(2, { value: 3 });
        expect(Logger.Log).toHaveBeenNthCalledWith(3, { value: 5 });
        expect(Logger.Log).toHaveBeenNthCalledWith(4, "done");
    });

    it("MultiGate Block", () => {
        const sceneReady = new FlowGraphSceneReadyEventBlock();
        flowGraph.addEventBlock(sceneReady);

        const multiGate = new FlowGraphMultiGateBlock({ outputSignalCount: 3, isLoop: true });
        sceneReady.done.connectTo(multiGate.in);

        const customFunction1 = new FlowGraphConsoleLogBlock();
        customFunction1.message.setValue("custom1", flowGraphContext);
        multiGate.outputSignals[0].connectTo(customFunction1.in);
        const customFunction2 = new FlowGraphConsoleLogBlock();
        customFunction2.message.setValue("custom2", flowGraphContext);
        multiGate.outputSignals[1].connectTo(customFunction2.in);
        const customFunction3 = new FlowGraphConsoleLogBlock();
        customFunction3.message.setValue("custom3", flowGraphContext);
        multiGate.outputSignals[2].connectTo(customFunction3.in);

        flowGraph.start();

        // notify a second time so two of the multi gate blocks will be activated
        sceneReady.done._activateSignal(flowGraphContext);
        expect(Logger.Log).toHaveBeenNthCalledWith(1, "custom1");
        expect(Logger.Log).toHaveBeenNthCalledWith(2, "custom2");

        // activate the third gate
        sceneReady.done._activateSignal(flowGraphContext);
        expect(Logger.Log).toHaveBeenNthCalledWith(3, "custom3");

        // activate the first gate again
        sceneReady.done._activateSignal(flowGraphContext);
        expect(Logger.Log).toHaveBeenNthCalledWith(4, "custom1");
    });

    it("Switch Block", () => {
        const sceneReady = new FlowGraphSceneReadyEventBlock();
        flowGraph.addEventBlock(sceneReady);

        const switchBlock = new FlowGraphSwitchBlock({ cases: [1, 2, 3] });
        sceneReady.done.connectTo(switchBlock.in);
        switchBlock.case.setValue(2, flowGraphContext);

        const customFunctionBlock1 = new FlowGraphConsoleLogBlock();
        customFunctionBlock1.message.setValue("custom1", flowGraphContext);
        switchBlock._getOutputFlowForCase(1)?.connectTo(customFunctionBlock1.in);
        const customFunctionBlock2 = new FlowGraphConsoleLogBlock();
        customFunctionBlock2.message.setValue("custom2", flowGraphContext);
        switchBlock._getOutputFlowForCase(2)?.connectTo(customFunctionBlock2.in);
        const customFunctionBlock3 = new FlowGraphConsoleLogBlock();
        customFunctionBlock3.message.setValue("custom3", flowGraphContext);
        switchBlock._getOutputFlowForCase(3)?.connectTo(customFunctionBlock3.in);

        flowGraph.start();

        expect(Logger.Log).toHaveBeenNthCalledWith(1, "custom2");

        switchBlock.case.setValue(3, flowGraphContext);
        sceneReady.done._activateSignal(flowGraphContext);
        expect(Logger.Log).toHaveBeenNthCalledWith(2, "custom3");
    });

    it("Timer Block", async () => {
        const sceneReady = new FlowGraphSceneReadyEventBlock();
        flowGraph.addEventBlock(sceneReady);

        const timeToWait = 1000;

        const timer = new FlowGraphSetDelayBlock();
        sceneReady.done.connectTo(timer.in);
        timer.duration.setValue(timeToWait / 1000, flowGraphContext);

        const consoleLogBlock = new FlowGraphConsoleLogBlock();
        consoleLogBlock.message.setValue("custom", flowGraphContext);
        timer.out.connectTo(consoleLogBlock.in);

        const consoleLog2Block = new FlowGraphConsoleLogBlock();
        consoleLog2Block.message.setValue("custom2", flowGraphContext);
        timer.done.connectTo(consoleLog2Block.in);

        flowGraph.start();
        // wait for the timer to finish
        await new Promise((resolve) => setTimeout(resolve, timeToWait + 30));
        scene.render();
        expect(Logger.Log).toHaveBeenNthCalledWith(1, "custom");
        expect(Logger.Log).toHaveBeenNthCalledWith(2, "custom2");
    });

    it("Flip Flop Block", () => {
        const sceneTick = new FlowGraphSceneTickEventBlock();
        flowGraph.addEventBlock(sceneTick);

        const flipFlop = new FlowGraphFlipFlopBlock();
        sceneTick.done.connectTo(flipFlop.in);

        const onTrue = new FlowGraphConsoleLogBlock();
        onTrue.message.setValue("onTrue", flowGraphContext);
        flipFlop.onOn.connectTo(onTrue.in);
        const onFalse = new FlowGraphConsoleLogBlock();
        onFalse.message.setValue("onFalse", flowGraphContext);
        flipFlop.onOff.connectTo(onFalse.in);

        flowGraph.start();
        scene.render();

        expect(Logger.Log).toHaveBeenNthCalledWith(1, "onTrue");

        scene.render();
        expect(Logger.Log).toHaveBeenNthCalledWith(2, "onFalse");
    });

    it("Throttle Block", () => {
        const sceneTick = new FlowGraphSceneTickEventBlock();
        flowGraph.addEventBlock(sceneTick);

        const throttle = new FlowGraphThrottleBlock();
        throttle.duration.setValue(1000, flowGraphContext);
        sceneTick.done.connectTo(throttle.in);

        const customFunction = new FlowGraphConsoleLogBlock();
        throttle.out.connectTo(customFunction.in);

        flowGraph.start();
        scene.render();

        expect(Logger.Log).toHaveBeenCalledTimes(1);

        // Check if the execution is throttled
        scene.render();
        expect(Logger.Log).toHaveBeenCalledTimes(1);
    });

    // this should test the JSON property parser.
    // it("SetPropertyBlock", () => {
    //     const mesh0 = new Mesh("myMesh0", scene);
    //     const mesh1 = new Mesh("myMesh1", scene);

    //     const sceneReady = new FlowGraphSceneReadyEventBlock();
    //     flowGraph.addEventBlock(sceneReady);

    //     flowGraphContext.setVariable("nodes", [mesh0, mesh1]);

    //     const pathConverter = new FlowGraphPathConverter(flowGraphContext, "/");

    //     const setProperty = new FlowGraphSetPropertyBlock<Vector3>({
    //         path: "nodes/{nodeIndex}/position",
    //         pathConverter,
    //     });
    //     sceneReady.out.connectTo(setProperty.in);

    //     const nodeIndexInput = setProperty.getDataInput("nodeIndex");
    //     expect(nodeIndexInput).toBeDefined();

    //     nodeIndexInput!.setValue(new FlowGraphInteger(1), flowGraphContext);
    //     setProperty.a.setValue(new Vector3(1, 2, 3), flowGraphContext);

    //     flowGraph.start();

    //     scene.onReadyObservable.notifyObservers(scene);
    //     expect(mesh0.position.asArray()).toEqual([0, 0, 0]);
    //     expect(mesh1.position.asArray()).toEqual([1, 2, 3]);
    // });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });
});
