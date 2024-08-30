import { registerOBJLoader } from "./OBJ/objFileLoader.dynamic";
import { registerGLTFLoader } from "./glTF/glTFFileLoader.dynamic";
import { registerSPLATLoader } from "./SPLAT/splatFileLoader.dynamic";
import { registerSTLLoader } from "./STL/stlFileLoader.dynamic";

/**
 * Registers the async plugin factories for all built-in loaders.
 * Loaders will be dynamically imported on demand, only when a SceneLoader load operation needs each respective loader.
 */
export function registerBuiltInLoaders() {
    registerOBJLoader();
    registerGLTFLoader();
    registerSPLATLoader();
    registerSTLLoader();
}
