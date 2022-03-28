import { loadPlayground, getPlaygroundId } from "./playground";
const canvas = document.getElementById("babylon-canvas"); // Get the canvas element
import { createScene } from "./createScene";
import { createEngine } from "./createEngine";

let engine;
let scene;
const resize = () => {
    engine && engine.resize();
};
const openInspector = (e) => {
    console.log(e);
    if (e.keyCode === 85 && e.shiftKey && (e.ctrlKey || e.metaKey) && scene) {
        scene.debugLayer.show();
    }
};
const runScene = async () => {
    const playgroundId = getPlaygroundId();
    if (engine) {
        engine.dispose();
        engine = undefined;
    }
    engine = createEngine(); // Generate the BABYLON 3D engine
    if (playgroundId) {
        window.engine = engine;
        window.canvas = canvas;
        scene = await loadPlayground(playgroundId);
    } else {
        const createdScene = createScene(engine, canvas); //Call the createScene function
        if (createdScene.then) {
            scene = await createdScene;
        } else {
            scene = createdScene;
        }
    }

    // Register a render loop to repeatedly render the scene
    engine.runRenderLoop(function () {
        if (scene.activeCamera || (scene.activeCameras && scene.activeCameras.length > 0)) {
            scene.render();
        }
    });

    // Watch for browser/canvas resize events
};

runScene();

window.addEventListener("resize", resize);
window.addEventListener("hashchange", runScene);
window.addEventListener("keydown", openInspector);

console.log("Open the inspector using Ctrl+Shift+U (or Command+Shift+U on Mac)");
