import { registerSceneLoaderPlugin } from "core/Loading/sceneLoader";
import { OBJFileLoader } from "./objFileLoader.plugin";
export { OBJFileLoader };

//Add this loader into the register plugin
registerSceneLoaderPlugin(new OBJFileLoader());
