/// <reference types="babylonjs"/>

declare module 'babylonjs-serializers' { 
    export = BABYLON; 
}

declare module BABYLON {
    class OBJExport {
        static OBJ(mesh: Mesh[], materials?: boolean, matlibname?: string, globalposition?: boolean): string;
        static MTL(mesh: Mesh): string;
    }
}


declare module BABYLON {
    class GLTFExport {
        /**
         * Exports the geometry of a Mesh array in .gltf file format.
         * If glb is set to true, exports as .glb.
         * @param meshes
         * @param materials
         * @param glb
         */
        static GLTF(meshes: Mesh[], filename: string, glb?: boolean): {
            [fileName: string]: string | Blob;
        };
    }
}
