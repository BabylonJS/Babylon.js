import { registerSceneLoaderPlugin } from "core/Loading/sceneLoader";
import { STLFileLoader } from "./stlFileLoader.plugin";
export * from "./stlFileLoader.plugin";

// Add this loader into the register plugin
registerSceneLoaderPlugin(new STLFileLoader());
