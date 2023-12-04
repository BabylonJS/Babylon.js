import { PickingInfo } from "core/Collisions";
import type { Engine } from "core/Engines";
import { NullEngine } from "core/Engines";
import { PointerEventTypes, PointerInfo } from "core/Events";
import type { FlowGraph, FlowGraphContext } from "core/FlowGraph";
import {
    FlowGraphCoordinator,
    FlowGraphLogBlock,
    FlowGraphMeshPickEventBlock,
    FlowGraphPath,
    FlowGraphReceiveCustomEventBlock,
    FlowGraphSceneReadyEventBlock,
    FlowGraphSendCustomEventBlock,
} from "core/FlowGraph";
import { Mesh } from "core/Meshes";
import { Scene } from "core/scene";

describe("Flow Graph Event Nodes", () => {
    let engine: Engine;
    let scene: Scene;
    let flowGraphCoordinator: FlowGraphCoordinator;
    let flowGraph: FlowGraph;
    let flowGraphContext: FlowGraphContext;

    beforeEach(() => {
        console.log = jest.fn();
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });

        scene = new Scene(engine);
        flowGraphCoordinator = new FlowGraphCoordinator({ scene });
        flowGraph = flowGraphCoordinator.createGraph();
        flowGraphContext = flowGraph.createContext();
    });

    it("Custom Event Block", () => {
        const receiverGraph = flowGraphCoordinator.createGraph();

        const sceneReady = new FlowGraphSceneReadyEventBlock({ name: "SceneReady" });
        flowGraph.addEventBlock(sceneReady);

        const sendEvent = new FlowGraphSendCustomEventBlock({ name: "SendEvent" });
        sendEvent.eventId.setValue("testEvent", flowGraphContext);
        sendEvent.eventData.setValue(42, flowGraphContext);
        sceneReady.onDone.connectTo(sendEvent.onStart);

        const receiveEvent = new FlowGraphReceiveCustomEventBlock({ eventId: "testEvent", name: "ReceiveEvent" });
        receiverGraph.addEventBlock(receiveEvent);

        const runCustomFunction = new FlowGraphLogBlock({ name: "Log" });
        receiveEvent.onDone.connectTo(runCustomFunction.onStart);
        receiveEvent.eventData.connectTo(runCustomFunction.message);

        flowGraph.start();
        receiverGraph.start();

        // This will activate the sendEvent block and send the event to the receiverGraph
        scene.onReadyObservable.notifyObservers(scene);

        expect(console.log).toHaveBeenCalledWith(42);
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

        // Create a mesh pick event on mesh1 and mesh3
        const meshPick1 = new FlowGraphMeshPickEventBlock({ name: "MeshPick1", path: new FlowGraphPath("/meshes/0") });
        graph.addEventBlock(meshPick1);
        const meshPick3 = new FlowGraphMeshPickEventBlock({ name: "MeshPick3", path: new FlowGraphPath("/meshes/2") });
        graph.addEventBlock(meshPick3);

        // Create a console log block for each mesh pick
        const meshLog1 = new FlowGraphLogBlock({ name: "MeshLog1" });
        meshPick1.onDone.connectTo(meshLog1.onStart);
        meshLog1.message.setValue("Mesh 1 was picked", context);
        const meshLog3 = new FlowGraphLogBlock({ name: "MeshLog3" });
        meshPick3.onDone.connectTo(meshLog3.onStart);
        meshLog3.message.setValue("Mesh 3 was picked", context);

        // Start the graph
        graph.start();

        // Notify that the mesh3 was picked
        const pickInfo = new PickingInfo();
        pickInfo.hit = true;
        pickInfo.pickedMesh = mesh3;
        // const mouseEvent = jest.mock("core/Events/") as any;
        const mouseEvent = {} as any;
        const pointerInfo = new PointerInfo(PointerEventTypes.POINTERPICK, mouseEvent, pickInfo);
        scene.onPointerObservable.notifyObservers(pointerInfo);

        // Mesh3 was picked, so we expect the pick to "bubble up" to mesh1
        expect(console.log).toHaveBeenNthCalledWith(1, "Mesh 3 was picked");
        expect(console.log).toHaveBeenNthCalledWith(2, "Mesh 1 was picked");
    });
});
