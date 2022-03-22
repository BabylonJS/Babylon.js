import type { Scene } from "@dev/core";
import { Engine } from "@dev/core"; // can also be @lts/core
import { createScene as createSceneTS } from "./createScene";
import { createScene as createSceneJS } from "./createSceneJS.js";

const useJavascript = false;

const createScene = useJavascript ? createSceneJS : createSceneTS;

export const canvas = document.getElementById("babylon-canvas"); // Get the canvas element
export const engine = new Engine(canvas, true); // Generate the BABYLON 3D engine

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
