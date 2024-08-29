import { registerOBJLoader } from "./OBJ/objDynamicFileLoader";
import { registerGLTFLoader } from "./glTF/glTFDynamicFileLoader";
import { registerSPLATLoader } from "./SPLAT/splatDynamicFileLoader";

export function registerLoaders() {
    registerOBJLoader();
    registerGLTFLoader();
    registerSPLATLoader();
}
