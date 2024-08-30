import { registerOBJLoader } from "./OBJ/objFileLoader.dynamic";
import { registerGLTFLoader } from "./glTF/glTFFileLoader.dynamic";
import { registerSPLATLoader } from "./SPLAT/splatFileLoader.dynamic";
import { registerSTLLoader } from "./STL/stlFileLoader.dynamic";

//test
export function registerBuiltInLoaders() {
    registerOBJLoader();
    registerGLTFLoader();
    registerSPLATLoader();
    registerSTLLoader();
}
