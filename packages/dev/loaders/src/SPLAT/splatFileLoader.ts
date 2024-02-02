import type { ISceneLoaderPluginAsync, ISceneLoaderPluginFactory, ISceneLoaderPlugin, ISceneLoaderAsyncResult, ISceneLoaderPluginExtensions } from "core/Loading/sceneLoader";
import { SceneLoader } from "core/Loading/sceneLoader";
import { GaussianSplattingMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingMesh";
import type { AssetContainer } from "core/assetContainer";
import type { Scene } from "core/scene";

/**
 * @experimental
 * SPLAT file type loader.
 * This is a babylon scene loader plugin.
 */
export class SPLATFileLoader implements ISceneLoaderPluginAsync, ISceneLoaderPluginFactory {
    /**
     * Defines the name of the plugin.
     */
    public name = "splat";

    /**
     * Defines the extensions the splat loader is able to load.
     * force data to come in as an ArrayBuffer
     */
    public extensions: ISceneLoaderPluginExtensions = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ".splat": { isBinary: true },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ".ply": { isBinary: true },
    };

    //private _loadingOptions: SPLATLoadingOptions;
    /**
     * Creates loader for gaussian splatting files
     */
    constructor() {}

    /**
     * Instantiates a gaussian splatting file loader plugin.
     * @returns the created plugin
     */
    createPlugin(): ISceneLoaderPluginAsync | ISceneLoaderPlugin {
        return new SPLATFileLoader();
    }

    /**
     * If the data string can be loaded directly.
     * @returns if the data can be loaded directly
     */
    public canDirectLoad(): boolean {
        return false;
    }

    /**
     * Imports  from the loaded gaussian splatting data and adds them to the scene
     * @param _meshesNames a string or array of strings of the mesh names that should be loaded from the file
     * @param scene the scene the meshes should be added to
     * @param data the gaussian splatting data to load
     * @param rootUrl root url to load from
     * @returns a promise containing the loaded meshes, particles, skeletons and animations
     */
    public async importMeshAsync(_meshesNames: any, scene: Scene, data: any, rootUrl: string): Promise<ISceneLoaderAsyncResult> {
        const gaussianSplatting = new GaussianSplattingMesh("GaussianSplatting", null, scene);
        await gaussianSplatting.loadFileAsync(rootUrl);
        return {
            meshes: [gaussianSplatting],
            particleSystems: [],
            skeletons: [],
            animationGroups: [],
            transformNodes: [],
            geometries: [],
            lights: [],
        };
    }

    /**
     * Imports all objects from the loaded gaussian splatting data and adds them to the scene
     * @param scene the scene the objects should be added to
     * @param data the gaussian splatting data to load
     * @param _rootUrl root url to load from
     * @returns a promise which completes when objects have been loaded to the scene
     */
    public loadAsync(scene: Scene, data: any, _rootUrl: string): Promise<void> {
        const gaussianSplatting = new GaussianSplattingMesh("GaussianSplatting", null, scene);
        return gaussianSplatting.loadDataAsync(GaussianSplattingMesh.ConvertPLYToSplat(data));
    }

    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * Load into an asset container.
     * @param _scene The scene to load into
     * @param _data The data to import
     * @param _rootUrl The root url for scene and resources
     * @returns The loaded asset container
     */
    public loadAssetContainerAsync(_scene: Scene, _data: string, _rootUrl: string): Promise<AssetContainer> {
        throw new Error("loadAssetContainerAsync not implemented for Gaussian Splatting loading");
    }
}

if (SceneLoader) {
    //Add this loader into the register plugin
    SceneLoader.RegisterPlugin(new SPLATFileLoader());
}
