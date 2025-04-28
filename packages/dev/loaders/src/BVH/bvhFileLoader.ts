import type { ISceneLoaderPluginAsync, ISceneLoaderPluginFactory, ISceneLoaderPlugin, ISceneLoaderAsyncResult, ISceneLoaderPluginExtensions } from "core/Loading/sceneLoader";
import { RegisterSceneLoaderPlugin } from "core/Loading/sceneLoader";
import { AssetContainer } from "core/assetContainer";
import type { Scene } from "core/scene";
import { BVHLoader } from "./bvhLoader";
import { BVHLoadingOptions } from "./bvhLoadingOptions";
import { BVHFileLoaderMetadata } from "./bvhFileLoader.metadata";

declare module "core/Loading/sceneLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc
    export interface SceneLoaderPluginOptions {
        /**
         * Defines options for the bvh loader.
         */
        [BVHFileLoaderMetadata.name]: Partial<BVHLoadingOptions>;
    }
}

/**
 * @experimental
 * BVH file type loader.
 * This is a babylon scene loader plugin.
 */
export class BVHFileLoader implements ISceneLoaderPluginAsync, ISceneLoaderPluginFactory {
    /**
     * Defines the name of the plugin.
     */
    public name = "bvh";

    private _loadingOptions: BVHLoadingOptions;

    /**
     * Defines the extensions the bvh loader is able to load.
     * force data to come in as an ArrayBuffer
     */
    public extensions: ISceneLoaderPluginExtensions = {
        ".bvh": { isBinary: false },
    };

    /**
     * Creates loader for bvh motion files
     */
    constructor(loadingOptions?: Partial<Readonly<BVHLoadingOptions>>) {
        this._loadingOptions = { ...BVHFileLoader._DefaultLoadingOptions, ...(loadingOptions ?? {}) };
    }

    private static get _DefaultLoadingOptions(): BVHLoadingOptions {
        return {
            animationName: "Animation",
            loopBehavior: 1,
            skeletonName: "skeleton",
            skeletonId: "skeleton_id",
        };
    }

    /**
     * Instantiates a bvh file loader plugin.
     * @returns the created plugin
     */
    createPlugin(): ISceneLoaderPluginAsync | ISceneLoaderPlugin {
        return new BVHFileLoader();
    }

    /**
     * If the data string can be loaded directly.
     * @returns if the data can be loaded directly
     */
    public canDirectLoad(): boolean {
        return true;
    }

    /**
     * Imports  from the loaded gaussian splatting data and adds them to the scene
     * @param meshesNames a string or array of strings of the mesh names that should be loaded from the file
     * @param scene the scene the meshes should be added to
     * @param data the bvh data to load
     * @param rootUrl root url to load from
     * @returns a promise containing the loaded meshes, particles, skeletons and animations
     */
    public importMeshAsync(_meshesNames: any, scene: Scene, data: any, _rootUrl: string): Promise<ISceneLoaderAsyncResult> {
        if (typeof data !== "string") {
            return Promise.reject("BVH loader expects string data.");
        }
        try {
            const skeleton = BVHLoader.readBvh(data, scene, this._loadingOptions);
            return Promise.resolve({
                meshes: [],
                particleSystems: [],
                skeletons: [skeleton],
                animationGroups: [],
                transformNodes: [],
                geometries: [],
                lights: [],
                spriteManagers: [],
            });
        } catch (e) {
            return Promise.reject(e);
        }
    }

    /**
     * Imports all objects from the loaded bvh data and adds them to the scene
     * @param scene the scene the objects should be added to
     * @param data the bvh data to load
     * @param rootUrl root url to load from
     * @returns a promise which completes when objects have been loaded to the scene
     */
    public loadAsync(scene: Scene, data: any, _rootUrl: string): Promise<void> {
        if (typeof data !== "string") {
            return Promise.reject("BVH loader expects string data.");
        }
        try {
            BVHLoader.readBvh(data, scene);
            return Promise.resolve();
        } catch (e) {
            return Promise.reject(e);
        }
    }

    /**
     * Load into an asset container.
     * @param scene The scene to load into
     * @param data The data to import
     * @param rootUrl The root url for scene and resources
     * @returns The loaded asset container
     */
    public loadAssetContainerAsync(scene: Scene, data: string, _rootUrl: string): Promise<AssetContainer> {
        if (typeof data !== "string") {
            return Promise.reject("BVH loader expects string data.");
        }
        const assetContainer = new AssetContainer(scene);
        try {
            const skeleton = BVHLoader.readBvh(data, scene, this._loadingOptions);
            assetContainer.skeletons.push(skeleton);
            return Promise.resolve(assetContainer);
        } catch (e) {
            return Promise.reject(e);
        }
    }
}

RegisterSceneLoaderPlugin(new BVHFileLoader());
