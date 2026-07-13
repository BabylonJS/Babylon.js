export * from "./glTFLoader.pure";

import { RegisterGLTF2Loader } from "./glTFLoader.pure";
import { RegisterGLTFFileLoader } from "../glTFFileLoader.pure";

RegisterGLTF2Loader();

// Auto-register the .gltf/.glb SceneLoader plugin so that importing
// "@babylonjs/loaders/glTF/2.0" restores the pre-9.15 behavior of making
// SceneLoader able to load glTF 2.0 assets. This registers the version-aware
// GLTFFileLoader plugin only; it does not pull in the legacy glTF 1.0 loader.
RegisterGLTFFileLoader();
