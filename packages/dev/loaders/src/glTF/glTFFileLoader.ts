import type { AssetContainer } from "core/assetContainer";
import type { Camera } from "core/Cameras/camera";
import type { ISceneLoaderPluginExtensions, ISceneLoaderAsyncResult, ISceneLoaderPlugin, ISceneLoaderPluginAsync } from "core/Loading/sceneLoader";
import { SceneLoader } from "core/Loading/sceneLoader";
import type { Material } from "core/Materials/material";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import { DataReader } from "core/Misc/dataReader";
import { Observable } from "core/Misc/observable";
import { GLTFValidation } from "./glTFValidation";
import type { ILoader, ILoaderData } from "./abstractFileLoader";
import { AbstractFileLoader, readAsync } from "./abstractFileLoader";
import { DecodeBase64UrlToBinary } from "core/Misc/fileTools";
import { RuntimeError, ErrorCodes } from "core/Misc/error";
import type { TransformNode } from "core/Meshes/transformNode";
import type { Scene } from "core/scene";

/**
 * Mode that determines the coordinate system to use.
 */
export enum GLTFLoaderCoordinateSystemMode {
    /**
     * Automatically convert the glTF right-handed data to the appropriate system based on the current coordinate system mode of the scene.
     */
    AUTO,

    /**
     * Sets the useRightHandedSystem flag on the scene.
     */
    FORCE_RIGHT_HANDED,
}

/**
 * Mode that determines what animations will start.
 */
export enum GLTFLoaderAnimationStartMode {
    /**
     * No animation will start.
     */
    NONE,

    /**
     * The first animation will start.
     */
    FIRST,

    /**
     * All animations will start.
     */
    ALL,
}

// back-compat
export type { ILoaderData as IGLTFLoaderData };

export class GLTFFileLoader extends AbstractFileLoader {
    /** @hidden */
    public static _CreateGLTF1Loader: (parent: AbstractFileLoader) => ILoader;

    /** @hidden */
    public static _CreateGLTF2Loader: (parent: AbstractFileLoader) => ILoader;
    private static _MagicBase64Encoded = "Z2xURg";
    private static _Binary = {
        magic: 0x46546c67,
    };
    private _materials: Array<Material> = [];
    private _textures: Array<BaseTexture> = [];
    private _cameras: Array<Camera> = [];

    // ----------
    // V1 options
    // ----------

    /**
     * Set this property to false to disable incremental loading which delays the loader from calling the success callback until after loading the meshes and shaders.
     * Textures always loads asynchronously. For example, the success callback can compute the bounding information of the loaded meshes when incremental loading is disabled.
     * Defaults to true.
     * @hidden
     */
    public static IncrementalLoading = true;

    /**
     * Set this property to true in order to work with homogeneous coordinates, available with some converters and exporters.
     * Defaults to false. See https://en.wikipedia.org/wiki/Homogeneous_coordinates.
     * @hidden
     */
    public static HomogeneousCoordinates = false;

    // ----------
    // V2 options
    // ----------

    /**
     * The coordinate system mode. Defaults to AUTO.
     */
    public coordinateSystemMode = GLTFLoaderCoordinateSystemMode.AUTO;

    /**
     * The animation start mode. Defaults to FIRST.
     */
    public animationStartMode = GLTFLoaderAnimationStartMode.FIRST;

    /**
     * Defines if the loader should compile materials before raising the success callback. Defaults to false.
     */
    public compileMaterials = false;

    /**
     * Defines if the loader should also compile materials with clip planes. Defaults to false.
     */
    public useClipPlane = false;

    /**
     * Defines if the loader should compile shadow generators before raising the success callback. Defaults to false.
     */
    public compileShadowGenerators = false;

    /**
     * Defines if the Alpha blended materials are only applied as coverage.
     * If false, (default) The luminance of each pixel will reduce its opacity to simulate the behaviour of most physical materials.
     * If true, no extra effects are applied to transparent pixels.
     */
    public transparencyAsCoverage = false;

    /**
     * Defines if the loader should create instances when multiple glTF nodes point to the same glTF mesh. Defaults to true.
     */
    public createInstances = true;

