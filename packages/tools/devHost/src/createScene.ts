/* eslint-disable-next-line import/no-internal-modules */
import { engine } from "./index";
import "@dev/loaders";
import "@tools/node-editor";
import * as GUIEditor from "@tools/gui-editor";
import { Inspector, InjectGUIEditor } from "@dev/inspector";
import { FlowGraph, FlowGraphForLoopBlock, FlowGraphLogBlock, MeshBuilder, FlowGraphMeshPickEventBlock, Scene, StandardMaterial, FlowGraphAddNumberBlock } from "@dev/core";

export const createScene = async function () {
    const scene = new Scene(engine);

    const box = MeshBuilder.CreateBox("box", { size: 2 }, scene);
    box.material = new StandardMaterial("boxMat", scene);

    const flowGraph = new FlowGraph();

    const eventBlock = new FlowGraphMeshPickEventBlock(flowGraph, box);
    eventBlock.init();

    const forBlock = new FlowGraphForLoopBlock(flowGraph);
    forBlock.endIndex.value = 10;
    eventBlock.onTriggered.connectTo(forBlock.onStart);

    const logBlock = new FlowGraphLogBlock(flowGraph);
    forBlock.onLoop.connectTo(logBlock.onStart);

    const addOneBlock = new FlowGraphAddNumberBlock(flowGraph);
    forBlock.index.connectTo(addOneBlock.left);
    addOneBlock.right.value = 1;
    addOneBlock.output.connectTo(logBlock.message);

    flowGraph.start();

    scene.createDefaultCameraOrLight(true, true, true);
    
    InjectGUIEditor(GUIEditor);
    Inspector.Show(scene, {});

    return scene;
};
