/**
 * animated-character — pure import style.
 */
import {
    Engine,
    Scene,
    ArcRotateCamera,
    HemisphericLight,
    DirectionalLight,
    CreateGround,
    PBRMaterial,
    Color3,
    Color4,
    Vector3,
    SceneLoader,
    RegisterStandardEngineExtensions,
    RegisterEnginesExtensionsEngineRawTexture,
} from "@babylonjs/core/pure";
import "@babylonjs/loaders/glTF";

RegisterStandardEngineExtensions();
RegisterEnginesExtensionsEngineRawTexture();

const MODEL_URL = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Fox/glTF-Binary/Fox.glb";

export async function run(canvas: HTMLCanvasElement): Promise<void> {
    const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.4, 0.6, 0.8, 1);

    const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 4, 150, new Vector3(0, 30, 0), scene);
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 50;
    camera.upperRadiusLimit = 300;

    const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
    hemi.intensity = 0.5;

    const dir = new DirectionalLight("dir", new Vector3(-1, -3, -1), scene);
    dir.intensity = 0.8;
    dir.position = new Vector3(50, 100, 50);

    const ground = CreateGround("ground", { width: 200, height: 200 }, scene);
    const groundMat = new PBRMaterial("groundMat", scene);
    groundMat.albedoColor = new Color3(0.3, 0.5, 0.2);
    groundMat.metallic = 0.0;
    groundMat.roughness = 0.95;
    ground.material = groundMat;

    const result = await SceneLoader.ImportMeshAsync("", MODEL_URL, undefined, scene);
    result.meshes[0].position = Vector3.Zero();
    result.animationGroups.forEach((ag) => ag.stop());
    if (result.skeletons.length > 0) {
        result.skeletons[0].returnToRest();
    }

    engine.runRenderLoop(() => {
        scene.render();
    });
    scene.executeWhenReady(() => {
        (window as any).__ready = true;
    });
}
