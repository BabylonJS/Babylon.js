import { registerOBJLoader } from "./OBJ/objDynamicFileLoader";
import { registerGLTFLoader } from "./glTF/glTFDynamicFileLoader";

export function registerLoaders() {
    registerOBJLoader();
    registerGLTFLoader();
}
