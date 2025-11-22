import type { IKHRInteractivity_Declaration, IKHRInteractivity_Graph, IKHRInteractivity_Node, IKHRInteractivity_Type } from "babylonjs-gltf2interface";
import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { NullEngine } from "core/Engines/nullEngine";
import { PerformanceConfigurator } from "core/Engines/performanceConfigurator";
import { FlowGraphCoordinator } from "core/FlowGraph/flowGraphCoordinator";
import { FlowGraphAction } from "core/FlowGraph/flowGraphLogger";
import { GetAngleBetweenQuaternions, GetQuaternionFromDirections } from "core/FlowGraph/flowGraphMath";
import { ParseFlowGraphAsync } from "core/FlowGraph/flowGraphParser";
import { Quaternion, Vector3 } from "core/Maths/math.vector";
import { Logger } from "core/Misc/logger";
import { Scene } from "core/scene";
import { InteractivityGraphToFlowGraphParser } from "loaders/glTF/2.0/Extensions/KHR_interactivity/interactivityGraphParser";
import { GetPathToObjectConverter } from "loaders/glTF/2.0/Extensions/objectModelMapping";

const typesAndLengths: {
    [key: string]: number;
} = {
    float: 1,
    float2: 2,
    float3: 3,
    float4: 4,
    int: 1,
    float4x4: 16,
};

function round3(value: number): number {
    return Math.round(value * 1000) / 1000;
}

function roundArray3(value: number[]): number[] {
    return value.map((v) => round3(v));
}

/**
 * This test is for the interactivity nodes. Each nodes will have its own test, making sure it is working according to the specs.
 * Note that this expects that the Flow Graph is working correctly, as the nodes will be converted to FlowGraph blocks.
 */
