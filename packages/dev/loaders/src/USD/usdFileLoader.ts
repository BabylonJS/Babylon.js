import type { ISceneLoaderPluginAsync, ISceneLoaderPluginFactory, ISceneLoaderAsyncResult, ISceneLoaderProgressEvent } from "core/Loading/sceneLoader";
import { registerSceneLoaderPlugin } from "core/Loading/sceneLoader";
import { USDFileLoaderMetadata } from "./usdFileLoader.metadata";
import { AssetContainer } from "core/assetContainer";
import type { Scene } from "core/scene";
import type { Nullable } from "core/types";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import { Mesh } from "core/Meshes/mesh";
import { VertexData } from "core/Meshes/mesh.vertexData";
import { RawTexture } from "core/Materials/Textures/rawTexture";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { Texture } from "core/Materials/Textures/texture";
import { Engine } from "core/Engines/engine";
import { IsWindowObjectExist } from "core/Misc/domManagement";
import { Tools } from "core/Misc/tools";
import { Constants } from "core/Engines/constants";

/**
 * @experimental
 * USD(z) file type loader.
 * This is a babylon scene loader plugin.
 */
export class USDFileLoader implements ISceneLoaderPluginAsync, ISceneLoaderPluginFactory {
    /**
     * Defines the name of the plugin.
     */
    public readonly name = USDFileLoaderMetadata.name;

    private _assetContainer: Nullable<AssetContainer> = null;

    /**
     * Defines the extensions the UDS loader is able to load.
     * force data to come in as an ArrayBuffer
     */
    public readonly extensions = USDFileLoaderMetadata.extensions;

    /**
     * Creates loader for gaussian USD files
     */
    constructor() {}

    /** @internal */
    createPlugin(): ISceneLoaderPluginAsync {
        return new USDFileLoader();
    }

    /**
     * Imports from the loaded USD data and adds them to the scene
     * @param meshesNames a string or array of strings of the mesh names that should be loaded from the file
     * @param scene the scene the meshes should be added to
     * @param data the USD data to load
     * @param rootUrl root url to load from
     * @param onProgress callback called while file is loading
     * @param fileName Defines the name of the file to load
     * @returns a promise containing the loaded meshes, particles, skeletons and animations
     */
    public async importMeshAsync(
        meshesNames: any,
        scene: Scene,
        data: any,
        rootUrl: string,
        onProgress?: (event: ISceneLoaderProgressEvent) => void,
        fileName?: string
    ): Promise<ISceneLoaderAsyncResult> {
        return this._parse(meshesNames, scene, data, rootUrl).then((meshes) => {
            return {
                meshes: meshes,
                particleSystems: [],
                skeletons: [],
                animationGroups: [],
                transformNodes: [],
                geometries: [],
                lights: [],
                spriteManagers: [],
            };
        });
    }
    private static _UniqueResolveID = 1000;

    private static _LoadScriptModuleAsync(scriptUrl: string, scriptId?: string): Promise<any> {
        return new Promise((resolve, reject) => {
            // Need a relay
            let windowAsAny: any;
            let windowString: string;

            if (IsWindowObjectExist()) {
                windowAsAny = window;
                windowString = "window";
            } else if (typeof self !== "undefined") {
                windowAsAny = self;
                windowString = "self";
            } else {
                reject(new Error("Cannot load script module outside of a window or a worker"));
                return;
            }

            if (!windowAsAny._LoadScriptModuleResolve) {
                windowAsAny._LoadScriptModuleResolve = {};
            }
            windowAsAny._LoadScriptModuleResolve[USDFileLoader._UniqueResolveID] = resolve;

            scriptUrl += `
                ${windowString}._LoadScriptModuleResolve[${USDFileLoader._UniqueResolveID}](returnedValue);
                ${windowString}._LoadScriptModuleResolve[${USDFileLoader._UniqueResolveID}] = undefined;
            `;
            USDFileLoader._UniqueResolveID++;

            Tools.LoadScript(
                scriptUrl,
                undefined,
                (message, exception) => {
                    reject(exception || new Error(message));
                },
                scriptId,
                true
            );
        });
    }

