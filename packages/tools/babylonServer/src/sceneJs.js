/* eslint-disable no-console */
import { LoadPlaygroundAsync, GetPlaygroundId } from "./playground";
const canvas = document.getElementById("babylon-canvas"); // Get the canvas element
import { createScene } from "./createScene";
import { createEngine } from "./createEngine";

let engine;
let scene;
// Track whether current engine is WebGPU so we can detect context-type switches.
// null means no engine has been created yet.
let wasWebGPU = null;
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
    const playgroundId = GetPlaygroundId();
    if (engine) {
        engine.dispose();
        engine = undefined;
    }
    if (playgroundId) {
        // Expose canvas as a global before loading the snippet so that
        // legacy code referencing the bare `canvas` identifier can find it
        // during module evaluation (ESM blob).
        window.canvas = canvas;
        const snippet = await LoadPlaygroundAsync(playgroundId);
        // The snippet provides createEngine and createScene.
        engine = await snippet.createEngine(canvas);
        const nowWebGPU = !!engine.isWebGPU;
        // A canvas context (WebGL ↔ WebGPU) can't be switched once created.
        // Reload the page so a fresh canvas is used.
        if (wasWebGPU !== null && wasWebGPU !== nowWebGPU) {
            location.reload();
            return;
        }
        wasWebGPU = nowWebGPU;
        // Expose engine as a global for legacy snippet compatibility.
        window.engine = engine;
        // Initialize runtime globals (Havok, Recast, Ammo) that the
        // snippet code references. This only calls factory functions that
        // are already on window — the <script> tags in index.html are
        // responsible for loading them.
        await snippet.initializeRuntimeAsync({ loadScripts: true });
        scene = await snippet.createScene(engine, canvas);
    } else {
        const createdEngine = createEngine(); // Generate the BABYLON 3D engine
        if (createdEngine.then) {
            engine = await createdEngine;
        } else {
            engine = createdEngine;
        }
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
            scene.render();
        });
    }

    // Register a render loop to repeatedly render the scene
};

runScene();

console.log("Open the inspector using Ctrl+Shift+U (or Command+Shift+U on Mac)");
