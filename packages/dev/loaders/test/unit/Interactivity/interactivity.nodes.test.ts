import { IKHRInteractivity_Declaration, IKHRInteractivity_Node, IKHRInteractivity_Type } from "babylonjs-gltf2interface";
import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { NullEngine } from "core/Engines/nullEngine";
import { PerformanceConfigurator } from "core/Engines/performanceConfigurator";
import { FlowGraphCoordinator } from "core/FlowGraph/flowGraphCoordinator";
import { FlowGraphAction } from "core/FlowGraph/flowGraphLogger";
import { ParseFlowGraphAsync } from "core/FlowGraph/flowGraphParser";
import { Vector3 } from "core/Maths/math.vector";
import { Logger } from "core/Misc/logger";
import { Scene } from "core/scene";
import { InteractivityGraphToFlowGraphParser } from "loaders/glTF/2.0/Extensions/KHR_interactivity/interactivityGraphParser";
import { getPathToObjectConverter } from "loaders/glTF/2.0/Extensions/objectModelMapping";

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

/**
 * This test is for the interactivity nodes. Each nodes will have its own test, making sure it is working according to the specs.
 * Note that this expects that the Flow Graph is working correctly, as the nodes will be converted to FlowGraph blocks.
 */
describe("Interactivity nodes", () => {
    let engine;
    let scene: Scene;
    const log: jest.SpyInstance = jest.spyOn(Logger, "Log");
    let mockGltf: any;
    const pathConverter = getPathToObjectConverter(mockGltf);

    async function generateSimpleNodeGraph(
        declarations: IKHRInteractivity_Declaration[],
        nodes: IKHRInteractivity_Node[],
        types: IKHRInteractivity_Type[] = [],
        nodeIndexForOutput: number = 0,
        socketValueForOutput: string = "value"
    ) {
        const ig = {
            declarations: [...declarations, { op: "event/onStart" }, { op: "babylon/log", extension: "BABYLON_Logging" }],
            types,
            nodes: [
                ...nodes,
                {
                    declaration: declarations.length,
                    flows: {
                        out: {
                            node: declarations.length + 1,
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
    });

    it("should use math/e correctly", async () => {
        const graph = await generateSimpleNodeGraph(
            [{ op: "math/e" }],
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

    it("should use math/pi correctly", async () => {
        const graph = await generateSimpleNodeGraph(
            [{ op: "math/pi" }],
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

    // math/inf
    it("should use math/inf correctly", async () => {
        const graph = await generateSimpleNodeGraph(
            [{ op: "math/inf" }],
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

    // math/nan
    it("should use math/nan correctly", async () => {
        const graph = await generateSimpleNodeGraph(
            [{ op: "math/nan" }],
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

    const testMathNodes: {
        [key: string]: {
            operation: (...args: any) => any;
            types: string[];
            inputs: number;
        };
    } = {
        "math/abs": {
            operation: Math.abs,
            types: ["float", "float2", "float3", "float4", "float4x4"],
            inputs: 1,
        },
        "math/sign": {
            operation: Math.sign,
            types: ["float", "float2", "float3", "float4", "float4x4"],
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
            types: ["float", "float2", "float3", "float4", "float4x4"],
            inputs: 1,
        },
        "math/add": {
            operation: (a: number, b: number) => a + b,
            types: ["float", "float2", "float3", "float4", "float4x4"],
            inputs: 2,
        },
        "math/sub": {
            operation: (a: number, b: number) => a - b,
            types: ["float", "float2", "float3", "float4", "float4x4"],
            inputs: 2,
        },
        "math/mul": {
            operation: (a: number, b: number) => a * b,
            types: ["float", "float2", "float3", "float4", "float4x4"],
            inputs: 2,
        },
        "math/div": {
            operation: (a: number, b: number) => a / b,
            types: ["float", "float2", "float3", "float4", "float4x4"],
            inputs: 2,
        },
        "math/clamp": {
            operation: (a: number, b: number, c: number) => Math.min(Math.max(a, Math.min(b, c)), Math.max(b, c)),
            types: ["float", "float2", "float3", "float4", "float4x4"],
            inputs: 3,
        },
        "math/min": {
            operation: Math.min,
            types: ["float", "float2", "float3", "float4", "float4x4"],
            inputs: 2,
        },
        "math/max": {
            operation: Math.max,
            types: ["float", "float2", "float3", "float4", "float4x4"],
            inputs: 2,
        },
        "math/rem": {
            operation: (a: number, b: number) => a % b,
            types: ["float", "float2", "float3", "float4", "float4x4"],
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
    };

    const filterType = "";
    const filterTest = "";

    const testScenarios: { [key: string]: (length: number) => number[] } = {
        allRandom: (length: number) => Array.from({ length }, () => Math.random() * 100 - 50),
        allPositive: (length: number) => Array.from({ length }, () => Math.random() * 100),
        allNegative: (length: number) => Array.from({ length }, () => Math.random() * -100),
        allZero: (length: number) => Array.from({ length }, () => 0),
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
                        const val = testScenarios[scenarioName](length).map((v) => Math.round(v * 10000) / 10000);
                        const key = i === 0 ? "a" : i === 1 ? "b" : i === 2 ? "c" : "d";
                        values[key] = {
                            type: 0,
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
                    const expected: number[] = [];
                    for (let i = 0; i < length; i++) {
                        expected.push(testNode.operation(...valArrays.map((v) => v[i])));
                    }
                    const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
                    expect(logItem).toBeDefined();
                    const resultArray = logItem!.payload.value.asArray ? [...logItem!.payload.value.asArray()] : [logItem!.payload.value];
                    expect(typeof resultArray[0]).toBe("number");
                    // make sure nothing is NaN
                    for (let i = 0; i < resultArray.length; i++) {
                        expect(resultArray[i]).not.toBeNaN();
                    }
                    expect(resultArray).toEqual(expected);
                });
            });
        });
    });
});
