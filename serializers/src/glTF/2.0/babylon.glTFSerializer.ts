/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

module BABYLON {
    /**
     * Holds a collection of exporter options and parameters
     */
    export interface IExporterOptions {
        /**
         * Function which indicates whether a babylon mesh should be exported or not
         * @param mesh source Babylon mesh. It is used to check whether it should be exported to glTF or not
         * @returns boolean, which indicates whether the mesh should be exported (true) or not (false)
         */
        shouldExportMesh?(mesh: AbstractMesh): boolean;
        /**
         * The sample rate to bake animation curves
         */
        animationSampleRate?: number;
    };

    /**
     * Class for generating glTF data from a Babylon scene.
     */
    export class GLTF2Export {
        /**
         * Exports the geometry of the scene to .gltf file format
         * @param scene Babylon scene with scene hierarchy information
         * @param filePrefix File prefix to use when generating the glTF file
         * @param options Exporter options
         * @returns Returns an object with a .gltf file and associates texture names
         * as keys and their data and paths as values
         */
        public static GLTF(scene: Scene, filePrefix: string, options?: IExporterOptions): Nullable<GLTFData> {
            const glTFPrefix = filePrefix.replace(/\.[^/.]+$/, "");
            const gltfGenerator = new GLTF2._Exporter(scene, options);
            if (scene.isReady) {
                return gltfGenerator._generateGLTF(glTFPrefix);
            }
            else {
                Tools.Error("glTF Serializer: Scene is not ready!");
                return null;
            } 
        }

        /**
         * Exports the geometry of the scene to .glb file format
         * @param scene Babylon scene with scene hierarchy information
         * @param filePrefix File prefix to use when generating glb file
         * @param options Exporter options
         * @returns Returns an object with a .glb filename as key and data as value
         */
        public static GLB(scene: Scene, filePrefix: string, options?: IExporterOptions): Nullable<GLTFData> {
            const glTFPrefix = filePrefix.replace(/\.[^/.]+$/, "");        
            const gltfGenerator = new GLTF2._Exporter(scene, options);
            if (scene.isReady) {
                return gltfGenerator._generateGLB(glTFPrefix);
            }
            else {
                Tools.Error("glTF Serializer: Scene is not ready!");
                return null;
            }  
        }
    }
}
