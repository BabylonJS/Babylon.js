import { IKHRInteractivity_Declaration, IKHRInteractivity_Node, IKHRInteractivity_Type } from "babylonjs-gltf2interface";
import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { NullEngine } from "core/Engines/nullEngine";
import { FlowGraphCoordinator } from "core/FlowGraph/flowGraphCoordinator";
import { FlowGraphAction } from "core/FlowGraph/flowGraphLogger";
import { ParseFlowGraphAsync } from "core/FlowGraph/flowGraphParser";
import { Vector3 } from "core/Maths/math.vector";
import { Logger } from "core/Misc/logger";
import { Scene } from "core/scene";
import { InteractivityGraphToFlowGraphParser } from "loaders/glTF/2.0/Extensions/KHR_interactivity/interactivityGraphParser";
import { getPathToObjectConverter } from "loaders/glTF/2.0/Extensions/objectModelMapping";

const typesAndLengths = {
    float: 1,
    float2: 2,
    float3: 3,
    float4: 4,
    int: 1,
    float4x4: 16,
};

const generalMathOperations = {
    "math/e": [],
    "math/pi": [],
    "math/inf": [],
    "math/nan": [],
    "math/random": [],
    "math/abs": {
        a: ["float", "float2", "float3", "float4"],
    },
    "math/sign": {
        a: ["float", "float2", "float3", "float4"],
        value: ["float", "float2", "float3", "float4"],
    },
    "math/trunc": {
        a: ["float", "float2", "float3", "float4"],
        value: ["float", "float2", "float3", "float4"],
    },
    "math/floor": {
        a: ["float", "float2", "float3", "float4"],
        value: ["float", "float2", "float3", "float4"],
    },
    "math/ceil": {
        a: ["float", "float2", "float3", "float4"],
        value: ["float", "float2", "float3", "float4"],
    },
    "math/round": {
        a: ["float", "float2", "float3", "float4"],
        value: ["float", "float2", "float3", "float4"],
    },
    "math.fract": {
        a: ["float", "float2", "float3", "float4"],
        value: ["float", "float2", "float3", "float4"],
    },
    "math/neg": {
        a: ["float", "float2", "float3", "float4"],
        value: ["float", "float2", "float3", "float4"],
    },
    // "math/add": 2,
    // "math/sub": 2,
    // "math/mul": 2,
    // "math/div": 2,
    // "math/rem": 2,
    // "math/min": 2,
    // "math/max": 2,
    // "math/clamp": 3,
    // "math/saturate": 1,
    // "math/mix": 3,
    // "math/eq": 2,
    // "math/lt": 2,
    // "math/le": 2,
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

    // Object.keys(typesAndLengths).forEach((type) => {
    //     it(`should use math/random with ${type}`, async () => {
    //         const graph = await generateSimpleNodeGraph(
    //             [{ op: "math/random" }],
    //             [
    //                 {
    //                     declaration: 0,
    //                 },
    //             ],
    //             [{ signature: type }]
    //         );

    //         const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
    //         expect(logItem).toBeDefined();
    //         expect(logItem!.payload.value.length).toBe(typesAndLengths[type]);
    //     });
    // });

    it("should run math/abs with a float", async () => {
        const val = -Math.random() * 100 - 50;
        const graph = await generateSimpleNodeGraph(
            [{ op: "math/abs" }],
            [
                {
                    declaration: 0,
                    values: {
                        a: {
                            type: 0,
                            value: [val],
                        },
                    },
                },
            ],
            [{ signature: "float" }]
        );

        const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        expect(logItem!.payload.value).toBe(Math.abs(val));
    });

    // math/abs with vector3
    it("should run math/abs with a vector3", async () => {
        const val = {
            x: -Math.random() * 100 - 50,
            y: Math.random() * 100 - 50,
            z: -Math.random() * 100 - 50,
        };
        const graph = await generateSimpleNodeGraph(
            [{ op: "math/abs" }],
            [
                {
                    declaration: 0,
                    values: {
                        a: {
                            type: 0,
                            value: [val.x, val.y, val.z],
                        },
                    },
                },
            ],
            [{ signature: "float3" }]
        );

        const logItem = graph.logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        const value = logItem!.payload.value;
        expect(value.x).toBe(Math.abs(val.x));
        expect(value.y).toBe(Math.abs(val.y));
        expect(value.z).toBe(Math.abs(val.z));
    });

    // math
});
