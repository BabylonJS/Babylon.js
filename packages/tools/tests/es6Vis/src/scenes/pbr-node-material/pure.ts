/**
 * pbr-node-material - pure import style.
 */
import {
    Engine,
    Scene,
    ArcRotateCamera,
    HemisphericLight,
    CreateGround,
    CreateSphere,
    CreateBox,
    CreateCylinder,
    PBRMaterial,
    Color3,
    Color4,
    Vector3,
    CubeTextureCreateFromPrefilteredData,
    NodeMaterialCreateDefault,
    RegisterAbstractEngineCubeTexture,
    RegisterEnginePrefilteredCubeTexture,
    RegisterEnginesExtensionsEngineCubeTexture,
    RegisterSceneHelpers,
    RegisterStandardEngineExtensions,
} from "@babylonjs/core/pure";
import "@babylonjs/core/Helpers/sceneHelpers.types";

RegisterStandardEngineExtensions();
RegisterAbstractEngineCubeTexture();
RegisterEnginesExtensionsEngineCubeTexture();
RegisterEnginePrefilteredCubeTexture();
RegisterSceneHelpers();

export function run(canvas: HTMLCanvasElement): void {
    const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.02, 0.02, 0.05, 1);

    const camera = new ArcRotateCamera("camera", -Math.PI / 4, Math.PI / 3, 10, Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 4;
    camera.upperRadiusLimit = 20;

    const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
    hemi.intensity = 0.4;

    const envTex = CubeTextureCreateFromPrefilteredData("https://assets.babylonjs.com/environments/environmentSpecular.env", scene);
    scene.environmentTexture = envTex;
    scene.createDefaultSkybox(envTex, true, 1000);

    const ground = CreateGround("ground", { width: 10, height: 10 }, scene);
    const groundMat = new PBRMaterial("groundMat", scene);
    groundMat.albedoColor = new Color3(0.1, 0.1, 0.12);
    groundMat.metallic = 0.05;
    groundMat.roughness = 0.95;
    ground.material = groundMat;

    const sphere = CreateSphere("sphere", { diameter: 2, segments: 32 }, scene);
    sphere.position.y = 1.5;
    const sphereMat = new PBRMaterial("sphereMat", scene);
    sphereMat.albedoColor = new Color3(0.9, 0.9, 0.95);
    sphereMat.metallic = 1.0;
    sphereMat.roughness = 0.05;
    sphere.material = sphereMat;

    const box = CreateBox("box", { size: 1.5 }, scene);
    box.position = new Vector3(-3, 0.75, 0);
    const nodeMat = NodeMaterialCreateDefault("nodeMat", scene);
    box.material = nodeMat;

    const cyl = CreateCylinder("cyl", { diameter: 1, height: 2.5 }, scene);
    cyl.position = new Vector3(3, 1.25, 0);
    const cylMat = new PBRMaterial("cylMat", scene);
    cylMat.albedoColor = new Color3(0.8, 0.2, 0.1);
    cylMat.metallic = 0.7;
    cylMat.roughness = 0.2;
    cyl.material = cylMat;

    engine.runRenderLoop(() => {
        scene.render();
    });
    scene.executeWhenReady(() => {
        (window as any).__ready = true;
    });
}
