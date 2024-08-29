import { registerSceneLoaderPlugin } from "core/Loading/sceneLoader";
import { OBJFileLoader } from "./objFileLoader.plugin";
export * from "./objFileLoader.plugin";

//Add this loader into the register plugin
registerSceneLoaderPlugin(new OBJFileLoader());
