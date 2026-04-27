import { type Engine, NullEngine } from "core/Engines";
import {
    type FlowGraph,
    type FlowGraphContext,
    FlowGraphCoordinator,
    FlowGraphGetVariableBlock,
    FlowGraphSceneReadyEventBlock,
    FlowGraphConsoleLogBlock,
    FlowGraphAddBlock,
    FlowGraphRandomBlock,
    FlowGraphConstantBlock,
} from "core/FlowGraph";
import { Logger } from "core/Misc/logger";
import { Scene } from "core/scene";
import { Vector3 } from "core/Maths/math.vector";
import { Color3 } from "core/Maths/math.color";
import { FlowGraphInteger } from "core/FlowGraph/CustomTypes/flowGraphInteger";

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
        Logger.Log = vi.fn();

        scene = new Scene(engine);
        flowGraphCoordinator = new FlowGraphCoordinator({ scene });
        flowGraph = flowGraphCoordinator.createGraph();
        flowGraphContext = flowGraph.createContext();
    });

    it("Variable Block", () => {
        const sceneReady = new FlowGraphSceneReadyEventBlock({ name: "SceneReady" });
        flowGraph.addEventBlock(sceneReady);

        const consoleLog = new FlowGraphConsoleLogBlock({ name: "Log" });
        sceneReady.done.connectTo(consoleLog.in);

        const getVariable = new FlowGraphGetVariableBlock({ variable: "testVariable" });

        flowGraphContext.setVariable("testVariable", 42);
        consoleLog.message.connectTo(getVariable.value);

        // Test in a different context
        const flowGraphContext2 = flowGraph.createContext();
        flowGraphContext2.setVariable("testVariable", 43);

        flowGraph.start();

        expect(Logger.Log).toHaveBeenCalledWith(42);
        expect(Logger.Log).toHaveBeenCalledWith(43);
    });

    it("Values are cached for the same execution id", () => {
        const sceneReady = new FlowGraphSceneReadyEventBlock({ name: "SceneReady" });
        flowGraph.addEventBlock(sceneReady);

        const add = new FlowGraphAddBlock();

        const rnd = new FlowGraphRandomBlock();
        const log = new FlowGraphConsoleLogBlock();

        let mockRandomIndex = 1;
        const mockedRandom = (): number => {
            return mockRandomIndex++;
        };
        const random = vi.spyOn(global.Math, "random").mockImplementation(mockedRandom);
        // add a number to itself, which should only trigger the random number block once and cache the result
        add.a.connectTo(rnd.value);
        add.b.connectTo(rnd.value);

        // log ther result
        log.message.connectTo(add.value);
        sceneReady.done.connectTo(log.in);

        flowGraph.start();

        // clear the random mock before calling

        expect(random).toHaveBeenCalledTimes(1);
        expect(Logger.Log).toHaveBeenCalledWith(2); // 1 + 1

        random.mockRestore();
    });

    describe("Constant Block", () => {
        it("outputs a number value when created with value: 0", () => {
            const constant = new FlowGraphConstantBlock({ name: "const", value: 0 });
            flowGraph.addBlock(constant);

            expect(constant.config.value).toBe(0);
            expect(constant.output.richType.typeName).toBe("number");

            const log = new FlowGraphConsoleLogBlock({ name: "Log" });
            log.message.connectTo(constant.output);

            const sceneReady = new FlowGraphSceneReadyEventBlock({ name: "SceneReady" });
            flowGraph.addEventBlock(sceneReady);
            sceneReady.done.connectTo(log.in);

            flowGraph.start();
            expect(Logger.Log).toHaveBeenCalledWith(0);
        });

        it("outputs a string value", () => {
            const constant = new FlowGraphConstantBlock({ name: "const", value: "hello" });
            flowGraph.addBlock(constant);

            expect(constant.output.richType.typeName).toBe("string");

            const log = new FlowGraphConsoleLogBlock({ name: "Log" });
            log.message.connectTo(constant.output);

            const sceneReady = new FlowGraphSceneReadyEventBlock({ name: "SceneReady" });
            flowGraph.addEventBlock(sceneReady);
            sceneReady.done.connectTo(log.in);

            flowGraph.start();
            expect(Logger.Log).toHaveBeenCalledWith("hello");
        });

        it("outputs a boolean value", () => {
            const constant = new FlowGraphConstantBlock({ name: "const", value: true });
            flowGraph.addBlock(constant);

            expect(constant.output.richType.typeName).toBe("boolean");
        });

        it("outputs a Vector3 value", () => {
            const v = new Vector3(1, 2, 3);
            const constant = new FlowGraphConstantBlock({ name: "const", value: v });
            flowGraph.addBlock(constant);

            expect(constant.output.richType.typeName).toBe("Vector3");
        });

        it("outputs a Color3 value", () => {
            const c = new Color3(1, 0, 0);
            const constant = new FlowGraphConstantBlock({ name: "const", value: c });
            flowGraph.addBlock(constant);

            expect(constant.output.richType.typeName).toBe("Color3");
        });

        it("outputs a FlowGraphInteger value", () => {
            const constant = new FlowGraphConstantBlock({ name: "const", value: new FlowGraphInteger(42) });
            flowGraph.addBlock(constant);

            expect(constant.output.richType.typeName).toBe("FlowGraphInteger");
        });

        it("value can be updated after creation", () => {
            const constant = new FlowGraphConstantBlock({ name: "const", value: 10 });
            flowGraph.addBlock(constant);

            constant.config.value = 99;

            const log = new FlowGraphConsoleLogBlock({ name: "Log" });
            log.message.connectTo(constant.output);

            const sceneReady = new FlowGraphSceneReadyEventBlock({ name: "SceneReady" });
            flowGraph.addEventBlock(sceneReady);
            sceneReady.done.connectTo(log.in);

            flowGraph.start();
            expect(Logger.Log).toHaveBeenCalledWith(99);
        });

        it("serializes and round-trips a numeric constant", () => {
            const constant = new FlowGraphConstantBlock({ name: "const", value: 42 });
            flowGraph.addBlock(constant);

            const serialized: any = {};
            constant.serialize(serialized);

            expect(serialized.config.value).toBe(42);
            expect(serialized.className).toBe("FlowGraphConstantBlock");
        });

        it("serializes and round-trips a Vector3 constant", () => {
            const v = new Vector3(1, 2, 3);
            const constant = new FlowGraphConstantBlock({ name: "const", value: v });
            flowGraph.addBlock(constant);

            const serialized: any = {};
            constant.serialize(serialized);

            expect(serialized.config.value).toEqual({ value: [1, 2, 3], className: "Vector3" });
        });
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });
});
