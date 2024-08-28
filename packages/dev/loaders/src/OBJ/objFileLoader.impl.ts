// eslint-disable-next-line import/no-internal-modules
import type { AbstractMesh, ISceneLoaderAsyncResult, Mesh, Nullable, Scene, WebRequest } from "core/index";
import type { OBJLoadingOptions } from "./objLoadingOptions";

import { AssetContainer } from "core/assetContainer";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { Tools } from "core/Misc/tools";
import { MTLFileLoader } from "./mtlFileLoader";
import { SolidParser } from "./solidParser";

/**
 * @internal
 * Calls synchronously the MTL file attached to this obj.
 * Load function or importMesh function don't enable to load 2 files in the same time asynchronously.
 * Without this function materials are not displayed in the first frame (but displayed after).
 * In consequence it is impossible to get material information in your HTML file
 *
 * @param url The URL of the MTL file
 * @param rootUrl defines where to load data from
 * @param onSuccess Callback function to be called when the MTL file is loaded
 * @param onFailure
 */
function loadMTL(url: string, rootUrl: string, onSuccess: (response: string | ArrayBuffer, responseUrl?: string) => any, onFailure: (pathOfFile: string, exception?: any) => void) {
    //The complete path to the mtl file
    const pathOfFile = rootUrl + url;

    // Loads through the babylon tools to allow fileInput search.
    Tools.LoadFile(pathOfFile, onSuccess, undefined, undefined, false, (request?: WebRequest | undefined, exception?: any) => {
        onFailure(pathOfFile, exception);
    });
}

/**
 * @internal
 * Read the OBJ file and create an Array of meshes.
 * Each mesh contains all information given by the OBJ and the MTL file.
 * i.e. vertices positions and indices, optional normals values, optional UV values, optional material
 * @param meshesNames defines a string or array of strings of the mesh names that should be loaded from the file
 * @param scene defines the scene where are displayed the data
 * @param assetContainer defines the asset container to store the material in (can be null)
 * @param loadingOptions options for loading and parsing OBJ/MTL files.
 * @param data defines the content of the obj file
 * @param rootUrl defines the path to the folder
 * @returns the list of loaded meshes
 */
