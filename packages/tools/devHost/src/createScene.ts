/* eslint-disable-next-line import/no-internal-modules */
import { canvas, engine } from "./index";
import "@dev/loaders";
import "@tools/node-editor";
import "@tools/node-geometry-editor";
import * as GUIEditor from "@tools/gui-editor";
import { Inspector, InjectGUIEditor } from "@dev/inspector";
import type { ArcRotateCamera } from "@dev/core";
import { CubeTexture, Scene, SceneLoader } from "@dev/core";
import { AdvancedDynamicTexture, Button } from "@dev/gui";

export const createScene = async function () {
    const scene = new Scene(engine);
    scene.createDefaultCameraOrLight(true);
    const hdrTexture = new CubeTexture("https://playground.babylonjs.com/textures/SpecularHDR.dds", scene);
    scene.createDefaultSkybox(hdrTexture, true, 10000);

    // The first parameter can be used to specify which mesh to import. Here we import all meshes
    SceneLoader.AppendAsync("https://assets.babylonjs.com/meshes/webp/", "webp.gltf", scene, function (_newMeshes) {
        scene.activeCamera!.attachControl(canvas, false);
        // scene.activeCamera!.alpha += Math.PI; // camera +180°
        (scene.activeCamera as ArcRotateCamera).radius = 80;
    });

    const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");

    const button1 = Button.CreateSimpleButton("but1", "Click Me");
    button1.width = "150px";
    button1.height = "40px";
    button1.color = "white";
    button1.cornerRadius = 20;
    button1.background = "green";
    button1.onPointerUpObservable.add(function () {
        // eslint-disable-next-line no-console
        console.log("you did it!");
    });
    advancedTexture.addControl(button1);
    InjectGUIEditor(GUIEditor);
    Inspector.Show(scene, {});

    return scene;
};
