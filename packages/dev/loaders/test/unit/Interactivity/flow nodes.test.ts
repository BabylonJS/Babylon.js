import { NullEngine } from "core/Engines";
import { Scene } from "core/scene";
import { FlowGraphCoordinator } from "core/FlowGraph/flowGraphCoordinator";
import { Vector3 } from "core/Maths";
import { ArcRotateCamera } from "core/Cameras";
import { Logger } from "core/Misc";
import { ParseFlowGraphAsync } from "core/FlowGraph";
import { InteractivityGraphToFlowGraphParser } from "loaders/glTF/2.0/Extensions/KHR_interactivity/interactivityGraphParser";
import { GetPathToObjectConverter } from "loaders/glTF/2.0/Extensions/objectModelMapping";
import { IKHRInteractivity_Declaration, IKHRInteractivity_Graph, IKHRInteractivity_Node, IKHRInteractivity_Type, IKHRInteractivity_Variable } from "babylonjs-gltf2interface";

describe("Flow Nodes", () => {
    let engine;
    let scene: Scene;
    const log: jest.SpyInstance = jest.spyOn(Logger, "Log").mockImplementation(() => {});
    const errorLog: jest.SpyInstance = jest.spyOn(Logger, "Error").mockImplementation(() => {});
    const warnLog: jest.SpyInstance = jest.spyOn(Logger, "Warn").mockImplementation(() => {});
    let mockGltf: any;
    const pathConverter = GetPathToObjectConverter(mockGltf);
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

        const i2fg = new InteractivityGraphToFlowGraphParser(ig, mockGltf, {
            parent: {
                targetFps: 60,
            },
        } as unknown as any);
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
            [{ op: "flow/sequence" }, { op: "flow/log", extension: "BABYLON" }],
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
            [{ op: "flow/sequence" }, { op: "flow/log", extension: "BABYLON" }],
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
            [{ op: "flow/branch" }, { op: "flow/log", extension: "BABYLON" }],
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
            [{ op: "flow/branch" }, { op: "flow/log", extension: "BABYLON" }],
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
            [{ op: "flow/switch" }, { op: "flow/log", extension: "BABYLON" }],
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
            [{ op: "flow/switch" }, { op: "flow/log", extension: "BABYLON" }],
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
            [{ op: "flow/switch" }, { op: "flow/log", extension: "BABYLON" }],
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
            [{ op: "flow/setDelay" }, { op: "flow/log", extension: "BABYLON" }],
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
            [{ op: "flow/setDelay" }, { op: "flow/log", extension: "BABYLON" }],
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
            [{ op: "flow/setDelay" }, { op: "flow/log", extension: "BABYLON" }, { op: "flow/sequence" }],
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
            [{ op: "variable/set" }, { op: "variable/get" }, { op: "flow/log", extension: "BABYLON" }],
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

    test("variable/interpolate with float", async () => {
        // linear interpolation from 1 to 5 in 1 second
        await generateSimpleNodeGraph(
            [{ op: "variable/interpolate" }, { op: "flow/log", extension: "BABYLON" }, { op: "event/onTick" }, { op: "variable/get" }],
            [
                {
                    declaration: 0,
                    configuration: {
                        variable: {
                            value: [0], //the index of the variable
                        },
                        useSlerp: {
                            value: [false],
                        },
                    },
                    values: {
                        value: {
                            type: 0,
                            value: [5],
                        },
                        duration: {
                            type: 0,
                            value: [1], // 1 second
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
                            node: 2,
                            socket: "value",
                        },
                    },
                },
                // get variable
                {
                    declaration: 3,
                    configuration: {
                        variable: {
                            value: [0], //the index of the variable
                        },
                    },
                },
                // onTick for logging
                {
                    declaration: 2,
                    flows: {
                        out: {
                            node: 1,
                            socket: "in",
                        },
                    },
                },
            ],
            [{ signature: "float" }],
            [{ type: 0, value: [1] }]
        );

        // wait 1 second
        await new Promise((resolve) => setTimeout(resolve, 1000 + 100));
        // flatten the calls
        const logs = log.mock.calls.map((c) => c[0]);
        // expect each value to be bigger than the last one, and lower than 5
        expect(logs.every((v, i, a) => (i ? v >= a[i - 1] : true) && v <= 5)).toBe(true);
        expect(log).toHaveBeenCalledWith(5);
    });

    test("variable/interpolate with float - colliding, cancel 1st", async () => {
        // linear interpolation from 1 to 5 in 1 second
        await generateSimpleNodeGraph(
            [{ op: "variable/interpolate" }, { op: "flow/log", extension: "BABYLON" }, { op: "variable/get" }, { op: "flow/sequence" }, { op: "flow/setDelay" }],
            [
                {
                    declaration: 3,
                    flows: {
                        "1": {
                            node: 1,
                            socket: "in",
                        },
                        "2": {
                            node: 4, // delay - 0.5 seconds to run interpolation again
                            socket: "in",
                        },
                    },
                },
                {
                    declaration: 0,
                    configuration: {
                        variable: {
                            value: [0], //the index of the variable
                        },
                        useSlerp: {
                            value: [false],
                        },
                    },
                    values: {
                        value: {
                            type: 0,
                            value: [5],
                        },
                        duration: {
                            type: 0,
                            value: [1], // 1 second
                        },
                    },
                    flows: {
                        done: {
                            // not expected to be called!
                            node: 2,
                            socket: "in",
                        },
                    },
                },
                {
                    declaration: 1,
                    values: {
                        message: {
                            node: 3,
                            socket: "value",
                        },
                    },
                },
                // get variable
                {
                    declaration: 2,
                    configuration: {
                        variable: {
                            value: [0], //the index of the variable
                        },
                    },
                },
                // set delay
                {
                    declaration: 4,
                    values: {
                        duration: {
                            type: 0,
                            value: [0.5], // 0.5 seconds
                        },
                    },
                    flows: {
                        done: {
                            node: 5,
                            socket: "in",
                        },
                    },
                },
                {
                    declaration: 0,
                    configuration: {
                        variable: {
                            value: [0], //the index of the variable
                        },
                        useSlerp: {
                            value: [false],
                        },
                    },
                    values: {
                        value: {
                            type: 0,
                            value: [3],
                        },
                        duration: {
                            type: 0,
                            value: [0.6], // 1 second
                        },
                    },
                    flows: {
                        done: {
                            node: 2,
                            socket: "in",
                        },
                    },
                },
            ],
            [{ signature: "float" }],
            [{ type: 0, value: [1] }]
        );

        // wait 1 second
        await new Promise((resolve) => setTimeout(resolve, 1000 + 200));
        // only one time, and ONLY with 3! not with 5
        expect(log).toHaveBeenCalledTimes(1);
        expect(log).toHaveBeenCalledWith(3);
    });

    // variable/interpolate with a vector3 and easing function
    test("variable/interpolate with vector3 and easing function", async () => {
        await generateSimpleNodeGraph(
            [{ op: "variable/interpolate" }, { op: "flow/log", extension: "BABYLON" }, { op: "event/onTick" }, { op: "variable/get" }],
            [
                {
                    declaration: 0,
                    configuration: {
                        variable: {
                            value: [0], //the index of the variable
                        },
                        useSlerp: {
                            value: [false],
                        },
                    },
                    values: {
                        value: {
                            type: 0,
                            value: [1, 1, 1],
                        },
                        duration: {
                            type: 2,
                            value: [1], // 1 second
                        },
                        // control point 1 for bezier easing - expoInOut
                        p1: {
                            type: 1,
                            value: [1, 0],
                        },
                        p2: {
                            type: 1,
                            value: [0, 1],
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
                            node: 2,
                            socket: "value",
                        },
                    },
                },
                // get variable
                {
                    declaration: 3,
                    configuration: {
                        variable: {
                            value: [0], //the index of the variable
                        },
                    },
                },
                // onTick for logging
                {
                    declaration: 2,
                    flows: {
                        out: {
                            node: 1,
                            socket: "in",
                        },
                    },
                },
            ],
            [{ signature: "float3" }, { signature: "float2" }, { signature: "float" }],
            [{ type: 0, value: [0, 0, 0] }]
        );

        const calls: any[] = [];

        // the reason for cloning is that the same vector is being returned, meaning that the values will be the same at the end of the interpolation
        log.mockImplementation((val) => {
            calls.push(val.clone());
        });

        // wait 1 second
        await new Promise((resolve) => setTimeout(resolve, 1000 + 100));
        // expect the log to be called with 1,1,1
        expect(log).toHaveBeenCalledWith(new Vector3(1, 1, 1));
        // check that the calls interpolation worked, i.e. the vector x is between 0 and 1
        expect(calls.every((v) => v.x >= 0 && v.x <= 1)).toBe(true);
        log.mockImplementation(() => {});
    });

    // now we have variable get/set we can test while loop
    test("flow/while", async () => {
        // a while loop that increments an integer (setting a variable). condition is using math/gt
        await generateSimpleNodeGraph(
            [{ op: "flow/while" }, { op: "math/lt" }, { op: "variable/set" }, { op: "variable/get" }, { op: "flow/log", extension: "BABYLON" }, { op: "math/add" }],
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

    // flow/for
    test("flow/for", async () => {
        // a for loop that increments an integer (setting a variable). condition is using math/gt
        await generateSimpleNodeGraph(
            [{ op: "flow/for" }, { op: "flow/log", extension: "BABYLON" }],
            [
                // for loop
                {
                    declaration: 0,
                    configuration: {
                        initialIndex: {
                            value: [1],
                        },
                    },
                    values: {
                        startIndex: {
                            type: 0,
                            value: [0],
                        },
                        endIndex: {
                            type: 0,
                            value: [5],
                        },
                    },
                    flows: {
                        loopBody: {
                            node: 1,
                            socket: "in",
                        },
                        completed: {
                            node: 1,
                            socket: "in",
                        },
                    },
                },
                // logging, when for loop is done
                {
                    declaration: 1,
                    values: {
                        message: {
                            node: 0,
                            socket: "index",
                        },
                    },
                },
            ],
            [{ signature: "float" }]
        );

        // expect the log to be called 6 times with 0, 1,2,3,4 as a value, and then again with 4 on completed
        // called with flowgraphintegers
        expect(log).toHaveBeenCalledTimes(6);
        expect(log).toHaveBeenCalledWith({ value: 0 });
        expect(log).toHaveBeenCalledWith({ value: 1 });
        expect(log).toHaveBeenCalledWith({ value: 2 });
        expect(log).toHaveBeenCalledWith({ value: 3 });
        expect(log).toHaveBeenCalledWith({ value: 4 });
    });

    // for/doN
    test("flow/doN", async () => {
        // a for loop that increments an integer (setting a variable). condition is using math/gt
        await generateSimpleNodeGraph(
            [{ op: "flow/doN" }, { op: "flow/log", extension: "BABYLON" }, { op: "flow/sequence" }],
            [
                // doN loop
                {
                    declaration: 0,
                    values: {
                        n: {
                            type: 0,
                            value: [5],
                        },
                    },
                    flows: {
                        out: {
                            node: 2, // trigger the sequence node
                            socket: "in",
                        },
                    },
                },
                // logging, when doN loop is done
                {
                    declaration: 1,
                    values: {
                        message: {
                            node: 0,
                            socket: "currentCount",
                        },
                    },
                },
                // sequence node - go to logging in AND the doN loop
                {
                    declaration: 2,
                    flows: {
                        "1": {
                            node: 1, // logging node
                            socket: "in",
                        },
                        "2": {
                            node: 0, // doN loop
                            socket: "in",
                        },
                    },
                },
            ],
            [{ signature: "int" }]
        );

        // expect the log to be called 5 times with 1,2,3,4,5 as a value
        const values = log.mock.calls.map((c) => c[0].value);
        expect(log).toHaveBeenCalledTimes(5);
        expect(values).toEqual([1, 2, 3, 4, 5]);
    });

    // flow/multiGate
    test("flow/multiGate", async () => {
        // a multiGate that will trigger the logging node 3 times
        await generateSimpleNodeGraph(
            [{ op: "flow/multiGate" }, { op: "flow/log", extension: "BABYLON" }, { op: "flow/sequence" }],
            [
                // multiGate
                {
                    declaration: 0,
                    flows: {
                        "1": {
                            node: 2,
                            socket: "in",
                        },
                        "2": {
                            node: 2,
                            socket: "in",
                        },
                        "3": {
                            node: 2,
                            socket: "in",
                        },
                        "4": {
                            node: 2,
                            socket: "in",
                        },
                        "5": {
                            node: 2,
                            socket: "in",
                        },
                    },
                },
                // logging, when multiGate is done
                {
                    declaration: 1,
                    values: {
                        message: {
                            node: 0,
                            socket: "lastIndex",
                        },
                    },
                },
                // sequence node - go to logging in AND the doN loop
                {
                    declaration: 2,
                    flows: {
                        "1": {
                            node: 1, // logging node
                            socket: "in",
                        },
                        "2": {
                            node: 0, // multigate
                            socket: "in",
                        },
                    },
                },
            ],
            [{ signature: "float" }]
        );

        const values = log.mock.calls.map((c) => c[0].value);
        // expect the log to be called 3 times with 0 as a value
        expect(log).toHaveBeenCalledTimes(5);
        expect(values).toEqual([0, 1, 2, 3, 4]);
    });

    // flow/multiGate
    test("flow/multiGate with random", async () => {
        // a multiGate that will trigger the logging node 3 times
        await generateSimpleNodeGraph(
            [{ op: "flow/multiGate" }, { op: "flow/log", extension: "BABYLON" }, { op: "flow/sequence" }],
            [
                // multiGate
                {
                    declaration: 0,
                    configuration: {
                        isRandom: {
                            value: [true],
                        },
                    },
                    flows: {
                        "1": {
                            node: 2,
                            socket: "in",
                        },
                        "2": {
                            node: 2,
                            socket: "in",
                        },
                        "3": {
                            node: 2,
                            socket: "in",
                        },
                        "4": {
                            node: 2,
                            socket: "in",
                        },
                        "5": {
                            node: 2,
                            socket: "in",
                        },
                    },
                },
                // logging, when multiGate is done
                {
                    declaration: 1,
                    values: {
                        message: {
                            node: 0,
                            socket: "lastIndex",
                        },
                    },
                },
                // sequence node - go to logging in AND the doN loop
                {
                    declaration: 2,
                    flows: {
                        "1": {
                            node: 1, // logging node
                            socket: "in",
                        },
                        "2": {
                            node: 0, // multigate
                            socket: "in",
                        },
                    },
                },
            ],
            [{ signature: "float" }]
        );

        const values = log.mock.calls.map((c) => c[0].value);
        // expect the log to be called 3 times with 0 as a value
        expect(log).toHaveBeenCalledTimes(5);
        // they should not be sorted!
        expect(values).not.toEqual([0, 1, 2, 3, 4]);
        // however, when sorted, they should be this array. Not that .sort works because it is a single digit!
        expect(values.sort()).toEqual([0, 1, 2, 3, 4]);
    });

    // flow/waitAll
    test("flow/waitAll - standard", async () => {
        // a waitAll that will trigger the logging node 3 times
        await generateSimpleNodeGraph(
            [{ op: "flow/waitAll" }, { op: "flow/log", extension: "BABYLON" }, { op: "flow/sequence" }, { op: "flow/setDelay" }],
            [
                // sequence node - go to logging in AND the doN loop
                {
                    declaration: 2,
                    flows: {
                        "1": {
                            node: 5, // delay
                            socket: "in",
                        },
                        "2": {
                            node: 4, // delay
                            socket: "in",
                        },
                        "3": {
                            node: 3, // delay
                            socket: "in",
                        },
                    },
                },
                // waitAll
                {
                    declaration: 0,
                    configuration: {
                        inputFlows: {
                            value: [3],
                        },
                    },
                    flows: {
                        completed: {
                            node: 2,
                            socket: "in",
                        },
                        out: {
                            node: 2,
                            socket: "in",
                        },
                    },
                },
                // logging, when waitAll is done
                {
                    declaration: 1,
                    values: {
                        message: {
                            node: 1,
                            socket: "remainingInputs",
                        },
                    },
                },
                // setDelay
                {
                    declaration: 3,
                    values: {
                        duration: {
                            type: 0,
                            value: [0.4],
                        },
                    },
                    flows: {
                        done: {
                            node: 1,
                            socket: "0",
                        },
                    },
                },
                {
                    declaration: 3,
                    values: {
                        duration: {
                            type: 0,
                            value: [0.5],
                        },
                    },
                    flows: {
                        done: {
                            node: 1,
                            socket: "1",
                        },
                    },
                },
                {
                    declaration: 3,
                    values: {
                        duration: {
                            type: 0,
                            value: [0.2],
                        },
                    },
                    flows: {
                        done: {
                            node: 1,
                            socket: "2",
                        },
                    },
                },
            ],
            [{ signature: "float" }]
        );

        // wait for 1 second
        await new Promise((resolve) => setTimeout(resolve, 1000 + 100));
        const values = log.mock.calls.map((c) => c[0]);
        // expect log to be called 3 times - after the first was triggered (2 remaining), then after the second (1 remaining), and then after the last one (0 remaining - completed.)
        expect(log).toHaveBeenCalledTimes(3);
        // last remaining inputs test, also testing out and completed flows
        expect(values).toEqual([2, 1, 0]);
    });

    // flow throttle
    test("flow/throttle", async () => {
        // a throttle that will trigger the logging node 3 times
        await generateSimpleNodeGraph(
            [{ op: "flow/throttle" }, { op: "flow/log", extension: "BABYLON" }, { op: "flow/sequence" }, { op: "flow/setDelay" }],
            [
                // sequence node - go to logging in AND the doN loop
                {
                    declaration: 2,
                    flows: {
                        "1": {
                            node: 6, // delay
                            socket: "in",
                        },
                        "2": {
                            node: 5, // delay
                            socket: "in",
                        },
                        "3": {
                            node: 3, // delay
                            socket: "in",
                        },
                        "4": {
                            node: 7, // delay
                            socket: "in",
                        },
                        "5": {
                            node: 8, // delay
                            socket: "in",
                        },
                    },
                },
                // throttle
                {
                    declaration: 0,
                    values: {
                        duration: {
                            value: [0.2],
                            type: 0,
                        },
                    },
                    flows: {
                        out: {
                            node: 2,
                            socket: "in",
                        },
                    },
                },
                // logging, when throttle is done
                {
                    declaration: 1,
                    values: {
                        message: {
                            node: 1,
                            socket: "lastRemainingTime",
                        },
                    },
                },
                // setDelay
                {
                    declaration: 3,
                    values: {
                        duration: {
                            type: 0,
                            value: [0.25],
                        },
                    },
                    flows: {
                        done: {
                            node: 4,
                            socket: "in",
                        },
                    },
                },
                // sequence - one to log, one to throttle
                {
                    declaration: 2,
                    flows: {
                        "1": {
                            // first log
                            node: 1,
                            socket: "in",
                        },
                        "2": {
                            node: 2,
                            socket: "in",
                        },
                    },
                },
                {
                    declaration: 3,
                    values: {
                        duration: {
                            type: 0,
                            value: [0.5],
                        },
                    },
                    flows: {
                        done: {
                            node: 4, // log
                            socket: "in",
                        },
                    },
                },
                {
                    declaration: 3,
                    values: {
                        duration: {
                            type: 0,
                            value: [0.1],
                        },
                    },
                    flows: {
                        done: {
                            node: 4, // log
                            socket: "in",
                        },
                    },
                },
                {
                    declaration: 3,
                    values: {
                        duration: {
                            type: 0,
                            value: [0.38],
                        },
                    },
                    flows: {
                        done: {
                            node: 4, // log
                            socket: "in",
                        },
                    },
                },
                {
                    declaration: 3,
                    values: {
                        duration: {
                            type: 0,
                            value: [0.65],
                        },
                    },
                    flows: {
                        done: {
                            node: 4, // log
                            socket: "in",
                        },
                    },
                },
            ],
            [{ signature: "float" }]
        );

        // wait for 1 second
        await new Promise((resolve) => setTimeout(resolve, 1000 + 100));
        const values = log.mock.calls.map((c) => c[0]);
        // expect log to be called 8 times - 5 times from the delays, and 3 executions from the throttle
        expect(log).toHaveBeenCalledTimes(8);
        // now - expect positions 0,1 to equal 0
        expect(values.slice(0, 2)).toEqual([0, 0]);
        // same for positions 3,4
        expect(values.slice(3, 5)).toEqual([0, 0]);
        // same for positions 6,7
        expect(values.slice(6, 8)).toEqual([0, 0]);
        // expect position 2 and position 5 to NOT be 0 and to be positive, and less than 0.2
        expect(values[2]).toBeGreaterThan(0);
        expect(values[2]).toBeLessThan(0.2);
        expect(values[5]).toBeGreaterThan(0);
        expect(values[5]).toBeLessThan(0.2);
    });

    // flow/cancelDelay
    test("flow/cancelDelay", async () => {
        // a cancelDelay that will trigger the logging node 3 times
        await generateSimpleNodeGraph(
            [{ op: "flow/setDelay" }, { op: "flow/cancelDelay" }, { op: "flow/log", extension: "BABYLON" }, { op: "flow/sequence" }],
            [
                // sequence node - go to logging in AND the doN loop
                {
                    declaration: 3,
                    flows: {
                        "1": {
                            node: 1, // setDelay that goes to log
                            socket: "in",
                        },
                        "2": {
                            node: 2, // set delay that cancels the first delay
                            socket: "in",
                        },
                    },
                },
                // setDelay
                {
                    declaration: 0,
                    values: {
                        duration: {
                            type: 0,
                            value: [0.7],
                        },
                    },
                    flows: {
                        done: {
                            node: 2,
                            socket: "in",
                        },
                    },
                },
                // setDelay to cancel the first delay
                {
                    declaration: 0,
                    values: {
                        duration: {
                            type: 0,
                            value: [0.5],
                        },
                    },
                    flows: {
                        done: {
                            node: 3,
                            socket: "in",
                        },
                    },
                },
                // cancelDelay
                {
                    declaration: 1,
                    values: {
                        delayIndex: {
                            type: 1,
                            value: [0],
                        },
                    },
                },
                // logging, when delay is done - not expected to be called
                {
                    declaration: 2,
                    values: {
                        message: {
                            node: 1,
                            socket: "lastDelayIndex",
                        },
                    },
                },
            ],
            [{ signature: "float" }, { signature: "int" }]
        );

        // wait for 1 second + 100 ,s buffer
        await new Promise((resolve) => setTimeout(resolve, 1000 + 100));
        // expect log to be not have been called
        expect(log).not.toHaveBeenCalled();
    });

    test("debug/log", async () => {
        await generateSimpleNodeGraph(
            [{ op: "debug/log" }],
            [
                {
                    declaration: 0,
                    configuration: {
                        message: {
                            value: ["Hello World {a}, this is a test {b}"],
                        },
                    },
                    values: {
                        a: {
                            type: 0,
                            value: [1],
                        },
                        b: {
                            type: 1,
                            value: [2, 3],
                        },
                    },
                },
            ],
            [{ signature: "float" }, { signature: "float2" }]
        );
        // expect log to be called 1 time with the message
        expect(log).toHaveBeenCalledTimes(1);
        expect(log).toHaveBeenCalledWith("Hello World 1, this is a test {X: 2 Y: 3}");
    });
});
