/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

module BABYLON {
    /**
     * Holds a collection of exporter options and parameters
     */
    export interface IExportOptions {
        /**
         * Function which indicates whether a babylon mesh should be exported or not
         * @param transformNode source Babylon transform node. It is used to check whether it should be exported to glTF or not
         * @returns boolean, which indicates whether the mesh should be exported (true) or not (false)
         */
        shouldExportTransformNode?(transformNode: TransformNode): boolean;
        /**
         * The sample rate to bake animation curves
         */
        animationSampleRate?: number;

        /**
         * Begin serialization without waiting for the scene to be ready
         */
        exportWithoutWaitingForScene?: boolean;
    }

    /**
     * Class for generating glTF data from a Babylon scene.
     */
    export class GLTF2Export {
        /**
         * Exports the geometry of the scene to .gltf file format asynchronously
         * @param scene Babylon scene with scene hierarchy information
         * @param filePrefix File prefix to use when generating the glTF file
         * @param options Exporter options
         * @returns Returns an object with a .gltf file and associates texture names
         * as keys and their data and paths as values
         */
        public static GLTFAsync(scene: Scene, filePrefix: string, options?: IExportOptions): Promise<GLTFData> {
            return scene.whenReadyAsync().then(() => {
                const glTFPrefix = filePrefix.replace(/\.[^/.]+$/, "");
                const gltfGenerator = new GLTF2.Exporter._Exporter(scene, options);
                return gltfGenerator._generateGLTFAsync(glTFPrefix);
            });
        }

        private static _PreExportAsync(scene: Scene, options?: IExportOptions): Promise<void> {
            return Promise.resolve().then(() => {
                if (options && options.exportWithoutWaitingForScene) {
                    return Promise.resolve();
                }
                else {
                    return scene.whenReadyAsync();
                }
            });
        }

        private static _PostExportAsync(scene: Scene, glTFData: GLTFData, options?: IExportOptions): Promise<GLTFData> {
            return Promise.resolve().then(() => {
                if (options && options.exportWithoutWaitingForScene) {
                    return glTFData;
                }
                else {
                    return glTFData;
                }
            });
        }

        /**
         * Exports the geometry of the scene to .glb file format asychronously
         * @param scene Babylon scene with scene hierarchy information
         * @param filePrefix File prefix to use when generating glb file
         * @param options Exporter options
         * @returns Returns an object with a .glb filename as key and data as value
         */
        public static GLBAsync(scene: Scene, filePrefix: string, options?: IExportOptions): Promise<GLTFData> {
            return this._PreExportAsync(scene, options).then(() => {
                const glTFPrefix = filePrefix.replace(/\.[^/.]+$/, "");
                const gltfGenerator = new GLTF2.Exporter._Exporter(scene, options);
                return gltfGenerator._generateGLBAsync(glTFPrefix).then((glTFData) => {
                    return this._PostExportAsync(scene, glTFData, options);
                });
            });
        }
    }
}
