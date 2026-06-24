import { NullEngine } from "core/Engines";
import { Scene } from "core/scene";
import { FlowGraphCoordinator } from "core/FlowGraph/flowGraphCoordinator";
import { Vector3 } from "core/Maths";
import { Mesh } from "core/Meshes";
import { PickingInfo } from "core/Collisions";
import { PointerEventTypes, PointerInfo } from "core/Events";
import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { Logger } from "core/Misc";
import { ParseFlowGraphAsync } from "core/FlowGraph";
import { InteractivityGraphToFlowGraphParser } from "loaders/glTF/2.0/Extensions/KHR_interactivity/interactivityGraphParser";
import "loaders/glTF/2.0/glTFLoaderAnimation";
import "loaders/glTF/2.0/Extensions/KHR_animation_pointer.data";
import "loaders/glTF/2.0/Extensions/KHR_interactivity";
import "loaders/glTF/2.0/Extensions/KHR_node_selectability";
import { GetPathToObjectConverter } from "loaders/glTF/2.0/Extensions/objectModelMapping";
import {
    IKHRInteractivity_Declaration,
    IKHRInteractivity_Event,
    IKHRInteractivity_Graph,
    IKHRInteractivity_Node,
    IKHRInteractivity_Type,
    IKHRInteractivity_Variable,
} from "babylonjs-gltf2interface";
describe("Interactivity event nodes", () => {
    let engine: NullEngine;
    let scene: Scene;
    const log: ReturnType<typeof vi.spyOn> = vi.spyOn(Logger, "Log").mockImplementation(() => {});
    const errorLog: ReturnType<typeof vi.spyOn> = vi.spyOn(Logger, "Error").mockImplementation(() => {});
    let renderInterval: any;

    async function generateSimpleNodeGraph(
        declarations: IKHRInteractivity_Declaration[],
        nodes: IKHRInteractivity_Node[],
        events: IKHRInteractivity_Event[] = [],
        types: IKHRInteractivity_Type[] = [],
        variables: IKHRInteractivity_Variable[] = [],
        mockGltf: any = {} //Partial<IGLTF>,
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
            events,
        };

        const pathConverter = GetPathToObjectConverter(mockGltf);
        const i2fg = new InteractivityGraphToFlowGraphParser(ig, {
            ...mockGltf,
            extensions: {
                KHR_interactivity: ig,
            },
        });
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
        renderInterval = setInterval(() => scene?.render(), 16);
    });

    afterEach(() => {
        clearInterval(renderInterval);
        scene.dispose();
        engine.dispose();
    });

    it("should log an error when trying to use a non-existent event", async () => {
        await expect(
            generateSimpleNodeGraph(
                [{ op: "event/receive" }],
                [
                    {
                        declaration: 0,
                        configuration: {
                            event: {
                                value: [0],
                            },
                        },
                    },
                ],
                [],
                [{ signature: "int" }]
            )
        ).rejects.toThrow();
    });

    it("event/onSelect fires the flow when its configured node mesh is picked", async () => {
        // The node at glTF index 0 is backed by this mesh; picking it must fire the event.
        const mesh = new Mesh("selectMe", scene);
        const gltf: any = { nodes: [{ _babylonTransformNode: mesh }] };

        const ig: IKHRInteractivity_Graph = {
            declarations: [
                { op: "event/onSelect", extension: "KHR_node_selectability" },
                { op: "flow/log", extension: "BABYLON" },
            ],
            types: [{ signature: "int" }],
            nodes: [
                {
                    declaration: 0,
                    configuration: { nodeIndex: { value: [0] } },
                    flows: { out: { node: 1, socket: "in" } },
                },
                { declaration: 1, values: { message: { type: 0, value: [42] } } },
            ],
            variables: [],
            events: [],
        };

        const i2fg = new InteractivityGraphToFlowGraphParser(ig, gltf);
        const json = i2fg.serializeToFlowGraph();
        const coordinator = new FlowGraphCoordinator({ scene });
        const localPathConverter = GetPathToObjectConverter(gltf);
        await ParseFlowGraphAsync(json, { coordinator, pathConverter: localPathConverter });
        coordinator.start();

        // Not fired before any pick.
        expect(log).not.toHaveBeenCalledWith({ value: 42 });

        // Simulate clicking the mesh.
        const pickInfo = new PickingInfo();
        pickInfo.hit = true;
        pickInfo.pickedMesh = mesh;
        pickInfo.pickedPoint = new Vector3();
        scene.onPointerObservable.notifyObservers(new PointerInfo(PointerEventTypes.POINTERPICK, {} as any, pickInfo));

        expect(log).toHaveBeenCalledWith({ value: 42 });
    });

    it("event/onSelect does not fire when a different mesh is picked", async () => {
        const target = new Mesh("target", scene);
        const other = new Mesh("other", scene);
        const gltf: any = { nodes: [{ _babylonTransformNode: target }] };

        const ig: IKHRInteractivity_Graph = {
            declarations: [
                { op: "event/onSelect", extension: "KHR_node_selectability" },
                { op: "flow/log", extension: "BABYLON" },
            ],
            types: [{ signature: "int" }],
            nodes: [
                {
                    declaration: 0,
                    configuration: { nodeIndex: { value: [0] } },
                    flows: { out: { node: 1, socket: "in" } },
                },
                { declaration: 1, values: { message: { type: 0, value: [7] } } },
            ],
            variables: [],
            events: [],
        };

        const i2fg = new InteractivityGraphToFlowGraphParser(ig, gltf);
        const json = i2fg.serializeToFlowGraph();
        const coordinator = new FlowGraphCoordinator({ scene });
        const localPathConverter = GetPathToObjectConverter(gltf);
        await ParseFlowGraphAsync(json, { coordinator, pathConverter: localPathConverter });
        coordinator.start();

        const pickInfo = new PickingInfo();
        pickInfo.hit = true;
        pickInfo.pickedMesh = other;
        pickInfo.pickedPoint = new Vector3();
        scene.onPointerObservable.notifyObservers(new PointerInfo(PointerEventTypes.POINTERPICK, {} as any, pickInfo));

        expect(log).not.toHaveBeenCalledWith({ value: 7 });
    });

    it("should send an event with id", async () => {
        await generateSimpleNodeGraph(
            [{ op: "event/send" }, { op: "event/receive" }, { op: "flow/log", extension: "BABYLON" }],

            [
                {
                    declaration: 0,
                    configuration: {
                        event: {
                            value: [0],
                        },
                    },
                },
                {
                    declaration: 1,
                    configuration: {
                        event: {
                            value: [0],
                        },
                    },
                    flows: {
                        out: {
                            node: 2,
                            socket: "in",
                        },
                    },
                },
                // log node
                {
                    declaration: 2,
                    values: {
                        message: {
                            type: 0,
                            value: [100],
                        },
                    },
                },
            ],
            [
                {
                    id: "test",
                },
            ],
            [{ signature: "int" }]
        );

        expect(log).toHaveBeenNthCalledWith(1, { value: 100 });
    });

    it("should send and receive an event with event data - default values", async () => {
        await generateSimpleNodeGraph(
            [{ op: "event/send" }, { op: "event/receive" }, { op: "flow/log", extension: "BABYLON" }],

            [
                {
                    declaration: 0,
                    configuration: {
                        event: {
                            value: [0],
                        },
                    },
                },
                {
                    declaration: 1,
                    configuration: {
                        event: {
                            value: [0],
                        },
                    },
                    flows: {
                        out: {
                            node: 2,
                            socket: "in",
                        },
                    },
                },
                // log node
                {
                    declaration: 2,
                    values: {
                        message: {
                            node: 1,
                            socket: "var1",
                        },
                    },
                },
            ],
            [
                {
                    id: "test",
                    values: {
                        var1: {
                            type: 0,
                            value: [300],
                        },
                        var2: {
                            type: 0,
                            value: [200],
                        },
                    },
                },
            ],
            [{ signature: "int" }]
        );

        expect(log).toHaveBeenNthCalledWith(1, { value: 300 });
    });

    it("should send and receive an event with event data - overwrite default values", async () => {
        await generateSimpleNodeGraph(
            [{ op: "event/send" }, { op: "event/receive" }, { op: "flow/log", extension: "BABYLON" }],

            [
                {
                    declaration: 0,
                    configuration: {
                        event: {
                            value: [0],
                        },
                    },
                    values: {
                        var1: {
                            type: 0,
                            value: [400],
                        },
                    },
                },
                {
                    declaration: 1,
                    configuration: {
                        event: {
                            value: [0],
                        },
                    },
                    flows: {
                        out: {
                            node: 2,
                            socket: "in",
                        },
                    },
                },
                // log node
                {
                    declaration: 2,
                    values: {
                        message: {
                            node: 1,
                            socket: "var1",
                        },
                    },
                },
            ],
            [
                {
                    id: "test",
                    values: {
                        var1: {
                            type: 0,
                            value: [300],
                        },
                        var2: {
                            type: 0,
                            value: [200],
                        },
                    },
                },
            ],
            [{ signature: "float" }]
        );

        expect(log).toHaveBeenNthCalledWith(1, 400);
    });
});
