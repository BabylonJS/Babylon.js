import { NullEngine } from "core/Engines";
import { Scene } from "core/scene";
import { FlowGraphCoordinator } from "core/FlowGraph/flowGraphCoordinator";
import { Vector3 } from "core/Maths";
import { ArcRotateCamera } from "core/Cameras";
import { Logger } from "core/Misc";
import { ParseFlowGraphAsync } from "core/FlowGraph";
import { InteractivityGraphToFlowGraphParser } from "loaders/glTF/2.0/Extensions/KHR_interactivity/interactivityGraphParser";
import "loaders/glTF/2.0/glTFLoaderAnimation";
import "loaders/glTF/2.0/Extensions/KHR_animation_pointer.data";
import { _AddInteractivityObjectModel } from "loaders/glTF/2.0/Extensions/KHR_interactivity";
import { GetPathToObjectConverter } from "loaders/glTF/2.0/Extensions/objectModelMapping";
import { IKHRInteractivity_Declaration, IKHRInteractivity_Graph, IKHRInteractivity_Node, IKHRInteractivity_Type, IKHRInteractivity_Variable } from "babylonjs-gltf2interface";
import { Mesh } from "core/Meshes/mesh";

/**
 * These tests will check the connection between interactivity's object model and pointers to the flow graph.
 * It will check pointer get, pointer set, interpolation, and the JSON pointers specified in the interactivity specs.
 */

