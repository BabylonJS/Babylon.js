/**
 * particle-fountain — barrel import style.
 * Particle system with glow, point lights, animations.
 */

// Deterministic PRNG for reproducible particle positions
let _seed = 12345;
Math.random = () => {
    _seed = (_seed * 16807) % 2147483647;
    return (_seed - 1) / 2147483646;
};

import {
    Engine,
    Scene,
    ArcRotateCamera,
    PointLight,
    HemisphericLight,
    MeshBuilder,
    StandardMaterial,
    PBRMaterial,
    Color3,
    Color4,
    Vector3,
    ParticleSystem,
    GlowLayer,
    Animation,
} from "@babylonjs/core";

export function run(canvas: HTMLCanvasElement): void {
    const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    engine.getDeltaTime = () => 16.67;
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.02, 0.02, 0.06, 1);

    const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 3, 15, new Vector3(0, 2, 0), scene);
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 6;
    camera.upperRadiusLimit = 30;

    new HemisphericLight("ambient", new Vector3(0, 1, 0), scene).intensity = 0.15;

    const pointLight = new PointLight("pointLight", new Vector3(0, 4, 0), scene);
    pointLight.intensity = 2;
    pointLight.diffuse = new Color3(1, 0.6, 0.2);

    const glow = new GlowLayer("glow", scene);
    glow.intensity = 0.8;

    const ground = MeshBuilder.CreateGround("ground", { width: 12, height: 12 }, scene);
    const groundMat = new PBRMaterial("groundMat", scene);
    groundMat.albedoColor = new Color3(0.08, 0.08, 0.12);
    groundMat.metallic = 0.2;
    groundMat.roughness = 0.8;
    ground.material = groundMat;

    const base = MeshBuilder.CreateCylinder("base", { diameterTop: 1, diameterBottom: 1.5, height: 1 }, scene);
    base.position.y = 0.5;
    const baseMat = new PBRMaterial("baseMat", scene);
    baseMat.albedoColor = new Color3(0.3, 0.3, 0.35);
    baseMat.metallic = 0.8;
    baseMat.roughness = 0.3;
    base.material = baseMat;

    const emitter = MeshBuilder.CreateSphere("emitter", { diameter: 0.4, segments: 16 }, scene);
    emitter.position.y = 1.2;
    const emitterMat = new StandardMaterial("emitterMat", scene);
    emitterMat.emissiveColor = new Color3(1, 0.5, 0.1);
    emitterMat.disableLighting = true;
    emitter.material = emitterMat;

    // Create particle system (exercises the import) but don't start for determinism
    const ps = new ParticleSystem("fountain", 2000, scene);
    ps.createPointEmitter(new Vector3(-0.2, 1, -0.2), new Vector3(0.2, 1, 0.2));
    ps.emitter = emitter;
    ps.color1 = new Color4(1, 0.6, 0.1, 1);
    ps.color2 = new Color4(1, 0.2, 0.05, 1);
    ps.colorDead = new Color4(0.2, 0.05, 0.0, 0);
    ps.minSize = 0.05;
    ps.maxSize = 0.2;
    ps.minLifeTime = 0.5;
    ps.maxLifeTime = 2.0;
    ps.emitRate = 400;
    ps.gravity = new Vector3(0, -9.81, 0);
    ps.minEmitPower = 3;
    ps.maxEmitPower = 6;
    ps.updateSpeed = 0.01;
    // ps.start() intentionally omitted for deterministic screenshots

    // Orbiting spheres with animation
    for (let i = 0; i < 3; i++) {
        const orb = MeshBuilder.CreateSphere(`orb${i}`, { diameter: 0.5, segments: 16 }, scene);
        const angle = (i * 2 * Math.PI) / 3;
        orb.position = new Vector3(Math.cos(angle) * 3, 1.5, Math.sin(angle) * 3);

        const orbMat = new StandardMaterial(`orbMat${i}`, scene);
        const hue = i / 3;
        orbMat.emissiveColor = Color3.FromHSV(hue * 360, 0.8, 1);
        orbMat.disableLighting = true;
        orb.material = orbMat;

        const anim = new Animation(`bob${i}`, "position.y", 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
        anim.setKeys([
            { frame: 0, value: 1.0 },
            { frame: 30, value: 2.5 },
            { frame: 60, value: 1.0 },
        ]);
        orb.animations.push(anim);
        scene.beginAnimation(orb, 0, 60, true);
    }

    let frameCount = 0;
    engine.runRenderLoop(() => {
        scene.render();
        if (++frameCount >= 30) {
            (window as any).__ready = true;
        }
    });
}
