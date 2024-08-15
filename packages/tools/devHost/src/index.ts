import type { Scene } from "core/scene";

import { createScene as createSceneTS } from "./createScene";
// import { createScene as createSceneJS } from "./createSceneJS.js";
import { engine } from "./engine";

const createScene = createSceneTS;

let scene: Scene;

// avoid await on main level
const createSceneResult = createScene();
if (createSceneResult instanceof Promise) {
    createSceneResult.then(function (result) {
        scene = result;
    });
} else {
    scene = createSceneResult;
}

// Register a render loop to repeatedly render the scene
engine.runRenderLoop(function () {
    scene && scene.render();
});

// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
    engine && engine.resize();
});
