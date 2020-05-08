import { FloatArray, IndicesArray } from "babylonjs/types";
import { Vector3, Vector2 } from "babylonjs/Maths/math.vector";
import { Color4 } from 'babylonjs/Maths/math.color';
import { Tools } from "babylonjs/Misc/tools";
import { VertexData } from "babylonjs/Meshes/mesh.vertexData";
import { Geometry } from "babylonjs/Meshes/geometry";
import { AnimationGroup } from "babylonjs/Animations/animationGroup";
import { Skeleton } from "babylonjs/Bones/skeleton";
import { IParticleSystem } from "babylonjs/Particles/IParticleSystem";
import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
import { Mesh } from "babylonjs/Meshes/mesh";
import { SceneLoader, ISceneLoaderPluginAsync, SceneLoaderProgressEvent, ISceneLoaderPluginFactory, ISceneLoaderPlugin } from "babylonjs/Loading/sceneLoader";

import { AssetContainer } from "babylonjs/assetContainer";
import { Scene } from "babylonjs/scene";
import { WebRequest } from 'babylonjs/Misc/webRequest';
import { MTLFileLoader } from './mtlFileLoader';

type MeshObject = {
    name: string;
    indices?: Array<number>;
    positions?: Array<number>;
    normals?: Array<number>;
    colors?: Array<number>;
    uvs?: Array<number>;
    materialName: string;
};

/**
 * Options for loading OBJ/MTL files
 */
