import { PickingInfo } from "core/Collisions";
import type { Engine } from "core/Engines";
import { NullEngine } from "core/Engines";
import { PointerEventTypes, PointerInfo } from "core/Events";
import type { FlowGraph, FlowGraphContext } from "core/FlowGraph";
import {
    FlowGraphCoordinator,
    FlowGraphConsoleLogBlock,
    FlowGraphMeshPickEventBlock,
    FlowGraphReceiveCustomEventBlock,
    FlowGraphSceneReadyEventBlock,
    FlowGraphSendCustomEventBlock,
} from "core/FlowGraph";
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
        Logger.Log = jest.fn();

        scene = new Scene(engine);
        flowGraphCoordinator = new FlowGraphCoordinator({ scene });
        flowGraph = flowGraphCoordinator.createGraph();
        flowGraphContext = flowGraph.createContext();
    });

    it("Custom Event Block", () => {
        const receiverGraph = flowGraphCoordinator.createGraph();

        const sceneReady = new FlowGraphSceneReadyEventBlock({ name: "SceneReady" });
        flowGraph.addEventBlock(sceneReady);

        const sendEvent = new FlowGraphSendCustomEventBlock({ eventId: "testEvent", eventData: ["testData"] });
        const sendEventDataNode = sendEvent.getDataInput("testData");
        expect(sendEventDataNode).toBeDefined();
        sendEventDataNode?.setValue(42, flowGraphContext);
        sceneReady.out.connectTo(sendEvent.in);

        const receiveEvent = new FlowGraphReceiveCustomEventBlock({ eventId: "testEvent", eventData: ["testData"] });
        receiverGraph.addEventBlock(receiveEvent);

        const consoleLogBlock = new FlowGraphConsoleLogBlock({ name: "Log" });
        receiveEvent.out.connectTo(consoleLogBlock.in);
        const receiveEventDataNode = receiveEvent.getDataOutput("testData");
        expect(receiveEventDataNode).toBeDefined();
        receiveEventDataNode?.connectTo(consoleLogBlock.message);

        flowGraph.start();
        receiverGraph.start();

        // This will activate the sendEvent block and send the event to the receiverGraph
        scene.onReadyObservable.notifyObservers(scene);

        expect(Logger.Log).toHaveBeenCalledWith(42);
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

        context.setVariable("meshes", [mesh1, mesh2, mesh3]);

        const pathConverter = new FlowGraphPathConverter(context, "/");

        // Create a mesh pick event on mesh1 and mesh3
        const meshPick1 = new FlowGraphMeshPickEventBlock({ name: "MeshPick1", path: "meshes/0/", pathConverter });
        graph.addEventBlock(meshPick1);
        const meshPick3 = new FlowGraphMeshPickEventBlock({ name: "MeshPick3", path: "meshes/2/", pathConverter });
        graph.addEventBlock(meshPick3);

        // Create a console log block for each mesh pick
        const meshLog1 = new FlowGraphConsoleLogBlock({ name: "MeshLog1" });
        meshPick1.out.connectTo(meshLog1.in);
        meshLog1.message.setValue("Mesh 1 was picked", context);
        const meshLog3 = new FlowGraphConsoleLogBlock({ name: "MeshLog3" });
        meshPick3.out.connectTo(meshLog3.in);
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
});
