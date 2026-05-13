import { FreeCamera, HemisphericLight, MeshBuilder, NullEngine, PBRMaterial, Scene, SceneLoader, StandardMaterial, Vector3 } from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import { GridMaterial } from "@babylonjs/materials/grid/gridMaterial";

const engine = new NullEngine();
const scene = new Scene(engine);

const camera = new FreeCamera("camera", new Vector3(0, 2, -8), scene);
camera.setTarget(Vector3.Zero());
scene.activeCamera = camera;

const light = new HemisphericLight("light", Vector3.Up(), scene);
light.intensity = 0.8;

const box = MeshBuilder.CreateBox("box", { size: 2 }, scene);
box.material = new StandardMaterial("standard", scene);

const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 1, segments: 8 }, scene);
sphere.position.x = 2;
sphere.material = new PBRMaterial("pbr", scene);

const ground = MeshBuilder.CreateGround("ground", { width: 4, height: 4 }, scene);
ground.material = new GridMaterial("grid", scene);

if (!SceneLoader.IsPluginForExtensionAvailable(".gltf")) {
    throw new Error("The glTF loader was not registered by the ES6 loaders package.");
}

scene.render();

if (scene.meshes.length < 3 || !scene.activeCamera) {
    throw new Error("The ES6 runtime smoke scene did not initialize correctly.");
}

engine.dispose();
