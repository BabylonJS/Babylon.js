import { PickingInfo } from "core/Collisions";
import { type Engine, NullEngine } from "core/Engines";
import { PointerEventTypes, PointerInfo } from "core/Events";
import {
    type FlowGraph,
    type FlowGraphContext,
    FlowGraphCoordinator,
    FlowGraphConsoleLogBlock,
    FlowGraphMeshPickEventBlock,
    FlowGraphReceiveCustomEventBlock,
    FlowGraphSceneReadyEventBlock,
    FlowGraphSceneTickEventBlock,
    FlowGraphSendCustomEventBlock,
    FlowGraphStopEventPropagationBlock,
    GetDefaultEventReference,
    RichTypeNumber,
    RichTypeString,
    ParseFlowGraphAsync,
} from "core/FlowGraph";
import { ParseFlowGraph } from "core/FlowGraph/flowGraphParser";
import { FlowGraphPathConverter } from "core/FlowGraph/flowGraphPathConverter";
import { Mesh } from "core/Meshes";
import { Logger } from "core/Misc/logger";
import { Scene } from "core/scene";

describe("Flow Graph Event Nodes", () => {
    let engine: Engine;
    let scene: Scene;
    let flowGraphCoordinator: FlowGraphCoordinator;
    let flowGraph: FlowGraph;
    let flowGraphContext: FlowGraphContext;

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
        flowGraphCoordinator = new FlowGraphCoordinator({ scene });
        flowGraph = flowGraphCoordinator.createGraph();
        flowGraphContext = flowGraph.createContext();
    });

    it("logs an explicitly empty message template", () => {
        const sceneReady = new FlowGraphSceneReadyEventBlock();
        const log = new FlowGraphConsoleLogBlock({ messageTemplate: "" });
        flowGraph.addEventBlock(sceneReady);
        sceneReady.done.connectTo(log.in);

        flowGraph.start();

        expect(Logger.Log).toHaveBeenCalledWith("");
    });

    it("treats a non-string message template as absent", () => {
        const sceneReady = new FlowGraphSceneReadyEventBlock();
        const log = new FlowGraphConsoleLogBlock(JSON.parse('{"messageTemplate":null}'));
        flowGraph.addEventBlock(sceneReady);
        sceneReady.done.connectTo(log.in);
        log.message.setValue("fallback", flowGraphContext);

        flowGraph.start();

        expect(Logger.Log).toHaveBeenCalledWith("fallback");
    });

    it("Custom Event Block", () => {
        const receiverGraph = flowGraphCoordinator.createGraph();

        const sceneReady = new FlowGraphSceneReadyEventBlock({ name: "SceneReady" });
        flowGraph.addEventBlock(sceneReady);

        const randomValue = Math.random();
        const eventId = "testEvent" + Math.random();

        const sendEvent = new FlowGraphSendCustomEventBlock({
            eventId,
            eventData: {
                testData: {
                    type: RichTypeNumber,
                },
            },
        });
        const sendEventDataNode = sendEvent.getDataInput("testData");
        expect(sendEventDataNode).toBeDefined();
        sendEventDataNode!.setValue(randomValue, flowGraphContext);
        sceneReady.done.connectTo(sendEvent.in);

        const receiveEvent = new FlowGraphReceiveCustomEventBlock({
            eventId,
            eventData: {
                testData: {
                    type: RichTypeNumber,
                },
            },
        });
        receiverGraph.addEventBlock(receiveEvent);

        const consoleLogBlock = new FlowGraphConsoleLogBlock({ name: "Log" });
        receiveEvent.done.connectTo(consoleLogBlock.in);
        const receiveEventDataNode = receiveEvent.getDataOutput("testData");
        expect(receiveEventDataNode).toBeDefined();
        receiveEventDataNode?.connectTo(consoleLogBlock.message);

        receiverGraph.start();
        flowGraph.start();

        expect(Logger.Log).toHaveBeenCalledWith(randomValue);
    });

    it("SendCustomEvent serializes and deserializes eventData correctly", () => {
        const eventId = "serializeTest";
        const sendEvent = new FlowGraphSendCustomEventBlock({
            eventId,
            eventData: {
                myNumber: { type: RichTypeNumber, value: 42 },
            },
        });

        const serialized: any = {};
        sendEvent.serialize(serialized);

        // eventData should be stored with typeName strings, not RichType instances
        expect(serialized.config.eventData.myNumber.type).toBe("number");
        expect(serialized.config.eventData.myNumber.value).toBe(42);

        // Reconstruct from serialized config — type is now a string
        const deserialized = new FlowGraphSendCustomEventBlock(serialized.config);
        const input = deserialized.getDataInput("myNumber");
        expect(input).toBeDefined();
        expect(input!.richType.typeName).toBe("number");
    });

    it("ReceiveCustomEvent serializes and deserializes eventData correctly", () => {
        const eventId = "serializeTest";
        const receiveEvent = new FlowGraphReceiveCustomEventBlock({
            eventId,
            eventData: {
                myNumber: { type: RichTypeNumber },
            },
        });

        const serialized: any = {};
        receiveEvent.serialize(serialized);

        expect(serialized.config.eventData.myNumber.type).toBe("number");

        const deserialized = new FlowGraphReceiveCustomEventBlock(serialized.config);
        const output = deserialized.getDataOutput("myNumber");
        expect(output).toBeDefined();
        expect(output!.richType.typeName).toBe("number");
    });

    it("Custom event round-trip preserves String type through full serialize/parse pipeline", () => {
        // Build a graph with Send+Receive custom events using String type
        const eventId = "stringTypeRoundTrip";
        const sendBlock = new FlowGraphSendCustomEventBlock({
            eventId,
            eventData: {
                myString: { type: RichTypeString, value: "hello" },
            },
        });
        const receiveBlock = new FlowGraphReceiveCustomEventBlock({
            eventId,
            eventData: {
                myString: { type: RichTypeString },
            },
        });

        flowGraph.addBlock(sendBlock);
        flowGraph.addBlock(receiveBlock);
        flowGraph.addEventBlock(receiveBlock);

        // Serialize the entire graph (same path as the editor)
        const serializationObject: any = {};
        flowGraph.serialize(serializationObject);

        // Verify the serialized JSON has type "string"
        const sendSerialized = serializationObject.allBlocks.find((b: any) => b.className === "FlowGraphSendCustomEventBlock");
        const recvSerialized = serializationObject.allBlocks.find((b: any) => b.className === "FlowGraphReceiveCustomEventBlock");
        expect(sendSerialized.config.eventData.myString.type).toBe("string");
        expect(recvSerialized.config.eventData.myString.type).toBe("string");

        // Parse the graph from the serialized object (same path as the editor's DeserializeAsync)
        // Build resolvedClasses in the same order as serialized allBlocks
        const resolvedClasses = serializationObject.allBlocks.map((b: any) =>
            b.className === "FlowGraphSendCustomEventBlock" ? FlowGraphSendCustomEventBlock : FlowGraphReceiveCustomEventBlock
        );
        const parsedGraph = ParseFlowGraph(serializationObject, { coordinator: flowGraphCoordinator }, resolvedClasses);

        // Check the parsed blocks have the correct type
        const parsedBlocks = parsedGraph.getAllBlocks();
        const parsedSend = parsedBlocks.find((b) => b.getClassName() === "FlowGraphSendCustomEventBlock") as FlowGraphSendCustomEventBlock;
        const parsedRecv = parsedBlocks.find((b) => b.getClassName() === "FlowGraphReceiveCustomEventBlock") as FlowGraphReceiveCustomEventBlock;

        expect(parsedSend).toBeDefined();
        expect(parsedRecv).toBeDefined();

        const sendInput = parsedSend.getDataInput("myString");
        expect(sendInput).toBeDefined();
        expect(sendInput!.richType.typeName).toBe("string");

        const recvOutput = parsedRecv.getDataOutput("myString");
        expect(recvOutput).toBeDefined();
        expect(recvOutput!.richType.typeName).toBe("string");
    });

    it("Mesh Pick Event Bubbling", () => {
        const graph = flowGraphCoordinator.createGraph();
        const context = graph.createContext();

        // We have three meshes, mesh1 is the parent of mesh2, which is the parent of mesh3
        const mesh1 = new Mesh("mesh1", scene);
        const mesh2 = new Mesh("mesh2", scene);
        mesh2.parent = mesh1;
        const mesh3 = new Mesh("mesh3", scene);
        mesh3.parent = mesh2;

        // Create a mesh pick event on mesh1 and mesh3
        const meshPick1 = new FlowGraphMeshPickEventBlock({ name: "MeshPick1", targetMesh: mesh1 });
        graph.addEventBlock(meshPick1);
        const meshPick3 = new FlowGraphMeshPickEventBlock({ name: "MeshPick3", targetMesh: mesh3 });
        graph.addEventBlock(meshPick3);

        // Create a console log block for each mesh pick
        const meshLog1 = new FlowGraphConsoleLogBlock({ name: "MeshLog1" });
        meshPick1.done.connectTo(meshLog1.in);
        meshLog1.message.setValue("Mesh 1 was picked", context);
        const meshLog3 = new FlowGraphConsoleLogBlock({ name: "MeshLog3" });
        meshPick3.done.connectTo(meshLog3.in);
        meshLog3.message.setValue("Mesh 3 was picked", context);

        // Start the graph
        graph.start();

        // Notify that the mesh3 was picked
        const pickInfo = new PickingInfo();
        pickInfo.hit = true;
        pickInfo.pickedMesh = mesh3;
        const mouseEvent = {} as any;
        const pointerInfo = new PointerInfo(PointerEventTypes.POINTERPICK, mouseEvent, pickInfo);
        scene.onPointerObservable.notifyObservers(pointerInfo);

        // Mesh3 was picked, so we expect the pick to "bubble up" to mesh1
        expect(Logger.Log).toHaveBeenNthCalledWith(1, "Mesh 3 was picked");
        expect(Logger.Log).toHaveBeenNthCalledWith(2, "Mesh 1 was picked");
    });

    it("stops hierarchical mesh pick propagation without affecting ordinary event dispatch", () => {
        const graph = flowGraphCoordinator.createGraph();
        const context = graph.createContext();
        const parent = new Mesh("parent", scene);
        const child = new Mesh("child", scene);
        child.parent = parent;
        const childPick = new FlowGraphMeshPickEventBlock({ targetMesh: child });
        const parentPick = new FlowGraphMeshPickEventBlock({ targetMesh: parent });
        const stop = new FlowGraphStopEventPropagationBlock();
        const parentLog = new FlowGraphConsoleLogBlock();
        stop.event.setValue(GetDefaultEventReference(childPick.eventKey), context);
        parentLog.message.setValue("parent", context);
        childPick.done.connectTo(stop.in);
        parentPick.done.connectTo(parentLog.in);
        graph.addEventBlock(parentPick);
        graph.addEventBlock(childPick);
        graph.start();

        const pickInfo = new PickingInfo();
        pickInfo.hit = true;
        pickInfo.pickedMesh = child;
        scene.onPointerObservable.notifyObservers(new PointerInfo(PointerEventTypes.POINTERPICK, {} as any, pickInfo));

        expect(Logger.Log).not.toHaveBeenCalledWith("parent");
    });

    it("Mesh Pick Event ignores unrelated meshes with duplicate names", () => {
        const graph = flowGraphCoordinator.createGraph();
        const context = graph.createContext();
        const meshA = new Mesh("duplicate", scene);
        const meshB = new Mesh("duplicate", scene);
        const pickA = new FlowGraphMeshPickEventBlock({ targetMesh: meshA });
        const pickB = new FlowGraphMeshPickEventBlock({ targetMesh: meshB });
        const logA = new FlowGraphConsoleLogBlock();
        const logB = new FlowGraphConsoleLogBlock();
        pickA.done.connectTo(logA.in);
        pickB.done.connectTo(logB.in);
        logA.message.setValue("A", context);
        logB.message.setValue("B", context);
        graph.addEventBlock(pickA);
        graph.addEventBlock(pickB);
        graph.start();

        const pickInfo = new PickingInfo();
        pickInfo.hit = true;
        pickInfo.pickedMesh = meshA;
        scene.onPointerObservable.notifyObservers(new PointerInfo(PointerEventTypes.POINTERPICK, {} as any, pickInfo));

        expect(Logger.Log).toHaveBeenCalledWith("A");
        expect(Logger.Log).not.toHaveBeenCalledWith("B");
    });

    it("Event blocks fire both done and out signals", () => {
        const graph = flowGraphCoordinator.createGraph();
        const context = graph.createContext();

        const sceneReady = new FlowGraphSceneReadyEventBlock();
        graph.addEventBlock(sceneReady);

        // Connect one log to 'done' and another to 'out'
        const doneLog = new FlowGraphConsoleLogBlock({ name: "doneLog" });
        sceneReady.done.connectTo(doneLog.in);
        doneLog.message.setValue("done fired", context);

        const outLog = new FlowGraphConsoleLogBlock({ name: "outLog" });
        sceneReady.out.connectTo(outLog.in);
        outLog.message.setValue("out fired", context);

        graph.start();

        expect(Logger.Log).toHaveBeenCalledWith("done fired");
        expect(Logger.Log).toHaveBeenCalledWith("out fired");
    });

    it("Event blocks do not fire out signal at graph start (only when event triggers)", () => {
        const graph = flowGraphCoordinator.createGraph();
        const context = graph.createContext();

        // Use SceneTickEvent which fires on every render frame
        const tick = new FlowGraphSceneTickEventBlock();
        graph.addEventBlock(tick);

        const outLog = new FlowGraphConsoleLogBlock({ name: "outLog" });
        tick.out.connectTo(outLog.in);
        outLog.message.setValue("out fired", context);

        // Start the graph — _startPendingTasks should NOT fire out
        graph.start();

        // Before any render frame, out should not have fired
        // (The base FlowGraphAsyncExecutionBlock._startPendingTasks WOULD fire out,
        // but the event block override should suppress it)
        expect(Logger.Log).not.toHaveBeenCalledWith("out fired");
    });

    it("Event block fires both out and done signals after round-trip", async () => {
        const mockContext: any = {};
        const pathConverter = new FlowGraphPathConverter(mockContext);

        const graph = flowGraphCoordinator.createGraph();
        const context = graph.createContext();

        const mesh = new Mesh("testMesh", scene);
        const meshPick = new FlowGraphMeshPickEventBlock({ targetMesh: mesh });
        graph.addEventBlock(meshPick);

        // Connect to done
        const doneLog = new FlowGraphConsoleLogBlock({ name: "doneLog" });
        meshPick.done.connectTo(doneLog.in);
        doneLog.message.setValue("done fired", context);

        // Connect to out
        const outLog = new FlowGraphConsoleLogBlock({ name: "outLog" });
        meshPick.out.connectTo(outLog.in);
        outLog.message.setValue("out fired", context);

        // Serialize
        const serialized: any = {};
        graph.serialize(serialized);

        // Parse into a new graph
        const coordinator2 = new FlowGraphCoordinator({ scene });
        const parsed = await ParseFlowGraphAsync(serialized, { coordinator: coordinator2, pathConverter });

        parsed.start();

        // Simulate a mesh pick
        const pickInfo = new PickingInfo();
        pickInfo.hit = true;
        pickInfo.pickedMesh = mesh;
        const mouseEvent = {} as any;
        const pointerInfo = new PointerInfo(PointerEventTypes.POINTERPICK, mouseEvent, pickInfo);
        scene.onPointerObservable.notifyObservers(pointerInfo);

        expect(Logger.Log).toHaveBeenCalledWith("done fired");
        expect(Logger.Log).toHaveBeenCalledWith("out fired");
    });
});
