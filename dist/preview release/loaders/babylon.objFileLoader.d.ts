
declare module BABYLON {
    /**
     * Class reading and parsing the MTL file bundled with the obj file.
     */
    class MTLFileLoader {
        materials: BABYLON.StandardMaterial[];
        /**
         * This function will read the mtl file and create each material described inside
         * This function could be improve by adding :
         * -some component missing (Ni, Tf...)
         * -including the specific options available
         *
         * @param scene
         * @param data
         * @param rootUrl
         */
        parseMTL: (scene: Scene, data: string, rootUrl: string) => void;
        /**
         * Gets the texture for the material.
         *
         * If the material is imported from input file,
         * We sanitize the url to ensure it takes the textre from aside the material.
         *
         * @param rootUrl The root url to load from
         * @param value The value stored in the mtl
         * @return The Texture
         */
        private static _getTexture(rootUrl, value, scene);
    }
    class OBJFileLoader implements ISceneLoaderPlugin {
        static OPTIMIZE_WITH_UV: boolean;
        extensions: string;
        obj: RegExp;
        group: RegExp;
        mtllib: RegExp;
        usemtl: RegExp;
        smooth: RegExp;
        vertexPattern: RegExp;
        normalPattern: RegExp;
        uvPattern: RegExp;
        facePattern1: RegExp;
        facePattern2: RegExp;
        facePattern3: RegExp;
        facePattern4: RegExp;
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
        private _loadMTL(url, rootUrl, onSuccess);
        importMesh(meshesNames: any, scene: Scene, data: any, rootUrl: string, meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]): boolean;
        load(scene: Scene, data: string, rootUrl: string): boolean;
        /**
         * Read the OBJ file and create an Array of meshes.
         * Each mesh contains all information given by the OBJ and the MTL file.
         * i.e. vertices positions and indices, optional normals values, optional UV values, optional material
         *
         * @param meshesNames
         * @param scene BABYLON.Scene The scene where are displayed the data
         * @param data String The content of the obj file
         * @param rootUrl String The path to the folder
         * @returns Array<AbstractMesh>
         * @private
         */
        private _parseSolid(meshesNames, scene, data, rootUrl);
    }
}
