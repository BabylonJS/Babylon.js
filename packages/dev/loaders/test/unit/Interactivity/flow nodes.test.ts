import { NullEngine } from "core/Engines";
import { Scene } from "core/scene";
import { FlowGraphCoordinator } from "core/FlowGraph/flowGraphCoordinator";
import { Vector3 } from "core/Maths";
import { ArcRotateCamera } from "core/Cameras";
import { Logger } from "core/Misc";
import { ParseFlowGraphAsync } from "core/FlowGraph";
import { InteractivityGraphToFlowGraphParser } from "loaders/glTF/2.0/Extensions/KHR_interactivity/interactivityGraphParser";
import { getPathToObjectConverter } from "loaders/glTF/2.0/Extensions/objectModelMapping";
import { IKHRInteractivity_Declaration, IKHRInteractivity_Graph, IKHRInteractivity_Node, IKHRInteractivity_Type, IKHRInteractivity_Variable } from "babylonjs-gltf2interface";

describe("Flow Nodes", () => {
    let engine;
    let scene: Scene;
    const log: jest.SpyInstance = jest.spyOn(Logger, "Log").mockImplementation(() => {});
    const errorLog: jest.SpyInstance = jest.spyOn(Logger, "Error").mockImplementation(() => {});
    const warnLog: jest.SpyInstance = jest.spyOn(Logger, "Warn").mockImplementation(() => {});
    let mockGltf: any;
    const pathConverter = getPathToObjectConverter(mockGltf);
    let renderInterval: any;

    async function generateSimpleNodeGraph(
        declarations: IKHRInteractivity_Declaration[],
        nodes: IKHRInteractivity_Node[],
        types: IKHRInteractivity_Type[] = [],
        variables: IKHRInteractivity_Variable[] = []
    ) {
        const ig: IKHRInteractivity_Graph = {
            declarations: [...declarations, { op: "event/onStart" }],
            types,
            nodes: [
                ...nodes,
                {
                    declaration: declarations.length,
                    flows: {
                        out: {
                            node: 0, // first node provided should be the flow node tested
                            socket: "in",
                        },
                    },
                },
            ],
            variables,
        };

        const i2fg = new InteractivityGraphToFlowGraphParser(ig, mockGltf);
        const json = i2fg.serializeToFlowGraph();
        const coordinator = new FlowGraphCoordinator({ scene });
        const graph = await ParseFlowGraphAsync(json, { coordinator, pathConverter });
        graph.getContext(0).enableLogging = true;
        graph.getContext(0).logger!.logToConsole = false;

        coordinator.start();

        return {
            graph,
            logger: graph.getContext(0).logger!,
        };
    }

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        new ArcRotateCamera("", 0, 0, 0, new Vector3(0, 0, 0));
        log.mockClear();
        errorLog.mockClear();
        renderInterval = setInterval(() => scene.render(), 16);
    });

    afterEach(() => {
        clearInterval(renderInterval);
    });

    test("flow/sequence with proper IDs", async () => {
        await generateSimpleNodeGraph(
            [{ op: "flow/sequence" }, { op: "babylon/log", extension: "BABYLON_Logging" }],
            [
                {
                    declaration: 0,
                    flows: {
                        aFirst: {
                            node: 1,
                            socket: "in",
                        },
                        // deliberately out of order
                        cThird: {
                            node: 3,
                            socket: "in",
                        },
                        bSecond: {
                            node: 2,
                            socket: "in",
                        },
                    },
                },
                {
                    declaration: 1,
                    values: {
                        message: {
                            type: 0,
                            value: [0],
                        },
                    },
                },
                {
                    declaration: 1,
                    values: {
                        message: {
                            type: 0,
                            value: [1],
                        },
                    },
                },
                {
                    declaration: 1,
                    values: {
                        message: {
                            type: 0,
                            value: [2],
                        },
                    },
                },
            ],
            [{ signature: "float" }]
        );

        expect(log.mock.calls.map((c) => c[0])).toEqual([0, 1, 2]);
    });

    test("flow/sequence with numbered IDs", async () => {
        await generateSimpleNodeGraph(
            [{ op: "flow/sequence" }, { op: "babylon/log", extension: "BABYLON_Logging" }],
            [
                {
                    declaration: 0,
                    flows: {
                        "1": {
                            node: 1,
                            socket: "in",
                        },
                        // deliberately out of order
                        "3": {
                            node: 3,
                            socket: "in",
                        },
                        "21": {
                            node: 2,
                            socket: "in",
                        },
                    },
                },
                {
                    declaration: 1,
                    values: {
                        message: {
                            type: 0,
                            value: [0],
                        },
                    },
                },
                {
                    declaration: 1,
                    values: {
                        message: {
                            type: 0,
                            value: [1],
                        },
                    },
                },
                {
                    declaration: 1,
                    values: {
                        message: {
                            type: 0,
                            value: [2],
                        },
                    },
                },
            ],
            [{ signature: "float" }]
        );

        expect(log.mock.calls.map((c) => c[0])).toEqual([0, 1, 2]);
    });

    // flow/branch
    test("flow/branch with true", async () => {
        await generateSimpleNodeGraph(
            [{ op: "flow/branch" }, { op: "babylon/log", extension: "BABYLON_Logging" }],
            [
                {
                    declaration: 0,
                    flows: {
                        true: {
                            node: 1,
                            socket: "in",
                        },
                        false: {
                            node: 2,
                            socket: "in",
                        },
                    },
                    values: {
                        condition: {
                            type: 0,
                            value: [true],
                        },
                    },
                },
                {
                    declaration: 1,
                    values: {
                        message: {
                            type: 0,
                            value: [0],
                        },
                    },
                },
                {
                    declaration: 1,
                    values: {
                        message: {
                            type: 0,
                            value: [1],
                        },
                    },
                },
            ],
            [{ signature: "float" }]
        );

        expect(log).toHaveBeenCalledTimes(1);
        expect(log).toHaveBeenCalledWith(0);
    });

    test("flow/branch with false", async () => {
        await generateSimpleNodeGraph(
            [{ op: "flow/branch" }, { op: "babylon/log", extension: "BABYLON_Logging" }],
            [
                {
                    declaration: 0,
                    flows: {
                        true: {
                            node: 1,
                            socket: "in",
                        },
                        false: {
                            node: 2,
                            socket: "in",
                        },
                    },
                    values: {
                        condition: {
                            type: 0,
                            value: [false],
                        },
                    },
                },
                {
                    declaration: 1,
                    values: {
                        message: {
                            type: 0,
                            value: [0],
                        },
                    },
                },
                {
                    declaration: 1,
                    values: {
                        message: {
                            type: 0,
                            value: [1],
                        },
                    },
                },
            ],
            [{ signature: "float" }]
        );

        expect(log).toHaveBeenCalledTimes(1);
        expect(log).toHaveBeenCalledWith(1);
    });

    // flow/switch
    test("flow/switch with existing selection", async () => {
        const selection = 1;
        await generateSimpleNodeGraph(
            [{ op: "flow/switch" }, { op: "babylon/log", extension: "BABYLON_Logging" }],
            [
                {
                    declaration: 0,
                    configuration: {
                        cases: {
                            value: [0, selection, 5, 19, 7],
                        },
                    },
                    flows: {
                        0: {
                            node: 1,
                            socket: "in",
                        },
                        [selection]: {
                            node: 2,
                            socket: "in",
                        },
                        5: {
                            node: 3,
                            socket: "in",
                        },
                        7: {
                            node: 4,
                            socket: "in",
                        },
                        19: {
                            node: 5,
                            socket: "in",
                        },
                        default: {
                            node: 6,
                            socket: "in",
                        },
                    },
                    values: {
                        selection: {
                            type: 0,
                            value: [1],
                        },
                    },
                },
                {
                    declaration: 1,
                    values: {
                        message: {
                            type: 0,
                            value: [0],
                        },
                    },
                },
                {
                    declaration: 1,
                    values: {
                        message: {
                            type: 0,
                            value: [selection],
                        },
                    },
                },
                {
                    declaration: 1,
                    values: {
                        message: {
                            type: 0,
                            value: [5],
                        },
                    },
                },
                {
                    declaration: 1,
                    values: {
                        message: {
                            type: 0,
                            value: [7],
                        },
                    },
                },
                {
                    declaration: 1,
                    values: {
                        message: {
                            type: 0,
                            value: [19],
                        },
                    },
                },
                {
                    declaration: 1,
                    values: {
                        message: {
                            type: 0,
                            value: [100],
                        },
                    },
                },
            ],
            [{ signature: "float" }]
        );

        expect(log).toHaveBeenCalledTimes(1);
        expect(log).toHaveBeenCalledWith(1);
    });

    test("flow/switch with default selection", async () => {
        await generateSimpleNodeGraph(
            [{ op: "flow/switch" }, { op: "babylon/log", extension: "BABYLON_Logging" }],
            [
                {
                    declaration: 0,
                    configuration: {
                        cases: {
                            value: [0, 1, 5, 19, 7],
                        },
                    },
                    flows: {
                        0: {
                            node: 1,
                            socket: "in",
                        },
                        1: {
                            node: 2,
                            socket: "in",
                        },
                        5: {
                            node: 3,
                            socket: "in",
                        },
                        7: {
                            node: 4,
                            socket: "in",
                        },
                        19: {
                            node: 5,
                            socket: "in",
                        },
                        default: {
                            node: 6,
                            socket: "in",
                        },
                    },
                    values: {
                        selection: {
                            type: 0,
                            value: [99],
                        },
                    },
                },
                {
                    declaration: 1,
                    values: {
                        message: {
                            type: 0,
                            value: [0],
                        },
                    },
                },
                {
                    declaration: 1,
                    values: {
                        message: {
                            type: 0,
                            value: [1],
                        },
                    },
                },
                {
                    declaration: 1,
                    values: {
                        message: {
                            type: 0,
                            value: [5],
                        },
                    },
                },
                {
                    declaration: 1,
                    values: {
                        message: {
                            type: 0,
                            value: [7],
                        },
                    },
                },
                {
                    declaration: 1,
                    values: {
                        message: {
                            type: 0,
                            value: [19],
                        },
                    },
                },
                {
                    declaration: 1,
                    values: {
                        message: {
                            type: 0,
                            value: [100],
                        },
                    },
                },
            ],
            [{ signature: "float" }]
        );

        expect(log).toHaveBeenCalledTimes(1);
        expect(log).toHaveBeenCalledWith(100);
    });

    // incorrect flow/switch
    test("flow/switch with floats as case(s)", async () => {
        await generateSimpleNodeGraph(
            [{ op: "flow/switch" }, { op: "babylon/log", extension: "BABYLON_Logging" }],
            [
                {
                    declaration: 0,
                    configuration: {
                        cases: {
                            value: [5.5, 4, 3],
                        },
                    },
                    flows: {
                        default: {
                            node: 1,
                            socket: "in",
                        },
                    },
                    values: {
                        selection: {
                            type: 0,
                            value: [5.5],
                        },
                    },
                },
                {
                    declaration: 1,
                    values: {
                        message: {
                            type: 0,
                            value: [100],
                        },
                    },
                },
            ],
            [{ signature: "float" }]
        );

        expect(log).toHaveBeenCalledTimes(1);
        expect(log).toHaveBeenCalledWith(100);
        // show a warning - incorrect case value(s)
        expect(warnLog).toHaveBeenCalledTimes(1);
    });

    // flow/setDelay
    test("flow/setDelay with predefined delay", async () => {
        const duration = 1; // in seconds
        await generateSimpleNodeGraph(
            [{ op: "flow/setDelay" }, { op: "babylon/log", extension: "BABYLON_Logging" }],
            [
                {
                    declaration: 0,
                    values: {
                        duration: {
                            type: 0,
                            value: [duration],
                        },
                    },
                    flows: {
                        done: {
                            node: 1,
                            socket: "in",
                        },
                    },
                },
                {
                    declaration: 1,
                    values: {
                        message: {
                            node: 0,
                            socket: "lastDelayIndex",
                        },
                    },
                },
            ],
            [{ signature: "float" }]
        );

        expect(log).not.toHaveBeenCalled();
        // wait for the delay to pass
        await new Promise((resolve) => setTimeout(resolve, duration * 1000 + 100));
        expect(log).toHaveBeenCalledTimes(1);
        expect(log).toHaveBeenCalledWith(0);
    });

    // flowDelay with NaN as duration - should activate the error signal
    test("flow/setDelay with NaN as duration", async () => {
        await generateSimpleNodeGraph(
            [{ op: "flow/setDelay" }, { op: "babylon/log", extension: "BABYLON_Logging" }],
            [
                {
                    declaration: 0,
                    values: {
                        duration: {
                            type: 0,
                            value: [NaN],
                        },
                    },
                    flows: {
                        done: {
                            node: 1,
                            socket: "in",
                        },
                        err: {
                            node: 2,
                            socket: "in",
                        },
                    },
                },
                {
                    declaration: 1,
                    values: {
                        message: {
                            type: 0,
                            value: [0],
                        },
                    },
                },
                {
                    declaration: 1,
                    values: {
                        message: {
                            type: 0,
                            value: [1],
                        },
                    },
                },
            ],
            [{ signature: "float" }]
        );

        expect(log).toHaveBeenCalledWith(1);
        expect(log).not.toHaveBeenCalledWith(0);
    });

    //flow/setDelay canceled after activation
    test("flow/setDelay canceled after activation", async () => {
        const duration = 1; // in seconds
        // sequence triggers two delays - the 2nd cancels the first
        await generateSimpleNodeGraph(
            [{ op: "flow/setDelay" }, { op: "babylon/log", extension: "BABYLON_Logging" }, { op: "flow/sequence" }],
            [
                {
                    declaration: 2,
                    flows: {
                        "1": {
                            node: 1,
                            socket: "in",
                        },
                        "2": {
                            node: 3,
                            socket: "in",
                        },
                    },
                },
                {
                    declaration: 0,
                    values: {
                        duration: {
                            type: 0,
                            value: [duration],
                        },
                    },
                    flows: {
                        done: {
                            node: 2,
                            socket: "in",
                        },
                    },
                },
                {
                    declaration: 1,
                    values: {
                        message: {
                            node: 1,
                            socket: "lastDelayIndex",
                        },
                    },
                },
                {
                    declaration: 0,
                    values: {
                        duration: {
                            type: 0,
                            value: [duration / 2], // half of the delay
                        },
                    },
                    flows: {
                        done: {
                            node: 1,
                            socket: "cancel", // cancel the delay!
                        },
                    },
                },
            ],
            [{ signature: "float" }]
        );

        expect(log).not.toHaveBeenCalled();
        await new Promise((resolve) => setTimeout(resolve, duration * 1000 + 100));
        expect(log).not.toHaveBeenCalled();
    });

    // variable/get and variable/set - set a variable and then get it. testing the out flow as well.
    test("variable/get and variable/set", async () => {
        await generateSimpleNodeGraph(
            [{ op: "variable/set" }, { op: "variable/get" }, { op: "babylon/log", extension: "BABYLON_Logging" }],
            [
                {
                    declaration: 0,
                    configuration: {
                        variable: {
                            value: [0], //the index of the variable
                        },
                    },
                    values: {
                        value: {
                            type: 0,
                            value: [1],
                        },
                    },
                    flows: {
                        out: {
                            node: 2,
                            socket: "in",
                        },
                    },
                },
                {
                    declaration: 1,
                    configuration: {
                        variable: {
                            value: [0], //the index of the variable
                        },
                    },
                },
                {
                    declaration: 2,
                    values: {
                        message: {
                            node: 1,
                            socket: "value",
                        },
                    },
                },
            ],
            [{ signature: "float" }],
            [{ type: 0, value: [0] }]
        );

        expect(log).toHaveBeenCalledWith(1);
    });

    // now we have variable get/set we can test while loop
    test("flow/while", async () => {
        // a while loop that increments an integer (setting a variable). condition is using math/gt
        await generateSimpleNodeGraph(
            [{ op: "flow/while" }, { op: "math/lt" }, { op: "variable/set" }, { op: "variable/get" }, { op: "babylon/log", extension: "BABYLON_Logging" }, { op: "math/add" }],
            [
                // for while. loop body will go to a variable set node
                {
                    declaration: 0,
                    values: {
                        condition: {
                            node: 5,
                            socket: "value",
                        },
                    },
                    flows: {
                        completed: {
                            node: 1,
                            socket: "in",
                        },
                        loopBody: {
                            node: 2,
                            socket: "in",
                        },
                    },
                },
                // logging, when while is done
                {
                    declaration: 4,
                    values: {
                        message: {
                            node: 3, // the getVariable node
                            socket: "value",
                        },
                    },
                },
                // set variable node
                {
                    declaration: 2,
                    configuration: {
                        variable: {
                            value: [0], // the index of the variable
                        },
                    },
                    values: {
                        value: {
                            node: 4, // math add that increments the variable
                            socket: "value",
                        },
                    },
                },
                // get variable node
                {
                    declaration: 3,
                    configuration: {
                        variable: {
                            value: [0], //the index of the variable
                        },
                    },
                },
                // math/add node
                {
                    declaration: 5,
                    values: {
                        a: {
                            type: 0,
                            value: [1],
                        },
                        b: {
                            node: 3, // getVariable node
                            socket: "value",
                        },
                    },
                },
                // math/lt node
                {
                    declaration: 1,
                    values: {
                        a: {
                            node: 3, // getVariable node
                            socket: "value",
                        },
                        b: {
                            type: 0,
                            value: [5], // variable is less than 5 (i.e. stop at 5)
                        },
                    },
                },
            ],
            [{ signature: "float" }],
            [{ type: 0, value: [0] }]
        );

        // expect the log to be called 1 time with 5 as a value
        expect(log).toHaveBeenCalledWith(5);
        expect(log).toHaveBeenCalledTimes(1);
    });
});