describe("glTF interactivity Object Model", () => {
    let engine: NullEngine;
    let scene: Scene;
    const log: jest.SpyInstance = jest.spyOn(Logger, "Log").mockImplementation(() => {});
    const errorLog: jest.SpyInstance = jest.spyOn(Logger, "Error").mockImplementation(() => {});
    let renderInterval: any;

    async function generateSimpleNodeGraph(
        mockGltf: any, //Partial<IGLTF>,
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

        const pathConverter = GetPathToObjectConverter(mockGltf);
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
        new ArcRotateCamera("", Math.PI / 2, Math.PI / 2, 4, new Vector3(0, 0, 0));
        log.mockClear();
        errorLog.mockClear();
        _AddInteractivityObjectModel(scene);
        renderInterval = setInterval(() => scene?.render(), 16);
    });

    afterEach(() => {
        clearInterval(renderInterval);
        scene.dispose();
        engine.dispose();
    });

    // basic JSON Pointer tests
    it("should find a node's translation", async () => {
        const mesh = new Mesh("mesh", scene);
        mesh.position.set(1, 2, 3);
        const mockGltf: any = {
            nodes: [
                {
                    _babylonTransformNode: mesh,
                },
            ],
        };

        await generateSimpleNodeGraph(
            mockGltf,
            [{ op: "pointer/get" }, { op: "flow/log", extension: "BABYLON" }],
            [
                {
                    declaration: 1,
                    values: {
                        message: {
                            node: 1,
                            socket: "value",
                        },
                    },
                },
                {
                    declaration: 0,
                    configuration: {
                        pointer: { value: ["/nodes/0/translation"] },
                        type: {
                            value: [0],
                        },
                    },
                },
            ],
            [{ signature: "float3" }]
        );

        expect(log).toHaveBeenCalledWith(new Vector3(1, 2, 3));
    });

    // use variables to store the pointer
    it("should find a node's translation using a template variable", async () => {
        const mesh = new Mesh("mesh", scene);
        mesh.position.set(1, 2, 3);
        const mockGltf: any = {
            nodes: [
                {
                    _babylonTransformNode: mesh,
                },
            ],
        };

        await generateSimpleNodeGraph(
            mockGltf,
            [{ op: "pointer/get" }, { op: "flow/log", extension: "BABYLON" }],
            [
                {
                    declaration: 1,
                    values: {
                        message: {
                            node: 1,
                            socket: "value",
                        },
                    },
                },
                {
                    declaration: 0,
                    configuration: {
                        pointer: { value: ["/nodes/{nodeIdx}/translation"] },
                        type: { value: [1] },
                    },
                    values: {
                        nodeIdx: { value: [0], type: 0 },
                    },
                },
            ],
            [{ signature: "int" }, { signature: "float3" }]
        );

        expect(log).toHaveBeenCalledWith(new Vector3(1, 2, 3));
    });

    it("should get the active camera's position", async () => {
        await generateSimpleNodeGraph(
            {
                extensions: {
                    KHR_interactivity: {},
                },
            },
            [{ op: "pointer/get" }, { op: "flow/log", extension: "BABYLON" }],
            [
                {
                    declaration: 1,
                    values: {
                        message: {
                            node: 1,
                            socket: "value",
                        },
                    },
                },
                {
                    declaration: 0,
                    configuration: {
                        pointer: { value: ["/extensions/KHR_interactivity/activeCamera/position"] },
                        type: { value: [0] },
                    },
                },
            ],
            [{ signature: "float3" }]
        );
        // the result comes from the definition in the beforeEach function - a: PI/2, b: PI/2, r: 4
        const lastCallValue = log.mock.calls[log.mock.calls.length - 1][0];
        // round the result
        expect(lastCallValue.x).toBeCloseTo(0);
        expect(lastCallValue.y).toBeCloseTo(0);
        expect(lastCallValue.z).toBeCloseTo(4);
    });

    // check activeCamera/rotation
    it("should get the active camera's rotation", async () => {
        await generateSimpleNodeGraph(
            {
                extensions: {
                    KHR_interactivity: {},
                },
            },
            [{ op: "pointer/get" }, { op: "flow/log", extension: "BABYLON" }],
            [
                {
                    declaration: 1,
                    values: {
                        message: {
                            node: 1,
                            socket: "value",
                        },
                    },
                },
                {
                    declaration: 0,
                    configuration: {
                        pointer: { value: ["/extensions/KHR_interactivity/activeCamera/rotation"] },
                        type: { value: [1] },
                    },
                },
            ],
            [{ signature: "float4" }]
        );

        const lastCallValue = log.mock.calls[log.mock.calls.length - 1][0];
        // should be 0,1,0,0
        expect(lastCallValue.x).toBeCloseTo(0);
        expect(lastCallValue.y).toBeCloseTo(1);
        expect(lastCallValue.z).toBeCloseTo(0);
        expect(lastCallValue.w).toBeCloseTo(0);
    });

    it("should set a pointer value and get it correctly", async () => {
        const mesh = new Mesh("mesh", scene);
        const mockGltf: any = {
            nodes: [
                {
                    _babylonTransformNode: mesh,
                },
            ],
        };

        await generateSimpleNodeGraph(
            mockGltf,
            [{ op: "pointer/set" }, { op: "pointer/get" }, { op: "flow/log", extension: "BABYLON" }],
            [
                {
                    declaration: 0,
                    configuration: {
                        pointer: { value: ["/nodes/0/scale"] },
                    },
                    flows: {
                        out: {
                            node: 2,
                            socket: "in",
                        },
                    },
                    values: {
                        value: { value: [2, 3, 4], type: 0 },
                    },
                },
                {
                    declaration: 1,
                    configuration: {
                        pointer: { value: ["/nodes/0/scale"] },
                        type: { value: [0] },
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
            [{ signature: "float3" }]
        );

        expect(log).toHaveBeenCalledWith(new Vector3(2, 3, 4));
    });

    // simple pointer/interpolate
    it("should interpolate a pointer value", async () => {
        // the reason for cloning is that the same vector is being returned, meaning that the values will be the same at the end of the interpolation
        const calls: any[] = [];
        log.mockImplementation((val) => {
            calls.push(val.clone());
        });
        const mesh = new Mesh("mesh", scene);
        mesh.position.set(1, 2, 3);
        const mockGltf: any = {
            nodes: [
                {
                    _babylonTransformNode: mesh,
                },
            ],
        };

        await generateSimpleNodeGraph(
            mockGltf,
            [{ op: "pointer/interpolate" }, { op: "pointer/get" }, { op: "flow/log", extension: "BABYLON" }, { op: "event/onTick" }],
            [
                {
                    declaration: 0,
                    configuration: {
                        pointer: { value: ["/nodes/0/translation"] },
                        type: { value: [0] },
                    },
                    values: {
                        value: {
                            value: [2, 3, 4],
                            type: 0,
                        },
                        duration: {
                            value: [0.9],
                            type: 1,
                        },
                    },
                    flows: {
                        // on start - log
                        out: {
                            node: 1,
                            socket: "in",
                        },
                        // on done - log
                        done: {
                            node: 1,
                            socket: "in",
                        },
                    },
                },
                {
                    declaration: 2,
                    values: {
                        message: {
                            node: 2,
                            socket: "value",
                        },
                    },
                },
                {
                    declaration: 1,
                    configuration: {
                        pointer: { value: ["/nodes/0/translation"] },
                        type: { value: [0] },
                    },
                },
                {
                    declaration: 3,
                    flows: {
                        out: {
                            node: 1,
                            socket: "in",
                        },
                    },
                },
            ],
            [{ signature: "float3" }, { signature: "float" }]
        );

        // wait for 1 second + buffer
        await new Promise((resolve) => setTimeout(resolve, 1000 + 300));
        expect(calls[0]).toEqual(new Vector3(1, 2, 3));
        calls.forEach((call, idx) => {
            if (idx === 0) {
                return;
            }
            expect(call.x).toBeGreaterThanOrEqual(calls[idx - 1].x);
            expect(call.y).toBeGreaterThanOrEqual(calls[idx - 1].y);
            expect(call.z).toBeGreaterThanOrEqual(calls[idx - 1].z);
        });
        expect(calls.pop()).toEqual(new Vector3(2, 3, 4));

        log.mockImplementation(() => {});
    });
});