export function parseSolid(
    meshesNames: any,
    scene: Scene,
    assetContainer: Nullable<AssetContainer>,
    loadingOptions: OBJLoadingOptions,
    data: string,
    rootUrl: string
): Promise<Array<AbstractMesh>> {
    let fileToLoad: string = ""; //The name of the mtlFile to load
    const materialsFromMTLFile: MTLFileLoader = new MTLFileLoader();
    const materialToUse: string[] = [];
    const babylonMeshesArray: Array<Mesh> = []; //The mesh for babylon

    // Sanitize data
    data = data.replace(/#.*$/gm, "").trim();

    // Main function
    const solidParser = new SolidParser(materialToUse, babylonMeshesArray, loadingOptions);

    solidParser.parse(meshesNames, data, scene, assetContainer, (fileName: string) => {
        fileToLoad = fileName;
    });

    // load the materials
    const mtlPromises: Array<Promise<void>> = [];
    // Check if we have a file to load
    if (fileToLoad !== "" && !loadingOptions.skipMaterials) {
        //Load the file synchronously
        mtlPromises.push(
            new Promise((resolve, reject) => {
                loadMTL(
                    fileToLoad,
                    rootUrl,
                    (dataLoaded) => {
                        try {
                            //Create materials thanks MTLLoader function
                            materialsFromMTLFile.parseMTL(scene, dataLoaded, rootUrl, assetContainer);
                            //Look at each material loaded in the mtl file
                            for (let n = 0; n < materialsFromMTLFile.materials.length; n++) {
                                //Three variables to get all meshes with the same material
                                let startIndex = 0;
                                const _indices = [];
                                let _index;

                                //The material from MTL file is used in the meshes loaded
                                //Push the indice in an array
                                //Check if the material is not used for another mesh
                                while ((_index = materialToUse.indexOf(materialsFromMTLFile.materials[n].name, startIndex)) > -1) {
                                    _indices.push(_index);
                                    startIndex = _index + 1;
                                }
                                //If the material is not used dispose it
                                if (_index === -1 && _indices.length === 0) {
                                    //If the material is not needed, remove it
                                    materialsFromMTLFile.materials[n].dispose();
                                } else {
                                    for (let o = 0; o < _indices.length; o++) {
                                        //Apply the material to the Mesh for each mesh with the material
                                        const mesh = babylonMeshesArray[_indices[o]];
                                        const material = materialsFromMTLFile.materials[n];
                                        mesh.material = material;

                                        if (!mesh.getTotalIndices()) {
                                            // No indices, we need to turn on point cloud
                                            material.pointsCloud = true;
                                        }
                                    }
                                }
                            }
                            resolve();
                        } catch (e) {
                            Tools.Warn(`Error processing MTL file: '${fileToLoad}'`);
                            if (loadingOptions.materialLoadingFailsSilently) {
                                resolve();
                            } else {
                                reject(e);
                            }
                        }
                    },
                    (pathOfFile: string, exception?: any) => {
                        Tools.Warn(`Error downloading MTL file: '${fileToLoad}'`);
                        if (loadingOptions.materialLoadingFailsSilently) {
                            resolve();
                        } else {
                            reject(exception);
                        }
                    }
                );
            })
        );
    }
    //Return an array with all Mesh
    return Promise.all(mtlPromises).then(() => {
        const isLine = (mesh: AbstractMesh) => Boolean(mesh._internalMetadata?.["_isLine"] ?? false);

        // Iterate over the mesh, determine if it is a line mesh, clone or modify the material to line rendering.
        babylonMeshesArray.forEach((mesh) => {
            if (isLine(mesh)) {
                let mat = mesh.material ?? new StandardMaterial(mesh.name + "_line", scene);
                // If another mesh is using this material and it is not a line then we need to clone it.
                const needClone = mat.getBindedMeshes().filter((e) => !isLine(e)).length > 0;
                if (needClone) {
                    mat = mat.clone(mat.name + "_line") ?? mat;
                }
                mat.wireframe = true;
                mesh.material = mat;
                if (mesh._internalMetadata) {
                    mesh._internalMetadata["_isLine"] = undefined;
                }
            }
        });

        return babylonMeshesArray;
    });
}

/**
 * @internal
 */
export async function importMeshAsync(
    meshesNames: any,
    scene: Scene,
    assetContainer: Nullable<AssetContainer>,
    loadingOptions: OBJLoadingOptions,
    data: any,
    rootUrl: string
): Promise<ISceneLoaderAsyncResult> {
    //get the meshes from OBJ file
    const meshes = await parseSolid(meshesNames, scene, assetContainer, loadingOptions, data, rootUrl);
    return {
        meshes,
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
 * @internal
 */
export async function loadAssetContainerAsync(scene: Scene, loadingOptions: OBJLoadingOptions, data: string, rootUrl: string): Promise<AssetContainer> {
    const container = new AssetContainer();

    return importMeshAsync(null, scene, container, loadingOptions, data, rootUrl)
        .then((result) => {
            result.meshes.forEach((mesh) => container.meshes.push(mesh));
            result.meshes.forEach((mesh) => {
                const material = mesh.material;
                if (material) {
                    // Materials
                    if (container.materials.indexOf(material) == -1) {
                        container.materials.push(material);

                        // Textures
                        const textures = material.getActiveTextures();
                        textures.forEach((t) => {
                            if (container.textures.indexOf(t) == -1) {
                                container.textures.push(t);
                            }
                        });
                    }
                }
            });
            return container;
        })
        .catch((ex) => {
            throw ex;
        });
}
