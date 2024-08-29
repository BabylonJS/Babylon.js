import { registerOBJLoader } from "./OBJ/objDynamicFileLoader";
import { registerGLTFLoader } from "./glTF/glTFDynamicFileLoader";
import { registerSPLATLoader } from "./SPLAT/splatDynamicFileLoader";
import { registerSTLLoader } from "./STL/stlDynamicFileLoader";

//test
export function registerLoaders() {
    registerOBJLoader();
    registerGLTFLoader();
    registerSPLATLoader();
    registerSTLLoader();
}
