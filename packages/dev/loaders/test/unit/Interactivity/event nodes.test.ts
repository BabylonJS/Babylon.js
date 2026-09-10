import { NullEngine } from "core/Engines";
import { Scene } from "core/scene";
import { FlowGraphCoordinator } from "core/FlowGraph/flowGraphCoordinator";
import { Vector3 } from "core/Maths";
import { Ray } from "core/Culling/ray";
import { Mesh, TransformNode } from "core/Meshes";
import { PickingInfo } from "core/Collisions";
import { PointerEventTypes, PointerInfo } from "core/Events";
import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { Logger } from "core/Misc";
import { FlowGraphSceneReadyEventBlock, ParseFlowGraphAsync } from "core/FlowGraph";
import { InteractivityGraphToFlowGraphParser } from "loaders/glTF/2.0/Extensions/KHR_interactivity/interactivityGraphParser";
import "loaders/glTF/2.0/glTFLoaderAnimation";
import "loaders/glTF/2.0/Extensions/KHR_animation_pointer.data";
import "loaders/glTF/2.0/Extensions/KHR_interactivity";
import "loaders/glTF/2.0/Extensions/KHR_node_selectability";
import "loaders/glTF/2.0/Extensions/KHR_node_hoverability";
import { GetPathToObjectConverter } from "loaders/glTF/2.0/Extensions/objectModelMapping";
import { InteractivityHostResolver } from "loaders/glTF/2.0/Extensions/KHR_interactivity/interactivityHostResolver";
import { GetEventReference } from "loaders/glTF/2.0/Extensions/KHR_interactivity/interactivityReferences";
import { CloneKHRInteractivityGraph, CreateKHRInteractivityGraphModel } from "loaders/glTF/2.0/Extensions/KHR_interactivity/interactivityGraphModel";
import { FlowGraphObjectReferenceBlock } from "loaders/glTF/2.0/Extensions/KHR_interactivity/flowGraphObjectReferenceBlock";
import { FlowGraphEventReferenceBlock } from "loaders/glTF/2.0/Extensions/KHR_interactivity/flowGraphEventReferenceBlock";
import { GetInteractivityNodeState, InitializeInteractivityNodeState, SetInteractivityNodeState } from "loaders/glTF/2.0/Extensions/KHR_interactivity/interactivityNodeState";
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

    it.each([undefined, -1, 9])("event/onSelect does not fire with defaulted nodeIndex %s", async (nodeIndex) => {
        const mesh = new Mesh("target", scene);
        const gltf: any = { nodes: [{ _babylonTransformNode: mesh }] };
        const graph: IKHRInteractivity_Graph = {
            declarations: [
                { op: "event/onSelect", extension: "KHR_node_selectability" },
                { op: "flow/log", extension: "BABYLON" },
            ],
            types: [{ signature: "int" }],
            nodes: [
                {
                    declaration: 0,
                    configuration: nodeIndex === undefined ? undefined : { nodeIndex: { value: [nodeIndex] } },
                    flows: { out: { node: 1 } },
                },
                { declaration: 1, values: { message: { type: 0, value: [9] } } },
            ],
        };
        const parser = new InteractivityGraphToFlowGraphParser(graph, gltf);
        const coordinator = new FlowGraphCoordinator({ scene });
        await ParseFlowGraphAsync(parser.serializeToFlowGraph(), { coordinator, pathConverter: GetPathToObjectConverter(gltf) });
        coordinator.start();

        const pickInfo = new PickingInfo();
        pickInfo.hit = true;
        pickInfo.pickedMesh = mesh;
        scene.onPointerObservable.notifyObservers(new PointerInfo(PointerEventTypes.POINTERPICK, { pointerId: 1 } as any, pickInfo));

        expect(log).not.toHaveBeenCalled();
    });

    it.each([
        ["event/onSelect", "KHR_node_selectability", "selectedNode", "select"],
        ["event/onHoverIn", "KHR_node_hoverability", "hoveredNode", "hoverIn"],
        ["event/onHoverOut", "KHR_node_hoverability", "hoveredNode", "hoverOut"],
    ] as const)("%s exposes node, controller, and event references before firing", async (operation, extension, nodeSocket, trigger) => {
        const mesh = new Mesh("interactive", scene);
        (mesh as any)._internalMetadata = { gltf: { pointers: ["/nodes/0"] } };
        const gltf: any = { nodes: [{ _babylonTransformNode: mesh, _primitiveBabylonMeshes: [mesh] }] };
        const isSelect = operation === "event/onSelect";
        const outputValueSockets = isSelect
            ? {
                  selectedNode: { type: 1 },
                  selectionRayOrigin: { type: 2 },
                  selectionPoint: { type: 2 },
                  controllerIndex: { type: 0 },
                  event: { type: 1 },
              }
            : {
                  hoveredNode: { type: 1 },
                  controllerIndex: { type: 0 },
                  event: { type: 1 },
              };
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "int" }, { signature: "ref" }, { signature: "float3" }],
            declarations: [{ op: operation, extension, outputValueSockets }, { op: "flow/sequence" }, { op: "flow/log", extension: "BABYLON" }],
            nodes: [
                {
                    declaration: 0,
                    configuration: { nodeIndex: { value: [0] } },
                    flows: { out: { node: 1 } },
                },
                {
                    declaration: 1,
                    flows: {
                        "000": { node: 2 },
                        "001": { node: 3 },
                        "002": { node: 4 },
                    },
                },
                { declaration: 2, values: { message: { node: 0, socket: nodeSocket, type: 1 } } },
                { declaration: 2, values: { message: { node: 0, socket: "controllerIndex", type: 0 } } },
                { declaration: 2, values: { message: { node: 0, socket: "event", type: 1 } } },
            ],
        };
        const model = CreateKHRInteractivityGraphModel(graph);
        const parser = new InteractivityGraphToFlowGraphParser(graph, gltf, 60, 0, undefined, model.declarations);
        const coordinator = new FlowGraphCoordinator({ scene, hostResolver: new InteractivityHostResolver() });
        const serializedGraph = parser.serializeToFlowGraph();
        const runtimeGraph = await ParseFlowGraphAsync(serializedGraph, { coordinator, pathConverter: GetPathToObjectConverter(gltf) });
        const context = runtimeGraph.getContext(0);
        const eventStateBlock = runtimeGraph.getAllBlocks().find((block) => block.getClassName() === "FlowGraphEventReferenceBlock")!;
        expect(eventStateBlock.getDataOutput("nodeReference")!.getValue(context)).toBe("");
        expect(eventStateBlock.getDataOutput("controllerIndex")!.getValue(context)).toBe(-1);
        expect(eventStateBlock.getDataOutput("selectionPoint")!.getValue(context).asArray().every(Number.isNaN)).toBe(true);
        expect(eventStateBlock.getDataOutput("selectionRayOrigin")!.getValue(context).asArray().every(Number.isNaN)).toBe(true);
        coordinator.start();

        if (trigger === "select") {
            const pickInfo = new PickingInfo();
            pickInfo.hit = true;
            pickInfo.pickedMesh = mesh;
            scene.onPointerObservable.notifyObservers(new PointerInfo(PointerEventTypes.POINTERPICK, { pointerId: 7 } as any, pickInfo));
        } else {
            scene.setPointerOverMesh(mesh, 7);
            if (trigger === "hoverOut") {
                scene.setPointerOverMesh(null, 7);
            }
        }

        expect(log).toHaveBeenCalledWith("/nodes/0");
        expect(log).toHaveBeenCalledWith(0);
        expect(log).toHaveBeenCalledWith(GetEventReference(`${extension}:${operation}:0`));
        if (isSelect) {
            expect(eventStateBlock.getDataOutput("selectionPoint")!.getValue(context).asArray().every(Number.isNaN)).toBe(true);
            expect(eventStateBlock.getDataOutput("selectionRayOrigin")!.getValue(context).asArray().every(Number.isNaN)).toBe(true);
        }
    });

    it("encodes a picked primitive as its owning glTF node reference", () => {
        const owner = new TransformNode("owner", scene);
        (owner as any)._internalMetadata = { gltf: { pointers: ["/nodes/4"] } };
        const primitive = new Mesh("primitive", scene);
        primitive.parent = owner;
        (primitive as any)._internalMetadata = { gltf: { pointers: ["/meshes/2/primitives/1"] } };
        const coordinator = new FlowGraphCoordinator({ scene, hostResolver: new InteractivityHostResolver() });
        const context = coordinator.createGraph().createContext();
        const block = new FlowGraphObjectReferenceBlock();
        block.object.setValue(primitive, context);

        expect(block.value.getValue(context)).toBe("/nodes/4");
    });

    it("keeps event references null until the event flow executes", () => {
        const coordinator = new FlowGraphCoordinator({ scene, hostResolver: new InteractivityHostResolver() });
        const context = coordinator.createGraph().createContext();
        const block = new FlowGraphEventReferenceBlock({ eventKey: "event-key" });

        expect(block.value.getValue(context)).toBe("");
        block._execute(context);
        expect(block.value.getValue(context)).toBe(GetEventReference("event-key"));
    });

    it.each([
        ["immediate", true],
        ["transitive", false],
    ] as const)("event/onSelect supports %s propagation cancellation", async (_name, stopImmediate) => {
        const parent = new Mesh("parent", scene);
        const child = stopImmediate ? parent : new Mesh("child", scene);
        if (child !== parent) {
            child.parent = parent;
        }
        const gltf: any = {
            nodes: [
                { _babylonTransformNode: parent, _primitiveBabylonMeshes: [parent] },
                { _babylonTransformNode: child, _primitiveBabylonMeshes: [child] },
            ],
        };
        const outputValueSockets = {
            selectedNode: { type: 2 },
            selectionRayOrigin: { type: 3 },
            selectionPoint: { type: 3 },
            controllerIndex: { type: 1 },
            event: { type: 2 },
        };
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "bool" }, { signature: "int" }, { signature: "ref" }, { signature: "float3" }],
            declarations: [
                { op: "event/onSelect", extension: "KHR_node_selectability", outputValueSockets },
                { op: "event/stopPropagation" },
                { op: "flow/log", extension: "BABYLON" },
            ],
            nodes: [
                {
                    declaration: 0,
                    configuration: { nodeIndex: { value: [stopImmediate ? 0 : 1] } },
                    flows: { out: { node: 2 } },
                },
                {
                    declaration: 0,
                    configuration: { nodeIndex: { value: [0] } },
                    flows: { out: { node: 3 } },
                },
                {
                    declaration: 1,
                    values: {
                        event: { node: 0, socket: "event", type: 2 },
                        stopImmediate: { type: 0, value: [stopImmediate] },
                    },
                },
                { declaration: 2, values: { message: { type: 1, value: [99] } } },
            ],
        };
        const model = CreateKHRInteractivityGraphModel(graph, 0, undefined, gltf.nodes.length);
        const parser = new InteractivityGraphToFlowGraphParser(graph, gltf, 60, 0, undefined, model.declarations);
        const coordinator = new FlowGraphCoordinator({ scene, hostResolver: new InteractivityHostResolver() });
        await ParseFlowGraphAsync(parser.serializeToFlowGraph(), { coordinator, pathConverter: GetPathToObjectConverter(gltf) });
        coordinator.start();

        const pickInfo = new PickingInfo();
        pickInfo.hit = true;
        pickInfo.pickedMesh = child;
        pickInfo.pickedPoint = Vector3.Zero();
        pickInfo.ray = new Ray(Vector3.Zero(), Vector3.Forward());
        scene.onPointerObservable.notifyObservers(new PointerInfo(PointerEventTypes.POINTERPICK, { pointerId: 1 } as any, pickInfo));

        expect(log).not.toHaveBeenCalled();
    });

    it.each(["event/onStart", "event/onTick"] as const)("%s stopImmediate suppresses later lifecycle handlers", async (operation) => {
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "bool" }, { signature: "ref" }, { signature: "int" }],
            declarations: [{ op: operation }, { op: operation }, { op: "event/stopPropagation" }, { op: "flow/log", extension: "BABYLON" }],
            nodes: [
                { declaration: 0, flows: { out: { node: 2 } } },
                { declaration: 1, flows: { out: { node: 3 } } },
                {
                    declaration: 2,
                    values: {
                        event: { node: 0, socket: "event", type: 1 },
                        stopImmediate: { type: 0, value: [true] },
                    },
                },
                { declaration: 3, values: { message: { type: 2, value: [42] } } },
            ],
        };
        const parser = new InteractivityGraphToFlowGraphParser(graph, {});
        const coordinator = new FlowGraphCoordinator({ scene, hostResolver: new InteractivityHostResolver() });
        await ParseFlowGraphAsync(parser.serializeToFlowGraph(), { coordinator });

        coordinator.start();
        if (operation === "event/onTick") {
            scene.render();
        }

        expect(log).not.toHaveBeenCalled();
    });

    it("event/onTick exposes typed timeSinceStart at runtime", async () => {
        clearInterval(renderInterval);
        vi.spyOn(engine, "getDeltaTime").mockReturnValue(250);
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "float" }, { signature: "int" }],
            declarations: [{ op: "event/onTick" }, { op: "flow/log", extension: "BABYLON" }],
            nodes: [
                { declaration: 0, flows: { out: { node: 1 } } },
                { declaration: 1, values: { message: { node: 0, socket: "timeSinceStart", type: 0 } } },
            ],
        };
        const model = CreateKHRInteractivityGraphModel(graph);
        expect(model.valid).toBe(true);
        const invalidGraph = CloneKHRInteractivityGraph(graph);
        invalidGraph.nodes![1].values!.message.type = 1;
        expect(CreateKHRInteractivityGraphModel(invalidGraph).valid).toBe(false);
        const parser = new InteractivityGraphToFlowGraphParser(graph, {}, 60, 0, undefined, model.declarations);
        const coordinator = new FlowGraphCoordinator({ scene, hostResolver: new InteractivityHostResolver() });
        await ParseFlowGraphAsync(parser.serializeToFlowGraph(), { coordinator });

        coordinator.start();
        scene.render();
        scene.render();

        const elapsedValues = log.mock.calls.map(([value]) => value).filter((value) => typeof value === "number");
        expect(elapsedValues).toEqual([0, 0.25]);
    });

    it("assigns stable distinct controller indices for multiple pointer ids", () => {
        const coordinator = new FlowGraphCoordinator({ scene, hostResolver: new InteractivityHostResolver() });
        const context = coordinator.createGraph().createContext();
        const block = new FlowGraphEventReferenceBlock({ eventKey: "pointer" });

        block.controllerIndexInput.setValue(7, context);
        block._execute(context);
        expect(block.controllerIndex.getValue(context)).toBe(0);
        block.controllerIndexInput.setValue(8, context);
        block._execute(context);
        expect(block.controllerIndex.getValue(context)).toBe(1);
        block.controllerIndexInput.setValue(7, context);
        block._execute(context);
        expect(block.controllerIndex.getValue(context)).toBe(0);
    });

    it("cleans lifecycle dispatch state when an event handler throws", () => {
        const coordinator = new FlowGraphCoordinator({ scene, hostResolver: new InteractivityHostResolver() });
        const graph = coordinator.createGraph();
        graph.createContext();
        const event = new FlowGraphSceneReadyEventBlock();
        graph.addEventBlock(event);
        vi.spyOn(event, "_executeEvent").mockImplementation(() => {
            throw new Error("event failure");
        });

        expect(() => coordinator.start()).toThrow("event failure");
        expect(coordinator._eventDispatchStack).toHaveLength(0);
    });

    it.each([
        ["event/onSelect", "KHR_node_selectability", "select"],
        ["event/onHoverIn", "KHR_node_hoverability", "hover"],
    ] as const)("%s assigns distinct indices to two pointer controllers", async (operation, extension, trigger) => {
        const mesh = new Mesh("interactive", scene);
        (mesh as any)._internalMetadata = { gltf: { pointers: ["/nodes/0"] } };
        const gltf: any = { nodes: [{ _babylonTransformNode: mesh, _primitiveBabylonMeshes: [mesh] }] };
        const outputValueSockets =
            trigger === "select"
                ? {
                      selectedNode: { type: 1 },
                      selectionRayOrigin: { type: 2 },
                      selectionPoint: { type: 2 },
                      controllerIndex: { type: 0 },
                      event: { type: 1 },
                  }
                : {
                      hoveredNode: { type: 1 },
                      controllerIndex: { type: 0 },
                      event: { type: 1 },
                  };
        const graph: IKHRInteractivity_Graph = {
            types: [{ signature: "int" }, { signature: "ref" }, { signature: "float3" }],
            declarations: [
                { op: operation, extension, outputValueSockets },
                { op: "flow/log", extension: "BABYLON" },
            ],
            nodes: [
                {
                    declaration: 0,
                    configuration: { nodeIndex: { value: [0] } },
                    flows: { out: { node: 1 } },
                },
                { declaration: 1, values: { message: { node: 0, socket: "controllerIndex", type: 0 } } },
            ],
        };
        const model = CreateKHRInteractivityGraphModel(graph, 0, undefined, 1);
        const parser = new InteractivityGraphToFlowGraphParser(graph, gltf, 60, 0, undefined, model.declarations);
        const coordinator = new FlowGraphCoordinator({ scene, hostResolver: new InteractivityHostResolver() });
        await ParseFlowGraphAsync(parser.serializeToFlowGraph(), { coordinator, pathConverter: GetPathToObjectConverter(gltf) });
        coordinator.start();

        if (trigger === "select") {
            for (const pointerId of [7, 8]) {
                const pickInfo = new PickingInfo();
                pickInfo.hit = true;
                pickInfo.pickedMesh = mesh;
                scene.onPointerObservable.notifyObservers(new PointerInfo(PointerEventTypes.POINTERPICK, { pointerId } as any, pickInfo));
            }
        } else {
            scene.setPointerOverMesh(mesh, 7);
            scene.setPointerOverMesh(null, 7);
            scene.setPointerOverMesh(mesh, 8);
        }

        expect(log).toHaveBeenCalledWith(0);
        expect(log).toHaveBeenCalledWith(1);
    });

    it.each(["selectable", "hoverable"] as const)("%s state applies to own primitives and respects inherited false values", (state) => {
        const parentMesh = new Mesh("parent", scene);
        const childMesh = new Mesh("child", scene);
        const parent: any = { _babylonTransformNode: parentMesh, _primitiveBabylonMeshes: [parentMesh] };
        const child: any = { parent, _babylonTransformNode: childMesh, _primitiveBabylonMeshes: [childMesh] };

        InitializeInteractivityNodeState([parent, child], state, (node) => node === parent);
        expect(GetInteractivityNodeState(parent, state)).toBe(true);
        expect(GetInteractivityNodeState(child, state)).toBe(false);
        if (state === "selectable") {
            expect(parentMesh.isPickable).toBe(true);
            expect(childMesh.isPickable).toBe(false);
        } else {
            expect(parentMesh._isPointerMovePickable).toBe(true);
            expect(childMesh._isPointerMovePickable).toBe(false);
        }

        SetInteractivityNodeState(child, state, true);
        SetInteractivityNodeState(parent, state, false);
        if (state === "selectable") {
            expect(parentMesh.isPickable).toBe(false);
            expect(childMesh.isPickable).toBe(false);
        } else {
            expect(parentMesh._isPointerMovePickable).toBe(false);
            expect(childMesh._isPointerMovePickable).toBe(false);
        }
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
