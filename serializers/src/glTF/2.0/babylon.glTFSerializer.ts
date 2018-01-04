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
        public static GLTF(scene: BABYLON.Scene, filename: string): {[fileName: string]: string | Blob} {
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
        public static GLB(scene: BABYLON.Scene, filename: string): {[fileName: string]: string | Blob} {
            let glTFPrefix = filename.replace(/\.[^/.]+$/, "");        
            let gltfGenerator = new _GLTF2Exporter(scene);

            return gltfGenerator._generateGLB(glTFPrefix);
        }
        /**
         * Downloads data from glTF object.
         * 
         * @param gltfData glTF object with keys being file names and values being data
         */
        public static downloadFiles(gltfData: {[fileName: string]: string | Blob} ): void {
            /**
             * Checks for a matching suffix at the end of a string (for ES5 and lower)
             * @param str 
             * @param suffix 
             * 
             * @returns {boolean} indicating whether the suffix matches or not
             */
            function endsWith(str: string, suffix: string): boolean {
                return str.indexOf(suffix, str.length - suffix.length) !== -1;
            }
            for (let key in gltfData) {
                let link = document.createElement('a');
                document.body.appendChild(link);
                link.setAttribute("type", "hidden");
                link.download = key;
                let blob = gltfData[key];
                let mimeType;
                
                if (endsWith(key, ".glb")) {
                    mimeType = {type: "model/gltf-binary"};
                }
                else if (endsWith(key, ".bin")) {
                    mimeType = {type: "application/octet-stream"};
                }
                else if (endsWith(key, ".gltf")) {
                    mimeType = {type: "model/gltf+json"};
                }

                link.href = window.URL.createObjectURL(new Blob([blob], mimeType));
                link.click();
            }
        }
    }
}
