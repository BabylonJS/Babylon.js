/**
 * textured-ground — pure import style.
 */
import {
    Engine,
    Scene,
    ArcRotateCamera,
    DirectionalLight,
    HemisphericLight,
    PBRMaterial,
    Color3,
    Color4,
    Vector3,
    ShadowGenerator,
    NoiseProceduralTexture,
    CreateBox,
    CreateCylinder,
    CreateGround,
    CreateTorusKnot,
    RegisterStandardEngineExtensions,
} from "@babylonjs/core/pure";
import "@babylonjs/core/Shaders/noise.fragment";

RegisterStandardEngineExtensions();

export function run(canvas: HTMLCanvasElement): void {
    const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.05, 0.05, 0.1, 1);

    const camera = new ArcRotateCamera("camera", -Math.PI / 3, Math.PI / 3, 12, Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 5;
    camera.upperRadiusLimit = 25;

    new HemisphericLight("ambient", new Vector3(0, 1, 0), scene).intensity = 0.3;
    const dirLight = new DirectionalLight("dirLight", new Vector3(-1, -2, 1).normalize(), scene);
    dirLight.position = new Vector3(5, 10, -5);
    dirLight.intensity = 0.9;

    const shadowGen = new ShadowGenerator(1024, dirLight);
    shadowGen.useBlurExponentialShadowMap = true;

    const ground = CreateGround("ground", { width: 10, height: 10 }, scene);
    const groundMat = new PBRMaterial("groundMat", scene);
    groundMat.albedoColor = new Color3(0.15, 0.15, 0.15);
    groundMat.metallic = 0.1;
    groundMat.roughness = 0.9;
    ground.material = groundMat;
    ground.receiveShadows = true;

    const knot = CreateTorusKnot("knot", { radius: 1.5, tube: 0.5, radialSegments: 128, tubularSegments: 64 }, scene);
    knot.position.y = 2.5;
    const knotMat = new PBRMaterial("knotMat", scene);
    knotMat.albedoColor = new Color3(0.8, 0.3, 0.1);
    knotMat.metallic = 0.7;
    knotMat.roughness = 0.3;
    const noiseTex = new NoiseProceduralTexture("noiseBump", 256, scene);
    noiseTex.animationSpeedFactor = 0;
    noiseTex.brightness = 0.5;
    noiseTex.octaves = 4;
    knotMat.bumpTexture = noiseTex;
    knot.material = knotMat;
    shadowGen.addShadowCaster(knot);

    const box = CreateBox("box", { size: 1.5 }, scene);
    box.position = new Vector3(-3, 0.75, 2);
    const boxMat = new PBRMaterial("boxMat", scene);
    boxMat.albedoColor = new Color3(0.2, 0.5, 0.8);
    boxMat.metallic = 0.4;
    boxMat.roughness = 0.5;
    box.material = boxMat;
    shadowGen.addShadowCaster(box);

    const cyl = CreateCylinder("cyl", { diameter: 1, height: 3 }, scene);
    cyl.position = new Vector3(3, 1.5, -2);
    const cylMat = new PBRMaterial("cylMat", scene);
    cylMat.albedoColor = new Color3(0.1, 0.7, 0.3);
    cylMat.metallic = 0.6;
    cylMat.roughness = 0.2;
    cyl.material = cylMat;
    shadowGen.addShadowCaster(cyl);

    let frameCount = 0;
    engine.runRenderLoop(() => {
        scene.render();
        if (++frameCount >= 10) {
            (window as any).__ready = true;
        }
    });
}
