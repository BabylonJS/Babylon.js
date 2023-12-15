/* eslint-disable no-console */
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
    if (e.keyCode === 85 && e.shiftKey && (e.ctrlKey || e.metaKey) && scene) {
        scene.debugLayer.show();
    }
};
const runScene = async () => {
    try {
        // eslint-disable-next-line no-undef
        await Recast();
    } catch (e) {}
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

    window.addEventListener("resize", resize);
    window.addEventListener("hashchange", runScene);
    window.addEventListener("keydown", openInspector);
    scene.onDisposeObservable.add(() => {
        window.removeEventListener("resize", resize);
        window.removeEventListener("hashchange", runScene);
        window.removeEventListener("keydown", openInspector);
    });

    const runInVisualizationTestMode = (typeof process !== "undefined" && process.env.VIS_TEST_MODE === "true") || false;
    if (runInVisualizationTestMode) {
        let renderCount = 1;
        scene.useConstantAnimationDeltaTime = true;

        scene.executeWhenReady(function () {
            if (!scene || !engine) {
                return;
            }
            if (scene.activeCamera && scene.activeCamera.useAutoRotationBehavior) {
                scene.activeCamera.useAutoRotationBehavior = false;
            }
            engine.runRenderLoop(function () {
                try {
                    if (renderCount === 0) {
                        engine && engine.stopRenderLoop();
                    } else {
                        scene && scene.render();
                        renderCount--;
                    }
                } catch (e) {
                    engine && engine.stopRenderLoop();
                    console.error(e);
                    return;
                }
            });
        }, true);
    } else {
        // Register a render loop to repeatedly render the scene
        engine.runRenderLoop(function () {
            if (scene.activeCamera || (scene.activeCameras && scene.activeCameras.length > 0)) {
                scene.render();
            }
        });
    }

    // Register a render loop to repeatedly render the scene
};

runScene();

console.log("Open the inspector using Ctrl+Shift+U (or Command+Shift+U on Mac)");
