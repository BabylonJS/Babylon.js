import { registerSceneLoaderPlugin } from "core/Loading/sceneLoader";
import { GLTFFileLoader } from "./glTFFileLoader.plugin";
export * from "./glTFFileLoader.plugin";

//Add this loader into the register plugin
registerSceneLoaderPlugin(new GLTFFileLoader());
