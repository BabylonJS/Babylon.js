// eslint-disable-next-line import/no-internal-modules
import type { ArcRotateCamera } from "core/index";

import { Engine } from "core/Engines/engine";
import { LoadAssetContainerAsync } from "core/Loading/sceneLoader";
import { Scene } from "core/scene";
import { registerBuiltInLoaders } from "loaders/dynamic";

import { ShowInspector } from "../../src/inspector";

import "core/Helpers/sceneHelpers";

// Register scene loader plugins.
registerBuiltInLoaders();

const canvas = document.getElementById("canvas") as HTMLCanvasElement;

const engine = new Engine(canvas, true, {
    adaptToDeviceRatio: true,
    antialias: true,
});

const scene = new Scene(engine);

(async () => {
    const assetContainer = await LoadAssetContainerAsync("https://assets.babylonjs.com/meshes/alien.glb", scene);
    assetContainer.addAllToScene();
    scene.createDefaultCameraOrLight(true, true, true);
    const camera = scene.activeCamera as ArcRotateCamera;
    camera.alpha = Math.PI / 2;

    engine.runRenderLoop(() => {
        scene.render();
    });
})();

ShowInspector(scene);
