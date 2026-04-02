import { type Engine } from "core/Engines/engine";
import { Scene } from "core/scene";
import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { HemisphericLight } from "core/Lights/hemisphericLight";
import { Vector3 } from "core/Maths/math.vector";
import { SmartAssetManager } from "core/SmartAssets/smartAssetManager";
import { registerBuiltInLoaders } from "loaders/dynamic";

// Register file loaders (glTF, OBJ, etc.)
registerBuiltInLoaders();

// eslint-disable-next-line @typescript-eslint/naming-convention, no-restricted-syntax
export const createScene = async function (engine: Engine, canvas: HTMLCanvasElement): Promise<Scene> {
    const scene = new Scene(engine);

    const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 3, new Vector3(0, 1, 0), scene);
    camera.attachControl(canvas, true);

    new HemisphericLight("light", new Vector3(0, 1, 0), scene);

    // ── SmartAssetManager Demo ──
    const sam = new SmartAssetManager(scene);

    // Register two assets by key — known-good Babylon CDN models
    sam.registerAsset("shark", "https://models.babylonjs.com/shark.glb", { extension: ".glb" });
    sam.registerAsset("alien", "https://models.babylonjs.com/alien.glb", { extension: ".glb" });

    // Listen to events
    sam.onAssetLoadedObservable.add((event) => {
        console.log(`Loaded "${event.key}" — ${event.container.meshes.length} meshes`);
    });

    sam.onAssetErrorObservable.add((event) => {
        console.log(`Failed to load "${event.key}" from "${event.url}":`, event.error);
    });

    // Verify discovery works
    const found = SmartAssetManager.GetFromScene(scene);
    console.log("SmartAssetManager discovered from scene:", found === sam);

    // Load the first asset
    console.log("Loading shark...");
    const sharkContainer = await sam.loadAsync("shark");

    // Auto-frame the camera to fit loaded meshes
    if (sharkContainer.meshes.length > 0) {
        const worldExtends = scene.getWorldExtends();
        const worldSize = worldExtends.max.subtract(worldExtends.min);
        const worldCenter = worldExtends.min.add(worldSize.scale(0.5));
        camera.setTarget(worldCenter);
        camera.radius = worldSize.length() * 1.5;
    }

    // Check provenance
    const prov = sam.getProvenance("shark");
    if (prov) {
        console.log(`Shark provenance: ${prov.meshNames.length} meshes, ${prov.materialNames.length} materials`);
    }

    // Demonstrate unload + load another asset after 5 seconds
    setTimeout(async () => {
        console.log("Swapping shark for alien...");
        await sam.unloadAsync("shark");
        await sam.loadAsync("alien");

        const alienProv = sam.getProvenance("alien");
        if (alienProv) {
            console.log(`Alien provenance: ${alienProv.meshNames.length} meshes`);
        }
    }, 5000);

    return scene;
};
