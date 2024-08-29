import { registerSceneLoaderPlugin } from "core/Loading/sceneLoader";
import { SPLATFileLoader } from "./splatFileLoader.plugin";
export * from "./splatFileLoader.plugin";

// Add this loader into the register plugin
registerSceneLoaderPlugin(new SPLATFileLoader());
