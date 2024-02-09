import { Scene } from "core/scene";
import { canvas, engine } from "./engine";
import { SceneLoader } from "core/Loading/sceneLoader";
import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { AdvancedDynamicTexture } from "gui/2D/advancedDynamicTexture";
import { Button } from "gui/2D/controls/button";
import { Vector3 } from "core/Maths/math.vector";
import { Color3 } from "core/Maths/math.color";
import { HemisphericLight } from "core/Lights/hemisphericLight";
import "core/Loading/loadingScreen";

import "loaders/glTF/2.0";

export const createScene = async function () {
    const scene = new Scene(engine);
    const camera = new ArcRotateCamera("camera1", Math.PI / 2, Math.PI / 4, 3, new Vector3(0, 1, 0), scene);
    camera.attachControl(canvas, true);

    const light = new HemisphericLight("light1", new Vector3(0, 1, 0), scene);
    light.intensity = 0.6;
    light.specular = Color3.Black();

    // The first parameter can be used to specify which mesh to import. Here we import all meshes
    SceneLoader.AppendAsync("https://assets.babylonjs.com/meshes/webp/", "webp.gltf", scene, function (_newMeshes) {
        scene.activeCamera!.attachControl(canvas, false);
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

    // InjectGUIEditor(GUIEditor);
    // Inspector.Show(scene, {});

    return scene;
};
