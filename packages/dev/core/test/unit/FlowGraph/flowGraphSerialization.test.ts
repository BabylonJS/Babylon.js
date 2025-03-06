import type { Engine } from "core/Engines";
import { NullEngine } from "core/Engines";
import type { FlowGraphAssetType, FlowGraphExecutionBlock } from "core/FlowGraph";
import {
    FlowGraphAddBlock,
    FlowGraphConstantBlock,
    FlowGraphCoordinator,
    FlowGraphGetVariableBlock,
    FlowGraphConsoleLogBlock,
    FlowGraphMultiGateBlock,
    FlowGraphPlayAnimationBlock,
    FlowGraphSceneReadyEventBlock,
    FlowGraphSetPropertyBlock,
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
import { Vector3 } from "core/Maths";
import { Mesh } from "core/Meshes";
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
        Logger.Log = jest.fn();

        scene = new Scene(engine);
    });
    it("Serializes and Parses a connection", () => {
        const block = jest.mock("core/FlowGraph/flowGraphBlock") as any;
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
        // const mockContext: any = jest.mock("core/FlowGraph/flowGraphContext") as any;
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
        const mockContext: any = jest.mock("core/FlowGraph/flowGraphContext") as any;
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
});
