/**
 * postprocess-pipeline — barrel import style.
 * DefaultRenderingPipeline, SSAO2, bloom, DoF, chromatic aberration.
 */

// Deterministic PRNG for reproducible object placement
let _seed = 12345;
Math.random = () => {
    _seed = (_seed * 16807) % 2147483647;
    return (_seed - 1) / 2147483646;
};

import {
    Engine,
    Scene,
    ArcRotateCamera,
    HemisphericLight,
    DirectionalLight,
    MeshBuilder,
    PBRMaterial,
    StandardMaterial,
    Color3,
    Color4,
    Vector3,
    DefaultRenderingPipeline,
    SSAO2RenderingPipeline,
} from "@babylonjs/core";

export function run(canvas: HTMLCanvasElement): void {
    const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.02, 0.02, 0.05, 1);

    const camera = new ArcRotateCamera("camera", -Math.PI / 4, Math.PI / 3.5, 20, new Vector3(0, 2, 0), scene);
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 5;
    camera.upperRadiusLimit = 40;
    camera.minZ = 0.1;

    const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
    hemi.intensity = 0.3;

    const dir = new DirectionalLight("dir", new Vector3(-1, -3, -2), scene);
    dir.intensity = 1.0;
    dir.position = new Vector3(10, 15, 10);

    const ground = MeshBuilder.CreateGround("ground", { width: 30, height: 30 }, scene);
    const groundMat = new PBRMaterial("groundMat", scene);
    groundMat.albedoColor = new Color3(0.1, 0.1, 0.12);
    groundMat.metallic = 0.3;
    groundMat.roughness = 0.7;
    ground.material = groundMat;

    // Scattered objects
    const objectMat = new PBRMaterial("objMat", scene);
    objectMat.albedoColor = new Color3(0.6, 0.3, 0.1);
    objectMat.metallic = 0.8;
    objectMat.roughness = 0.2;

    for (let i = 0; i < 20; i++) {
        const x = (Math.random() - 0.5) * 24;
        const z = (Math.random() - 0.5) * 24;
        const type = i % 3;
        let mesh;
        switch (type) {
            case 0:
                mesh = MeshBuilder.CreateSphere(`sphere${i}`, { diameter: 1 + Math.random() }, scene);
                break;
            case 1:
                mesh = MeshBuilder.CreateBox(`box${i}`, { size: 0.8 + Math.random() * 0.8 }, scene);
                break;
            default:
                mesh = MeshBuilder.CreateCylinder(`cyl${i}`, { diameter: 0.5 + Math.random() * 0.5, height: 1 + Math.random() * 2 }, scene);
                break;
        }
        mesh.position = new Vector3(x, mesh.getBoundingInfo().boundingBox.extendSize.y, z);
        mesh.material = objectMat;
    }

    // Emissive objects for bloom
    for (let i = 0; i < 5; i++) {
        const light = MeshBuilder.CreateSphere(`emissive${i}`, { diameter: 0.5 }, scene);
        const angle = (i / 5) * Math.PI * 2;
        light.position = new Vector3(Math.cos(angle) * 5, 2, Math.sin(angle) * 5);
        const emMat = new StandardMaterial(`emMat${i}`, scene);
        emMat.emissiveColor = Color3.FromHSV((i / 5) * 360, 0.8, 1);
        emMat.disableLighting = true;
        light.material = emMat;
    }

    // Default Rendering Pipeline
    const pipeline = new DefaultRenderingPipeline("defaultPipeline", true, scene, [camera]);
    pipeline.bloomEnabled = true;
    pipeline.bloomThreshold = 0.7;
    pipeline.bloomWeight = 0.5;
    pipeline.bloomKernel = 64;
    pipeline.depthOfFieldEnabled = true;
    pipeline.depthOfField.focalLength = 50;
    pipeline.depthOfField.fStop = 2.8;
    pipeline.depthOfField.focusDistance = 2000;
    pipeline.chromaticAberrationEnabled = true;
    pipeline.chromaticAberration.aberrationAmount = 30;
    pipeline.imageProcessingEnabled = true;
    pipeline.imageProcessing.contrast = 1.2;
    pipeline.imageProcessing.exposure = 1.1;

    // SSAO2
    const ssao = new SSAO2RenderingPipeline("ssao", scene, { ssaoRatio: 0.5, blurRatio: 0.5 });
    ssao.radius = 2;
    ssao.totalStrength = 1.2;
    ssao.samples = 16;
    scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline("ssao", camera);

    engine.runRenderLoop(() => {
        scene.render();
    });
    scene.executeWhenReady(() => {
        (window as any).__ready = true;
    });
}
