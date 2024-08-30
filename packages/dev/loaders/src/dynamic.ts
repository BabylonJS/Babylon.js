import { registerOBJLoader } from "./OBJ/objFileLoader.dynamic";
import { registerGLTFLoader } from "./glTF/glTFFileLoader.dynamic";
import { registerDefaultGLTFExtensions } from "./glTF/2.0/Extensions/dynamic";
import { registerSPLATLoader } from "./SPLAT/splatFileLoader.dynamic";
import { registerSTLLoader } from "./STL/stlFileLoader.dynamic";

//test
export function registerDefaultLoaders() {
    registerOBJLoader();
    registerGLTFLoader();
    registerDefaultGLTFExtensions();
    registerSPLATLoader();
    registerSTLLoader();
}
