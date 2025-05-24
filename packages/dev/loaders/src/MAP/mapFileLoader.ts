import { Scene, AssetContainer, RegisterSceneLoaderPlugin } from "core/index";
import type { ISceneLoaderPluginAsync, ISceneLoaderPluginFactory, ISceneLoaderAsyncResult, SceneLoaderPluginOptions } from "core/Loading/sceneLoader";
import { MapLoadingOptions } from "./mapLoadingOptions";
import { MapFileLoaderMetadata } from "./mapFileLoader.metadata";
import { MapLoader } from "./mapLoader";

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
        try {
            const result = await MapLoader.loadMap(data, scene, this._loadingOptions);
            return Promise.resolve({
                meshes: result.meshes,
                particleSystems: [],
                skeletons: [],
                animationGroups: [],
                transformNodes: [result.rootNode],
                geometries: [],
                lights: [], // TODO: Add lights
                spriteManagers: [],
                metadata: {
                    entities: result.entities,
                },
            } as ISceneLoaderAsyncResult);
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            return Promise.reject(e);
        }
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
        try {
            const result = await MapLoader.loadMap(data, scene, this._loadingOptions);
            assetContainer.meshes = result.meshes;

            // Add all loaded entities (which should be children of mapRootNode) to the asset container.
            // Also, add the mapRootNode itself to the asset container if it has any children.
            if (result.entities.length > 0) {
                assetContainer.transformNodes.push(result.rootNode);
                // The entities are already parented to mapRootNode by MapLoader.loadMap,
                // so we don't need to add them explicitly to assetContainer.transformNodes if mapRootNode is added.
            } else {
                result.rootNode.dispose(); // Clean up if no entities were loaded under it
            }

            return Promise.resolve(assetContainer);
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            return Promise.reject(e);
        }
    }
}

RegisterSceneLoaderPlugin(new MapFileLoader());
