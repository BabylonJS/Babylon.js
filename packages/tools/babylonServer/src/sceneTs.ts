type BabylonEngine = {
    runRenderLoop(callback: () => void): void;
    resize(): void;
};

type BabylonScene = {
    render(): void;
};

type BabylonVector3 = object;
type BabylonMesh = { position: { y: number } };

type BabylonRuntimeConstructors = {
    engine: new (canvas: HTMLCanvasElement, antialias: boolean) => BabylonEngine;
    scene: new (engine: BabylonEngine) => BabylonScene;
    freeCamera: new (
        name: string,
        position: BabylonVector3,
        scene: BabylonScene
    ) => { setTarget(target: BabylonVector3): void; attachControl(canvas: HTMLCanvasElement, noPreventDefault?: boolean): void };
    hemisphericLight: new (name: string, direction: BabylonVector3, scene: BabylonScene) => { intensity: number };
    vector3: { new (x: number, y: number, z: number): BabylonVector3; zero(): BabylonVector3 };
    meshBuilder: {
        createSphere(name: string, options: { diameter: number; segments: number }, scene: BabylonScene): BabylonMesh;
        createGround(name: string, options: { width: number; height: number }, scene: BabylonScene): BabylonMesh;
    };
};

const BabylonGlobal = (window as unknown as { BABYLON: Record<string, unknown> }).BABYLON;
const BabylonMeshBuilder = BabylonGlobal.MeshBuilder as Record<string, unknown>;
const BabylonVector3 = BabylonGlobal.Vector3 as { new (x: number, y: number, z: number): BabylonVector3 } & Record<string, unknown>;
const BabylonRuntime: BabylonRuntimeConstructors = {
    engine: BabylonGlobal.Engine as BabylonRuntimeConstructors["engine"],
    scene: BabylonGlobal.Scene as BabylonRuntimeConstructors["scene"],
    freeCamera: BabylonGlobal.FreeCamera as BabylonRuntimeConstructors["freeCamera"],
    hemisphericLight: BabylonGlobal.HemisphericLight as BabylonRuntimeConstructors["hemisphericLight"],
    vector3: Object.assign(BabylonVector3, { zero: BabylonVector3["Zero"] as BabylonRuntimeConstructors["vector3"]["zero"] }),
    meshBuilder: {
        createSphere: BabylonMeshBuilder["CreateSphere"] as BabylonRuntimeConstructors["meshBuilder"]["createSphere"],
        createGround: BabylonMeshBuilder["CreateGround"] as BabylonRuntimeConstructors["meshBuilder"]["createGround"],
    },
};

const Canvas = document.getElementById("babylon-canvas") as HTMLCanvasElement; // Get the canvas element
const Engine = new BabylonRuntime.engine(Canvas, true); // Generate the BABYLON 3D engine

class Playground {
    /**
     * Creates the default sample scene.
     * @param engine The Babylon engine.
     * @param canvas The rendering canvas.
     * @returns The created scene.
     */
    public static CreateScene(engine: BabylonEngine, canvas: HTMLCanvasElement): BabylonScene {
        // This creates a basic Babylon Scene object (non-mesh)
        const scene = new BabylonRuntime.scene(engine);

        // This creates and positions a free camera (non-mesh)
        const camera = new BabylonRuntime.freeCamera("camera1", new BabylonRuntime.vector3(0, 5, -10), scene);

        // This targets the camera to scene origin
        camera.setTarget(BabylonRuntime.vector3.zero());

        // This attaches the camera to the canvas
        camera.attachControl(canvas, true);

        // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
        const light = new BabylonRuntime.hemisphericLight("light1", new BabylonRuntime.vector3(0, 1, 0), scene);

        // Default intensity is 1. Let's dim the light a small amount
        light.intensity = 0.7;

        // Our built-in 'sphere' shape. Params: name, options, scene
        const sphere = BabylonRuntime.meshBuilder.createSphere("sphere", { diameter: 2, segments: 32 }, scene);

        // Move the sphere upward 1/2 its height
        sphere.position.y = 1;

        // Our built-in 'ground' shape. Params: name, options, scene
        BabylonRuntime.meshBuilder.createGround("ground", { width: 6, height: 6 }, scene);

        return scene;
    }
}

Playground.CreateScene(Engine, Canvas);

const Scene = Playground.CreateScene(Engine, Canvas);

// Register a render loop to repeatedly render the scene
Engine.runRenderLoop(function () {
    Scene.render();
});

// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
    Engine.resize();
});
