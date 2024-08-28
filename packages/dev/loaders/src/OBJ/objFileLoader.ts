import type { ISceneLoaderPluginFactory } from "core/Loading/sceneLoader";
import { registerSceneLoaderPlugin } from "core/Loading/sceneLoader";
import { OBJFileLoader } from "./objFileLoader.plugin";
export { OBJFileLoader };

class OBJFileLoaderFactory implements ISceneLoaderPluginFactory {
    public readonly name = "obj";
    public readonly extensions = ".obj";

    public canDirectLoad(): boolean {
        return false;
    }

    public createPlugin() {
        return new OBJFileLoader();
    }
}

//Add this loader into the register plugin
registerSceneLoaderPlugin(new OBJFileLoaderFactory());