    private _initializeTinyUSDZAsync(): Promise<void> {
        return USDFileLoader._LoadScriptModuleAsync(
            `
            import Module from 'https://lighttransport.github.io/tinyusdz/tinyusdz.js';
            const returnedValue = await Module();
            `
        );
    }

    private _parse(meshesNames: any, scene: Scene, data: any, rootUrl: string): Promise<Array<AbstractMesh>> {
        const babylonMeshesArray: Array<Mesh> = []; //The mesh for babylon

        return new Promise((resolve) => {
            this._initializeTinyUSDZAsync().then((tinyusdzModule: any) => {
                const usd = new tinyusdzModule.TinyUSDZLoader(data);
                const textures: { [key: string]: Texture } = {};
                for (let i = 0; i < usd.numMeshes(); i++) {
                    const mesh = usd.getMesh(i);
                    const customMesh = new Mesh(`usdMesh-${i}`, scene);
                    customMesh._parentContainer = this._assetContainer;
                    const vertexData = new VertexData();
                    vertexData.positions = Array.from(mesh.points);
                    // flip position x instead of changing scaling.x
                    if (!scene.useRightHandedSystem) {
                        for (let positionIndex = 0; positionIndex < vertexData.positions.length; positionIndex += 3) {
                            vertexData.positions[positionIndex] *= -1;
                        }
                    }
                    vertexData.indices = Array.from(mesh.faceVertexIndices.reverse());
                    if (mesh.hasOwnProperty("texcoords")) {
                        vertexData.uvs = Array.from(mesh.texcoords);
                    }
                    if (mesh.hasOwnProperty("normals")) {
                        vertexData.normals = Array.from(mesh.normals);
                    } else {
                        vertexData.normals = [];
                        VertexData.ComputeNormals(vertexData.positions, vertexData.indices, vertexData.normals, { useRightHandedSystem: !scene.useRightHandedSystem });
                    }
                    vertexData.applyToMesh(customMesh);

                    const usdMaterial = usd.getMaterial(mesh.materialId);
                    if (usdMaterial.hasOwnProperty("diffuseColorTextureId")) {
                        const material = new StandardMaterial("usdMaterial", scene);
                        customMesh.material = material;

                        if (!textures.hasOwnProperty(usdMaterial.diffuseColorTextureId)) {
                            const diffTex = usd.getTexture(usdMaterial.diffuseColorTextureId);
                            const img = usd.getImage(diffTex.textureImageId);
                            const texture = new RawTexture(img.data, img.width, img.height, Engine.TEXTUREFORMAT_RGBA, scene, false, true, Texture.LINEAR_LINEAR);
                            material.diffuseTexture = texture;
                            textures[usdMaterial.diffuseColorTextureId] = texture;
                            material.sideOrientation = Constants.MATERIAL_ClockWiseSideOrientation;
                        } else {
                            material.diffuseTexture = textures[usdMaterial.diffuseColorTextureId];
                        }
                    }
                    babylonMeshesArray.push(mesh);
                }
                resolve(babylonMeshesArray);
            });
        });
    }

    /**
     * Load into an asset container.
     * @param scene The scene to load into
     * @param data The data to import
     * @param rootUrl The root url for scene and resources
     * @returns The loaded asset container
     */
    public loadAssetContainerAsync(scene: Scene, data: string, rootUrl: string): Promise<AssetContainer> {
        const container = new AssetContainer(scene);
        this._assetContainer = container;

        return this.importMeshAsync(null, scene, data, rootUrl)
            .then((result) => {
                result.meshes.forEach((mesh) => container.meshes.push(mesh));
                // mesh material will be null before 1st rendered frame.
                this._assetContainer = null;
                return container;
            })
            .catch((ex) => {
                this._assetContainer = null;
                throw ex;
            });
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
}

// Add this loader into the register plugin
registerSceneLoaderPlugin(new USDFileLoader());
