import type { Node } from "core/node";
import type { Scene } from "core/scene";
import type { Animation } from "core/Animations/animation";
import type { GLTFData } from "./glTFData";
import { GLTFExporter } from "./glTFExporter";

/**
 * Mesh compression methods.
 */
export type MeshCompressionMethod = "None" | "Draco";

/**
 * Holds a collection of exporter options and parameters
 */
export interface IExportOptions {
    /**
     * Function which indicates whether a babylon node should be exported or not
     * @param node source Babylon node. It is used to check whether it should be exported to glTF or not
     * @returns boolean, which indicates whether the node should be exported (true) or not (false)
     */
    shouldExportNode?(node: Node): boolean;

    /**
     * Function which indicates whether an animation on the scene should be exported or not
     * @param animation source animation
     * @returns boolean, which indicates whether the animation should be exported (true) or not (false)
     */
    shouldExportAnimation?(animation: Animation): boolean;

    /**
     * Function to extract the part of the scene or node's `metadata` that will populate the corresponding
     * glTF object's `extras` field. If not defined, `node.metadata.gltf.extras` will be used.
     * @param metadata source metadata to read from
     * @returns the data to store into the glTF extras field
     */
    metadataSelector?(metadata: any): any;

    /**
     * The sample rate to bake animation curves. Defaults to 1 / 60.
     */
    animationSampleRate?: number;

    /**
     * Begin serialization without waiting for the scene to be ready. Defaults to false.
     */
    exportWithoutWaitingForScene?: boolean;

    /**
     * Indicates if unused vertex uv attributes should be included in export. Defaults to false.
     */
    exportUnusedUVs?: boolean;

    /**
     * Remove no-op root nodes when possible. Defaults to true.
     */
    removeNoopRootNodes?: boolean;

    /**
     * Indicates if coordinate system swapping root nodes should be included in export. Defaults to false.
     * @deprecated Please use removeNoopRootNodes instead
     */
    includeCoordinateSystemConversionNodes?: boolean;

    /**
     * Indicates what compression method to apply to mesh data.
     */
    meshCompressionMethod?: MeshCompressionMethod;
}

/**
 * Class for generating glTF data from a Babylon scene.
 */
export class GLTF2Export {
    /**
     * Exports the scene to .gltf file format
     * @param scene Babylon scene
     * @param fileName Name to use for the .gltf file
     * @param options Exporter options
     * @returns Returns the exported data
     */
    public static async GLTFAsync(scene: Scene, fileName: string, options?: IExportOptions): Promise<GLTFData> {
        if (!options || !options.exportWithoutWaitingForScene) {
            await scene.whenReadyAsync();
        }

        const exporter = new GLTFExporter(scene, options);
        const data = await exporter.generateGLTFAsync(fileName.replace(/\.[^/.]+$/, ""));
        exporter.dispose();

        return data;
    }

    /**
     * Exports the scene to .glb file format
     * @param scene Babylon scene
     * @param fileName Name to use for the .glb file
     * @param options Exporter options
     * @returns Returns the exported data
     */
    public static async GLBAsync(scene: Scene, fileName: string, options?: IExportOptions): Promise<GLTFData> {
        if (!options || !options.exportWithoutWaitingForScene) {
            await scene.whenReadyAsync();
        }

        const exporter = new GLTFExporter(scene, options);
        const data = await exporter.generateGLBAsync(fileName.replace(/\.[^/.]+$/, ""));
        exporter.dispose();

        return data;
    }
}
