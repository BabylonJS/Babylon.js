import { AssetContainer } from "core/assetContainer";
import type { ISceneLoaderAsyncResult, ISceneLoaderPluginAsync, ISceneLoaderPluginFactory, SceneLoaderPluginOptions } from "core/Loading/sceneLoader";
import { RegisterSceneLoaderPlugin } from "core/Loading/sceneLoader";
import type { Scene } from "core/scene";
import { MapFileLoaderMetadata } from "./mapFileLoader.metadata";
import { MapLoader } from "./mapLoader";
import type { MapLoadingOptions } from "./mapLoadingOptions";

declare module "core/Loading/sceneLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/naming-convention
    export interface SceneLoaderPluginOptions {
        [MapFileLoaderMetadata.name]: Partial<MapLoadingOptions>;
    }
}

/**
 * @experimental
 * MapLoader class for loading MAP files into Babylon.js
 */
export class MapFileLoader implements ISceneLoaderPluginAsync, ISceneLoaderPluginFactory {
    /**
     * Name of the loader ("map")
     */
    public readonly name = MapFileLoaderMetadata.name;

    /** @internal */
    public readonly extensions = MapFileLoaderMetadata.extensions;

    private readonly _loadingOptions: MapLoadingOptions;

    constructor(loadingOptions?: Partial<Readonly<MapLoadingOptions>>) {
        this._loadingOptions = { ...MapFileLoader._DefaultLoadingOptions, ...(loadingOptions ?? {}) };
    }

    private static get _DefaultLoadingOptions(): MapLoadingOptions {
        return {
            loadClips: false,
            loadTriggers: false,
            loadLights: false,
            materials: {},
        };
    }

    /** @internal */
    public createPlugin(options: SceneLoaderPluginOptions): ISceneLoaderPluginAsync {
        return new MapFileLoader(options[MapFileLoaderMetadata.name]);
    }

    /**
     * If the data string can be loaded directly.
     * @returns if the data can be loaded directly
     */
    public canDirectLoad(): boolean {
        return true;
    }

    // eslint-disable-next-line @typescript-eslint/promise-function-async, no-restricted-syntax
    public async importMeshAsync(_meshesNames: string | readonly string[] | null | undefined, scene: Scene, data: unknown): Promise<ISceneLoaderAsyncResult> {
        if (typeof data !== "string") {
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            return Promise.reject("Map loader expects string data.");
        }

        const result = MapLoader.loadMap(data, scene, this._loadingOptions);
        return {
            meshes: result.meshes,
            particleSystems: [],
            skeletons: [],
            animationGroups: [],
            transformNodes: [result.rootNode],
            geometries: [],
            lights: result.lights,
            spriteManagers: [],
        };
    }

    /**
     * Imports all objects from the loaded map data and adds them to the scene
     * @param scene the scene the objects should be added to
     * @param data the map data to load
     * @returns a promise which completes when objects have been loaded to the scene
     */
    // eslint-disable-next-line no-restricted-syntax, @typescript-eslint/promise-function-async
    public loadAsync(scene: Scene, data: unknown): Promise<void> {
        if (typeof data !== "string") {
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            return Promise.reject("Map loader expects string data.");
        }

        // eslint-disable-next-line github/no-then
        return this.importMeshAsync(null, scene, data).then(() => {
            // return void
        });
    }

    /**
     * Load into an asset container.
     * @param scene The scene to load into
     * @param data The data to import
     * @returns The loaded asset container
     */
    // eslint-disable-next-line @typescript-eslint/promise-function-async, no-restricted-syntax
    public async loadAssetContainerAsync(scene: Scene, data: unknown): Promise<AssetContainer> {
        if (typeof data !== "string") {
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            return Promise.reject("Map loader expects string data.");
        }
        const assetContainer = new AssetContainer(scene);

        return this.importMeshAsync(null, scene, data)
            .then((result) => {
                result.meshes.forEach((mesh) => assetContainer.meshes.push(mesh));
                result.lights.forEach((light) => assetContainer.lights.push(light));
                result.transformNodes.forEach((node) => assetContainer.transformNodes.push(node));
                return assetContainer;
            }) // eslint-disable-next-line github/no-then
            .catch((ex) => {
                throw ex;
            });
    }
}

RegisterSceneLoaderPlugin(new MapFileLoader());
