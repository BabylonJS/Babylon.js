// eslint-disable-next-line import/no-internal-modules
import type { AssetContainer, ISceneLoaderAsyncResult, ISceneLoaderPlugin, ISceneLoaderPluginAsync, ISceneLoaderPluginFactory, Scene } from "core/index";
import type { OBJLoadingOptions } from "./objLoadingOptions";

import { registerSceneLoaderPlugin } from "core/Loading/sceneLoader";
import { Vector2 } from "core/Maths/math.vector";
import { ObjLoadingFlags } from "./objLoadingFlags";

// eslint-disable-next-line @typescript-eslint/naming-convention
const PLUGIN_OBJ = "obj";

declare module "core/Loading/sceneLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc
    export interface SceneLoaderPluginOptions {
        /**
         * Defines options for the obj loader.
         */
        [PLUGIN_OBJ]: {};
    }
}

/**
 * OBJ file type loader.
 * This is a babylon scene loader plugin.
 */
export class OBJFileLoader implements ISceneLoaderPluginAsync, ISceneLoaderPluginFactory {
    /**
     * Defines if UVs are optimized by default during load.
     */
    public static OPTIMIZE_WITH_UV = true;
    /**
     * Invert model on y-axis (does a model scaling inversion)
     */
    public static INVERT_Y = false;
    /**
     * Invert Y-Axis of referenced textures on load
     */
    public static get INVERT_TEXTURE_Y() {
        return ObjLoadingFlags.INVERT_TEXTURE_Y;
    }

    public static set INVERT_TEXTURE_Y(value: boolean) {
        ObjLoadingFlags.INVERT_TEXTURE_Y = value;
    }

    /**
     * Include in meshes the vertex colors available in some OBJ files.  This is not part of OBJ standard.
     */
    public static IMPORT_VERTEX_COLORS = false;
    /**
     * Compute the normals for the model, even if normals are present in the file.
     */
    public static COMPUTE_NORMALS = false;
    /**
     * Optimize the normals for the model. Lighting can be uneven if you use OptimizeWithUV = true because new vertices can be created for the same location if they pertain to different faces.
     * Using OptimizehNormals = true will help smoothing the lighting by averaging the normals of those vertices.
     */
    public static OPTIMIZE_NORMALS = false;
    /**
     * Defines custom scaling of UV coordinates of loaded meshes.
     */
    public static UV_SCALING = new Vector2(1, 1);
    /**
     * Skip loading the materials even if defined in the OBJ file (materials are ignored).
     */
    public static SKIP_MATERIALS = false;

    /**
     * When a material fails to load OBJ loader will silently fail and onSuccess() callback will be triggered.
     *
     * Defaults to true for backwards compatibility.
     */
    public static MATERIAL_LOADING_FAILS_SILENTLY = true;

    /**
     * Loads assets without handedness conversions. This flag is for compatibility. Use it only if absolutely required. Defaults to false.
     */
    public static USE_LEGACY_BEHAVIOR = false;

    /**
     * Defines the name of the plugin.
     */
    public readonly name = PLUGIN_OBJ;
    /**
     * Defines the extension the plugin is able to load.
     */
    public readonly extensions = ".obj";

    private _loadingOptions: OBJLoadingOptions;

    /**
     * Creates loader for .OBJ files
     *
     * @param loadingOptions options for loading and parsing OBJ/MTL files.
     */
    constructor(loadingOptions?: OBJLoadingOptions) {
        this._loadingOptions = loadingOptions || OBJFileLoader._DefaultLoadingOptions;
    }

    private static get _DefaultLoadingOptions(): OBJLoadingOptions {
        return {
            computeNormals: OBJFileLoader.COMPUTE_NORMALS,
            optimizeNormals: OBJFileLoader.OPTIMIZE_NORMALS,
            importVertexColors: OBJFileLoader.IMPORT_VERTEX_COLORS,
            invertY: OBJFileLoader.INVERT_Y,
            invertTextureY: OBJFileLoader.INVERT_TEXTURE_Y,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            UVScaling: OBJFileLoader.UV_SCALING,
            materialLoadingFailsSilently: OBJFileLoader.MATERIAL_LOADING_FAILS_SILENTLY,
            optimizeWithUV: OBJFileLoader.OPTIMIZE_WITH_UV,
            skipMaterials: OBJFileLoader.SKIP_MATERIALS,
            useLegacyBehavior: OBJFileLoader.USE_LEGACY_BEHAVIOR,
        };
    }

    /**
     * Instantiates a OBJ file loader plugin.
     * @returns the created plugin
     */
    createPlugin(): ISceneLoaderPluginAsync | ISceneLoaderPlugin {
        return new OBJFileLoader(OBJFileLoader._DefaultLoadingOptions);
    }

    /**
     * If the data string can be loaded directly.
     * @returns if the data can be loaded directly
     */
    public canDirectLoad(): boolean {
        return false;
    }

    /**
     * Imports one or more meshes from the loaded OBJ data and adds them to the scene
     * @param meshesNames a string or array of strings of the mesh names that should be loaded from the file
     * @param scene the scene the meshes should be added to
     * @param data the OBJ data to load
     * @param rootUrl root url to load from
     * @returns a promise containing the loaded meshes, particles, skeletons and animations
     */
    public async importMeshAsync(meshesNames: any, scene: Scene, data: any, rootUrl: string): Promise<ISceneLoaderAsyncResult> {
        // Dynamically import the bulk of the implementation
        const impl = await import("./objFileLoader.impl");
        return await impl.importMeshAsync(meshesNames, scene, null, this._loadingOptions, data, rootUrl);
    }

    /**
     * Imports all objects from the loaded OBJ data and adds them to the scene
     * @param scene the scene the objects should be added to
     * @param data the OBJ data to load
     * @param rootUrl root url to load from
     * @returns a promise which completes when objects have been loaded to the scene
     */
    public loadAsync(scene: Scene, data: string, rootUrl: string): Promise<void> {
        //Get the 3D model
        return this.importMeshAsync(null, scene, data, rootUrl).then(() => {
            // return void
        });
    }

    /**
     * Load into an asset container.
     * @param scene The scene to load into
     * @param data The data to import
     * @param rootUrl The root url for scene and resources
     * @returns The loaded asset container
     */
    public async loadAssetContainerAsync(scene: Scene, data: string, rootUrl: string): Promise<AssetContainer> {
        // Dynamically import the bulk of the implementation
        const impl = await import("./objFileLoader.impl");
        return await impl.loadAssetContainerAsync(scene, this._loadingOptions, data, rootUrl);
    }
}

//Add this loader into the register plugin
registerSceneLoaderPlugin(new OBJFileLoader());
