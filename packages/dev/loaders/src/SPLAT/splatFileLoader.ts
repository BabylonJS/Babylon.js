import type {
    ISceneLoaderPluginAsync,
    ISceneLoaderPluginFactory,
    ISceneLoaderPlugin,
    ISceneLoaderAsyncResult,
    ISceneLoaderPluginExtensions,
    ISceneLoaderProgressEvent,
} from "core/Loading/sceneLoader";
import { SceneLoader } from "core/Loading/sceneLoader";
import { Quaternion } from "core/Maths/math.vector";
import { GaussianSplattingMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingMesh";
import { Logger } from "core/Misc/logger";
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
     * Code from https://github.com/dylanebert/gsplat.js/blob/main/src/loaders/PLYLoader.ts Under MIT license
     * Loads a .ply from data array buffer
     * if data array buffer is not ply, returns the original buffer
     * @param data the data to load
     * @returns the loaded buffer
     */
    private _loadPLY(data: any): ArrayBuffer {
        const ubuf = new Uint8Array(data);
        const header = new TextDecoder().decode(ubuf.slice(0, 1024 * 10));
        const headerEnd = "end_header\n";
        const headerEndIndex = header.indexOf(headerEnd);
        if (headerEndIndex < 0 || !header) {
            return data;
        }
        const vertexCount = parseInt(/element vertex (\d+)\n/.exec(header)![1]);

        let rowOffset = 0;
        const offsets: Record<string, number> = {
            double: 8,
            int: 4,
            uint: 4,
            float: 4,
            short: 2,
            ushort: 2,
            uchar: 1,
        };

        type PlyProperty = {
            name: string;
            type: string;
            offset: number;
        };
        const properties: PlyProperty[] = [];
        const filtered = header
            .slice(0, headerEndIndex)
            .split("\n")
            .filter((k) => k.startsWith("property "));
        for (const prop of filtered) {
            const [, type, name] = prop.split(" ");
            properties.push({ name, type, offset: rowOffset });
            if (offsets[type]) {
                rowOffset += offsets[type];
            } else {
                Logger.Error(`Unsupported property type: ${type}. Are you sure it's a valid Gaussian Splatting file?`);
                return new ArrayBuffer(0);
            }
        }

        const rowLength = 3 * 4 + 3 * 4 + 4 + 4;
        const SH_C0 = 0.28209479177387814;

        const dataView = new DataView(data, headerEndIndex + headerEnd.length);
        const buffer = new ArrayBuffer(rowLength * vertexCount);
        const q = new Quaternion();

        for (let i = 0; i < vertexCount; i++) {
            const position = new Float32Array(buffer, i * rowLength, 3);
            const scale = new Float32Array(buffer, i * rowLength + 12, 3);
            const rgba = new Uint8ClampedArray(buffer, i * rowLength + 24, 4);
            const rot = new Uint8ClampedArray(buffer, i * rowLength + 28, 4);

            let r0: number = 255;
            let r1: number = 0;
            let r2: number = 0;
            let r3: number = 0;

            for (let propertyIndex = 0; propertyIndex < properties.length; propertyIndex++) {
                const property = properties[propertyIndex];
                let value;
                switch (property.type) {
                    case "float":
                        value = dataView.getFloat32(property.offset + i * rowOffset, true);
                        break;
                    case "int":
                        value = dataView.getInt32(property.offset + i * rowOffset, true);
                        break;
                    default:
                        throw new Error(`Unsupported property type: ${property.type}`);
                }

                switch (property.name) {
                    case "x":
                        position[0] = value;
                        break;
                    case "y":
                        position[1] = value;
                        break;
                    case "z":
                        position[2] = value;
                        break;
                    case "scale_0":
                        scale[0] = Math.exp(value);
                        break;
                    case "scale_1":
                        scale[1] = Math.exp(value);
                        break;
                    case "scale_2":
                        scale[2] = Math.exp(value);
                        break;
                    case "red":
                        rgba[0] = value;
                        break;
                    case "green":
                        rgba[1] = value;
                        break;
                    case "blue":
                        rgba[2] = value;
                        break;
                    case "f_dc_0":
                        rgba[0] = (0.5 + SH_C0 * value) * 255;
                        break;
                    case "f_dc_1":
                        rgba[1] = (0.5 + SH_C0 * value) * 255;
                        break;
                    case "f_dc_2":
                        rgba[2] = (0.5 + SH_C0 * value) * 255;
                        break;
                    case "f_dc_3":
                        rgba[3] = (0.5 + SH_C0 * value) * 255;
                        break;
                    case "opacity":
                        rgba[3] = (1 / (1 + Math.exp(-value))) * 255;
                        break;
                    case "rot_0":
                        r0 = value;
                        break;
                    case "rot_1":
                        r1 = value;
                        break;
                    case "rot_2":
                        r2 = value;
                        break;
                    case "rot_3":
                        r3 = value;
                        break;
                }
            }

            q.set(r1, r2, r3, r0);
            q.normalize();
            rot[0] = q.w * 128 + 128;
            rot[1] = q.x * 128 + 128;
            rot[2] = q.y * 128 + 128;
            rot[3] = q.z * 128 + 128;
        }

        return buffer;
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
        await gaussianSplatting.loadFileAsync(rootUrl + fileName);
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
        return gaussianSplatting.loadDataAsync(this._loadPLY(data));
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