    /**
     * Defines if the loader should always compute the bounding boxes of meshes and not use the min/max values from the position accessor. Defaults to false.
     */
    public alwaysComputeBoundingBox = false;

    /**
     * If true, load all materials defined in the file, even if not used by any mesh. Defaults to false.
     */
    public loadAllMaterials = false;

    /**
     * If true, load only the materials defined in the file. Defaults to false.
     */
    public loadOnlyMaterials = false;

    /**
     * If true, do not load any materials defined in the file. Defaults to false.
     */
    public skipMaterials = false;

    /**
     * If true, load the color (gamma encoded) textures into sRGB buffers (if supported by the GPU), which will yield more accurate results when sampling the texture. Defaults to true.
     */
    public useSRGBBuffers = true;

    /**
     * When loading glTF animations, which are defined in seconds, target them to this FPS. Defaults to 60.
     */
    public targetFps = 60;

    /**
     * Defines if the loader should always compute the nearest common ancestor of the skeleton joints instead of using `skin.skeleton`. Defaults to false.
     * Set this to true if loading assets with invalid `skin.skeleton` values.
     */
    public alwaysComputeSkeletonRootNode = false;

    /**
     * Name of the loader ("gltf")
     */
    public name = "gltf";
    /** @hidden */
    public extensions: ISceneLoaderPluginExtensions = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ".gltf": { isBinary: false },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ".glb": { isBinary: true },
    };

    /**
     * Callback raised when the loader creates a skin after parsing the glTF properties of the skin node.
     * @see https://doc.babylonjs.com/divingDeeper/importers/glTF/glTFSkinning#ignoring-the-transform-of-the-skinned-mesh
     * @param node - the transform node that corresponds to the original glTF skin node used for animations
     * @param skinnedNode - the transform node that is the skinned mesh itself or the parent of the skinned meshes
     */
    public readonly onSkinLoadedObservable = new Observable<{ node: TransformNode; skinnedNode: TransformNode }>();

    /**
     * Observable raised when the loader creates a texture after parsing the glTF properties of the texture.
     */
    public readonly onTextureLoadedObservable = new Observable<BaseTexture>();

    /**
     * Callback raised when the loader creates a texture after parsing the glTF properties of the texture.
     */
    public set onTextureLoaded(callback: (texture: BaseTexture) => void) {
        this.onTextureLoadedObservable.remove(this._observers.onTextureLoaded);
        this._observers.onTextureLoaded = this.onTextureLoadedObservable.add(callback);
    }

    /**
     * Observable raised when the loader creates a material after parsing the glTF properties of the material.
     */
    public readonly onMaterialLoadedObservable = new Observable<Material>();

    /**
     * Callback raised when the loader creates a material after parsing the glTF properties of the material.
     */
    public set onMaterialLoaded(callback: (material: Material) => void) {
        this.onMaterialLoadedObservable.remove(this._observers.onMaterialLoaded);
        this._observers.onMaterialLoaded = this.onMaterialLoadedObservable.add(callback);
    }

    /**
     * Observable raised when the loader creates a camera after parsing the glTF properties of the camera.
     */
    public readonly onCameraLoadedObservable = new Observable<Camera>();

    /**
     * Callback raised when the loader creates a camera after parsing the glTF properties of the camera.
     */
    public set onCameraLoaded(callback: (camera: Camera) => void) {
        this.onCameraLoadedObservable.remove(this._observers.onCameraLoaded);
        this._observers.onCameraLoaded = this.onCameraLoadedObservable.add(callback);
    }

    /**
     * Observable raised when the loader creates a mesh after parsing the glTF properties of the mesh.
     * Note that the observable is raised as soon as the mesh object is created, meaning some data may not have been setup yet for this mesh (vertex data, morph targets, material, ...)
     */
    public readonly onMeshLoadedObservable = new Observable<AbstractMesh>();

    /**
     * Callback raised when the loader creates a mesh after parsing the glTF properties of the mesh.
     * Note that the callback is called as soon as the mesh object is created, meaning some data may not have been setup yet for this mesh (vertex data, morph targets, material, ...)
     */
    public set onMeshLoaded(callback: (mesh: AbstractMesh) => void) {
        this.onMeshLoadedObservable.remove(this._observers.onMeshLoaded);
        this._observers.onMeshLoaded = this.onMeshLoadedObservable.add(callback);
    }

    protected _loadAssetContainer(_container: AssetContainer): void {
        // Get materials/textures when loading to add to container
        this._materials.length = 0;
        this.onMaterialLoadedObservable.add((material) => {
            this._materials.push(material);
        });
        this._textures.length = 0;
        this.onTextureLoadedObservable.add((texture) => {
            this._textures.push(texture);
        });
        this._cameras.length = 0;
        this.onCameraLoadedObservable.add((camera) => {
            this._cameras.push(camera);
        });
    }
    protected _importMeshAsyncDone(result: ISceneLoaderAsyncResult, container: AssetContainer): void {
        Array.prototype.push.apply(container.materials, this._materials);
        Array.prototype.push.apply(container.textures, this._textures);
        Array.prototype.push.apply(container.cameras, this._cameras);
    }
    public canDirectLoad(data: string): boolean {
        return (
            (data.indexOf("asset") !== -1 && data.indexOf("version") !== -1) ||
            data.startsWith("data:base64," + GLTFFileLoader._MagicBase64Encoded) || // this is technically incorrect, but will continue to support for backcompat.
            data.startsWith("data:;base64," + GLTFFileLoader._MagicBase64Encoded) ||
            data.startsWith("data:application/octet-stream;base64," + GLTFFileLoader._MagicBase64Encoded) ||
            data.startsWith("data:model/gltf-binary;base64," + GLTFFileLoader._MagicBase64Encoded)
        );
    }

    /**
     * @param scene
     * @param data
     * @hidden
     */
    public directLoad(scene: Scene, data: string): Promise<any> {
        if (
            data.startsWith("base64," + GLTFFileLoader._MagicBase64Encoded) || // this is technically incorrect, but will continue to support for backcompat.
            data.startsWith(";base64," + GLTFFileLoader._MagicBase64Encoded) ||
            data.startsWith("application/octet-stream;base64," + GLTFFileLoader._MagicBase64Encoded) ||
            data.startsWith("model/gltf-binary;base64," + GLTFFileLoader._MagicBase64Encoded)
        ) {
            const arrayBuffer = DecodeBase64UrlToBinary(data);

            this._validate(scene, arrayBuffer);
            return this._unpackBinaryAsync(
                new DataReader({
                    readAsync: (byteOffset, byteLength) => readAsync(arrayBuffer, byteOffset, byteLength),
                    byteLength: arrayBuffer.byteLength,
                })
            );
        }

        this._validate(scene, data);
        return Promise.resolve({ json: this._parseJson(data) });
    }

    /**
     * The callback that allows custom handling of the root url based on the response url.
     * @param rootUrl the original root url
     * @param responseURL the response url if available
     * @returns the new root url
     */
    public rewriteRootURL?(rootUrl: string, responseURL?: string): string;

    /** @hidden */
    public createPlugin(): ISceneLoaderPlugin | ISceneLoaderPluginAsync {
        return new GLTFFileLoader();
    }

    // TODO - make sure everything is cleared here correctly
    public dispose(): void {
        super.dispose();
        this.onMeshLoadedObservable.clear();
        this.onTextureLoadedObservable.clear();
        this.onMaterialLoadedObservable.clear();
        this.onCameraLoadedObservable.clear();
        this.onSkinLoadedObservable.clear();
    }
    protected _runValidationAsync(data: string | ArrayBuffer, rootUrl: string, fileName: string, getExternalResource: (uri: string) => Promise<ArrayBuffer>): Promise<any> {
        return GLTFValidation.ValidateAsync(data, rootUrl, fileName, getExternalResource);
    }
    protected _getLoaders(): { [key: number]: (parent: AbstractFileLoader) => ILoader } {
        return {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            1: GLTFFileLoader._CreateGLTF1Loader,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            2: GLTFFileLoader._CreateGLTF2Loader,
        };
    }
    protected _onBinaryDataUnpacked(dataReader: DataReader): Promise<ILoaderData> {
        const magic = dataReader.readUint32();
        if (magic !== GLTFFileLoader._Binary.magic) {
            throw new RuntimeError("Unexpected magic: " + magic, ErrorCodes.GLTFLoaderUnexpectedMagicError);
        }

        const version = dataReader.readUint32();

        if (this.loggingEnabled) {
            this._log(`Binary version: ${version}`);
        }

        const length = dataReader.readUint32();
        if (dataReader.buffer.byteLength !== 0 && length !== dataReader.buffer.byteLength) {
            throw new Error(`Length in header does not match actual data length: ${length} != ${dataReader.buffer.byteLength}`);
        }

        switch (version) {
            case 1: {
                return this._unpackBinaryV1Async(dataReader, length);
            }
            case 2: {
                return this._unpackBinaryV2Async(dataReader, length);
            }
            default: {
                throw new Error("Unsupported version: " + version);
            }
        }
    }

    private _unpackBinaryV1Async(dataReader: DataReader, length: number): Promise<ILoaderData> {
        const ContentFormat = {
            JSON: 0,
        };

        const contentLength = dataReader.readUint32();
        const contentFormat = dataReader.readUint32();

        if (contentFormat !== ContentFormat.JSON) {
            throw new Error(`Unexpected content format: ${contentFormat}`);
        }

        const bodyLength = length - dataReader.byteOffset;

        const data: ILoaderData = { json: this._parseJson(dataReader.readString(contentLength)), bin: null };
        if (bodyLength !== 0) {
            const startByteOffset = dataReader.byteOffset;
            data.bin = {
                readAsync: (byteOffset, byteLength) => dataReader.buffer.readAsync(startByteOffset + byteOffset, byteLength),
                byteLength: bodyLength,
            };
        }

        return Promise.resolve(data);
    }

    private _unpackBinaryV2Async(dataReader: DataReader, length: number): Promise<ILoaderData> {
        const ChunkFormat = {
            JSON: 0x4e4f534a,
            BIN: 0x004e4942,
        };

        // Read the JSON chunk header.
        const chunkLength = dataReader.readUint32();
        const chunkFormat = dataReader.readUint32();
        if (chunkFormat !== ChunkFormat.JSON) {
            throw new Error("First chunk format is not JSON");
        }

        // Bail if there are no other chunks.
        if (dataReader.byteOffset + chunkLength === length) {
            return dataReader.loadAsync(chunkLength).then(() => {
                return { json: this._parseJson(dataReader.readString(chunkLength)), bin: null };
            });
        }

        // Read the JSON chunk and the length and type of the next chunk.
        return dataReader.loadAsync(chunkLength + 8).then(() => {
            const data: ILoaderData = { json: this._parseJson(dataReader.readString(chunkLength)), bin: null };

            const readAsync = (): Promise<ILoaderData> => {
                const chunkLength = dataReader.readUint32();
                const chunkFormat = dataReader.readUint32();

                switch (chunkFormat) {
                    case ChunkFormat.JSON: {
                        throw new Error("Unexpected JSON chunk");
                    }
                    case ChunkFormat.BIN: {
                        const startByteOffset = dataReader.byteOffset;
                        data.bin = {
                            readAsync: (byteOffset, byteLength) => dataReader.buffer.readAsync(startByteOffset + byteOffset, byteLength),
                            byteLength: chunkLength,
                        };
                        dataReader.skipBytes(chunkLength);
                        break;
                    }
                    default: {
                        // ignore unrecognized chunkFormat
                        dataReader.skipBytes(chunkLength);
                        break;
                    }
                }

                if (dataReader.byteOffset !== length) {
                    return dataReader.loadAsync(8).then(readAsync);
                }

                return Promise.resolve(data);
            };

            return readAsync();
        });
    }
}

if (SceneLoader) {
    SceneLoader.RegisterPlugin(new GLTFFileLoader());
}
