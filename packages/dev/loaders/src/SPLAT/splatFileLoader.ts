import type {
    ISceneLoaderPluginAsync,
    ISceneLoaderPluginFactory,
    ISceneLoaderPlugin,
    ISceneLoaderAsyncResult,
    ISceneLoaderPluginExtensions,
    ISceneLoaderProgressEvent,
} from "core/Loading/sceneLoader";
import { registerSceneLoaderPlugin } from "core/Loading/sceneLoader";
import { GaussianSplattingMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingMesh";
import type { AssetContainer } from "core/assetContainer";
import type { Scene } from "core/scene";

// eslint-disable-next-line @typescript-eslint/naming-convention
const PLUGIN_SPLAT = "splat";

declare module "core/Loading/sceneLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc
    export interface SceneLoaderPluginOptions {
        /**
         * Defines options for the splat loader.
         */
        [PLUGIN_SPLAT]: {};
    }
}

/**
 * @experimental
 * SPLAT file type loader.
 * This is a babylon scene loader plugin.
 */
export class SPLATFileLoader implements ISceneLoaderPluginAsync, ISceneLoaderPluginFactory {
    /**
     * Defines the name of the plugin.
     */
    public readonly name = PLUGIN_SPLAT;

    /**
     * Defines the extensions the splat loader is able to load.
     * force data to come in as an ArrayBuffer
     */
    public readonly extensions = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ".splat": { isBinary: true },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ".ply": { isBinary: true },
    } as const satisfies ISceneLoaderPluginExtensions;

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
     * @param onProgress callback called while file is loading
     * @param fileName Defines the name of the file to load
     * @returns a promise containing the loaded meshes, particles, skeletons and animations
     */
    public async importMeshAsync(
        _meshesNames: any,
        scene: Scene,
        data: any,
        rootUrl: string,
        onProgress?: (event: ISceneLoaderProgressEvent) => void,
        fileName?: string
    ): Promise<ISceneLoaderAsyncResult> {
        const gaussianSplatting = new GaussianSplattingMesh("GaussianSplatting", null, scene);
        await gaussianSplatting.loadFileAsync(rootUrl + (fileName ?? ""));
        return {
            meshes: [gaussianSplatting],
            particleSystems: [],
            skeletons: [],
            animationGroups: [],
            transformNodes: [],
            geometries: [],
            lights: [],
            spriteManagers: [],
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

//Add this loader into the register plugin
registerSceneLoaderPlugin(new SPLATFileLoader());
