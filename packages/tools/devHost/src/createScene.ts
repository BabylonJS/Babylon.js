/* eslint-disable-next-line import/no-internal-modules */
import { engine } from "./index";
import "@dev/loaders";
import "@tools/node-editor";
import * as GUIEditor from "@tools/gui-editor";
import { Inspector, InjectGUIEditor } from "@dev/inspector";
import { AddOneBlock, FlowGraph, ForLoopExecutionBlock, LogBlock, MeshBuilder, MeshPickEventBlock, MeshPickEventGenerator, Scene, StandardMaterial } from "@dev/core";

export const createScene = async function () {
    const scene = new Scene(engine);

    const box = MeshBuilder.CreateBox("box", { size: 2 }, scene);
    box.material = new StandardMaterial("boxMat", scene);

    const meshPickEventGenerator = new MeshPickEventGenerator(scene);
    meshPickEventGenerator.start();

    const flowGraph = new FlowGraph();

    const eventBlock = new MeshPickEventBlock(flowGraph, box, meshPickEventGenerator);
    eventBlock.init();

    const forBlock = new ForLoopExecutionBlock(flowGraph);
    forBlock.endIndex.value = 10;
    eventBlock.onTriggered.connectTo(forBlock.onStart);

    const logBlock = new LogBlock(flowGraph);
    forBlock.onLoop.connectTo(logBlock.onStart);

    const addOneBlock = new AddOneBlock(flowGraph);
    forBlock.index.connectTo(addOneBlock.input);
    addOneBlock.output.connectTo(logBlock.message);

    flowGraph.start();

    scene.createDefaultCameraOrLight(true, true, true);
    
    InjectGUIEditor(GUIEditor);
    Inspector.Show(scene, {});

    return scene;
};
