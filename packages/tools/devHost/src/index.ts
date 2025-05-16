import type { Scene } from "core/scene";

import { createScene as createSceneTS } from "./createScene";
// import { createScene as createSceneJS } from "./createSceneJS.js";
import { EngineInstance } from "./engine";

const CreateScene = createSceneTS;

let SceneInstance: Scene;

// avoid await on main level
const CreateSceneResult = CreateScene();
if (CreateSceneResult instanceof Promise) {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises, github/no-then
    CreateSceneResult.then(function (result) {
        SceneInstance = result;
    });
} else {
    SceneInstance = CreateSceneResult;
}

// Register a render loop to repeatedly render the scene
EngineInstance.runRenderLoop(function () {
    SceneInstance && SceneInstance.render();
});

// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
    EngineInstance && EngineInstance.resize();
});
