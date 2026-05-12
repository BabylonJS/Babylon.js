/**
 * audio-reactive — pure import style.
 */
import {
    Engine,
    Scene,
    ArcRotateCamera,
    HemisphericLight,
    PointLight,
    CreateSphere,
    CreateCylinder,
    CreateGround,
    StandardMaterial,
    PBRMaterial,
    Color3,
    Color4,
    Vector3,
    GlowLayer,
    Animation,
    RegisterStandardEngineExtensions,
    RegisterAnimatable,
} from "@babylonjs/core/pure";

RegisterStandardEngineExtensions();
RegisterAnimatable();

export function run(canvas: HTMLCanvasElement): void {
    const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    engine.getDeltaTime = () => 16.67;
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.03, 0.03, 0.08, 1);

    const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 3, 18, new Vector3(0, 1.5, 0), scene);
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 5;
    camera.upperRadiusLimit = 30;

    new HemisphericLight("ambient", new Vector3(0, 1, 0), scene).intensity = 0.2;

    const glow = new GlowLayer("glow", scene);
    glow.intensity = 0.6;

    const floor = CreateGround("floor", { width: 16, height: 16 }, scene);
    const floorMat = new PBRMaterial("floorMat", scene);
    floorMat.albedoColor = new Color3(0.08, 0.08, 0.12);
    floorMat.metallic = 0.3;
    floorMat.roughness = 0.7;
    floor.material = floorMat;

    const speakerPositions = [new Vector3(-4, 1.5, -4), new Vector3(4, 1.5, -4), new Vector3(-4, 1.5, 4), new Vector3(4, 1.5, 4)];
    const speakerColors = [new Color3(1, 0.2, 0.2), new Color3(0.2, 1, 0.2), new Color3(0.2, 0.2, 1), new Color3(1, 1, 0.2)];

    for (let i = 0; i < speakerPositions.length; i++) {
        const body = CreateCylinder(`speaker${i}`, { diameterTop: 0.6, diameterBottom: 0.8, height: 1.2 }, scene);
        body.position = speakerPositions[i];
        const bodyMat = new PBRMaterial(`speakerMat${i}`, scene);
        bodyMat.albedoColor = new Color3(0.15, 0.15, 0.2);
        bodyMat.metallic = 0.7;
        bodyMat.roughness = 0.3;
        body.material = bodyMat;

        const cone = CreateSphere(`speakerCone${i}`, { diameter: 0.5, segments: 16 }, scene);
        cone.position = speakerPositions[i].add(new Vector3(0, 0.3, 0));
        const coneMat = new StandardMaterial(`coneMat${i}`, scene);
        coneMat.emissiveColor = speakerColors[i];
        coneMat.disableLighting = true;
        cone.material = coneMat;

        const pulseAnim = new Animation(`pulse${i}`, "scaling", 30, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);
        pulseAnim.setKeys([
            { frame: 0, value: new Vector3(1, 1, 1) },
            { frame: 15 + i * 5, value: new Vector3(1.3, 1.3, 1.3) },
            { frame: 30 + i * 10, value: new Vector3(1, 1, 1) },
        ]);
        cone.animations.push(pulseAnim);
        scene.beginAnimation(cone, 0, 30 + i * 10, true);
    }

    const listener = CreateSphere("listener", { diameter: 0.4, segments: 8 }, scene);
    listener.position = new Vector3(0, 1, 0);
    const listenerMat = new StandardMaterial("listenerMat", scene);
    listenerMat.emissiveColor = new Color3(1, 1, 1);
    listenerMat.disableLighting = true;
    listener.material = listenerMat;

    const centerLight = new PointLight("centerLight", new Vector3(0, 3, 0), scene);
    centerLight.intensity = 1.5;
    centerLight.diffuse = new Color3(0.6, 0.6, 0.8);

    let frameCount = 0;
    engine.runRenderLoop(() => {
        scene.render();
        if (++frameCount >= 30) {
            (window as any).__ready = true;
        }
    });
}
