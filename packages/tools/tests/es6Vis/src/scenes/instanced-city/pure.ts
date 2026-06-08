/**
 * instanced-city — pure import style.
 */

// Deterministic PRNG for reproducible screenshots
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
    CreateGround,
    CreateBox,
    CreateSphere,
    CreateCylinder,
    PBRMaterial,
    StandardMaterial,
    Color3,
    Color4,
    Vector3,
    Matrix,
    SolidParticleSystem,
    RegisterStandardEngineExtensions,
    RegisterThinInstanceMesh,
    RegisterInstancedMesh,
    RegisterEngineDynamicBuffer,
    RegisterStandardMaterialDecalMap,
    RegisterAbstractMeshDecalMap,
    RegisterStandardMaterial,
} from "@babylonjs/core/pure";

RegisterStandardEngineExtensions();
RegisterThinInstanceMesh();
RegisterInstancedMesh();
RegisterEngineDynamicBuffer();
RegisterStandardMaterialDecalMap();
RegisterAbstractMeshDecalMap();
RegisterStandardMaterial();

export function run(canvas: HTMLCanvasElement): void {
    const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.5, 0.7, 0.9, 1);

    const camera = new ArcRotateCamera("camera", -Math.PI / 4, Math.PI / 4, 80, new Vector3(0, 5, 0), scene);
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 20;
    camera.upperRadiusLimit = 200;

    const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
    hemi.intensity = 0.4;
    hemi.groundColor = new Color3(0.2, 0.2, 0.3);

    const sun = new DirectionalLight("sun", new Vector3(-1, -3, -2), scene);
    sun.intensity = 0.9;
    sun.position = new Vector3(50, 100, 50);

    const ground = CreateGround("ground", { width: 100, height: 100 }, scene);
    const groundMat = new PBRMaterial("groundMat", scene);
    groundMat.albedoColor = new Color3(0.3, 0.32, 0.28);
    groundMat.metallic = 0.0;
    groundMat.roughness = 0.95;
    ground.material = groundMat;

    // Thin-instanced buildings
    const buildingMat = new PBRMaterial("buildingMat", scene);
    buildingMat.albedoColor = new Color3(0.6, 0.58, 0.55);
    buildingMat.metallic = 0.2;
    buildingMat.roughness = 0.7;

    const buildingTemplate = CreateBox("buildingTemplate", { width: 2, height: 1, depth: 2 }, scene);
    buildingTemplate.material = buildingMat;

    const gridSize = 8;
    const spacing = 6;
    const matrices: Matrix[] = [];

    for (let x = -gridSize; x <= gridSize; x++) {
        for (let z = -gridSize; z <= gridSize; z++) {
            if (x % 3 === 0 || z % 3 === 0) continue;
            const height = 2 + Math.random() * 10;
            const px = x * spacing + (Math.random() - 0.5) * 1;
            const pz = z * spacing + (Math.random() - 0.5) * 1;
            const matrix = Matrix.Compose(new Vector3(1 + Math.random() * 0.5, height, 1 + Math.random() * 0.5), Vector3.Zero().toQuaternion(), new Vector3(px, height / 2, pz));
            matrices.push(matrix);
        }
    }

    buildingTemplate.thinInstanceAdd(matrices);
    buildingTemplate.thinInstanceRefreshBoundingInfo();

    // SolidParticleSystem for trees
    const sps = new SolidParticleSystem("treeSPS", scene);
    const trunk = CreateCylinder("trunk", { diameter: 0.3, height: 1.5 }, scene);
    const canopy = CreateSphere("canopy", { diameter: 2, segments: 8 }, scene);
    sps.addShape(trunk, 50);
    sps.addShape(canopy, 50);
    sps.buildMesh();
    trunk.dispose();
    canopy.dispose();

    sps.initParticles = () => {
        for (let i = 0; i < sps.nbParticles; i++) {
            const p = sps.particles[i];
            const treeIndex = Math.floor(i / 2);
            const isTrunk = i % 2 === 0;
            const row = Math.floor(treeIndex / 10);
            const col = treeIndex % 10;
            const tx = (row - 5) * spacing * 3 + (Math.random() - 0.5) * 2;
            const tz = (col - 5) * spacing + (Math.random() - 0.5) * 2;
            if (isTrunk) {
                p.position.set(tx, 0.75, tz);
                p.scaling.set(1, 1, 1);
                p.color = new Color4(0.4, 0.25, 0.1, 1);
            } else {
                p.position.set(tx, 2.2, tz);
                p.scaling.set(1, 0.8, 1);
                p.color = new Color4(0.15, 0.5 + Math.random() * 0.2, 0.1, 1);
            }
        }
    };
    sps.initParticles();
    sps.setParticles();
    sps.refreshVisibleSize();

    // LOD sphere
    const detailSphere = CreateSphere("lodSphere", { diameter: 4, segments: 64 }, scene);
    detailSphere.position = new Vector3(0, 8, 0);
    const lodMat = new StandardMaterial("lodMat", scene);
    lodMat.emissiveColor = new Color3(1, 0.8, 0.3);
    lodMat.disableLighting = true;
    detailSphere.material = lodMat;

    const lodMid = CreateSphere("lodMid", { diameter: 4, segments: 16 }, scene);
    lodMid.material = lodMat;
    const lodLow = CreateSphere("lodLow", { diameter: 4, segments: 8 }, scene);
    lodLow.material = lodMat;
    detailSphere.addLODLevel(40, lodMid);
    detailSphere.addLODLevel(80, lodLow);
    detailSphere.addLODLevel(150, null);

    engine.runRenderLoop(() => {
        scene.render();
    });
    scene.executeWhenReady(() => {
        (window as any).__ready = true;
    });
}
