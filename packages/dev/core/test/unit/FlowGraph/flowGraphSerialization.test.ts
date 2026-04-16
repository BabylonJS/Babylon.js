import { type Engine, NullEngine } from "core/Engines";
import {
    type FlowGraphAssetType,
    type FlowGraphExecutionBlock,
    FlowGraphAddBlock,
    FlowGraphConstantBlock,
    FlowGraphCoordinator,
    FlowGraphGetVariableBlock,
    FlowGraphConsoleLogBlock,
    FlowGraphDivideBlock,
    FlowGraphMultiGateBlock,
    FlowGraphMultiplyBlock,
    FlowGraphPlayAnimationBlock,
    FlowGraphSceneReadyEventBlock,
    FlowGraphSetPropertyBlock,
    FlowGraphSubtractBlock,
    RichTypeNumber,
    RichTypeVector3,
    ParseGraphDataConnection,
    ParseFlowGraphBlockWithClassType,
    ParseFlowGraphContext,
    ParseFlowGraph,
    ParseFlowGraphAsync,
} from "core/FlowGraph";
import { FlowGraphConnectionType } from "core/FlowGraph/flowGraphConnection";
import { FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import { FlowGraphEventType } from "core/FlowGraph/flowGraphEventType";
import { FlowGraphPathConverter } from "core/FlowGraph/flowGraphPathConverter";
import { defaultValueSerializationFunction } from "core/FlowGraph/serialization";
import { InstancedMesh } from "core/Meshes/instancedMesh";
import { Vector3 } from "core/Maths";
import { Mesh } from "core/Meshes";
import { TransformNode } from "core/Meshes/transformNode";
import { Logger } from "core/Misc/logger";
import { Scene } from "core/scene";

describe("Flow Graph Serialization", () => {
    let engine: Engine;
    let scene: Scene;
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
    });
    it("Serializes and Parses a connection", () => {
        const block = {} as any;
        block.uniqueId = "test";
        const connection = new FlowGraphDataConnection("test", FlowGraphConnectionType.Input, block, RichTypeNumber);
        const serialized: any = {};
        connection.serialize(serialized);

        expect(serialized.uniqueId).toBeDefined();
        expect(serialized.name).toEqual("test");
        expect(serialized._connectionType).toEqual(FlowGraphConnectionType.Input);
        expect(serialized.connectedPointIds).toEqual([]);
        expect(serialized.className).toEqual("FlowGraphDataConnection");
        expect(serialized.richType.typeName).toEqual("number");
        expect(serialized.richType.defaultValue).toEqual(0);

        const parsed = ParseGraphDataConnection(serialized, block, FlowGraphDataConnection);
        expect(parsed.uniqueId).toEqual(connection.uniqueId);
        expect(parsed.name).toEqual("test");
        expect(parsed._connectionType).toEqual(FlowGraphConnectionType.Input);
        expect(parsed.getClassName()).toEqual("FlowGraphDataConnection");
        expect(parsed.richType.typeName).toEqual("number");
        expect(parsed.richType.defaultValue).toEqual(0);

        const connection2 = new FlowGraphDataConnection("test2", FlowGraphConnectionType.Output, block, RichTypeNumber);
        connection.connectTo(connection2);

        const serialized2: any = {};
        connection.serialize(serialized2);

        expect(serialized2.connectedPointIds[0]).toBe(connection2.uniqueId);

        const parsed2 = ParseGraphDataConnection(serialized2, block, FlowGraphDataConnection);
        expect(parsed2.connectedPointIds[0]).toBe(connection2.uniqueId);

        // Check if a more complex type is properly serialized and parsed.
        const connection3 = new FlowGraphDataConnection("test3", FlowGraphConnectionType.Output, block, RichTypeVector3);
        const serialized3: any = {};
        connection3.serialize(serialized3);
        expect(serialized3.richType.typeName).toEqual("Vector3");
        expect(serialized3.richType.defaultValue._x).toEqual(0);
        expect(serialized3.richType.defaultValue._y).toEqual(0);
        expect(serialized3.richType.defaultValue._z).toEqual(0);

        const parsed3 = ParseGraphDataConnection(serialized3, block, FlowGraphDataConnection);
        expect(parsed3.richType.typeName).toEqual("Vector3");
        expect(parsed3.richType.defaultValue.x).toEqual(0);
        expect(parsed3.richType.defaultValue.y).toEqual(0);
        expect(parsed3.richType.defaultValue.z).toEqual(0);
    });

    it("Serializes and parses a block", () => {
        // Serialize a block with path
        // const mockContext: any = vi.mock("core/FlowGraph/flowGraphContext") as any;
        // const pathConverter = new FlowGraphPathConverter(mockContext);

        const block = new FlowGraphPlayAnimationBlock();

        const serialized: any = {};
        block.serialize(serialized);
        expect(serialized.uniqueId).toBeDefined();
        expect(serialized.signalInputs.length).toEqual(block.signalInputs.length);
        expect(serialized.signalOutputs.length).toEqual(block.signalOutputs.length);
        expect(serialized.dataInputs.length).toEqual(block.dataInputs.length);
        expect(serialized.dataOutputs.length).toEqual(block.dataOutputs.length);
        expect(serialized.className).toEqual("FlowGraphPlayAnimationBlock");

        const parsed = ParseFlowGraphBlockWithClassType(serialized, { scene }, FlowGraphPlayAnimationBlock);
        expect(parsed.uniqueId).toEqual(block.uniqueId);
        expect(parsed.getClassName()).toEqual("FlowGraphPlayAnimationBlock");
        expect(parsed.dataInputs.length).toEqual(block.dataInputs.length);
        expect(parsed.dataOutputs.length).toEqual(block.dataOutputs.length);
        expect((parsed as FlowGraphExecutionBlock).signalInputs.length).toEqual(block.signalInputs.length);
        expect((parsed as FlowGraphExecutionBlock).signalOutputs.length).toEqual(block.signalOutputs.length);

        // Serialize a block with configuration
        const multiGateBlock = new FlowGraphMultiGateBlock({ outputSignalCount: 3, name: "MultiGate" });
        const serialized2: any = {};
        multiGateBlock.serialize(serialized2);
        const parsed2 = ParseFlowGraphBlockWithClassType(serialized2, { scene }, FlowGraphMultiGateBlock) as any;
        expect(parsed2.outputSignals.length).toEqual(3);
    });

    it("Serializes and parses a context", () => {
        const coordinator = new FlowGraphCoordinator({ scene });
        const graph = coordinator.createGraph();
        const context = graph.createContext();

        const mesh = new Mesh("testMesh", scene);

        context.setVariable("test", 42);
        context.setVariable("test2", "hello");
        context.setVariable("test3", new Vector3(1, 2, 3));
        context.setVariable("test4", mesh);

        const flowGraphAddBlock = new FlowGraphAddBlock();

        flowGraphAddBlock.a.setValue(1, context);
        flowGraphAddBlock.b.setValue(2, context);

        const serialized: any = {};
        context.serialize(serialized);

        expect(serialized._userVariables.test).toEqual(42);
        expect(serialized._userVariables.test2).toEqual("hello");
        expect(serialized._userVariables.test3.value).toEqual([1, 2, 3]);
        expect(serialized._userVariables.test3.className).toEqual("Vector3");
        expect(serialized._userVariables.test4.name).toEqual("testMesh");
        expect(serialized._userVariables.test4.className).toEqual("Mesh");
        expect(serialized._connectionValues[flowGraphAddBlock.a.uniqueId]).toEqual(1);
        expect(serialized._connectionValues[flowGraphAddBlock.b.uniqueId]).toEqual(2);

        const parsed = ParseFlowGraphContext(serialized, { graph });

        expect(parsed.uniqueId).toEqual(context.uniqueId);
        expect(parsed.getClassName()).toEqual("FlowGraphContext");
        expect(parsed.getVariable("test")).toEqual(42);
        expect(parsed.getVariable("test2")).toEqual("hello");
        expect(parsed.getVariable("test3").x).toEqual(1);
        expect(parsed.getVariable("test3").y).toEqual(2);
        expect(parsed.getVariable("test3").z).toEqual(3);
        expect(parsed._getConnectionValue(flowGraphAddBlock.a)).toEqual(1);
        expect(parsed._getConnectionValue(flowGraphAddBlock.b)).toEqual(2);
        expect(parsed.getVariable("test4").uniqueId).toEqual(mesh.uniqueId);
    });

    it("Serializes and parses a graph", async () => {
        const mockContext: any = {};
        const pathConverter = new FlowGraphPathConverter(mockContext);

        const coordinator = new FlowGraphCoordinator({ scene });
        const graph = coordinator.createGraph();
        const context = graph.createContext();

        context.setVariable("test", 42);

        const flowGraphSceneReadyBlock = new FlowGraphSceneReadyEventBlock();
        graph.addEventBlock(flowGraphSceneReadyBlock);

        const logBlock = new FlowGraphConsoleLogBlock();
        flowGraphSceneReadyBlock.out.connectTo(logBlock.in);

        const getVariableBlock = new FlowGraphGetVariableBlock({ variable: "test" });

        logBlock.message.connectTo(getVariableBlock.value);

        const serialized: any = {};
        graph.serialize(serialized);
        // Graph is serialized with all blocks
        expect(serialized.allBlocks.length).toBe(3);

        const parsed = await ParseFlowGraphAsync(serialized, { coordinator, pathConverter });
        expect(parsed._eventBlocks[FlowGraphEventType.SceneReady].length).toBe(1);
        parsed.start();

        expect(Logger.Log).toHaveBeenCalledWith(42);
    });

    it("Serializes and parses a graph with vector and mesh references", () => {
        const coordinator = new FlowGraphCoordinator({ scene });
        const graph = coordinator.createGraph();
        const context = graph.createContext();

        const mesh = new Mesh("testMesh", scene);
        context.setVariable("testMesh", mesh);

        const flowGraphSceneReadyBlock = new FlowGraphSceneReadyEventBlock();
        graph.addEventBlock(flowGraphSceneReadyBlock);

        const pathConverter = new FlowGraphPathConverter(context);
        const setPropertyBlock = new FlowGraphSetPropertyBlock<Vector3, FlowGraphAssetType.Mesh>({ propertyName: "position", target: mesh });
        flowGraphSceneReadyBlock.out.connectTo(setPropertyBlock.in);

        const constBlock = new FlowGraphConstantBlock<Vector3>({ value: new Vector3(1, 2, 3) });
        constBlock.output.connectTo(setPropertyBlock.value);

        const serialized: any = {};
        graph.serialize(serialized);

        const parsed = ParseFlowGraph(serialized, { coordinator, pathConverter }, [FlowGraphSceneReadyEventBlock, FlowGraphSetPropertyBlock, FlowGraphConstantBlock]);
        parsed.start();

        scene.onReadyObservable.notifyObservers(scene);
        expect(mesh.position.asArray()).toEqual([1, 2, 3]);
    });

    it("Event block fires both out and done signals after round-trip", async () => {
        const mockContext: any = {};
        const pathConverter = new FlowGraphPathConverter(mockContext);

        // Test 1: downstream connected via 'out'
        const coordinator1 = new FlowGraphCoordinator({ scene });
        const graph1 = coordinator1.createGraph();
        const ctx1 = graph1.createContext();
        ctx1.setVariable("test", "via-out");

        const sceneReady1 = new FlowGraphSceneReadyEventBlock();
        graph1.addEventBlock(sceneReady1);
        const log1 = new FlowGraphConsoleLogBlock();
        sceneReady1.out.connectTo(log1.in);
        const getVar1 = new FlowGraphGetVariableBlock({ variable: "test" });
        log1.message.connectTo(getVar1.value);

        const serialized1: any = {};
        graph1.serialize(serialized1);
        const parsed1 = await ParseFlowGraphAsync(serialized1, { coordinator: coordinator1, pathConverter });
        parsed1.start();
        expect(Logger.Log).toHaveBeenCalledWith("via-out");

        // Test 2: downstream connected via 'done'
        const coordinator2 = new FlowGraphCoordinator({ scene });
        const graph2 = coordinator2.createGraph();
        const ctx2 = graph2.createContext();
        ctx2.setVariable("test", "via-done");

        const sceneReady2 = new FlowGraphSceneReadyEventBlock();
        graph2.addEventBlock(sceneReady2);
        const log2 = new FlowGraphConsoleLogBlock();
        sceneReady2.done.connectTo(log2.in);
        const getVar2 = new FlowGraphGetVariableBlock({ variable: "test" });
        log2.message.connectTo(getVar2.value);

        const serialized2: any = {};
        graph2.serialize(serialized2);
        const parsed2 = await ParseFlowGraphAsync(serialized2, { coordinator: coordinator2, pathConverter });
        parsed2.start();
        expect(Logger.Log).toHaveBeenCalledWith("via-done");
    });

    it("Binary operation blocks have correct getClassName after construction", () => {
        const addBlock = new FlowGraphAddBlock();
        expect(addBlock.getClassName()).toEqual("FlowGraphAddBlock");

        const divideBlock = new FlowGraphDivideBlock();
        expect(divideBlock.getClassName()).toEqual("FlowGraphDivideBlock");

        const multiplyBlock = new FlowGraphMultiplyBlock();
        expect(multiplyBlock.getClassName()).toEqual("FlowGraphMultiplyBlock");

        const subtractBlock = new FlowGraphSubtractBlock();
        expect(subtractBlock.getClassName()).toEqual("FlowGraphSubtractBlock");
    });

    it("Unconnected input values survive serialize → parse round-trip", () => {
        const coordinator = new FlowGraphCoordinator({ scene });
        const graph = coordinator.createGraph();
        const context = graph.createContext();

        const divideBlock = new FlowGraphDivideBlock();
        // Set unconnected input "b" to 2 (simulating KHR_interactivity default)
        divideBlock.b.setValue(2, context);
        // Set "a" to 10
        divideBlock.a.setValue(10, context);

        const serialized: any = {};
        context.serialize(serialized);

        // Connection values should be in the serialized context
        expect(serialized._connectionValues[divideBlock.a.uniqueId]).toEqual(10);
        expect(serialized._connectionValues[divideBlock.b.uniqueId]).toEqual(2);

        // Parse back
        const parsed = ParseFlowGraphContext(serialized, { graph });
        expect(parsed._getConnectionValue(divideBlock.a)).toEqual(10);
        expect(parsed._getConnectionValue(divideBlock.b)).toEqual(2);
    });

    it("Math graph with unconnected inputs produces correct results after round-trip", async () => {
        const mockContext: any = {};
        const pathConverter = new FlowGraphPathConverter(mockContext);

        const coordinator = new FlowGraphCoordinator({ scene });
        const graph = coordinator.createGraph();
        const context = graph.createContext();

        // Build: OnSceneReady → Log(10 / 2) = 5
        const sceneReady = new FlowGraphSceneReadyEventBlock();
        graph.addEventBlock(sceneReady);

        const divideBlock = new FlowGraphDivideBlock();
        // a=10 (unconnected), b=2 (unconnected)
        divideBlock.a.setValue(10, context);
        divideBlock.b.setValue(2, context);

        const logBlock = new FlowGraphConsoleLogBlock();
        sceneReady.out.connectTo(logBlock.in);
        logBlock.message.connectTo(divideBlock.value);

        // Serialize entire graph
        const serialized: any = {};
        graph.serialize(serialized);

        // Deserialize into a new coordinator
        const coordinator2 = new FlowGraphCoordinator({ scene });
        const parsed = await ParseFlowGraphAsync(serialized, { coordinator: coordinator2, pathConverter });

        parsed.start();
        expect(Logger.Log).toHaveBeenCalledWith(5);
    });

    it("TransformNode references survive serialize → parse round-trip", () => {
        const coordinator = new FlowGraphCoordinator({ scene });
        const graph = coordinator.createGraph();
        const context = graph.createContext();

        const transformNode = new TransformNode("myTransform", scene);
        context.setVariable("testNode", transformNode);

        const serialized: any = {};
        context.serialize(serialized);

        // Serialized as an object with name and className
        expect(serialized._userVariables.testNode.name).toEqual("myTransform");
        expect(serialized._userVariables.testNode.className).toEqual("TransformNode");

        // Parse back — should resolve to the same TransformNode in the scene
        const parsed = ParseFlowGraphContext(serialized, { graph });
        const resolved = parsed.getVariable("testNode");
        expect(resolved).toBeDefined();
        expect(resolved.uniqueId).toEqual(transformNode.uniqueId);
        expect(resolved.name).toEqual("myTransform");
    });

    it("Multiple meshes with the same id are distinguished by uniqueId through round-trip", () => {
        const coordinator = new FlowGraphCoordinator({ scene });
        const graph = coordinator.createGraph();
        const context = graph.createContext();

        // Create 3 meshes that share the same name/id (simulates glTF instancing)
        const meshA = new Mesh("Button", scene);
        const meshB = new Mesh("Button", scene);
        const meshC = new Mesh("Button", scene);

        // All three have the same id
        expect(meshA.id).toEqual(meshB.id);
        expect(meshB.id).toEqual(meshC.id);
        // But different uniqueIds
        expect(meshA.uniqueId).not.toEqual(meshB.uniqueId);
        expect(meshB.uniqueId).not.toEqual(meshC.uniqueId);

        context.setVariable("pickedMesh_0", meshA);
        context.setVariable("pickedMesh_1", meshB);
        context.setVariable("pickedMesh_2", meshC);

        const serialized: any = {};
        context.serialize(serialized);

        // All three serialized with uniqueId preserved
        expect(serialized._userVariables.pickedMesh_0.uniqueId).toEqual(meshA.uniqueId);
        expect(serialized._userVariables.pickedMesh_1.uniqueId).toEqual(meshB.uniqueId);
        expect(serialized._userVariables.pickedMesh_2.uniqueId).toEqual(meshC.uniqueId);

        // Parse back — each variable should resolve to its SPECIFIC mesh
        const parsed = ParseFlowGraphContext(serialized, { graph });
        const resolvedA = parsed.getVariable("pickedMesh_0");
        const resolvedB = parsed.getVariable("pickedMesh_1");
        const resolvedC = parsed.getVariable("pickedMesh_2");

        expect(resolvedA).toBe(meshA);
        expect(resolvedB).toBe(meshB);
        expect(resolvedC).toBe(meshC);
    });

    it("Serialization includes uniqueId for mesh references", () => {
        const mesh = new Mesh("myMesh", scene);
        const serialized: any = {};
        defaultValueSerializationFunction("target", mesh, serialized);

        expect(serialized.target).toBeDefined();
        expect(serialized.target.id).toEqual("myMesh");
        expect(serialized.target.name).toEqual("myMesh");
        expect(serialized.target.className).toEqual("Mesh");
        expect(serialized.target.uniqueId).toEqual(mesh.uniqueId);
    });

    it("TransformNode class name is recognized as a mesh type for serialization round-trip", () => {
        const coordinator = new FlowGraphCoordinator({ scene });
        const graph = coordinator.createGraph();
        const context = graph.createContext();

        const tn = new TransformNode("myTN", scene);
        context.setVariable("tnVar", tn);

        const serialized: any = {};
        context.serialize(serialized);

        expect(serialized._userVariables.tnVar.className).toEqual("TransformNode");

        const parsed = ParseFlowGraphContext(serialized, { graph });
        const resolved = parsed.getVariable("tnVar");
        expect(resolved).toBe(tn);
    });

    it("InstancedMesh class name is recognized as a mesh type for serialization round-trip", () => {
        const coordinator = new FlowGraphCoordinator({ scene });
        const graph = coordinator.createGraph();
        const context = graph.createContext();

        const sourceMesh = new Mesh("source", scene);
        const instance = sourceMesh.createInstance("inst1");
        context.setVariable("instVar", instance);

        const serialized: any = {};
        context.serialize(serialized);

        // InstancedMesh should serialize with className and uniqueId
        expect(serialized._userVariables.instVar.className).toBeDefined();
        expect(serialized._userVariables.instVar.uniqueId).toEqual(instance.uniqueId);
    });

    it("Serialization skips pathConverter key gracefully", () => {
        const serialized: any = {};
        const fakePathConverter = { convert: () => ({}) };
        defaultValueSerializationFunction("pathConverter", fakePathConverter, serialized);
        expect(serialized.pathConverter).toBeUndefined();
    });

    it("Serialization skips objects with function properties", () => {
        const serialized: any = {};
        const objWithFn = { name: "test", doSomething: () => {} };
        defaultValueSerializationFunction("myKey", objWithFn, serialized);
        expect(serialized.myKey).toBeUndefined();
    });

    it("Serialization stores plain JSON-safe objects", () => {
        const serialized: any = {};
        const plainObj = { a: 1, b: "hello", c: true };
        defaultValueSerializationFunction("config", plainObj, serialized);
        expect(serialized.config).toEqual({ a: 1, b: "hello", c: true });
    });

    it("Plain array of primitives survives parse round-trip without being treated as event config", () => {
        const coordinator = new FlowGraphCoordinator({ scene });
        const graph = coordinator.createGraph();
        const context = graph.createContext();

        // Store a plain array of strings (like variable name lists from variable/set)
        context.setVariable("varNames", ["rotation", "position", "scale"]);

        const serialized: any = {};
        context.serialize(serialized);

        // Should be stored as-is (not reduced to an object)
        expect(Array.isArray(serialized._userVariables.varNames)).toBe(true);
        expect(serialized._userVariables.varNames).toEqual(["rotation", "position", "scale"]);

        const parsed = ParseFlowGraphContext(serialized, { graph });
        const resolved = parsed.getVariable("varNames");
        expect(Array.isArray(resolved)).toBe(true);
        expect(resolved).toEqual(["rotation", "position", "scale"]);
    });
});
