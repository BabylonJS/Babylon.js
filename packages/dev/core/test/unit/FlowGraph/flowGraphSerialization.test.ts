import type { Engine } from "core/Engines";
import { NullEngine } from "core/Engines";
import type { FlowGraphExecutionBlock } from "core/FlowGraph";
import { FlowGraphAddNumberBlock, FlowGraphBlock, FlowGraphContext, FlowGraphCoordinator, FlowGraphPlayAnimationBlock, RichTypeNumber } from "core/FlowGraph";
import { FlowGraphConnectionType } from "core/FlowGraph/flowGraphConnection";
import { FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
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

        scene = new Scene(engine);
    });
    it("Serializes and Parses a connection", () => {
        const block = jest.mock("core/FlowGraph/flowGraphBlock") as any;
        block.uniqueId = "test";
        const connection = new FlowGraphDataConnection("test", FlowGraphConnectionType.Input, block, RichTypeNumber);
        const serialized: any = {};
        connection.serialize(serialized);
        console.log("serialized connection", serialized);
        expect(serialized.uniqueId).toBeDefined();
        expect(serialized.name).toEqual("test");
        expect(serialized._connectionType).toEqual(FlowGraphConnectionType.Input);
        expect(serialized.connectedPoint).toEqual([]);
        expect(serialized.className).toEqual("FlowGraphDataConnection");
        expect(serialized.richType.typeName).toEqual("number");
        expect(serialized.richType.defaultValue).toEqual(0);

        const parsed = FlowGraphDataConnection.Parse(serialized, block);
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

        expect(serialized2.connectedPoint[0]).toBe(connection2.uniqueId);
    });

    it("Serializes and parses a block", () => {
        const block = new FlowGraphPlayAnimationBlock();

        const serialized: any = {};
        block.serialize(serialized);
        console.log("serialized block", serialized);
        expect(serialized.uniqueId).toBeDefined();
        expect(serialized.signalInputs.length).toEqual(1);
        expect(serialized.signalOutputs.length).toEqual(2);
        expect(serialized.dataInputs.length).toEqual(6);
        expect(serialized.dataOutputs.length).toEqual(1);
        expect(serialized.className).toEqual("FlowGraphPlayAnimationBlock");

        const parsed = FlowGraphBlock.Parse(serialized);
        console.log("parsed block", parsed);
        expect(parsed.uniqueId).toEqual(block.uniqueId);
        expect(parsed.getClassName()).toEqual("FlowGraphPlayAnimationBlock");
        expect(parsed.dataInputs.length).toEqual(6);
        expect(parsed.dataOutputs.length).toEqual(1);
        expect((parsed as FlowGraphExecutionBlock).signalInputs.length).toEqual(1);
        expect((parsed as FlowGraphExecutionBlock).signalOutputs.length).toEqual(2);
    });

    it("Serializes and parses a context", () => {
        const coordinator = new FlowGraphCoordinator({ scene });
        const graph = coordinator.createGraph();
        const context = graph.createContext();

        context.setVariable("test", 42);
        context.setVariable("test2", "hello");

        const flowGraphAddBlock = new FlowGraphAddNumberBlock();

        flowGraphAddBlock.leftInput.setValue(1, context);
        flowGraphAddBlock.rightInput.setValue(2, context);

        const serialized: any = {};
        context.serialize(serialized);
        console.log("serialized context", serialized);

        expect(serialized._userVariables.test).toEqual(42);
        expect(serialized._connectionValues[flowGraphAddBlock.leftInput.uniqueId]).toEqual(1);
        expect(serialized._connectionValues[flowGraphAddBlock.rightInput.uniqueId]).toEqual(2);

        const parsed = FlowGraphContext.Parse(serialized, { scene, eventCoordinator: coordinator.eventCoordinator });
        console.log("parsed context", parsed);
        expect(parsed.uniqueId).toEqual(context.uniqueId);
        expect(parsed.getClassName()).toEqual("FlowGraphContext");
        expect(parsed.getVariable("test")).toEqual(42);
        expect(parsed.getVariable("test2")).toEqual("hello");
        expect(parsed._getConnectionValue(flowGraphAddBlock.leftInput)).toEqual(1);
        expect(parsed._getConnectionValue(flowGraphAddBlock.rightInput)).toEqual(2);
    });
});