describe("Interactivity math nodes", () => {
    let engine;
    let scene: Scene;
    const log: jest.SpyInstance = jest.spyOn(Logger, "Log").mockImplementation(() => {});
    const errorLog: jest.SpyInstance = jest.spyOn(Logger, "Error").mockImplementation(() => {});
    let mockGltf: any;
    const pathConverter = GetPathToObjectConverter(mockGltf);

    async function generateSimpleNodeGraph(
        declarations: IKHRInteractivity_Declaration[],
        nodes: IKHRInteractivity_Node[],
        types: IKHRInteractivity_Type[] = [],
        nodeIndexForOutput: number = 0,
        socketValueForOutput: string = "value"
    ) {
        const ig = {
            declarations: [...declarations, { op: "event/onStart" }, { op: "flow/log", extension: "BABYLON" }],
            types,
            nodes: [
                ...nodes,
                {
                    declaration: declarations.length,
                    flows: {
                        out: {
                            node: nodes.length + 1,
                            socket: "in",
                        },
                    },
                },
                {
                    declaration: declarations.length + 1,
                    values: {
                        message: {
                            node: nodeIndexForOutput,
                            socket: socketValueForOutput,
                        },
                    },
                },
            ],
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
        PerformanceConfigurator.MatrixCurrentType = Array;
    });

    it("should use math/E correctly", async () => {
        const graph = await generateSimpleNodeGraph(
            [{ op: "math/E" }],
            [
                {
                    declaration: 0,
                },
            ]
        );

        const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        expect(logItem!.payload.value).toBe(Math.E);
    });

    it("should use math/Pi correctly", async () => {
        const graph = await generateSimpleNodeGraph(
            [{ op: "math/Pi" }],
            [
                {
                    declaration: 0,
                },
            ]
        );

        const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        expect(logItem!.payload.value).toBe(Math.PI);
    });

    it("should use math/Inf correctly", async () => {
        const graph = await generateSimpleNodeGraph(
            [{ op: "math/Inf" }],
            [
                {
                    declaration: 0,
                },
            ]
        );

        const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        expect(logItem!.payload.value).toBe(Infinity);
    });

    it("should use math/NaN correctly", async () => {
        const graph = await generateSimpleNodeGraph(
            [{ op: "math/NaN" }],
            [
                {
                    declaration: 0,
                },
            ]
        );

        const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        expect(isNaN(logItem!.payload.value)).toBe(true);
    });

    it("should use math/random correctly", async () => {
        const graph = await generateSimpleNodeGraph(
            [{ op: "math/random" }],
            [
                {
                    declaration: 0,
                },
            ]
        );

        const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        expect(typeof logItem!.payload.value).toBe("number");
    });

    it("should be the same random number when using math/eq with math/random", async () => {
        const graph = await generateSimpleNodeGraph(
            [{ op: "math/eq" }, { op: "math/random" }],
            [
                {
                    declaration: 0,
                    values: {
                        a: {
                            node: 1,
                            socket: "value",
                        },
                        b: {
                            node: 1,
                            socket: "value",
                        },
                    },
                },
                {
                    declaration: 1,
                },
            ],
            [{ signature: "float" }]
        );

        const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        expect(logItem!.payload.value).toBe(true);
    });

    it("should use math/select correctly - positive", async () => {
        const graph = await generateSimpleNodeGraph(
            [{ op: "math/select" }],
            [
                {
                    declaration: 0,
                    values: {
                        a: {
                            type: 0,
                            value: [1, 2, 3],
                        },
                        b: {
                            type: 0,
                            value: [4, 5, 6],
                        },
                        condition: {
                            type: 1,
                            value: [true],
                        },
                    },
                },
            ],
            [{ signature: "float3" }, { signature: "bool" }]
        );

        const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        expect(logItem!.payload.value.asArray()).toEqual([1, 2, 3]);
    });

    it("should use math/select correctly - negative", async () => {
        const graph = await generateSimpleNodeGraph(
            [{ op: "math/select" }],
            [
                {
                    declaration: 0,
                    values: {
                        a: {
                            type: 0,
                            value: [1, 2, 3],
                        },
                        b: {
                            type: 0,
                            value: [4, 5, 6],
                        },
                        condition: {
                            type: 1,
                            value: [false],
                        },
                    },
                },
            ],
            [{ signature: "float3" }, { signature: "bool" }]
        );

        const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        expect(logItem!.payload.value.asArray()).toEqual([4, 5, 6]);
    });

    const testMathNodes: {
        [key: string]: {
            operation: (...args: any) => any;
            types: string[];
            inputs: number;
            returnLength?: number;
            only?: string[];
        };
    } = {
        "math/abs": {
            operation: Math.abs,
            types: ["float", "float2", "float3", "float4", "float4x4", "int"],
            inputs: 1,
        },
        "math/sign": {
            operation: Math.sign,
            types: ["float", "float2", "float3", "float4", "float4x4", "int"],
            inputs: 1,
        },
        "math/trunc": {
            operation: Math.trunc,
            types: ["float", "float2", "float3", "float4", "float4x4"],
            inputs: 1,
        },
        "math/floor": {
            operation: Math.floor,
            types: ["float", "float2", "float3", "float4", "float4x4"],
            inputs: 1,
        },
        "math/ceil": {
            operation: Math.ceil,
            types: ["float", "float2", "float3", "float4", "float4x4"],
            inputs: 1,
        },
        "math/round": {
            operation: (val: number) => (val < 0 ? -Math.round(-val) : Math.round(val)),
            types: ["float", "float2", "float3", "float4", "float4x4"],
            inputs: 1,
        },
        "math/fract": {
            operation: (val: number) => val - Math.floor(val),
            types: ["float", "float2", "float3", "float4", "float4x4"],
            inputs: 1,
        },
        "math/neg": {
            operation: (val: number) => -val,
            types: ["float", "float2", "float3", "float4", "float4x4", "int"],
            inputs: 1,
        },
        "math/add": {
            operation: (a: number, b: number) => a + b,
            types: ["float", "float2", "float3", "float4", "float4x4", "int"],
            inputs: 2,
        },
        "math/sub": {
            operation: (a: number, b: number) => a - b,
            types: ["float", "float2", "float3", "float4", "float4x4", "int"],
            inputs: 2,
        },
        "math/mul": {
            operation: (a: number, b: number) => a * b,
            types: ["float", "float2", "float3", "float4", "float4x4", "int"],
            inputs: 2,
        },
        "math/div": {
            operation: (a: number, b: number) => a / b,
            types: ["float", "float2", "float3", "float4", "float4x4", "int"],
            inputs: 2,
        },
        "math/clamp": {
            operation: (a: number, b: number, c: number) => Math.min(Math.max(a, Math.min(b, c)), Math.max(b, c)),
            types: ["float", "float2", "float3", "float4", "float4x4", "int"],
            inputs: 3,
        },
        "math/min": {
            operation: Math.min,
            types: ["float", "float2", "float3", "float4", "float4x4", "int"],
            inputs: 2,
        },
        "math/max": {
            operation: Math.max,
            types: ["float", "float2", "float3", "float4", "float4x4", "int"],
            inputs: 2,
        },
        "math/rem": {
            operation: (a: number, b: number) => a % b,
            types: ["float", "float2", "float3", "float4", "float4x4", "int"],
            inputs: 2,
        },
        "math/saturate": {
            operation: (a: number) => Math.min(Math.max(a, 0), 1),
            types: ["float", "float2", "float3", "float4", "float4x4"],
            inputs: 1,
        },
        "math/mix": {
            operation: (a: number, b: number, c: number) => a * (1 - c) + b * c,
            types: ["float", "float2", "float3", "float4", "float4x4"],
            inputs: 3,
        },
        "math/eq": {
            operation: (a: number, b: number) => a === b,
            types: ["float", "float2", "float3", "float4", "float4x4", "int"],
            inputs: 2,
            returnLength: 1,
        },
        "math/lt": {
            operation: (a: number, b: number) => a < b,
            types: ["float", "int"],
            inputs: 2,
            returnLength: 1,
        },
        "math/le": {
            operation: (a: number, b: number) => a <= b,
            types: ["float", "int"],
            inputs: 2,
            returnLength: 1,
        },
        "math/gt": {
            operation: (a: number, b: number) => a > b,
            types: ["float", "int"],
            inputs: 2,
            returnLength: 1,
        },
        "math/ge": {
            operation: (a: number, b: number) => a >= b,
            types: ["float", "int"],
            inputs: 2,
            returnLength: 1,
        },
        "math/isNaN": {
            operation: isNaN,
            types: ["float"],
            inputs: 1,
        },
        "math/isInf": {
            operation: (a: number) => !isFinite(a),
            types: ["float"],
            inputs: 1,
        },
        "math/rad": {
            operation: (a: number) => (a * Math.PI) / 180,
            types: ["float", "float2", "float3", "float4", "float4x4"],
            inputs: 1,
        },
        "math/deg": {
            operation: (a: number) => (a * 180) / Math.PI,
            types: ["float", "float2", "float3", "float4", "float4x4"],
            inputs: 1,
        },
        "math/sin": {
            operation: Math.sin,
            types: ["float", "float2", "float3", "float4", "float4x4"],
            inputs: 1,
        },
        "math/cos": {
            operation: Math.cos,
            types: ["float", "float2", "float3", "float4", "float4x4"],
            inputs: 1,
        },
        "math/tan": {
            operation: Math.tan,
            types: ["float", "float2", "float3", "float4", "float4x4"],
            inputs: 1,
        },
        "math/asin": {
            operation: Math.asin,
            types: ["float", "float2", "float3", "float4", "float4x4"],
            inputs: 1,
            only: ["allPositive", "allZero"],
        },
        "math/acos": {
            operation: Math.acos,
            types: ["float", "float2", "float3", "float4", "float4x4"],
            inputs: 1,
            only: ["allPositive", "allZero"],
        },
        "math/atan": {
            operation: Math.atan,
            types: ["float", "float2", "float3", "float4", "float4x4"],
            inputs: 1,
            only: ["allPositive", "allZero"],
        },
        "math/atan2": {
            operation: Math.atan2,
            types: ["float", "float2", "float3", "float4", "float4x4"],
            inputs: 2,
        },
        "math/asinh": {
            operation: Math.asinh,
            types: ["float", "float2", "float3", "float4", "float4x4"],
            inputs: 1,
            only: ["allPositive", "allZero"],
        },
        "math/acosh": {
            operation: Math.acosh,
            types: ["float", "float2", "float3", "float4", "float4x4"],
            inputs: 1,
            only: ["allPositive", "allZero"],
        },
        "math/atanh": {
            operation: Math.atanh,
            types: ["float", "float2", "float3", "float4", "float4x4"],
            inputs: 1,
            only: ["allPositive", "allZero"],
        },
        "math/exp": {
            operation: Math.exp,
            types: ["float", "float2", "float3", "float4", "float4x4"],
            inputs: 1,
        },
        "math/log": {
            operation: Math.log,
            types: ["float", "float2", "float3", "float4", "float4x4"],
            inputs: 1,
            only: ["allPositive", "allZero"],
        },
        "math/log2": {
            operation: Math.log2,
            types: ["float", "float2", "float3", "float4", "float4x4"],
            inputs: 1,
            only: ["allPositive", "allZero"],
        },
        "math/log10": {
            operation: Math.log10,
            types: ["float", "float2", "float3", "float4", "float4x4"],
            inputs: 1,
            only: ["allPositive", "allZero"],
        },
        "math/sqrt": {
            operation: Math.sqrt,
            types: ["float", "float2", "float3", "float4", "float4x4"],
            inputs: 1,
            only: ["allPositive", "allZero"],
        },
        "math/cbrt": {
            operation: Math.cbrt,
            types: ["float", "float2", "float3", "float4", "float4x4"],
            inputs: 1,
            only: ["allPositive", "allZero"],
        },
        "math/pow": {
            operation: Math.pow,
            types: ["float", "float2", "float3", "float4", "float4x4"],
            inputs: 2,
            only: ["allPositive", "allZero"],
        },
    };

    const filterType = "int";
    const filterTest = "";

    const testScenarios: { [key: string]: (length: number) => number[] } = {
        allRandom: (length: number) => Array.from({ length }, () => Math.random() * 100 - 50),
        allPositive: (length: number) => Array.from({ length }, () => Math.random() * 100),
        allNegative: (length: number) => Array.from({ length }, () => Math.random() * -100),
        allZero: (length: number) => Array.from({ length }, () => 0),
        allSame: (length: number) => [...new Float32Array(length).fill(Math.random() * 100 - 50)],
    };

    Object.keys(testMathNodes).forEach((nodeName) => {
        if (filterTest && nodeName !== filterTest) {
            return;
        }
        const testNode = testMathNodes[nodeName];
        testNode.types.forEach((type) => {
            if (filterType && type !== filterType) {
                return;
            }
            if (testNode.only && !testNode.only.includes(type)) {
                return;
            }
            // check that it fails is wrong types are provided
            it(`should fail ${nodeName} with ${type} and wrong types`, async () => {
                const scenario = testScenarios.allRandom;
                const length = typesAndLengths[type];
                const valArrays: number[][] = [];
                const values: any = {};
                for (let i = 0; i < testNode.inputs; i++) {
                    const val = scenario(length).map((v) => Math.round(v * 10000) / 10000);
                    const key = i === 0 ? "a" : i === 1 ? "b" : i === 2 ? "c" : "d";
                    values[key] = {
                        type: 0, // first position in the types array defined below
                        value: val,
                    };
                    valArrays.push(val);
                }
                // get the wrong type
                const wrongType = type === "int" || type === "float" ? "float2" : testNode.types.find((t) => t !== type);
                // expect the next call to throw:
                let error;
                try {
                    await generateSimpleNodeGraph(
                        [{ op: nodeName }],
                        [
                            {
                                declaration: 0,
                                values,
                            },
                        ],
                        [{ signature: wrongType as IKHRInteractivity_Type["signature"] }]
                    );
                } catch (e) {
                    error = e;
                }
                expect(error).toBeDefined();
                expect(errorLog).toHaveBeenCalled();
            });
            Object.keys(testScenarios).forEach((scenarioName) => {
                // skip allZero in math/rem and math/div
                if (scenarioName === "allZero" && (nodeName === "math/rem" || nodeName === "math/div")) {
                    return;
                }
                it(`should run ${nodeName} with ${type} and ${scenarioName}`, async () => {
                    // make sure we don't use float32array for deterministic tests
                    PerformanceConfigurator.MatrixCurrentType = Array;
                    if (!typesAndLengths[type]) {
                        throw new Error(`Type ${type} is not supported`);
                    }
                    const length = typesAndLengths[type];
                    const valArrays: number[][] = [];
                    const values: any = {};
                    for (let i = 0; i < testNode.inputs; i++) {
                        let val = testScenarios[scenarioName](length).map((v) => Math.round(v * 10000) / 10000);
                        if (type === "int") {
                            val = val.map((v) => v | 0);
                        }
                        const key = i === 0 ? "a" : i === 1 ? "b" : i === 2 ? "c" : "d";
                        values[key] = {
                            type: 0, // first position in the types array defined below
                            value: val,
                        };
                        valArrays.push(val);
                    }
                    const graph = await generateSimpleNodeGraph(
                        [{ op: nodeName }],
                        [
                            {
                                declaration: 0,
                                values,
                            },
                        ],
                        [{ signature: type as IKHRInteractivity_Type["signature"] }]
                    );
                    const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
                    expect(logItem).toBeDefined();
                    const resultArray = logItem!.payload.value.asArray
                        ? [...logItem!.payload.value.asArray()]
                        : [typeof logItem!.payload.value.value !== "undefined" ? logItem!.payload.value.value : logItem!.payload.value];
                    expect(typeof resultArray[0]).not.toBe("undefined");
                    expect(resultArray.length).toBe(testNode.returnLength || length);
                    // make sure nothing is NaN
                    for (let i = 0; i < resultArray.length; i++) {
                        expect(resultArray[i]).not.toBeNaN();
                    }
                    let expected: number[] | boolean[] = [];
                    for (let i = 0; i < length; i++) {
                        (expected as number[]).push(testNode.operation(...valArrays.map((v) => v[i])));
                    }
                    if (typeof expected[0] === "boolean") {
                        expected = [expected.every((v) => v)];
                    }
                    // handle int
                    if (type === "int" && typeof expected[0] === "number") {
                        expected = expected.map((v) => (v as number) | 0);
                    }
                    expect(resultArray).toEqual(expected);
                });
            });
        });
    });

    const testVectorMathNodes: {
        [key: string]: {
            operation: (...args: any) => any;
            types: string[];
            inputs: number;
            returnLength?: number;
        };
    } = {
        "math/length": {
            operation: (a: number[]) => Math.sqrt(a.reduce((acc, val) => acc + val * val, 0)),
            types: ["float2", "float3", "float4"],
            inputs: 1,
        },
        "math/normalize": {
            operation: (a: number[]) => {
                const len = Math.sqrt(a.reduce((acc, val) => acc + val * val, 0));
                return a.map((v) => v / len);
            },
            types: ["float2", "float3", "float4"],
            inputs: 1,
        },
        "math/dot": {
            operation: (a: number[], b: number[]) => a.reduce((acc, val, i) => acc + val * b[i], 0),
            types: ["float2", "float3", "float4"],
            inputs: 2,
        },
        "math/cross": {
            operation: (a: number[], b: number[]) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
            types: ["float3"],
            inputs: 2,
        },
    };

    Object.keys(testVectorMathNodes).forEach((nodeName) => {
        const testNode = testVectorMathNodes[nodeName];
        testNode.types.forEach((type) => {
            if (filterType && type !== filterType) {
                return;
            }
            it(`should run vector ${nodeName} with ${type}`, async () => {
                const length = typesAndLengths[type];
                const valArrays: number[][] = [];
                const values: any = {};
                for (let i = 0; i < testNode.inputs; i++) {
                    const val = roundArray3(testScenarios.allRandom(length));
                    const key = i === 0 ? "a" : i === 1 ? "b" : i === 2 ? "c" : "d";
                    values[key] = {
                        type: 0, // first position in the types array defined below
                        value: val,
                    };
                    valArrays.push(val);
                }
                const graph = await generateSimpleNodeGraph(
                    [{ op: nodeName }],
                    [
                        {
                            declaration: 0,
                            values,
                        },
                    ],
                    [{ signature: type as IKHRInteractivity_Type["signature"] }]
                );
                const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
                expect(logItem).toBeDefined();
                const resultArray = logItem!.payload.value.asArray ? logItem!.payload.value.asArray() : logItem!.payload.value;
                // make sure nothing is NaN
                const expected = testNode.operation(...valArrays);
                for (let i = 0; i < resultArray.length || 0; i++) {
                    expect(resultArray[i]).not.toBeNaN();
                    // round to 3 decimals
                    resultArray[i] = roundArray3(resultArray);
                    expected[i] = roundArray3(expected);
                }

                expect(resultArray).toEqual(expected);
            });
        });
    });

    it("should use math/rotate2D correctly - basic rotation", async () => {
        const graph = await generateSimpleNodeGraph(
            [{ op: "math/rotate2D" }],
            [
                {
                    declaration: 0,
                    values: {
                        angle: {
                            type: 1,
                            value: [Math.PI / 2],
                        },
                        a: {
                            type: 0,
                            value: [1, 0],
                        },
                    },
                },
            ],
            [{ signature: "float2" }, { signature: "float" }]
        );
        const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        // round result to 3 decimals
        const resultArray = roundArray3(logItem!.payload.value.asArray());
        expect(resultArray).toEqual([0, 1]);
    });

    it("should use math/rotate2D correctly - random rotation", async () => {
        const rotationAngleInRadians = Math.random() * Math.PI * 2;
        const graph = await generateSimpleNodeGraph(
            [{ op: "math/rotate2D" }],
            [
                {
                    declaration: 0,
                    values: {
                        angle: {
                            type: 1,
                            value: [rotationAngleInRadians],
                        },
                        a: {
                            type: 0,
                            value: [1, 1],
                        },
                    },
                },
            ],
            [{ signature: "float2" }, { signature: "float" }]
        );
        const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        const expected = roundArray3([Math.cos(rotationAngleInRadians) - Math.sin(rotationAngleInRadians), Math.sin(rotationAngleInRadians) + Math.cos(rotationAngleInRadians)]);
        const resultArray = roundArray3(logItem!.payload.value.asArray());
        expect(resultArray).toEqual(expected);
    });

    it("should use math/rotate2D correctly - random rotation with random vector", async () => {
        const rotationAngleInRadians = Math.random() * Math.PI * 2;
        const vector = [Math.random() * 100 - 50, Math.random() * 100 - 50];
        const graph = await generateSimpleNodeGraph(
            [{ op: "math/rotate2D" }],
            [
                {
                    declaration: 0,
                    values: {
                        angle: {
                            type: 1,
                            value: [rotationAngleInRadians],
                        },
                        a: {
                            type: 0,
                            value: vector,
                        },
                    },
                },
            ],
            [{ signature: "float2" }, { signature: "float" }]
        );
        const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        const expected = roundArray3([
            vector[0] * Math.cos(rotationAngleInRadians) - vector[1] * Math.sin(rotationAngleInRadians),
            vector[0] * Math.sin(rotationAngleInRadians) + vector[1] * Math.cos(rotationAngleInRadians),
        ]);
        const resultArray = roundArray3(logItem!.payload.value.asArray());
        expect(resultArray).toEqual(expected);
    });

    it("should use math/rotate3D correctly - basic rotation", async () => {
        const graph = await generateSimpleNodeGraph(
            [{ op: "math/rotate3D" }],
            [
                {
                    declaration: 0,
                    values: {
                        a: {
                            type: 0,
                            value: [1, 1, 1],
                        },
                        rotation: {
                            type: 1,
                            value: Quaternion.FromEulerAngles(Math.PI / 2, 0, 0).asArray(),
                        },
                    },
                },
            ],
            [{ signature: "float3" }, { signature: "float4" }]
        );
        const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        const resultArray = roundArray3(logItem!.payload.value.asArray());
        expect(resultArray).toEqual([1, -1, 1]);
    });

    it("should use math/rotate3D correctly - random rotation and vector", async () => {
        const rotationAngleInRadians = Math.random() * Math.PI * 2;
        const quaternion = Quaternion.FromEulerAngles(rotationAngleInRadians, 0, 0);
        const vector = new Vector3(Math.random() * 100 - 50, Math.random() * 100 - 50, Math.random() * 100 - 50);
        const graph = await generateSimpleNodeGraph(
            [{ op: "math/rotate3D" }],
            [
                {
                    declaration: 0,
                    values: {
                        a: {
                            type: 0,
                            value: vector.asArray(),
                        },
                        rotation: {
                            type: 1,
                            value: quaternion.asArray(),
                        },
                    },
                },
            ],
            [{ signature: "float3" }, { signature: "float4" }]
        );
        const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        const expected = roundArray3(vector.applyRotationQuaternion(quaternion).asArray());
        const resultArray = roundArray3(logItem!.payload.value.asArray());
        expect(resultArray).toEqual(expected);
    });

    // math/transform

    it("should use math/transform correctly - vector2", async () => {
        const randomMatrix = Array.from({ length: 4 }, () => Math.random() - 0.5);
        const graph = await generateSimpleNodeGraph(
            [{ op: "math/transform" }],
            [
                {
                    declaration: 0,
                    values: {
                        // matrix2d
                        b: {
                            type: 1,
                            value: randomMatrix,
                        },
                        // vector to transform
                        a: {
                            type: 0,
                            value: [1, 1],
                        },
                    },
                },
            ],
            [{ signature: "float2" }, { signature: "float2x2" }]
        );
        const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        // round result to 3 decimals
        const resultArray = roundArray3(logItem!.payload.value.asArray());
        // row-major matrix
        const expected = roundArray3([1 * randomMatrix[0] + 1 * randomMatrix[1], 1 * randomMatrix[2] + 1 * randomMatrix[3]]);
        expect(resultArray).toEqual(expected);
    });

    it("should use math/transform correctly - vector3", async () => {
        const randomMatrix = Array.from({ length: 9 }, () => Math.random() - 0.5);
        const graph = await generateSimpleNodeGraph(
            [{ op: "math/transform" }],
            [
                {
                    declaration: 0,
                    values: {
                        // matrix2d
                        b: {
                            type: 1,
                            value: randomMatrix,
                        },
                        // vector to transform
                        a: {
                            type: 0,
                            value: [1, 1, 1],
                        },
                    },
                },
            ],
            [{ signature: "float3" }, { signature: "float3x3" }]
        );
        const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        // round result to 3 decimals
        const resultArray = roundArray3(logItem!.payload.value.asArray());
        // row-major matrix!
        const expected = roundArray3([
            1 * randomMatrix[0] + 1 * randomMatrix[1] + 1 * randomMatrix[2],
            1 * randomMatrix[3] + 1 * randomMatrix[4] + 1 * randomMatrix[5],
            1 * randomMatrix[6] + 1 * randomMatrix[7] + 1 * randomMatrix[8],
        ]);
        expect(resultArray).toEqual(expected);
    });

    it("should use math/transform correctly - vector4", async () => {
        const randomMatrix = Array.from({ length: 16 }, () => Math.random() - 0.5);
        const graph = await generateSimpleNodeGraph(
            [{ op: "math/transform" }],
            [
                {
                    declaration: 0,
                    values: {
                        // matrix2d
                        b: {
                            type: 1,
                            value: randomMatrix,
                        },
                        // vector to transform
                        a: {
                            type: 0,
                            value: [1, 1, 1, 1],
                        },
                    },
                },
            ],
            [{ signature: "float4" }, { signature: "float4x4" }]
        );
        const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        // round result to 3 decimals
        const resultArray = roundArray3(logItem!.payload.value.asArray());
        const expected = roundArray3([
            1 * randomMatrix[0] + 1 * randomMatrix[1] + 1 * randomMatrix[2] + 1 * randomMatrix[3],
            1 * randomMatrix[4] + 1 * randomMatrix[5] + 1 * randomMatrix[6] + 1 * randomMatrix[7],
            1 * randomMatrix[8] + 1 * randomMatrix[9] + 1 * randomMatrix[10] + 1 * randomMatrix[11],
            1 * randomMatrix[12] + 1 * randomMatrix[13] + 1 * randomMatrix[14] + 1 * randomMatrix[15],
        ]);
        expect(resultArray).toEqual(expected);
    });

    it("should use math/transpose correctly - matrix2", async () => {
        const randomMatrix = Array.from({ length: 4 }, () => Math.random() - 0.5);
        const graph = await generateSimpleNodeGraph(
            [{ op: "math/transpose" }],
            [
                {
                    declaration: 0,
                    values: {
                        // matrix2d
                        a: {
                            type: 0,
                            value: randomMatrix,
                        },
                    },
                },
            ],
            [{ signature: "float2x2" }]
        );
        const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        // round result to 3 decimals
        const resultArray = roundArray3(logItem!.payload.value.asArray());
        const expected = roundArray3([randomMatrix[0], randomMatrix[2], randomMatrix[1], randomMatrix[3]]);
        expect(resultArray).toEqual(expected);
    });

    it("should use math/transpose correctly - matrix3", async () => {
        const randomMatrix = Array.from({ length: 9 }, () => Math.random() - 0.5);
        const graph = await generateSimpleNodeGraph(
            [{ op: "math/transpose" }],
            [
                {
                    declaration: 0,
                    values: {
                        // matrix2d
                        a: {
                            type: 0,
                            value: randomMatrix,
                        },
                    },
                },
            ],
            [{ signature: "float3x3" }]
        );
        const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        // round result to 3 decimals
        const resultArray = roundArray3(logItem!.payload.value.asArray());
        const expected = roundArray3([
            randomMatrix[0],
            randomMatrix[3],
            randomMatrix[6],
            randomMatrix[1],
            randomMatrix[4],
            randomMatrix[7],
            randomMatrix[2],
            randomMatrix[5],
            randomMatrix[8],
        ]);
        expect(resultArray).toEqual(expected);
    });

    it("should use math/transpose correctly - matrix4", async () => {
        PerformanceConfigurator.MatrixCurrentType = Array;
        const randomMatrix = Array.from({ length: 16 }, () => Math.random() - 0.5);
        const graph = await generateSimpleNodeGraph(
            [{ op: "math/transpose" }],
            [
                {
                    declaration: 0,
                    values: {
                        // matrix2d
                        a: {
                            type: 0,
                            value: randomMatrix,
                        },
                    },
                },
            ],
            [{ signature: "float4x4" }]
        );
        const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        // round result to 3 decimals
        const resultArray = roundArray3(logItem!.payload.value.asArray());
        const expected = roundArray3([
            randomMatrix[0],
            randomMatrix[4],
            randomMatrix[8],
            randomMatrix[12],
            randomMatrix[1],
            randomMatrix[5],
            randomMatrix[9],
            randomMatrix[13],
            randomMatrix[2],
            randomMatrix[6],
            randomMatrix[10],
            randomMatrix[14],
            randomMatrix[3],
            randomMatrix[7],
            randomMatrix[11],
            randomMatrix[15],
        ]);
        expect(resultArray).toEqual(expected);
    });

    // math/determinant

    it("should use math/determinant correctly - matrix2", async () => {
        const randomMatrix = Array.from({ length: 4 }, () => Math.random() - 0.5);
        const graph = await generateSimpleNodeGraph(
            [{ op: "math/determinant" }],
            [
                {
                    declaration: 0,
                    values: {
                        // matrix2d
                        a: {
                            type: 0,
                            value: randomMatrix,
                        },
                    },
                },
            ],
            [{ signature: "float2x2" }]
        );
        const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        // round result to 3 decimals
        const result = round3(logItem!.payload.value);
        // round the expected result
        const expected = round3(randomMatrix[0] * randomMatrix[3] - randomMatrix[1] * randomMatrix[2]);
        expect(result).toEqual(expected);
    });

    it("should use math/determinant correctly - matrix3", async () => {
        const randomMatrix = Array.from({ length: 9 }, () => Math.random() - 0.5);
        const graph = await generateSimpleNodeGraph(
            [{ op: "math/determinant" }],
            [
                {
                    declaration: 0,
                    values: {
                        // matrix2d
                        a: {
                            type: 0,
                            value: randomMatrix,
                        },
                    },
                },
            ],
            [{ signature: "float3x3" }]
        );
        const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        // round result to 3 decimals
        const result = round3(logItem!.payload.value);
        const expected =
            randomMatrix[0] * (randomMatrix[4] * randomMatrix[8] - randomMatrix[5] * randomMatrix[7]) -
            randomMatrix[3] * (randomMatrix[1] * randomMatrix[8] - randomMatrix[2] * randomMatrix[7]) +
            randomMatrix[6] * (randomMatrix[1] * randomMatrix[5] - randomMatrix[2] * randomMatrix[4]);
        // round the expected result
        expect(result).toEqual(round3(expected));
    });

    it("should use math/determinant correctly - matrix4", async () => {
        const randomMatrix = Array.from({ length: 16 }, () => Math.random() - 0.5);
        const graph = await generateSimpleNodeGraph(
            [{ op: "math/determinant" }],
            [
                {
                    declaration: 0,
                    values: {
                        // matrix4d
                        a: {
                            type: 0,
                            value: randomMatrix,
                        },
                    },
                },
            ],
            [{ signature: "float4x4" }]
        );
        const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        // round result to 3 decimals
        const result = round3(logItem!.payload.value);
        const m = randomMatrix;
        const m00 = m[0],
            m10 = m[1],
            m20 = m[2],
            m30 = m[3],
            m01 = m[4],
            m11 = m[5],
            m21 = m[6],
            m31 = m[7],
            m02 = m[8],
            m12 = m[9],
            m22 = m[10],
            m32 = m[11],
            m03 = m[12],
            m13 = m[13],
            m23 = m[14],
            m33 = m[15];

        const expected = round3(
            m00 * (m11 * (m22 * m33 - m32 * m23) - m21 * (m12 * m33 - m32 * m13) + m31 * (m12 * m23 - m22 * m13)) -
                m01 * (m10 * (m22 * m33 - m32 * m23) - m20 * (m12 * m33 - m32 * m13) + m30 * (m12 * m23 - m22 * m13)) +
                m02 * (m10 * (m21 * m33 - m31 * m23) - m20 * (m11 * m33 - m31 * m13) + m30 * (m11 * m23 - m21 * m13)) -
                m03 * (m10 * (m21 * m32 - m31 * m22) - m20 * (m11 * m32 - m31 * m12) + m30 * (m11 * m22 - m21 * m12))
        );
        // round the expected result
        expect(result).toEqual(expected);
    });

    // math/inverse

    it("should use math/inverse correctly - matrix2", async () => {
        const randomMatrix = Array.from({ length: 4 }, () => Math.random() - 0.5);
        const graph = await generateSimpleNodeGraph(
            [{ op: "math/inverse" }],
            [
                {
                    declaration: 0,
                    values: {
                        // matrix2d
                        a: {
                            type: 0,
                            value: randomMatrix,
                        },
                    },
                },
            ],
            [{ signature: "float2x2" }]
        );
        const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        // round result to 3 decimals
        const resultArray = roundArray3(logItem!.payload.value.asArray());
        const det = randomMatrix[0] * randomMatrix[3] - randomMatrix[1] * randomMatrix[2];
        const expected = roundArray3([randomMatrix[3] / det, -randomMatrix[1] / det, -randomMatrix[2] / det, randomMatrix[0] / det]);
        expect(resultArray).toEqual(expected);
    });

    it("should use math/inverse correctly - matrix3", async () => {
        const randomMatrix = Array.from({ length: 9 }, () => Math.random() - 0.5);
        const graph = await generateSimpleNodeGraph(
            [{ op: "math/inverse" }],
            [
                {
                    declaration: 0,
                    values: {
                        // matrix3d
                        a: {
                            type: 0,
                            value: randomMatrix,
                        },
                    },
                },
            ],
            [{ signature: "float3x3" }]
        );
        const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        // round result to 3 decimals
        const resultArray = roundArray3(logItem!.payload.value.asArray());
        const det =
            randomMatrix[0] * randomMatrix[4] * randomMatrix[8] +
            randomMatrix[1] * randomMatrix[5] * randomMatrix[6] +
            randomMatrix[2] * randomMatrix[3] * randomMatrix[7] -
            randomMatrix[2] * randomMatrix[4] * randomMatrix[6] -
            randomMatrix[1] * randomMatrix[3] * randomMatrix[8] -
            randomMatrix[0] * randomMatrix[5] * randomMatrix[7];
        const expected = roundArray3([
            (randomMatrix[4] * randomMatrix[8] - randomMatrix[5] * randomMatrix[7]) / det,
            (randomMatrix[2] * randomMatrix[7] - randomMatrix[1] * randomMatrix[8]) / det,
            (randomMatrix[1] * randomMatrix[5] - randomMatrix[2] * randomMatrix[4]) / det,
            (randomMatrix[5] * randomMatrix[6] - randomMatrix[3] * randomMatrix[8]) / det,
            (randomMatrix[0] * randomMatrix[8] - randomMatrix[2] * randomMatrix[6]) / det,
            (randomMatrix[2] * randomMatrix[3] - randomMatrix[0] * randomMatrix[5]) / det,
            (randomMatrix[3] * randomMatrix[7] - randomMatrix[4] * randomMatrix[6]) / det,
            (randomMatrix[1] * randomMatrix[6] - randomMatrix[0] * randomMatrix[7]) / det,
            (randomMatrix[0] * randomMatrix[4] - randomMatrix[1] * randomMatrix[3]) / det,
        ]);
        expect(resultArray).toEqual(expected);
    });

    // TODO math/inverse for matrix4

    it("should use math/matMul correctly - matrix2", async () => {
        const randomMatrix1 = Array.from({ length: 4 }, () => Math.random() - 0.5);
        const randomMatrix2 = Array.from({ length: 4 }, () => Math.random() - 0.5);
        const graph = await generateSimpleNodeGraph(
            [{ op: "math/matMul" }],
            [
                {
                    declaration: 0,
                    values: {
                        // matrix2d
                        a: {
                            type: 0,
                            value: randomMatrix1,
                        },
                        b: {
                            type: 0,
                            value: randomMatrix2,
                        },
                    },
                },
            ],
            [{ signature: "float2x2" }, { signature: "float2x2" }]
        );
        const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        // round result to 3 decimals
        const resultArray = roundArray3(logItem!.payload.value.asArray());
        // row major matrix
        const expected = roundArray3([
            randomMatrix1[0] * randomMatrix2[0] + randomMatrix1[1] * randomMatrix2[2],
            randomMatrix1[0] * randomMatrix2[1] + randomMatrix1[1] * randomMatrix2[3],
            randomMatrix1[2] * randomMatrix2[0] + randomMatrix1[3] * randomMatrix2[2],
            randomMatrix1[2] * randomMatrix2[1] + randomMatrix1[3] * randomMatrix2[3],
        ]);
        expect(resultArray).toEqual(expected);
    });

    it("should use math/matMul correctly - matrix3", async () => {
        const randomMatrix1 = Array.from({ length: 9 }, () => Math.random() - 0.5);
        const randomMatrix2 = Array.from({ length: 9 }, () => Math.random() - 0.5);
        const graph = await generateSimpleNodeGraph(
            [{ op: "math/matMul" }],
            [
                {
                    declaration: 0,
                    values: {
                        // matrix2d
                        a: {
                            type: 0,
                            value: randomMatrix1,
                        },
                        b: {
                            type: 0,
                            value: randomMatrix2,
                        },
                    },
                },
            ],
            [{ signature: "float3x3" }, { signature: "float3x3" }]
        );
        const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        // round result to 3 decimals
        const resultArray = roundArray3(logItem!.payload.value.asArray());
        // row-major matrix
        const expected = roundArray3([
            randomMatrix1[0] * randomMatrix2[0] + randomMatrix1[1] * randomMatrix2[3] + randomMatrix1[2] * randomMatrix2[6],
            randomMatrix1[0] * randomMatrix2[1] + randomMatrix1[1] * randomMatrix2[4] + randomMatrix1[2] * randomMatrix2[7],
            randomMatrix1[0] * randomMatrix2[2] + randomMatrix1[1] * randomMatrix2[5] + randomMatrix1[2] * randomMatrix2[8],
            randomMatrix1[3] * randomMatrix2[0] + randomMatrix1[4] * randomMatrix2[3] + randomMatrix1[5] * randomMatrix2[6],
            randomMatrix1[3] * randomMatrix2[1] + randomMatrix1[4] * randomMatrix2[4] + randomMatrix1[5] * randomMatrix2[7],
            randomMatrix1[3] * randomMatrix2[2] + randomMatrix1[4] * randomMatrix2[5] + randomMatrix1[5] * randomMatrix2[8],
            randomMatrix1[6] * randomMatrix2[0] + randomMatrix1[7] * randomMatrix2[3] + randomMatrix1[8] * randomMatrix2[6],
            randomMatrix1[6] * randomMatrix2[1] + randomMatrix1[7] * randomMatrix2[4] + randomMatrix1[8] * randomMatrix2[7],
            randomMatrix1[6] * randomMatrix2[2] + randomMatrix1[7] * randomMatrix2[5] + randomMatrix1[8] * randomMatrix2[8],
        ]);
        expect(resultArray).toEqual(expected);
    });

    it("should use math/matMul correctly - matrix4", async () => {
        const randomMatrix1 = Array.from({ length: 16 }, () => Math.random() - 0.5).map((v: number) => round3(v));
        const randomMatrix2 = Array.from({ length: 16 }, () => Math.random() - 0.5).map((v: number) => round3(v));
        const graph = await generateSimpleNodeGraph(
            [{ op: "math/matMul" }],
            [
                {
                    declaration: 0,
                    values: {
                        // matrix4d
                        a: {
                            type: 0,
                            value: randomMatrix2,
                        },
                        b: {
                            type: 0,
                            value: randomMatrix1,
                        },
                    },
                },
            ],
            [{ signature: "float4x4" }, { signature: "float4x4" }]
        );
        const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        const resultArray = roundArray3(logItem!.payload.value.asArray());
        const expected = roundArray3([
            randomMatrix1[0] * randomMatrix2[0] + randomMatrix1[1] * randomMatrix2[4] + randomMatrix1[2] * randomMatrix2[8] + randomMatrix1[3] * randomMatrix2[12],
            randomMatrix1[0] * randomMatrix2[1] + randomMatrix1[1] * randomMatrix2[5] + randomMatrix1[2] * randomMatrix2[9] + randomMatrix1[3] * randomMatrix2[13],
            randomMatrix1[0] * randomMatrix2[2] + randomMatrix1[1] * randomMatrix2[6] + randomMatrix1[2] * randomMatrix2[10] + randomMatrix1[3] * randomMatrix2[14],
            randomMatrix1[0] * randomMatrix2[3] + randomMatrix1[1] * randomMatrix2[7] + randomMatrix1[2] * randomMatrix2[11] + randomMatrix1[3] * randomMatrix2[15],
            randomMatrix1[4] * randomMatrix2[0] + randomMatrix1[5] * randomMatrix2[4] + randomMatrix1[6] * randomMatrix2[8] + randomMatrix1[7] * randomMatrix2[12],
            randomMatrix1[4] * randomMatrix2[1] + randomMatrix1[5] * randomMatrix2[5] + randomMatrix1[6] * randomMatrix2[9] + randomMatrix1[7] * randomMatrix2[13],
            randomMatrix1[4] * randomMatrix2[2] + randomMatrix1[5] * randomMatrix2[6] + randomMatrix1[6] * randomMatrix2[10] + randomMatrix1[7] * randomMatrix2[14],
            randomMatrix1[4] * randomMatrix2[3] + randomMatrix1[5] * randomMatrix2[7] + randomMatrix1[6] * randomMatrix2[11] + randomMatrix1[7] * randomMatrix2[15],
            randomMatrix1[8] * randomMatrix2[0] + randomMatrix1[9] * randomMatrix2[4] + randomMatrix1[10] * randomMatrix2[8] + randomMatrix1[11] * randomMatrix2[12],
            randomMatrix1[8] * randomMatrix2[1] + randomMatrix1[9] * randomMatrix2[5] + randomMatrix1[10] * randomMatrix2[9] + randomMatrix1[11] * randomMatrix2[13],
            randomMatrix1[8] * randomMatrix2[2] + randomMatrix1[9] * randomMatrix2[6] + randomMatrix1[10] * randomMatrix2[10] + randomMatrix1[11] * randomMatrix2[14],
            randomMatrix1[8] * randomMatrix2[3] + randomMatrix1[9] * randomMatrix2[7] + randomMatrix1[10] * randomMatrix2[11] + randomMatrix1[11] * randomMatrix2[15],
            randomMatrix1[12] * randomMatrix2[0] + randomMatrix1[13] * randomMatrix2[4] + randomMatrix1[14] * randomMatrix2[8] + randomMatrix1[15] * randomMatrix2[12],
            randomMatrix1[12] * randomMatrix2[1] + randomMatrix1[13] * randomMatrix2[5] + randomMatrix1[14] * randomMatrix2[9] + randomMatrix1[15] * randomMatrix2[13],
            randomMatrix1[12] * randomMatrix2[2] + randomMatrix1[13] * randomMatrix2[6] + randomMatrix1[14] * randomMatrix2[10] + randomMatrix1[15] * randomMatrix2[14],
            randomMatrix1[12] * randomMatrix2[3] + randomMatrix1[13] * randomMatrix2[7] + randomMatrix1[14] * randomMatrix2[11] + randomMatrix1[15] * randomMatrix2[15],
        ]);
        expect(resultArray).toEqual(expected);
    });

    // test math/combine2

    it("should use math/combine2 correctly", async () => {
        const randomValue = Math.random() - 0.5;
        const randomValue2 = Math.random() - 0.5;
        const graph = await generateSimpleNodeGraph(
            [{ op: "math/combine2" }],
            [
                {
                    declaration: 0,
                    values: {
                        // matrix2d
                        a: {
                            type: 0,
                            value: [randomValue],
                        },
                        b: {
                            type: 0,
                            value: [randomValue2],
                        },
                    },
                },
            ],
            [{ signature: "float" }]
        );
        const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        const resultArray = roundArray3(logItem!.payload.value.asArray());
        const expected = roundArray3([randomValue, randomValue2]);
        expect(resultArray).toEqual(expected);
    });

    it("should use math/combine3 correctly", async () => {
        const randomValue = Math.random() - 0.5;
        const randomValue2 = Math.random() - 0.5;
        const randomValue3 = Math.random() - 0.5;
        const graph = await generateSimpleNodeGraph(
            [{ op: "math/combine3" }],
            [
                {
                    declaration: 0,
                    values: {
                        // matrix2d
                        a: {
                            type: 0,
                            value: [randomValue],
                        },
                        b: {
                            type: 0,
                            value: [randomValue2],
                        },
                        c: {
                            type: 0,
                            value: [randomValue3],
                        },
                    },
                },
            ],
            [{ signature: "float" }]
        );
        const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        const resultArray = roundArray3(logItem!.payload.value.asArray());
        const expected = roundArray3([randomValue, randomValue2, randomValue3]);
        expect(resultArray).toEqual(expected);
    });

    it("should use math/combine4 correctly", async () => {
        const randomValue = Math.random() - 0.5;
        const randomValue2 = Math.random() - 0.5;
        const randomValue3 = Math.random() - 0.5;
        const randomValue4 = Math.random() - 0.5;
        const graph = await generateSimpleNodeGraph(
            [{ op: "math/combine4" }],
            [
                {
                    declaration: 0,
                    values: {
                        // matrix2d
                        a: {
                            type: 0,
                            value: [randomValue],
                        },
                        b: {
                            type: 0,
                            value: [randomValue2],
                        },
                        c: {
                            type: 0,
                            value: [randomValue3],
                        },
                        d: {
                            type: 0,
                            value: [randomValue4],
                        },
                    },
                },
            ],
            [{ signature: "float" }]
        );
        const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        const resultArray = roundArray3(logItem!.payload.value.asArray());
        const expected = roundArray3([randomValue, randomValue2, randomValue3, randomValue4]);
        expect(resultArray).toEqual(expected);
    });

    test("math/matCompose", async () => {
        const randomPosition = Array.from({ length: 3 }, () => Math.random());
        const randomRotation = Array.from({ length: 4 }, () => Math.random());
        const randomScale = Array.from({ length: 3 }, () => Math.random());
        const graph = await generateSimpleNodeGraph(
            [{ op: "math/matCompose" }],
            [
                {
                    declaration: 0,
                    values: {
                        translation: {
                            type: 0,
                            value: randomPosition,
                        },
                        rotation: {
                            type: 1,
                            value: randomRotation,
                        },
                        scale: {
                            type: 0,
                            value: randomScale,
                        },
                    },
                },
            ],
            [{ signature: "float3" }, { signature: "float4" }]
        );
        const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        logItem!.payload.value.asArray().forEach((v: number) => expect(v).not.toBeNaN());
    });

    test("math/matDecompose - output translation", async () => {
        const randomMatrix = Array.from({ length: 16 }, () => Math.random());
        // make sure last row is 0,0,0,1
        randomMatrix[3] = 0;
        randomMatrix[7] = 0;
        randomMatrix[11] = 0;
        randomMatrix[15] = 1;
        const graph = await generateSimpleNodeGraph(
            [{ op: "math/matDecompose" }],
            [
                {
                    declaration: 0,
                    values: {
                        a: {
                            type: 0,
                            value: randomMatrix,
                        },
                    },
                },
            ],
            [{ signature: "float4x4" }],
            0,
            "translation"
        );
        const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        logItem!.payload.value.asArray().forEach((v: number) => expect(v).not.toBeNaN());
    });

    test("math/matDecompose - output rotation", async () => {
        const randomMatrix = Array.from({ length: 16 }, () => Math.random());
        // make sure last row is 0,0,0,1
        randomMatrix[3] = 0;
        randomMatrix[7] = 0;
        randomMatrix[11] = 0;
        randomMatrix[15] = 1;
        const graph = await generateSimpleNodeGraph(
            [{ op: "math/matDecompose" }],
            [
                {
                    declaration: 0,
                    values: {
                        a: {
                            type: 0,
                            value: randomMatrix,
                        },
                    },
                },
            ],
            [{ signature: "float4x4" }],
            0,
            "rotation"
        );
        const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        // make sure nothing is NaN
        logItem!.payload.value.asArray().forEach((v: number) => expect(v).not.toBeNaN());
    });

    test("math/matDecompose - output scaling", async () => {
        const randomMatrix = Array.from({ length: 16 }, () => Math.random());
        // make sure last row is 0,0,0,1
        randomMatrix[3] = 0;
        randomMatrix[7] = 0;
        randomMatrix[11] = 0;
        randomMatrix[15] = 1;
        const graph = await generateSimpleNodeGraph(
            [{ op: "math/matDecompose" }],
            [
                {
                    declaration: 0,
                    values: {
                        a: {
                            type: 0,
                            value: randomMatrix,
                        },
                    },
                },
            ],
            [{ signature: "float4x4" }],
            0,
            "scaling"
        );
        const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        logItem!.payload.value.asArray().forEach((v: number) => expect(v).not.toBeNaN());
    });

    test("math/matDecompose - output isValid should be false - matrix incorrect", async () => {
        const randomMatrix = Array.from({ length: 16 }, () => 1);
        const graph = await generateSimpleNodeGraph(
            [{ op: "math/matDecompose" }],
            [
                {
                    declaration: 0,
                    values: {
                        a: {
                            type: 0,
                            value: randomMatrix,
                        },
                    },
                },
            ],
            [{ signature: "float4x4" }],
            0,
            "isValid"
        );
        const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem?.payload.value).toBe(false);
    });

    test("math/matDecompose - output isValid should be false - scaling incorrect", async () => {
        const randomMatrix = Array.from({ length: 16 }, () => 0);
        randomMatrix[15] = 1;
        const graph = await generateSimpleNodeGraph(
            [{ op: "math/matDecompose" }],
            [
                {
                    declaration: 0,
                    values: {
                        a: {
                            type: 0,
                            value: randomMatrix,
                        },
                    },
                },
            ],
            [{ signature: "float4x4" }],
            0,
            "isValid"
        );
        const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem?.payload.value).toBe(false);
    });

    // TODO reintroduce these tests after a bit of research

    // it("should use math/combine2x2 correctly", async () => {
    //     const randomValue = Math.random() - 0.5;
    //     const randomValue2 = Math.random() - 0.5;
    //     const randomValue3 = Math.random() - 0.5;
    //     const randomValue4 = Math.random() - 0.5;
    //     const graph = await generateSimpleNodeGraph(
    //         [{ op: "math/combine4" }],
    //         [
    //             {
    //                 declaration: 0,
    //                 values: {
    //                     // matrix2d
    //                     a: {
    //                         type: 0,
    //                         value: [randomValue],
    //                     },
    //                     b: {
    //                         type: 0,
    //                         value: [randomValue2],
    //                     },
    //                     c: {
    //                         type: 0,
    //                         value: [randomValue3],
    //                     },
    //                     d: {
    //                         type: 0,
    //                         value: [randomValue4],
    //                     },
    //                 },
    //             },
    //         ],
    //         [{ signature: "float" }]
    //     );
    //     const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
    //     expect(logItem).toBeDefined();
    //     const resultArray = roundArray3(logItem!.payload.value.asArray());
    //     // expected column to row major
    //     const expected = roundArray3([randomValue, randomValue3, randomValue2, randomValue4]);
    //     expect(resultArray).toEqual(expected);
    // });

    // it("should use math/combine3x3 correctly", async () => {
    //     const randomValue = Math.random() - 0.5;
    //     const randomValue2 = Math.random() - 0.5;
    //     const randomValue3 = Math.random() - 0.5;
    //     const randomValue4 = Math.random() - 0.5;
    //     const randomValue5 = Math.random() - 0.5;
    //     const randomValue6 = Math.random() - 0.5;
    //     const randomValue7 = Math.random() - 0.5;
    //     const randomValue8 = Math.random() - 0.5;
    //     const randomValue9 = Math.random() - 0.5;
    //     const graph = await generateSimpleNodeGraph(
    //         [{ op: "math/combine3x3" }],
    //         [
    //             {
    //                 declaration: 0,
    //                 values: {
    //                     a: {
    //                         type: 0,
    //                         value: [randomValue],
    //                     },
    //                     b: {
    //                         type: 0,
    //                         value: [randomValue2],
    //                     },
    //                     c: {
    //                         type: 0,
    //                         value: [randomValue3],
    //                     },
    //                     d: {
    //                         type: 0,
    //                         value: [randomValue4],
    //                     },
    //                     e: {
    //                         type: 0,
    //                         value: [randomValue5],
    //                     },
    //                     f: {
    //                         type: 0,
    //                         value: [randomValue6],
    //                     },
    //                     g: {
    //                         type: 0,
    //                         value: [randomValue7],
    //                     },
    //                     h: {
    //                         type: 0,
    //                         value: [randomValue8],
    //                     },
    //                     i: {
    //                         type: 0,
    //                         value: [randomValue9],
    //                     },
    //                 },
    //             },
    //         ],
    //         [{ signature: "float" }]
    //     );
    //     const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
    //     expect(logItem).toBeDefined();
    //     const resultArray = roundArray3(logItem!.payload.value.asArray());
    //     // expected column to row major
    //     const expected = roundArray3([randomValue, randomValue3, randomValue6, randomValue2, randomValue5, randomValue8, randomValue4, randomValue7, randomValue9]);
    //     expect(resultArray).toEqual(expected);
    // });

    // it("should use math/combine4x4 correctly", async () => {
    //     const randomValue1 = Math.random() - 0.5;
    //     const randomValue2 = Math.random() - 0.5;
    //     const randomValue3 = Math.random() - 0.5;
    //     const randomValue4 = Math.random() - 0.5;
    //     const randomValue5 = Math.random() - 0.5;
    //     const randomValue6 = Math.random() - 0.5;
    //     const randomValue7 = Math.random() - 0.5;
    //     const randomValue8 = Math.random() - 0.5;
    //     const randomValue9 = Math.random() - 0.5;
    //     const randomValue10 = Math.random() - 0.5;
    //     const randomValue11 = Math.random() - 0.5;
    //     const randomValue12 = Math.random() - 0.5;
    //     const randomValue13 = Math.random() - 0.5;
    //     const randomValue14 = Math.random() - 0.5;
    //     const randomValue15 = Math.random() - 0.5;
    //     const graph = await generateSimpleNodeGraph(
    //         [{ op: "math/combine4x4" }],
    //         [
    //             {
    //                 declaration: 0,
    //                 values: {
    //                     a: {
    //                         type: 0,
    //                         value: [randomValue1],
    //                     },
    //                     b: {
    //                         type: 0,
    //                         value: [randomValue2],
    //                     },
    //                     c: {
    //                         type: 0,
    //                         value: [randomValue3],
    //                     },
    //                     d: {
    //                         type: 0,
    //                         value: [randomValue4],
    //                     },
    //                     e: {
    //                         type: 0,
    //                         value: [randomValue5],
    //                     },
    //                     f: {
    //                         type: 0,
    //                         value: [randomValue6],
    //                     },
    //                     g: {
    //                         type: 0,
    //                         value: [randomValue7],
    //                     },
    //                     h: {
    //                         type: 0,
    //                         value: [randomValue8],
    //                     },
    //                     i: {
    //                         type: 0,
    //                         value: [randomValue9],
    //                     },
    //                     j: {
    //                         type: 0,
    //                         value: [randomValue10],
    //                     },
    //                     k: {
    //                         type: 0,
    //                         value: [randomValue11],
    //                     },
    //                     l: {
    //                         type: 0,
    //                         value: [randomValue12],
    //                     },
    //                     m: {
    //                         type: 0,
    //                         value: [randomValue13],
    //                     },
    //                     n: {
    //                         type: 0,
    //                         value: [randomValue14],
    //                     },
    //                     o: {
    //                         type: 0,
    //                         value: [randomValue15],
    //                     },
    //                 },
    //             },
    //         ],
    //         [{ signature: "float" }]
    //     );
    //     const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
    //     expect(logItem).toBeDefined();
    //     const resultArray = roundArray3(logItem!.payload.value.asArray());
    //     // expected column to row major
    //     const expected = roundArray3([
    //         randomValue1,
    //         randomValue5,
    //         randomValue9,
    //         randomValue13,
    //         randomValue2,
    //         randomValue6,
    //         randomValue10,
    //         randomValue14,
    //         randomValue3,
    //         randomValue7,
    //         randomValue11,
    //         randomValue15,
    //         randomValue4,
    //         randomValue8,
    //         randomValue12,
    //         randomValue15,
    //     ]);
    //     expect(resultArray).toEqual(expected);
    // });

    it("should use math/quatConjugate", async () => {
        const randomQuaternion = Quaternion.FromEulerAngles(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        const graph = await generateSimpleNodeGraph(
            [{ op: "math/quatConjugate" }],
            [
                {
                    declaration: 0,
                    values: {
                        a: {
                            type: 0,
                            value: randomQuaternion.asArray(),
                        },
                    },
                },
            ],
            [{ signature: "float4" }]
        );
        const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        const resultArray = roundArray3(logItem!.payload.value.asArray());
        const expected = roundArray3(randomQuaternion.conjugate().asArray());
        expect(resultArray).toEqual(expected);
    });

    it("should use math/quatMul", async () => {
        const randomQuaternion1 = Quaternion.FromEulerAngles(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        const randomQuaternion2 = Quaternion.FromEulerAngles(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        const graph = await generateSimpleNodeGraph(
            [{ op: "math/quatMul" }],
            [
                {
                    declaration: 0,
                    values: {
                        a: {
                            type: 0,
                            value: randomQuaternion1.asArray(),
                        },
                        b: {
                            type: 0,
                            value: randomQuaternion2.asArray(),
                        },
                    },
                },
            ],
            [{ signature: "float4" }]
        );
        const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        const resultArray = roundArray3(logItem!.payload.value.asArray());
        const expected = roundArray3(randomQuaternion1.multiply(randomQuaternion2).asArray());
        expect(resultArray).toEqual(expected);
    });

    it("should use math/quatAngleBetween", async () => {
        const randomQuaternion1 = Quaternion.FromEulerAngles(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        const randomQuaternion2 = Quaternion.FromEulerAngles(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        const graph = await generateSimpleNodeGraph(
            [{ op: "math/quatAngleBetween" }],
            [
                {
                    declaration: 0,
                    values: {
                        a: {
                            type: 0,
                            value: randomQuaternion1.asArray(),
                        },
                        b: {
                            type: 0,
                            value: randomQuaternion2.asArray(),
                        },
                    },
                },
            ],
            [{ signature: "float4" }]
        );
        const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        const result = round3(logItem!.payload.value);
        const expected = round3(GetAngleBetweenQuaternions(randomQuaternion1, randomQuaternion2));
        expect(result).toEqual(expected);
    });

    it("should use math/quatFromAxisAngle", async () => {
        const randomAxis = new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
        const randomAngle = Math.random() * Math.PI;
        const graph = await generateSimpleNodeGraph(
            [{ op: "math/quatFromAxisAngle" }],
            [
                {
                    declaration: 0,
                    values: {
                        axis: {
                            type: 0,
                            value: randomAxis.asArray(),
                        },
                        angle: {
                            type: 1,
                            value: [randomAngle],
                        },
                    },
                },
            ],
            [{ signature: "float3" }, { signature: "float" }]
        );
        const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        const resultArray = roundArray3(logItem!.payload.value.asArray());
        const expected = roundArray3(Quaternion.RotationAxis(randomAxis, randomAngle).asArray());
        expect(resultArray).toEqual(expected);
    });

    it("should use math/quatToAxisAngle", async () => {
        const randomQuaternion = Quaternion.FromEulerAngles(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

        const ig: IKHRInteractivity_Graph = {
            declarations: [{ op: "math/quatToAxisAngle" }, { op: "event/onStart" }, { op: "flow/log", extension: "BABYLON" }],
            types: [{ signature: "float4" }],
            nodes: [
                {
                    declaration: 0,
                    values: {
                        a: {
                            type: 0,
                            value: randomQuaternion.asArray(),
                        },
                    },
                },
                {
                    declaration: 1,
                    flows: {
                        out: {
                            node: 2,
                            socket: "in",
                        },
                    },
                },
                {
                    declaration: 2,
                    values: {
                        axis: {
                            node: 0,
                            socket: "axis",
                        },
                        angle: {
                            node: 0,
                            socket: "angle",
                        },
                    },
                    configuration: {
                        messageTemplate: {
                            value: ["{axis}{angle}"],
                        },
                    },
                },
            ],
        };

        const i2fg = new InteractivityGraphToFlowGraphParser(ig, mockGltf);
        const json = i2fg.serializeToFlowGraph();
        const coordinator = new FlowGraphCoordinator({ scene });
        const flowGraph = await ParseFlowGraphAsync(json, { coordinator, pathConverter });
        flowGraph.getContext(0).enableLogging = true;
        flowGraph.getContext(0).logger!.logToConsole = false;

        coordinator.start();

        const graph = {
            graph: flowGraph,
            logger: flowGraph.getContext(0).logger!,
        };

        const expected = randomQuaternion.toAxisAngle();
        const logItems = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue);

        {
            const logItem = logItems.pop();
            expect(logItem).toBeDefined();
            const angle = logItem!.payload.value;
            expect(round3(angle)).toEqual(round3(expected.angle));
        }

        logItems.pop();

        {
            const logItem = logItems.pop();
            expect(logItem).toBeDefined();
            const axis = logItem!.payload.value;
            expect(roundArray3(axis.asArray())).toEqual(roundArray3(expected.axis.asArray()));
        }
    });

    it("should use math/quatFromDirections", async () => {
        const randomDirection1 = new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
        const randomDirection2 = new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
        const graph = await generateSimpleNodeGraph(
            [{ op: "math/quatFromDirections" }],
            [
                {
                    declaration: 0,
                    values: {
                        a: {
                            type: 0,
                            value: randomDirection1.asArray(),
                        },
                        b: {
                            type: 0,
                            value: randomDirection2.asArray(),
                        },
                    },
                },
            ],
            [{ signature: "float3" }]
        );
        const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        const resultArray = roundArray3(logItem!.payload.value.asArray());
        const expected = roundArray3(GetQuaternionFromDirections(randomDirection1, randomDirection2).asArray());
        expect(resultArray).toEqual(expected);
    });
});
