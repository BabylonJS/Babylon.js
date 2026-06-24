import {
    type ISceneLoaderPluginAsync,
    type ISceneLoaderPluginFactory,
    type ISceneLoaderAsyncResult,
    type SceneLoaderPluginOptions,
    RegisterSceneLoaderPlugin,
} from "core/Loading/sceneLoader";
import { AssetContainer } from "core/assetContainer";
import { Animation } from "core/Animations/animation.pure";
import { type Scene } from "core/scene";
import { type BVHLoadingOptions } from "./bvhLoadingOptions";
import { BVHFileLoaderMetadata } from "./bvhFileLoader.metadata";
import { ReadBvh } from "./bvhLoader";

/**
 * @experimental
 * BVH file type loader.
 * This is a babylon scene loader plugin.
 */
export class BVHFileLoader implements ISceneLoaderPluginAsync, ISceneLoaderPluginFactory {
    /**
     * Name of the loader ("bvh")
     */
    public readonly name = BVHFileLoaderMetadata.name;

    /** @internal */
    public readonly extensions = BVHFileLoaderMetadata.extensions;

    private readonly _loadingOptions: BVHLoadingOptions;

    /**
     * Creates loader for bvh motion files
     * @param loadingOptions - Options for the bvh loader
     */
    constructor(loadingOptions?: Partial<Readonly<BVHLoadingOptions>>) {
        this._loadingOptions = { ...BVHFileLoader._DefaultLoadingOptions, ...(loadingOptions ?? {}) };
    }

    private static get _DefaultLoadingOptions(): BVHLoadingOptions {
        return {
            loopMode: Animation.ANIMATIONLOOPMODE_CYCLE,
        };
    }

    /** @internal */
    public createPlugin(options: SceneLoaderPluginOptions): ISceneLoaderPluginAsync {
        return new BVHFileLoader(options[BVHFileLoaderMetadata.name]);
    }

    /**
     * If the data string can be loaded directly.
     * @param data - direct load data
     * @returns if the data can be loaded directly
     */
    public canDirectLoad(data: string): boolean {
        return this.isBvhHeader(data);
    }

    /**
     * Returns whether the provided text starts with a BVH HIERARCHY header.
     * @param text - the text to inspect
     * @returns true if the text is a BVH header
     */
    public isBvhHeader(text: string): boolean {
        return text.split("\n")[0] == "HIERARCHY";
    }

    /**
     * Returns whether the provided text does not start with a BVH HIERARCHY header.
     * @param text - the text to inspect
     * @returns true if the text is not a BVH header
     */
    public isNotBvhHeader(text: string): boolean {
        return !this.isBvhHeader(text);
    }

    /**
     * Imports  from the loaded gaussian splatting data and adds them to the scene
     * @param _meshesNames a string or array of strings of the mesh names that should be loaded from the file
     * @param scene the scene the meshes should be added to
     * @param data the bvh data to load
     * @returns a promise containing the loaded skeletons and animations
     */
    // eslint-disable-next-line @typescript-eslint/promise-function-async, no-restricted-syntax
    public importMeshAsync(_meshesNames: string | readonly string[] | null | undefined, scene: Scene, data: unknown): Promise<ISceneLoaderAsyncResult> {
        if (typeof data !== "string") {
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            return Promise.reject("BVH loader expects string data.");
        }
        if (this.isNotBvhHeader(data as string)) {
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            return Promise.reject("BVH loader expects HIERARCHY header.");
        }
        try {
            const skeleton = ReadBvh(data, scene, null, this._loadingOptions);
            return Promise.resolve({
                meshes: [],
                particleSystems: [],
                skeletons: [skeleton],
                animationGroups: [],
                transformNodes: [],
                geometries: [],
                lights: [],
                spriteManagers: [],
            } as ISceneLoaderAsyncResult);
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            return Promise.reject(e);
        }
    }

    /**
     * Imports all objects from the loaded bvh data and adds them to the scene
     * @param scene the scene the objects should be added to
     * @param data the bvh data to load
     * @returns a promise which completes when objects have been loaded to the scene
     */
    // eslint-disable-next-line no-restricted-syntax, @typescript-eslint/promise-function-async
    public loadAsync(scene: Scene, data: unknown): Promise<void> {
        if (typeof data !== "string") {
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            return Promise.reject("BVH loader expects string data.");
        }
        if (this.isNotBvhHeader(data as string)) {
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            return Promise.reject("BVH loader expects HIERARCHY header.");
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
    public loadAssetContainerAsync(scene: Scene, data: unknown): Promise<AssetContainer> {
        if (typeof data !== "string") {
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            return Promise.reject("BVH loader expects string data.");
        }
        if (this.isNotBvhHeader(data as string)) {
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            return Promise.reject("BVH loader expects HIERARCHY header.");
        }
        const assetContainer = new AssetContainer(scene);
        try {
            const skeleton = ReadBvh(data, scene, assetContainer, this._loadingOptions);
            assetContainer.skeletons.push(skeleton);
            return Promise.resolve(assetContainer);
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            return Promise.reject(e);
        }
    }
}

let _Registered = false;
/**
 * Registers the BVHFileLoader scene loader plugin.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterBVHFileLoader(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    RegisterSceneLoaderPlugin(new BVHFileLoader());
}
