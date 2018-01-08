/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

module BABYLON {
    export class GLTF2Export {
        /**
         * Exports the geometry of a Mesh array in .gltf file format.
         * If glb is set to true, exports as .glb.
         * @param meshes 
         * @param materials 
         * 
         * @returns {[fileName: string]: string | Blob} Returns an object with a .gltf, .glb and associates textures
         * as keys and their data and paths as values.
         */
        public static GLTF(scene: BABYLON.Scene, filename: string): _GLTFData {
            let glTFPrefix = filename.replace(/\.[^/.]+$/, "");
            let gltfGenerator = new _GLTF2Exporter(scene);

            return gltfGenerator._generateGLTF(glTFPrefix);
        }
        /**
         * 
         * @param meshes 
         * @param filename 
         * 
         * @returns {[fileName: string]: string | Blob} Returns an object with a .glb filename as key and data as value
         */
        public static GLB(scene: BABYLON.Scene, filename: string): _GLTFData {
            let glTFPrefix = filename.replace(/\.[^/.]+$/, "");        
            let gltfGenerator = new _GLTF2Exporter(scene);

            return gltfGenerator._generateGLB(glTFPrefix);
        }
    }
}
