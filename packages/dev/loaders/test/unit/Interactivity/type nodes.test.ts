import { NullEngine } from "core/Engines";
import { Scene } from "core/scene";
import { FlowGraphCoordinator } from "core/FlowGraph/flowGraphCoordinator";
import { Vector3 } from "core/Maths";
import { ArcRotateCamera } from "core/Cameras";
import { Logger } from "core/Misc";
import { ParseFlowGraphAsync } from "core/FlowGraph";
import { InteractivityGraphToFlowGraphParser } from "loaders/glTF/2.0/Extensions/KHR_interactivity/interactivityGraphParser";
import { GetPathToObjectConverter } from "loaders/glTF/2.0/Extensions/objectModelMapping";
import { IKHRInteractivity_Declaration, IKHRInteractivity_Node, IKHRInteractivity_Type } from "babylonjs-gltf2interface";
import { FlowGraphAction } from "core/FlowGraph/flowGraphLogger";

describe("interactivity type nodes", () => {
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
        errorLog.mockClear();
    });

    test("type/boolToInt - true", async () => {
        const { logger } = await generateSimpleNodeGraph(
            [{ op: "type/boolToInt" }],
            [
                {
                    declaration: 0,
                    values: {
                        a: {
                            type: 0,
                            value: [true],
                        },
                    },
                },
            ],
            [{ signature: "bool" }]
        );

        const logItem = logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        expect(logItem!.payload.value.value).toBe(1);
    });

    test("type/boolToInt - false", async () => {
        const { logger } = await generateSimpleNodeGraph(
            [{ op: "type/boolToInt" }],
            [
                {
                    declaration: 0,
                    values: {
                        a: {
                            type: 0,
                            value: [false],
                        },
                    },
                },
            ],
            [{ signature: "bool" }]
        );

        const logItem = logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        expect(logItem!.payload.value.value).toBe(0);
    });

    // type/boolToFloat
    test("type/boolToFloat - true", async () => {
        const { logger } = await generateSimpleNodeGraph(
            [{ op: "type/boolToFloat" }],
            [
                {
                    declaration: 0,
                    values: {
                        a: {
                            type: 0,
                            value: [true],
                        },
                    },
                },
            ],
            [{ signature: "bool" }]
        );

        const logItem = logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        expect(logItem!.payload.value).toBe(1);
    });

    test("type/boolToFloat - false", async () => {
        const { logger } = await generateSimpleNodeGraph(
            [{ op: "type/boolToFloat" }],
            [
                {
                    declaration: 0,
                    values: {
                        a: {
                            type: 0,
                            value: [false],
                        },
                    },
                },
            ],
            [{ signature: "bool" }]
        );

        const logItem = logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        expect(logItem!.payload.value).toBe(0);
    });

    // type/intToBool

    test("type/intToBool - 0", async () => {
        const { logger } = await generateSimpleNodeGraph(
            [{ op: "type/intToBool" }],
            [
                {
                    declaration: 0,
                    values: {
                        a: {
                            type: 0,
                            value: [0],
                        },
                    },
                },
            ],
            [{ signature: "int" }]
        );

        const logItem = logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        expect(logItem!.payload.value).toBe(false);
    });

    test("type/intToBool - 1", async () => {
        const { logger } = await generateSimpleNodeGraph(
            [{ op: "type/intToBool" }],
            [
                {
                    declaration: 0,
                    values: {
                        a: {
                            type: 0,
                            value: [1],
                        },
                    },
                },
            ],
            [{ signature: "int" }]
        );

        const logItem = logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        expect(logItem!.payload.value).toBe(true);
    });

    test("type/intToBool - -100", async () => {
        const { logger } = await generateSimpleNodeGraph(
            [{ op: "type/intToBool" }],
            [
                {
                    declaration: 0,
                    values: {
                        a: {
                            type: 0,
                            value: [-100],
                        },
                    },
                },
            ],
            [{ signature: "int" }]
        );

        const logItem = logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        expect(logItem!.payload.value).toBe(true);
    });

    // type/intToFloat

    test("type/intToFloat - 0", async () => {
        const { logger } = await generateSimpleNodeGraph(
            [{ op: "type/intToFloat" }],
            [
                {
                    declaration: 0,
                    values: {
                        a: {
                            type: 0,
                            value: [0],
                        },
                    },
                },
            ],
            [{ signature: "int" }]
        );

        const logItem = logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        expect(logItem!.payload.value).toBe(0);
    });

    test("type/intToFloat - 1", async () => {
        const { logger } = await generateSimpleNodeGraph(
            [{ op: "type/intToFloat" }],
            [
                {
                    declaration: 0,
                    values: {
                        a: {
                            type: 0,
                            value: [1],
                        },
                    },
                },
            ],
            [{ signature: "int" }]
        );

        const logItem = logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        expect(logItem!.payload.value).toBe(1);
    });

    test("type/intToFloat - -100", async () => {
        const { logger } = await generateSimpleNodeGraph(
            [{ op: "type/intToFloat" }],
            [
                {
                    declaration: 0,
                    values: {
                        a: {
                            type: 0,
                            value: [-100],
                        },
                    },
                },
            ],
            [{ signature: "int" }]
        );

        const logItem = logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        expect(logItem!.payload.value).toBe(-100);
    });

    // type/floatToInt

    test("type/floatToInt - 0", async () => {
        const { logger } = await generateSimpleNodeGraph(
            [{ op: "type/floatToInt" }],
            [
                {
                    declaration: 0,
                    values: {
                        a: {
                            type: 0,
                            value: [0],
                        },
                    },
                },
            ],
            [{ signature: "float" }]
        );

        const logItem = logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        expect(logItem!.payload.value.value).toBe(0);
    });

    test("type/floatToInt - 1.5", async () => {
        const { logger } = await generateSimpleNodeGraph(
            [{ op: "type/floatToInt" }],
            [
                {
                    declaration: 0,
                    values: {
                        a: {
                            type: 0,
                            value: [1],
                        },
                    },
                },
            ],
            [{ signature: "float" }]
        );

        const logItem = logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        expect(logItem!.payload.value.value).toBe(1);
    });

    test("type/floatToInt - NaN", async () => {
        const { logger } = await generateSimpleNodeGraph(
            [{ op: "type/floatToInt" }],
            [
                {
                    declaration: 0,
                    values: {
                        a: {
                            type: 0,
                            value: [NaN],
                        },
                    },
                },
            ],
            [{ signature: "float" }]
        );

        const logItem = logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        expect(logItem!.payload.value.value).toBe(0);
    });

    test("type/floatToInt - Infinity", async () => {
        const { logger } = await generateSimpleNodeGraph(
            [{ op: "type/floatToInt" }],
            [
                {
                    declaration: 0,
                    values: {
                        a: {
                            type: 0,
                            value: [Infinity],
                        },
                    },
                },
            ],
            [{ signature: "float" }]
        );

        const logItem = logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        expect(logItem!.payload.value.value).toBe(0);
    });

    test("type/floatToInt - -Infinity", async () => {
        const { logger } = await generateSimpleNodeGraph(
            [{ op: "type/floatToInt" }],
            [
                {
                    declaration: 0,
                    values: {
                        a: {
                            type: 0,
                            value: [-Infinity],
                        },
                    },
                },
            ],
            [{ signature: "float" }]
        );

        const logItem = logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        expect(logItem!.payload.value.value).toBe(0);
    });

    test("type/floatToInt - -345.543", async () => {
        const { logger } = await generateSimpleNodeGraph(
            [{ op: "type/floatToInt" }],
            [
                {
                    declaration: 0,
                    values: {
                        a: {
                            type: 0,
                            value: [-345.543],
                        },
                    },
                },
            ],
            [{ signature: "float" }]
        );

        const logItem = logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        expect(logItem!.payload.value.value).toBe(-345);
    });

    // type/floatToBool
    test("type/floatToBool - 0", async () => {
        const { logger } = await generateSimpleNodeGraph(
            [{ op: "type/floatToBool" }],
            [
                {
                    declaration: 0,
                    values: {
                        a: {
                            type: 0,
                            value: [0],
                        },
                    },
                },
            ],
            [{ signature: "float" }]
        );

        const logItem = logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        expect(logItem!.payload.value).toBe(false);
    });

    test("type/floatToBool - 1.5", async () => {
        const { logger } = await generateSimpleNodeGraph(
            [{ op: "type/floatToBool" }],
            [
                {
                    declaration: 0,
                    values: {
                        a: {
                            type: 0,
                            value: [1.5],
                        },
                    },
                },
            ],
            [{ signature: "float" }]
        );

        const logItem = logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        expect(logItem!.payload.value).toBe(true);
    });

    test("type/floatToBool - NaN", async () => {
        const { logger } = await generateSimpleNodeGraph(
            [{ op: "type/floatToBool" }],
            [
                {
                    declaration: 0,
                    values: {
                        a: {
                            type: 0,
                            value: [NaN],
                        },
                    },
                },
            ],
            [{ signature: "float" }]
        );

        const logItem = logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        expect(logItem!.payload.value).toBe(false);
    });

    test("type/floatToBool - Infinity", async () => {
        const { logger } = await generateSimpleNodeGraph(
            [{ op: "type/floatToBool" }],
            [
                {
                    declaration: 0,
                    values: {
                        a: {
                            type: 0,
                            value: [Infinity],
                        },
                    },
                },
            ],
            [{ signature: "float" }]
        );

        const logItem = logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        expect(logItem!.payload.value).toBe(true);
    });

    test("type/floatToBool - -Infinity", async () => {
        const { logger } = await generateSimpleNodeGraph(
            [{ op: "type/floatToBool" }],
            [
                {
                    declaration: 0,
                    values: {
                        a: {
                            type: 0,
                            value: [-Infinity],
                        },
                    },
                },
            ],
            [{ signature: "float" }]
        );

        const logItem = logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        expect(logItem!.payload.value).toBe(true);
    });

    test("type/floatToBool - -345.543", async () => {
        const { logger } = await generateSimpleNodeGraph(
            [{ op: "type/floatToBool" }],
            [
                {
                    declaration: 0,
                    values: {
                        a: {
                            type: 0,
                            value: [-345.543],
                        },
                    },
                },
            ],
            [{ signature: "float" }]
        );

        const logItem = logger.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem).toBeDefined();
        expect(logItem!.payload.value).toBe(true);
    });
});