type MeshLoadOptions = {
    /**
     * Defines if UVs are optimized by default during load.
     */
    OptimizeWithUV: boolean,
    /**
     * Defines custom scaling of UV coordinates of loaded meshes.
     */
    UVScaling: Vector2;
    /**
     * Invert model on y-axis (does a model scaling inversion)
     */
    InvertY: boolean,
    /**
     * Invert Y-Axis of referenced textures on load
     */
    InvertTextureY: boolean;
    /**
     * Include in meshes the vertex colors available in some OBJ files.  This is not part of OBJ standard.
     */
    ImportVertexColors: boolean,
    /**
     * Compute the normals for the model, even if normals are present in the file.
     */
    ComputeNormals: boolean,
    /**
     * Skip loading the materials even if defined in the OBJ file (materials are ignored).
     */
    SkipMaterials: boolean,
    /**
     * When a material fails to load OBJ loader will silently fail and onSuccess() callback will be triggered.
     */
    MaterialLoadingFailsSilently: boolean
};

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
        return MTLFileLoader.INVERT_TEXTURE_Y;
    }

    public static set INVERT_TEXTURE_Y(value: boolean) {
        MTLFileLoader.INVERT_TEXTURE_Y = value;
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
     * Defines the name of the plugin.
     */
    public name = "obj";
    /**
     * Defines the extension the plugin is able to load.
     */
    public extensions = ".obj";
    /** @hidden */
    public obj = /^o/;
    /** @hidden */
    public group = /^g/;
    /** @hidden */
    public mtllib = /^mtllib /;
    /** @hidden */
    public usemtl = /^usemtl /;
    /** @hidden */
    public smooth = /^s /;
    /** @hidden */
    public vertexPattern = /v( +[\d|\.|\+|\-|e|E]+){3,7}/;
    // vn float float float
    /** @hidden */
    public normalPattern = /vn( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)/;
    // vt float float
    /** @hidden */
    public uvPattern = /vt( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)/;
    // f vertex vertex vertex ...
    /** @hidden */
    public facePattern1 = /f\s+(([\d]{1,}[\s]?){3,})+/;
    // f vertex/uvs vertex/uvs vertex/uvs ...
    /** @hidden */
    public facePattern2 = /f\s+((([\d]{1,}\/[\d]{1,}[\s]?){3,})+)/;
    // f vertex/uvs/normal vertex/uvs/normal vertex/uvs/normal ...
    /** @hidden */
    public facePattern3 = /f\s+((([\d]{1,}\/[\d]{1,}\/[\d]{1,}[\s]?){3,})+)/;
    // f vertex//normal vertex//normal vertex//normal ...
    /** @hidden */
    public facePattern4 = /f\s+((([\d]{1,}\/\/[\d]{1,}[\s]?){3,})+)/;
    // f -vertex/-uvs/-normal -vertex/-uvs/-normal -vertex/-uvs/-normal ...
    /** @hidden */
    public facePattern5 = /f\s+(((-[\d]{1,}\/-[\d]{1,}\/-[\d]{1,}[\s]?){3,})+)/;

    private _forAssetContainer = false;

    private _meshLoadOptions: MeshLoadOptions;

    /**
     * Creates loader for .OBJ files
     *
     * @param meshLoadOptions options for loading and parsing OBJ/MTL files.
     */
    constructor(meshLoadOptions?: MeshLoadOptions) {
        this._meshLoadOptions = meshLoadOptions || OBJFileLoader.currentMeshLoadOptions;
    }

    private static get currentMeshLoadOptions(): MeshLoadOptions {
        return {
            ComputeNormals: OBJFileLoader.COMPUTE_NORMALS,
            ImportVertexColors: OBJFileLoader.IMPORT_VERTEX_COLORS,
            InvertY: OBJFileLoader.INVERT_Y,
            InvertTextureY: OBJFileLoader.INVERT_TEXTURE_Y,
            UVScaling: OBJFileLoader.UV_SCALING,
            MaterialLoadingFailsSilently: OBJFileLoader.MATERIAL_LOADING_FAILS_SILENTLY,
            OptimizeWithUV: OBJFileLoader.OPTIMIZE_WITH_UV,
            SkipMaterials: OBJFileLoader.SKIP_MATERIALS
        };
    }

    /**
     * Calls synchronously the MTL file attached to this obj.
     * Load function or importMesh function don't enable to load 2 files in the same time asynchronously.
     * Without this function materials are not displayed in the first frame (but displayed after).
     * In consequence it is impossible to get material information in your HTML file
     *
     * @param url The URL of the MTL file
     * @param rootUrl
     * @param onSuccess Callback function to be called when the MTL file is loaded
     * @private
     */
    private _loadMTL(url: string, rootUrl: string, onSuccess: (response: string | ArrayBuffer, responseUrl?: string) => any, onFailure: (pathOfFile: string, exception?: any) => void) {
        //The complete path to the mtl file
        var pathOfFile = Tools.BaseUrl + rootUrl + url;

        // Loads through the babylon tools to allow fileInput search.
        Tools.LoadFile(
            pathOfFile,
            onSuccess,
            undefined,
            undefined,
            false,
            (request?: WebRequest | undefined, exception?: any) => {
                onFailure(pathOfFile, exception);
            }
        );
    }

    /**
     * Instantiates a OBJ file loader plugin.
     * @returns the created plugin
     */
    createPlugin(): ISceneLoaderPluginAsync | ISceneLoaderPlugin {
        return new OBJFileLoader(OBJFileLoader.currentMeshLoadOptions);
    }

    /**
     * If the data string can be loaded directly.
     *
     * @param data string containing the file data
     * @returns if the data can be loaded directly
     */
    public canDirectLoad(data: string): boolean {
        return false;
    }

    /**
     * Imports one or more meshes from the loaded OBJ data and adds them to the scene
     * @param meshesNames a string or array of strings of the mesh names that should be loaded from the file
     * @param scene the scene the meshes should be added to
     * @param data the OBJ data to load
     * @param rootUrl root url to load from
     * @param onProgress event that fires when loading progress has occured
     * @param fileName Defines the name of the file to load
     * @returns a promise containg the loaded meshes, particles, skeletons and animations
     */
    public importMeshAsync(meshesNames: any, scene: Scene, data: any, rootUrl: string, onProgress?: (event: SceneLoaderProgressEvent) => void, fileName?: string): Promise<{ meshes: AbstractMesh[], particleSystems: IParticleSystem[], skeletons: Skeleton[], animationGroups: AnimationGroup[] }> {
        //get the meshes from OBJ file
        return this._parseSolid(meshesNames, scene, data, rootUrl).then((meshes) => {
            return {
                meshes,
                particleSystems: [],
                skeletons: [],
                animationGroups: []
            };
        });
    }

    /**
     * Imports all objects from the loaded OBJ data and adds them to the scene
     * @param scene the scene the objects should be added to
     * @param data the OBJ data to load
     * @param rootUrl root url to load from
     * @param onProgress event that fires when loading progress has occured
     * @param fileName Defines the name of the file to load
     * @returns a promise which completes when objects have been loaded to the scene
     */
    public loadAsync(scene: Scene, data: string, rootUrl: string, onProgress?: (event: SceneLoaderProgressEvent) => void, fileName?: string): Promise<void> {
        //Get the 3D model
        return this.importMeshAsync(null, scene, data, rootUrl, onProgress).then(() => {
            // return void
        });
    }

    /**
     * Load into an asset container.
     * @param scene The scene to load into
     * @param data The data to import
     * @param rootUrl The root url for scene and resources
     * @param onProgress The callback when the load progresses
     * @param fileName Defines the name of the file to load
     * @returns The loaded asset container
     */
    public loadAssetContainerAsync(scene: Scene, data: string, rootUrl: string, onProgress?: (event: SceneLoaderProgressEvent) => void, fileName?: string): Promise<AssetContainer> {
        this._forAssetContainer = true;

        return this.importMeshAsync(null, scene, data, rootUrl).then((result) => {
            var container = new AssetContainer(scene);
            result.meshes.forEach((mesh) => container.meshes.push(mesh));
            result.meshes.forEach((mesh) => {
                var material = mesh.material;
                if (material) {
                    // Materials
                    if (container.materials.indexOf(material) == -1) {
                        container.materials.push(material);

                        // Textures
                        var textures = material.getActiveTextures();
                        textures.forEach((t) => {
                            if (container.textures.indexOf(t) == -1) {
                                container.textures.push(t);
                            }
                        });
                    }
                }
            });
            this._forAssetContainer = false;
            return container;
        }).catch((ex) => {
            this._forAssetContainer = false;
            throw ex;
        });
    }

    /**
     * Read the OBJ file and create an Array of meshes.
     * Each mesh contains all information given by the OBJ and the MTL file.
     * i.e. vertices positions and indices, optional normals values, optional UV values, optional material
     *
     * @param meshesNames
     * @param scene Scene The scene where are displayed the data
     * @param data String The content of the obj file
     * @param rootUrl String The path to the folder
     * @returns Array<AbstractMesh>
     * @private
     */
    private _parseSolid(meshesNames: any, scene: Scene, data: string, rootUrl: string): Promise<Array<AbstractMesh>> {
        var positions: Array<Vector3> = [];      //values for the positions of vertices
        var normals: Array<Vector3> = [];      //Values for the normals
        var uvs: Array<Vector2> = [];      //Values for the textures
        var colors: Array<Color4> = [];
        var meshesFromObj: Array<MeshObject> = [];      //[mesh] Contains all the obj meshes
        var handledMesh: MeshObject;      //The current mesh of meshes array
        var indicesForBabylon: Array<number> = [];      //The list of indices for VertexData
        var wrappedPositionForBabylon: Array<Vector3> = [];      //The list of position in vectors
        var wrappedUvsForBabylon: Array<Vector2> = [];      //Array with all value of uvs to match with the indices
        var wrappedColorsForBabylon: Array<Color4> = []; // Array with all color values to match with the indices
        var wrappedNormalsForBabylon: Array<Vector3> = [];      //Array with all value of normals to match with the indices
        var tuplePosNorm: Array<{ normals: Array<number>; idx: Array<number>; uv: Array<number> }> = [];      //Create a tuple with indice of Position, Normal, UV  [pos, norm, uvs]
        var curPositionInIndices = 0;
        var hasMeshes: Boolean = false;   //Meshes are defined in the file
        var unwrappedPositionsForBabylon: Array<number> = [];      //Value of positionForBabylon w/o Vector3() [x,y,z]
        var unwrappedColorsForBabylon: Array<number> = [];       // Value of colorForBabylon w/o Color4() [r,g,b,a]
        var unwrappedNormalsForBabylon: Array<number> = [];      //Value of normalsForBabylon w/o Vector3()  [x,y,z]
        var unwrappedUVForBabylon: Array<number> = [];      //Value of uvsForBabylon w/o Vector3()      [x,y,z]
        var triangles: Array<string> = [];      //Indices from new triangles coming from polygons
        var materialNameFromObj: string = "";      //The name of the current material
        var fileToLoad: string = "";      //The name of the mtlFile to load
        var materialsFromMTLFile: MTLFileLoader = new MTLFileLoader();
        var objMeshName: string = "";      //The name of the current obj mesh
        var increment: number = 1;      //Id for meshes created by the multimaterial
        var isFirstMaterial: boolean = true;
        var grayColor = new Color4(0.5, 0.5, 0.5, 1);

        /**
         * Search for obj in the given array.
         * This function is called to check if a couple of data already exists in an array.
         *
         * If found, returns the index of the founded tuple index. Returns -1 if not found
         * @param arr Array<{ normals: Array<number>, idx: Array<number> }>
         * @param obj Array<number>
         * @returns {boolean}
         */
        var isInArray = (arr: Array<{ normals: Array<number>; idx: Array<number> }>, obj: Array<number>) => {
            if (!arr[obj[0]]) { arr[obj[0]] = { normals: [], idx: [] }; }
            var idx = arr[obj[0]].normals.indexOf(obj[1]);

            return idx === -1 ? -1 : arr[obj[0]].idx[idx];
        };
        var isInArrayUV = (arr: Array<{ normals: Array<number>; idx: Array<number>; uv: Array<number> }>, obj: Array<number>) => {
            if (!arr[obj[0]]) { arr[obj[0]] = { normals: [], idx: [], uv: [] }; }
            var idx = arr[obj[0]].normals.indexOf(obj[1]);

            if (idx != 1 && (obj[2] === arr[obj[0]].uv[idx])) {
                return arr[obj[0]].idx[idx];
            }
            return -1;
        };

        /**
         * This function set the data for each triangle.
         * Data are position, normals and uvs
         * If a tuple of (position, normal) is not set, add the data into the corresponding array
         * If the tuple already exist, add only their indice
         *
         * @param indicePositionFromObj Integer The index in positions array
         * @param indiceUvsFromObj Integer The index in uvs array
         * @param indiceNormalFromObj Integer The index in normals array
         * @param positionVectorFromOBJ Vector3 The value of position at index objIndice
         * @param textureVectorFromOBJ Vector3 The value of uvs
         * @param normalsVectorFromOBJ Vector3 The value of normals at index objNormale
         */
        var setData = (indicePositionFromObj: number, indiceUvsFromObj: number, indiceNormalFromObj: number, positionVectorFromOBJ: Vector3, textureVectorFromOBJ: Vector2, normalsVectorFromOBJ: Vector3, positionColorsFromOBJ?: Color4) => {
            //Check if this tuple already exists in the list of tuples
            var _index: number;
            if (this._meshLoadOptions.OptimizeWithUV) {
                _index = isInArrayUV(
                    tuplePosNorm,
                    [
                        indicePositionFromObj,
                        indiceNormalFromObj,
                        indiceUvsFromObj
                    ]
                );
            }
            else {
                _index = isInArray(
                    tuplePosNorm,
                    [
                        indicePositionFromObj,
                        indiceNormalFromObj
                    ]
                );
            }

            //If it not exists
            if (_index === -1) {
                //Add an new indice.
                //The array of indices is only an array with his length equal to the number of triangles - 1.
                //We add vertices data in this order
                indicesForBabylon.push(wrappedPositionForBabylon.length);
                //Push the position of vertice for Babylon
                //Each element is a Vector3(x,y,z)
                wrappedPositionForBabylon.push(positionVectorFromOBJ);
                //Push the uvs for Babylon
                //Each element is a Vector3(u,v)
                wrappedUvsForBabylon.push(textureVectorFromOBJ);
                //Push the normals for Babylon
                //Each element is a Vector3(x,y,z)
                wrappedNormalsForBabylon.push(normalsVectorFromOBJ);

                if (positionColorsFromOBJ !== undefined) {
                    //Push the colors for Babylon
                    //Each element is a BABYLON.Color4(r,g,b,a)
                    wrappedColorsForBabylon.push(positionColorsFromOBJ);
                }

                //Add the tuple in the comparison list
                tuplePosNorm[indicePositionFromObj].normals.push(indiceNormalFromObj);
                tuplePosNorm[indicePositionFromObj].idx.push(curPositionInIndices++);
                if (this._meshLoadOptions.OptimizeWithUV) { tuplePosNorm[indicePositionFromObj].uv.push(indiceUvsFromObj); }
            } else {
                //The tuple already exists
                //Add the index of the already existing tuple
                //At this index we can get the value of position, normal, color and uvs of vertex
                indicesForBabylon.push(_index);
            }
        };

        /**
         * Transform Vector() and BABYLON.Color() objects into numbers in an array
         */
        var unwrapData = () => {
            //Every array has the same length
            for (var l = 0; l < wrappedPositionForBabylon.length; l++) {
                //Push the x, y, z values of each element in the unwrapped array
                unwrappedPositionsForBabylon.push(wrappedPositionForBabylon[l].x, wrappedPositionForBabylon[l].y, wrappedPositionForBabylon[l].z);
                unwrappedNormalsForBabylon.push(wrappedNormalsForBabylon[l].x, wrappedNormalsForBabylon[l].y, wrappedNormalsForBabylon[l].z);
                unwrappedUVForBabylon.push(wrappedUvsForBabylon[l].x, wrappedUvsForBabylon[l].y); //z is an optional value not supported by BABYLON
            }
            if (this._meshLoadOptions.ImportVertexColors === true) {
                //Push the r, g, b, a values of each element in the unwrapped array
                unwrappedColorsForBabylon.push(wrappedColorsForBabylon[l].r, wrappedColorsForBabylon[l].g, wrappedColorsForBabylon[l].b, wrappedColorsForBabylon[l].a);
            }
            // Reset arrays for the next new meshes
            wrappedPositionForBabylon = [];
            wrappedNormalsForBabylon = [];
            wrappedUvsForBabylon = [];
            wrappedColorsForBabylon = [];
            tuplePosNorm = [];
            curPositionInIndices = 0;
        };

        /**
         * Create triangles from polygons
         * It is important to notice that a triangle is a polygon
         * We get 5 patterns of face defined in OBJ File :
         * facePattern1 = ["1","2","3","4","5","6"]
         * facePattern2 = ["1/1","2/2","3/3","4/4","5/5","6/6"]
         * facePattern3 = ["1/1/1","2/2/2","3/3/3","4/4/4","5/5/5","6/6/6"]
         * facePattern4 = ["1//1","2//2","3//3","4//4","5//5","6//6"]
         * facePattern5 = ["-1/-1/-1","-2/-2/-2","-3/-3/-3","-4/-4/-4","-5/-5/-5","-6/-6/-6"]
         * Each pattern is divided by the same method
         * @param face Array[String] The indices of elements
         * @param v Integer The variable to increment
         */
        var getTriangles = (faces: Array<string>, v: number) => {
            //Work for each element of the array
            for (var faceIndex = v; faceIndex < faces.length - 1; faceIndex++) {
                //Add on the triangle variable the indexes to obtain triangles
                triangles.push(faces[0], faces[faceIndex], faces[faceIndex + 1]);
            }

            //Result obtained after 2 iterations:
            //Pattern1 => triangle = ["1","2","3","1","3","4"];
            //Pattern2 => triangle = ["1/1","2/2","3/3","1/1","3/3","4/4"];
            //Pattern3 => triangle = ["1/1/1","2/2/2","3/3/3","1/1/1","3/3/3","4/4/4"];
            //Pattern4 => triangle = ["1//1","2//2","3//3","1//1","3//3","4//4"];
            //Pattern5 => triangle = ["-1/-1/-1","-2/-2/-2","-3/-3/-3","-1/-1/-1","-3/-3/-3","-4/-4/-4"];
        };

        /**
         * Create triangles and push the data for each polygon for the pattern 1
         * In this pattern we get vertice positions
         * @param face
         * @param v
         */
        var setDataForCurrentFaceWithPattern1 = (face: Array<string>, v: number) => {
            //Get the indices of triangles for each polygon
            getTriangles(face, v);
            //For each element in the triangles array.
            //This var could contains 1 to an infinity of triangles
            for (var k = 0; k < triangles.length; k++) {
                // Set position indice
                var indicePositionFromObj = parseInt(triangles[k]) - 1;

                setData(
                    indicePositionFromObj,
                    0, 0,                                           //In the pattern 1, normals and uvs are not defined
                    positions[indicePositionFromObj],               //Get the vectors data
                    Vector2.Zero(), Vector3.Up(),    //Create default vectors
                    this._meshLoadOptions.ImportVertexColors === true ? colors[indicePositionFromObj] : undefined
                );
            }
            //Reset variable for the next line
            triangles = [];
        };

        /**
         * Create triangles and push the data for each polygon for the pattern 2
         * In this pattern we get vertice positions and uvsu
         * @param face
         * @param v
         */
        var setDataForCurrentFaceWithPattern2 = (face: Array<string>, v: number) => {
            //Get the indices of triangles for each polygon
            getTriangles(face, v);
            for (var k = 0; k < triangles.length; k++) {
                //triangle[k] = "1/1"
                //Split the data for getting position and uv
                var point = triangles[k].split("/"); // ["1", "1"]
                //Set position indice
                var indicePositionFromObj = parseInt(point[0]) - 1;
                //Set uv indice
                var indiceUvsFromObj = parseInt(point[1]) - 1;

                setData(
                    indicePositionFromObj,
                    indiceUvsFromObj,
                    0,                                  //Default value for normals
                    positions[indicePositionFromObj],   //Get the values for each element
                    uvs[indiceUvsFromObj],
                    Vector3.Up(),                //Default value for normals
                    this._meshLoadOptions.ImportVertexColors === true ? colors[indicePositionFromObj] : undefined
                );
            }

            //Reset variable for the next line
            triangles = [];
        };

        /**
         * Create triangles and push the data for each polygon for the pattern 3
         * In this pattern we get vertice positions, uvs and normals
         * @param face
         * @param v
         */
        var setDataForCurrentFaceWithPattern3 = (face: Array<string>, v: number) => {
            //Get the indices of triangles for each polygon
            getTriangles(face, v);

            for (var k = 0; k < triangles.length; k++) {
                //triangle[k] = "1/1/1"
                //Split the data for getting position, uv, and normals
                var point = triangles[k].split("/"); // ["1", "1", "1"]
                // Set position indice
                var indicePositionFromObj = parseInt(point[0]) - 1;
                // Set uv indice
                var indiceUvsFromObj = parseInt(point[1]) - 1;
                // Set normal indice
                var indiceNormalFromObj = parseInt(point[2]) - 1;

                setData(
                    indicePositionFromObj, indiceUvsFromObj, indiceNormalFromObj,
                    positions[indicePositionFromObj], uvs[indiceUvsFromObj], normals[indiceNormalFromObj] //Set the vector for each component
                );

            }
            //Reset variable for the next line
            triangles = [];
        };

        /**
         * Create triangles and push the data for each polygon for the pattern 4
         * In this pattern we get vertice positions and normals
         * @param face
         * @param v
         */
        var setDataForCurrentFaceWithPattern4 = (face: Array<string>, v: number) => {
            getTriangles(face, v);

            for (var k = 0; k < triangles.length; k++) {
                //triangle[k] = "1//1"
                //Split the data for getting position and normals
                var point = triangles[k].split("//"); // ["1", "1"]
                // We check indices, and normals
                var indicePositionFromObj = parseInt(point[0]) - 1;
                var indiceNormalFromObj = parseInt(point[1]) - 1;

                setData(
                    indicePositionFromObj,
                    1, //Default value for uv
                    indiceNormalFromObj,
                    positions[indicePositionFromObj], //Get each vector of data
                    Vector2.Zero(),
                    normals[indiceNormalFromObj],
                    this._meshLoadOptions.ImportVertexColors === true ? colors[indicePositionFromObj] : undefined
                );
            }
            //Reset variable for the next line
            triangles = [];
        };

        /**
         * Create triangles and push the data for each polygon for the pattern 3
         * In this pattern we get vertice positions, uvs and normals
         * @param face
         * @param v
         */
        var setDataForCurrentFaceWithPattern5 = (face: Array<string>, v: number) => {
            //Get the indices of triangles for each polygon
            getTriangles(face, v);

            for (var k = 0; k < triangles.length; k++) {
                //triangle[k] = "-1/-1/-1"
                //Split the data for getting position, uv, and normals
                var point = triangles[k].split("/"); // ["-1", "-1", "-1"]
                // Set position indice
                var indicePositionFromObj = positions.length + parseInt(point[0]);
                // Set uv indice
                var indiceUvsFromObj = uvs.length + parseInt(point[1]);
                // Set normal indice
                var indiceNormalFromObj = normals.length + parseInt(point[2]);

                setData(
                    indicePositionFromObj, indiceUvsFromObj, indiceNormalFromObj,
                    positions[indicePositionFromObj], uvs[indiceUvsFromObj], normals[indiceNormalFromObj], //Set the vector for each component
                    this._meshLoadOptions.ImportVertexColors === true ? colors[indicePositionFromObj] : undefined
                );

            }
            //Reset variable for the next line
            triangles = [];
        };

        var addPreviousObjMesh = () => {

            //Check if it is not the first mesh. Otherwise we don't have data.
            if (meshesFromObj.length > 0) {
                //Get the previous mesh for applying the data about the faces
                //=> in obj file, faces definition append after the name of the mesh
                handledMesh = meshesFromObj[meshesFromObj.length - 1];

                //Set the data into Array for the mesh
                unwrapData();

                // Reverse tab. Otherwise face are displayed in the wrong sens
                indicesForBabylon.reverse();
                //Set the information for the mesh
                //Slice the array to avoid rewriting because of the fact this is the same var which be rewrited
                handledMesh.indices = indicesForBabylon.slice();
                handledMesh.positions = unwrappedPositionsForBabylon.slice();
                handledMesh.normals = unwrappedNormalsForBabylon.slice();
                handledMesh.uvs = unwrappedUVForBabylon.slice();

                if (this._meshLoadOptions.ImportVertexColors === true) {
                    handledMesh.colors = unwrappedColorsForBabylon.slice();
                }

                //Reset the array for the next mesh
                indicesForBabylon = [];
                unwrappedPositionsForBabylon = [];
                unwrappedColorsForBabylon = [];
                unwrappedNormalsForBabylon = [];
                unwrappedUVForBabylon = [];
            }
        };
        //Main function

        //Split the file into lines
        var lines = data.split('\n');
        //Look at each line
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim().replace(/\s\s/g, " ");
            var result;

            //Comment or newLine
            if (line.length === 0 || line.charAt(0) === '#') {
                continue;

                //Get information about one position possible for the vertices
            } else if (this.vertexPattern.test(line)) {
                result = line.match(/[^ ]+/g)!;  // match will return non-null due to passing regex pattern

                // Value of result with line: "v 1.0 2.0 3.0"
                // ["v", "1.0", "2.0", "3.0"]
                // Create a Vector3 with the position x, y, z
                positions.push(new Vector3(
                    parseFloat(result[1]),
                    parseFloat(result[2]),
                    parseFloat(result[3])
                ));

                if (this._meshLoadOptions.ImportVertexColors === true) {
                    if (result.length >= 7) {
                        // TODO: if these numbers are > 1 we can use Color4.FromInts(r,g,b,a)
                        colors.push(new Color4(
                            parseFloat(result[4]),
                            parseFloat(result[5]),
                            parseFloat(result[6]),
                            (result.length === 7 || result[7] === undefined) ? 1 : parseFloat(result[7])
                        ));
                    } else {
                        // TODO: maybe push NULL and if all are NULL to skip (and remove grayColor var).
                        colors.push(grayColor);
                    }
                }

            } else if ((result = this.normalPattern.exec(line)) !== null) {
                //Create a Vector3 with the normals x, y, z
                //Value of result
                // ["vn 1.0 2.0 3.0", "1.0", "2.0", "3.0"]
                //Add the Vector in the list of normals
                normals.push(new Vector3(
                    parseFloat(result[1]),
                    parseFloat(result[2]),
                    parseFloat(result[3])
                ));

            } else if ((result = this.uvPattern.exec(line)) !== null) {
                //Create a Vector2 with the normals u, v
                //Value of result
                // ["vt 0.1 0.2 0.3", "0.1", "0.2"]
                //Add the Vector in the list of uvs
                uvs.push(new Vector2(
                    parseFloat(result[1]) * OBJFileLoader.UV_SCALING.x,
                    parseFloat(result[2]) * OBJFileLoader.UV_SCALING.y
                ));

                //Identify patterns of faces
                //Face could be defined in different type of pattern
            } else if ((result = this.facePattern3.exec(line)) !== null) {
                //Value of result:
                //["f 1/1/1 2/2/2 3/3/3", "1/1/1 2/2/2 3/3/3"...]

                //Set the data for this face
                setDataForCurrentFaceWithPattern3(
                    result[1].trim().split(" "), // ["1/1/1", "2/2/2", "3/3/3"]
                    1
                );

            } else if ((result = this.facePattern4.exec(line)) !== null) {
                //Value of result:
                //["f 1//1 2//2 3//3", "1//1 2//2 3//3"...]

                //Set the data for this face
                setDataForCurrentFaceWithPattern4(
                    result[1].trim().split(" "), // ["1//1", "2//2", "3//3"]
                    1
                );

            } else if ((result = this.facePattern5.exec(line)) !== null) {
                //Value of result:
                //["f -1/-1/-1 -2/-2/-2 -3/-3/-3", "-1/-1/-1 -2/-2/-2 -3/-3/-3"...]

                //Set the data for this face
                setDataForCurrentFaceWithPattern5(
                    result[1].trim().split(" "), // ["-1/-1/-1", "-2/-2/-2", "-3/-3/-3"]
                    1
                );

            } else if ((result = this.facePattern2.exec(line)) !== null) {
                //Value of result:
                //["f 1/1 2/2 3/3", "1/1 2/2 3/3"...]

                //Set the data for this face
                setDataForCurrentFaceWithPattern2(
                    result[1].trim().split(" "), // ["1/1", "2/2", "3/3"]
                    1
                );

            } else if ((result = this.facePattern1.exec(line)) !== null) {
                //Value of result
                //["f 1 2 3", "1 2 3"...]

                //Set the data for this face
                setDataForCurrentFaceWithPattern1(
                    result[1].trim().split(" "), // ["1", "2", "3"]
                    1
                );

                //Define a mesh or an object
                //Each time this keyword is analysed, create a new Object with all data for creating a babylonMesh
            } else if (this.group.test(line) || this.obj.test(line)) {
                //Create a new mesh corresponding to the name of the group.
                //Definition of the mesh
                var objMesh: MeshObject = {
                    name: line.substring(2).trim(), //Set the name of the current obj mesh
                    indices: undefined,
                    positions: undefined,
                    normals: undefined,
                    uvs: undefined,
                    colors: undefined,
                    materialName: ""
                };
                addPreviousObjMesh();

                //Push the last mesh created with only the name
                meshesFromObj.push(objMesh);

                //Set this variable to indicate that now meshesFromObj has objects defined inside
                hasMeshes = true;
                isFirstMaterial = true;
                increment = 1;
                //Keyword for applying a material
            } else if (this.usemtl.test(line)) {
                //Get the name of the material
                materialNameFromObj = line.substring(7).trim();

                //If this new material is in the same mesh

                if (!isFirstMaterial || !hasMeshes) {
                    //Set the data for the previous mesh
                    addPreviousObjMesh();
                    //Create a new mesh
                    var objMesh: MeshObject =
                    //Set the name of the current obj mesh
                    {
                        name: (objMeshName || "mesh") + "_mm" + increment.toString(), //Set the name of the current obj mesh
                        indices: undefined,
                        positions: undefined,
                        normals: undefined,
                        uvs: undefined,
                        colors: undefined,
                        materialName: materialNameFromObj
                    };
                    increment++;
                    //If meshes are already defined
                    meshesFromObj.push(objMesh);
                    hasMeshes = true;
                }
                //Set the material name if the previous line define a mesh

                if (hasMeshes && isFirstMaterial) {
                    //Set the material name to the previous mesh (1 material per mesh)
                    meshesFromObj[meshesFromObj.length - 1].materialName = materialNameFromObj;
                    isFirstMaterial = false;
                }
                //Keyword for loading the mtl file
            } else if (this.mtllib.test(line)) {
                //Get the name of mtl file
                fileToLoad = line.substring(7).trim();

                //Apply smoothing
            } else if (this.smooth.test(line)) {
                // smooth shading => apply smoothing
                //Today I don't know it work with babylon and with obj.
                //With the obj file  an integer is set
            } else {
                //If there is another possibility
                console.log("Unhandled expression at line : " + line);
            }
        }

        //At the end of the file, add the last mesh into the meshesFromObj array
        if (hasMeshes) {
            //Set the data for the last mesh
            handledMesh = meshesFromObj[meshesFromObj.length - 1];

            //Reverse indices for displaying faces in the good sense
            indicesForBabylon.reverse();
            //Get the good array
            unwrapData();
            //Set array
            handledMesh.indices = indicesForBabylon;
            handledMesh.positions = unwrappedPositionsForBabylon;
            handledMesh.normals = unwrappedNormalsForBabylon;
            handledMesh.uvs = unwrappedUVForBabylon;

            if (this._meshLoadOptions.ImportVertexColors === true) {
                handledMesh.colors = unwrappedColorsForBabylon;
            }
        }

        //If any o or g keyword found, create a mesh with a random id
        if (!hasMeshes) {
            // reverse tab of indices
            indicesForBabylon.reverse();
            //Get positions normals uvs
            unwrapData();
            //Set data for one mesh
            meshesFromObj.push({
                name: Geometry.RandomId(),
                indices: indicesForBabylon,
                positions: unwrappedPositionsForBabylon,
                colors: unwrappedColorsForBabylon,
                normals: unwrappedNormalsForBabylon,
                uvs: unwrappedUVForBabylon,
                materialName: materialNameFromObj
            });
        }

        //Create a Mesh list
        var babylonMeshesArray: Array<Mesh> = []; //The mesh for babylon
        var materialToUse = new Array<string>();

        //Set data for each mesh
        for (var j = 0; j < meshesFromObj.length; j++) {

            //check meshesNames (stlFileLoader)
            if (meshesNames && meshesFromObj[j].name) {
                if (meshesNames instanceof Array) {
                    if (meshesNames.indexOf(meshesFromObj[j].name) === -1) {
                        continue;
                    }
                }
                else {
                    if (meshesFromObj[j].name !== meshesNames) {
                        continue;
                    }
                }
            }

            //Get the current mesh
            //Set the data with VertexBuffer for each mesh
            handledMesh = meshesFromObj[j];
            //Create a Mesh with the name of the obj mesh

            scene._blockEntityCollection = this._forAssetContainer;
            var babylonMesh = new Mesh(meshesFromObj[j].name, scene);
            scene._blockEntityCollection = false;

            //Push the name of the material to an array
            //This is indispensable for the importMesh function
            materialToUse.push(meshesFromObj[j].materialName);

            var vertexData: VertexData = new VertexData(); //The container for the values
            //Set the data for the babylonMesh
            vertexData.uvs = handledMesh.uvs as FloatArray;
            vertexData.indices = handledMesh.indices as IndicesArray;
            vertexData.positions = handledMesh.positions as FloatArray;
            if (this._meshLoadOptions.ComputeNormals === true) {
                let normals: Array<number> = new Array<number>();
                VertexData.ComputeNormals(handledMesh.positions, handledMesh.indices, normals);
                vertexData.normals = normals;
            } else {
                vertexData.normals = handledMesh.normals as FloatArray;
            }
            if (this._meshLoadOptions.ImportVertexColors === true) {
                vertexData.colors = handledMesh.colors as FloatArray;
            }
            //Set the data from the VertexBuffer to the current Mesh
            vertexData.applyToMesh(babylonMesh);
            if (this._meshLoadOptions.InvertY) {
                babylonMesh.scaling.y *= -1;
            }

            //Push the mesh into an array
            babylonMeshesArray.push(babylonMesh);
        }

        let mtlPromises: Array<Promise<any>> = [];
        //load the materials
        //Check if we have a file to load
        if (fileToLoad !== "" && this._meshLoadOptions.SkipMaterials === false) {
            //Load the file synchronously
            mtlPromises.push(new Promise((resolve, reject) => {
                this._loadMTL(fileToLoad, rootUrl, (dataLoaded) => {
                    try {
                        //Create materials thanks MTLLoader function
                        materialsFromMTLFile.parseMTL(scene, dataLoaded, rootUrl, this._forAssetContainer);
                        //Look at each material loaded in the mtl file
                        for (var n = 0; n < materialsFromMTLFile.materials.length; n++) {
                            //Three variables to get all meshes with the same material
                            var startIndex = 0;
                            var _indices = [];
                            var _index;

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
                                for (var o = 0; o < _indices.length; o++) {
                                    //Apply the material to the Mesh for each mesh with the material
                                    babylonMeshesArray[_indices[o]].material = materialsFromMTLFile.materials[n];
                                }
                            }
                        }
                        resolve();
                    } catch (e) {
                        Tools.Warn(`Error processing MTL file: '${fileToLoad}'`);
                        if (this._meshLoadOptions.MaterialLoadingFailsSilently) {
                            resolve();
                        } else {
                            reject(e);
                        }
                    }
                }, (pathOfFile: string, exception?: any) => {
                    Tools.Warn(`Error downloading MTL file: '${fileToLoad}'`);
                    if (this._meshLoadOptions.MaterialLoadingFailsSilently) {
                        resolve();
                    } else {
                        reject(exception);
                    }
                });
            }));

        }
        //Return an array with all Mesh
        return Promise.all(mtlPromises).then(() => {
            return babylonMeshesArray;
        });
    }

}

if (SceneLoader) {
    //Add this loader into the register plugin
    SceneLoader.RegisterPlugin(new OBJFileLoader());
}