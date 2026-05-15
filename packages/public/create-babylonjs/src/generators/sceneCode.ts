import type { ProjectOptions } from "../index";

const GLTF_MODEL_URL = "https://assets.babylonjs.com/meshes/boombox.glb";

// ES6 scene code — tree-shakeable imports
function es6Scene(language: "ts" | "js"): string {
    const canvasCast = language === "ts" ? " as HTMLCanvasElement" : "";
    const arcCamImport = language === "ts" ? '\nimport { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";' : "";
    const alphaCast = language === "ts" ? "(scene.activeCamera as ArcRotateCamera)" : "scene.activeCamera";
    return `import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { AppendSceneAsync } from "@babylonjs/core/Loading/sceneLoader";${arcCamImport}

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

    // Load a glTF model
    await AppendSceneAsync("${GLTF_MODEL_URL}", scene);

    // Create a default camera that frames the loaded model
    scene.createDefaultCamera(true, true, true);
    // Rotate the camera to face the front of the model
    ${alphaCast}.alpha += Math.PI;

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

    // Load a glTF model
    await BABYLON.AppendSceneAsync("${GLTF_MODEL_URL}", scene);

    // Create a default camera that frames the loaded model
    scene.createDefaultCamera(true, true, true);
    // Rotate the camera to face the front of the model
    (scene.activeCamera as BABYLON.ArcRotateCamera).alpha += Math.PI;

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

    // Load a glTF model
    await BABYLON.AppendSceneAsync("${GLTF_MODEL_URL}", scene);

    // Create a default camera that frames the loaded model
    scene.createDefaultCamera(true, true, true);
    // Rotate the camera to face the front of the model
    scene.activeCamera.alpha += Math.PI;

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
