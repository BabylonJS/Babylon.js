import type { ISceneLoaderPluginFactory } from "core/Loading/sceneLoader";
import { registerSceneLoaderPlugin } from "core/Loading/sceneLoader";
import { OBJFileLoader } from "./objFileLoader.plugin";
export { OBJFileLoader };

//Add this loader into the register plugin
registerSceneLoaderPlugin({
    name: "obj",
    extensions: ".obj",
    canDirectLoad: () => false,
    createPlugin: () => new OBJFileLoader(),
} satisfies ISceneLoaderPluginFactory);
