import type { ProjectOptions } from "../index";

// ES6 scene code — tree-shakeable imports
function es6Scene(language: "ts" | "js"): string {
    const canvasCast = language === "ts" ? " as HTMLCanvasElement" : "";
    const arcCamImport = language === "ts" ? '\nimport { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";' : "";
    const cameraCast = language === "ts" ? " as ArcRotateCamera" : "";
    return `import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { AppendSceneAsync } from "@babylonjs/core/Loading/sceneLoader";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";${arcCamImport}
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

// Side-effect imports: these register plugins and augment prototypes at load time
import "@babylonjs/core/Loading/loadingScreen";
import "@babylonjs/core/Helpers/sceneHelpers";
import "@babylonjs/core/Materials/standardMaterial";
import "@babylonjs/core/Materials/PBR/pbrMaterial";
import "@babylonjs/core/Materials/Textures/Loaders/envTextureLoader";
import "@babylonjs/loaders/glTF";

const canvas = document.getElementById("renderCanvas")${canvasCast};
const engine = new Engine(canvas, true);

    const createScene = async () => {
        const scene = new Scene(engine);

        try {
            // Load a glTF model
            await AppendSceneAsync("https://assets.babylonjs.com/meshes/boombox.glb", scene);

            // Create a default camera, and event caught by the controls will call preventdefault(),
            // such as wheel event
            scene.createDefaultCamera(true, true, true);
            // Rotate the camera to face the front of the model
            (scene.activeCamera${cameraCast}).alpha += Math.PI;
        } catch {
            // Fallback: when loading fails
            // Create a default box mesh
            CreateBox("box", {}, scene);

            scene.createDefaultCamera(true, true, true);
            const camera = scene.activeCamera${cameraCast};
            camera.setPosition(new Vector3(3, 3, 3));
            camera.setTarget(new Vector3(0, 0, 0));
        }

        // Create a default light for the scene
        scene.createDefaultLight(true);

        // Create a default environment (skybox + ground + environment lighting)
        scene.createDefaultEnvironment({
            createGround: true,
            createSkybox: true,
        });

        return scene;
    };

createScene().then((scene) => {
    engine.runRenderLoop(() => {
        scene.render();
    });
});

window.addEventListener("resize", () => {
    engine.resize();
});
`;
}

// UMD scene code — global BABYLON namespace
function umdScene(language: "ts" | "js"): string {
    if (language === "ts") {
        return `import * as BABYLON from "babylonjs";
import "babylonjs-loaders";

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
const engine = new BABYLON.Engine(canvas, true);

const createScene = async (): Promise<BABYLON.Scene> => {
    const scene = new BABYLON.Scene(engine);

    try {
        // Load a glTF model
        await BABYLON.AppendSceneAsync("https://assets.babylonjs.com/meshes/boombox.glb", scene);

        // Create a default camera, and event caught by the controls will call preventdefault(),
        // such as wheel event
        scene.createDefaultCamera(true, true, true);
        // Rotate the camera to face the front of the model
        (scene.activeCamera as BABYLON.ArcRotateCamera).alpha += Math.PI;
    } catch {
        // Fallback: when loading fails
        // Create a default box mesh
        BABYLON.CreateBox("box", {}, scene);

        scene.createDefaultCamera(true, true, true);
        const camera = scene.activeCamera as BABYLON.ArcRotateCamera;
        camera.setPosition(new BABYLON.Vector3(3, 3, 3));
        camera.setTarget(new BABYLON.Vector3(0, 0, 0));
    }

    // Create a default light for the scene
    scene.createDefaultLight(true);

    // Create a default environment (skybox + ground + environment lighting)
    scene.createDefaultEnvironment({
        createGround: true,
        createSkybox: true,
    });

    return scene;
};

createScene().then((scene) => {
    engine.runRenderLoop(() => {
        scene.render();
    });
});

window.addEventListener("resize", () => {
    engine.resize();
});
`;
    }

    // UMD + JS — imports needed because this file is always bundled
    // (CDN-only projects inline the scene code directly in index.html)
    return `import * as BABYLON from "babylonjs";
import "babylonjs-loaders";

const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

const createScene = async () => {
    const scene = new BABYLON.Scene(engine);

    try {
        // Load a glTF model
        await BABYLON.AppendSceneAsync("https://assets.babylonjs.com/meshes/boombox.glb", scene);

        // Create a default camera, and event caught by the controls will call preventdefault(),
        // such as wheel event
        scene.createDefaultCamera(true, true, true);
        // Rotate the camera to face the front of the model
        scene.activeCamera.alpha += Math.PI;
    } catch {
        // Fallback: when loading fails
        // Create a default box mesh
        BABYLON.CreateBox("box", {}, scene);

        scene.createDefaultCamera(true, true, true);
        const camera = scene.activeCamera;
        camera.setPosition(new BABYLON.Vector3(3, 3, 3));
        camera.setTarget(new BABYLON.Vector3(0, 0, 0));
    }

    // Create a default light for the scene
    scene.createDefaultLight(true);

    // Create a default environment (skybox + ground + environment lighting)
    scene.createDefaultEnvironment({
        createGround: true,
        createSkybox: true,
    });

    return scene;
};

createScene().then((scene) => {
    engine.runRenderLoop(() => {
        scene.render();
    });
});

window.addEventListener("resize", () => {
    engine.resize();
});
`;
}

export function generateSceneCode(options: ProjectOptions): string {
    const { moduleFormat, language } = options;
    if (moduleFormat === "es6") {
        return es6Scene(language);
    }
    return umdScene(language);
}
