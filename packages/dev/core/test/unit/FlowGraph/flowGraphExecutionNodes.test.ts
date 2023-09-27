import { ArcRotateCamera } from "core/Cameras";
import type { Engine } from "core/Engines";
import { NullEngine } from "core/Engines";
import type { FlowGraphContext, FlowGraph } from "core/FlowGraph";
import {
    FlowGraphCoordinator,
    FlowGraphDoNBlock,
    FlowGraphForLoopBlock,
    FlowGraphMultiGateBlock,
    FlowGraphSceneReadyEventBlock,
    FlowGraphSwitchBlock,
    FlowGraphTimerBlock,
} from "core/FlowGraph";
import { FlowGraphBranchBlock } from "core/FlowGraph/Blocks/Execution/ControlFlow/flowGraphBranchBlock";
import { FlowGraphCustomFunctionBlock } from "core/FlowGraph/Blocks/Execution/flowGraphCustomFunctionBlock";
import { Vector3 } from "core/Maths/math.vector";
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

        scene = new Scene(engine);
        flowGraphCoordinator = new FlowGraphCoordinator({ scene });
        flowGraph = flowGraphCoordinator.createGraph();
        flowGraphContext = flowGraph.createContext();
    });

    it("Branch Block", () => {
        const customFunctionTrue = jest.fn();
        const customFunctionFalse = jest.fn();

        const sceneReady = new FlowGraphSceneReadyEventBlock();
        flowGraph.addEventBlock(sceneReady);

        const branch = new FlowGraphBranchBlock();
        sceneReady.onDone.connectTo(branch.onStart);
        branch.condition.setValue(true, flowGraphContext); // will execute onTrue

        const onTrue = new FlowGraphCustomFunctionBlock({ customFunction: customFunctionTrue });
        branch.onTrue.connectTo(onTrue.onStart);
        const onFalse = new FlowGraphCustomFunctionBlock({ customFunction: customFunctionFalse });
        branch.onFalse.connectTo(onFalse.onStart);

        flowGraph.start();
        scene.onReadyObservable.notifyObservers(scene);

        expect(customFunctionTrue).toHaveBeenCalled();
        expect(customFunctionFalse).not.toHaveBeenCalled();
    });

    it("DoN Block", () => {
        const customFunction = jest.fn();

        const sceneReady = new FlowGraphSceneReadyEventBlock();
        flowGraph.addEventBlock(sceneReady);

        const doN = new FlowGraphDoNBlock();
        sceneReady.onDone.connectTo(doN.onStart);

        const nIsDone = new FlowGraphCustomFunctionBlock({ customFunction });
        doN.onDone.connectTo(nIsDone.onStart);
        doN.currentCount.connectTo(nIsDone.input);

        flowGraph.start();

        const numCalls = 5;
        doN.maxNumberOfExecutions.setValue(numCalls, flowGraphContext);

        const extraCalls = 2;

        for (let i = 0; i < numCalls + extraCalls; i++) {
            scene.onReadyObservable.notifyObservers(scene);
        }

        expect(customFunction).toHaveBeenCalledTimes(numCalls);
    });

    it("ForLoop Block", () => {
        const customFunction = jest.fn();
        const customFunctionDone = jest.fn();

        const sceneReady = new FlowGraphSceneReadyEventBlock();
        flowGraph.addEventBlock(sceneReady);

        const forLoop = new FlowGraphForLoopBlock();
        sceneReady.onDone.connectTo(forLoop.onStart);
        forLoop.startIndex.setValue(1, flowGraphContext);
        forLoop.endIndex.setValue(7, flowGraphContext);
        forLoop.step.setValue(2, flowGraphContext);

        const loop = new FlowGraphCustomFunctionBlock({ customFunction });
        forLoop.onLoop.connectTo(loop.onStart);
        forLoop.index.connectTo(loop.input);

        const done = new FlowGraphCustomFunctionBlock({ customFunction: customFunctionDone });
        forLoop.onDone.connectTo(done.onStart);

        flowGraph.start();
        scene.onReadyObservable.notifyObservers(scene);

        expect(customFunction).toHaveBeenCalledTimes(3);
        expect(customFunction).toHaveBeenNthCalledWith(1, 1);
        expect(customFunction).toHaveBeenNthCalledWith(2, 3);
        expect(customFunction).toHaveBeenNthCalledWith(3, 5);

        expect(customFunctionDone).toHaveBeenCalledTimes(1);
    });

    it("MultiGate Block", () => {
        const sceneReady = new FlowGraphSceneReadyEventBlock();
        flowGraph.addEventBlock(sceneReady);

        const custom1 = jest.fn();
        const custom2 = jest.fn();
        const custom3 = jest.fn();

        const multiGate = new FlowGraphMultiGateBlock({ numberOutputFlows: 3, loop: true });
        sceneReady.onDone.connectTo(multiGate.onStart);

        const customFunction1 = new FlowGraphCustomFunctionBlock({ customFunction: custom1 });
        multiGate.outFlows[0].connectTo(customFunction1.onStart);
        const customFunction2 = new FlowGraphCustomFunctionBlock({ customFunction: custom2 });
        multiGate.outFlows[1].connectTo(customFunction2.onStart);
        const customFunction3 = new FlowGraphCustomFunctionBlock({ customFunction: custom3 });
        multiGate.outFlows[2].connectTo(customFunction3.onStart);

        flowGraph.start();

        // notify twice so two of the multi gate blocks will be activated
        scene.onReadyObservable.notifyObservers(scene);
        scene.onReadyObservable.notifyObservers(scene);
        expect(custom1).toHaveBeenCalledTimes(1);
        expect(custom2).toHaveBeenCalledTimes(1);
        expect(custom3).toHaveBeenCalledTimes(0);

        // activate the third gate
        scene.onReadyObservable.notifyObservers(scene);
        expect(custom3).toHaveBeenCalledTimes(1);

        // activate the first gate again
        scene.onReadyObservable.notifyObservers(scene);
        expect(custom1).toHaveBeenCalledTimes(2);
    });

    it("Switch Block", () => {
        const sceneReady = new FlowGraphSceneReadyEventBlock();
        flowGraph.addEventBlock(sceneReady);

        const switchBlock = new FlowGraphSwitchBlock({ cases: [1, 2, 3] });
        sceneReady.onDone.connectTo(switchBlock.onStart);
        switchBlock.selection.setValue(2, flowGraphContext);

        const customFunction1 = jest.fn();
        const customFunction2 = jest.fn();
        const customFunction3 = jest.fn();

        const customFunctionBlock1 = new FlowGraphCustomFunctionBlock({ customFunction: customFunction1 });
        switchBlock.outputFlows[0].connectTo(customFunctionBlock1.onStart);
        const customFunctionBlock2 = new FlowGraphCustomFunctionBlock({ customFunction: customFunction2 });
        switchBlock.outputFlows[1].connectTo(customFunctionBlock2.onStart);
        const customFunctionBlock3 = new FlowGraphCustomFunctionBlock({ customFunction: customFunction3 });
        switchBlock.outputFlows[2].connectTo(customFunctionBlock3.onStart);

        flowGraph.start();
        scene.onReadyObservable.notifyObservers(scene);

        expect(customFunction1).toHaveBeenCalledTimes(0);
        expect(customFunction2).toHaveBeenCalledTimes(1);
        expect(customFunction3).toHaveBeenCalledTimes(0);

        switchBlock.selection.setValue(3, flowGraphContext);
        scene.onReadyObservable.notifyObservers(scene);
        expect(customFunction3).toHaveBeenCalledTimes(1);
    });

    it("Timer Block", () => {
        const cam = new ArcRotateCamera("cam", 0, 0, 0, new Vector3(0, 0, 0), scene);

        const sceneReady = new FlowGraphSceneReadyEventBlock();
        flowGraph.addEventBlock(sceneReady);

        const timer = new FlowGraphTimerBlock();
        sceneReady.onDone.connectTo(timer.onStart);
        timer.timeout.setValue(0, flowGraphContext);

        const customImmediateFunction = jest.fn();
        const customFunctionBlock = new FlowGraphCustomFunctionBlock({ customFunction: customImmediateFunction });
        timer.onDone.connectTo(customFunctionBlock.onStart);

        const customTimeoutFunction = jest.fn();
        const customFunctionBlock2 = new FlowGraphCustomFunctionBlock({ customFunction: customTimeoutFunction });
        timer.onTimerDone.connectTo(customFunctionBlock2.onStart);

        flowGraph.start();
        // this will run the onReadyObservable and the onBeforeRenderObservable
        scene.render();

        expect(customImmediateFunction).toHaveBeenCalledTimes(1);
        expect(customTimeoutFunction).toHaveBeenCalledTimes(1);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });
});
