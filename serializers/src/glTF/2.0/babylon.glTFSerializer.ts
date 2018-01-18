/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

module BABYLON {
    export interface IGLTFExporterOptions {
        /**
         * Interface function which indicates whether a babylon mesh should be exported or not.
         * @param mesh
         * @returns boolean, which indicates whether the mesh should be exported (true) or not (false)
         */
        shouldExportMesh?(mesh: AbstractMesh): boolean;
    };
    export class GLTF2Export {
        /**
         * Exports the geometry of a Mesh array in .gltf file format.
         * @param meshes  
         * @param materials 
         * @param options
         * 
         * @returns - Returns an object with a .gltf, .glb and associates textures
         * as keys and their data and paths as values.
         */
        public static GLTF(scene: Scene, filename: string, options?: IGLTFExporterOptions): _GLTFData {
            const glTFPrefix = filename.replace(/\.[^/.]+$/, "");
            const gltfGenerator = new _GLTF2Exporter(scene, options);
            if (scene.isReady) {
                return gltfGenerator._generateGLTF(glTFPrefix);
            }
            else {
                throw new Error("glTF Serializer: Scene is not ready!");
            }

            
        }
        /**
         * 
         * @param meshes 
         * @param filename 
         * 
         * @returns - Returns an object with a .glb filename as key and data as value
         */
        public static GLB(scene: Scene, filename: string, options?: IGLTFExporterOptions): _GLTFData {
            const glTFPrefix = filename.replace(/\.[^/.]+$/, "");        
            const gltfGenerator = new _GLTF2Exporter(scene, options);
            if (scene.isReady) {
                return gltfGenerator._generateGLB(glTFPrefix);
            }
            else {
                throw new Error("glTF Serializer: Scene is not ready!");
            }

            
        }
    }
}
