import { Node } from "babylonjs/node";
import { Scene } from "babylonjs/scene";
import { GLTFData } from "./glTFData";
import { _Exporter } from "./glTFExporter";
import { Mesh } from 'babylonjs/Meshes/mesh';
import { Vector3 } from "babylonjs/Maths/math";
import { Quaternion } from "babylonjs/Maths/math";
import { Material } from "babylonjs/Materials/material";

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
     * Function used to extract the part of node's metadata that will be exported into glTF node extras
     * @param metadata source metadata to read from
     * @returns the data to store to glTF node extras
     */
    metadataSelector?(metadata: any): any;

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
            const gltfGenerator = new _Exporter(scene, options);
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
        let oldRoot: Node;
        let oldRootChildren: Array<Node> = new Array<Node>();

        // Remove __root__ node temporary
        scene.rootNodes.forEach((rootNode) => {
            if (rootNode.name === "__root__" && oldRoot === undefined) {
                oldRoot = rootNode;
                // Update hierarchy
                for (let childNode of rootNode.getDescendants(true)) {
                    childNode.parent = null;
                    oldRootChildren.push(childNode);
                }
                rootNode.dispose();
                // Toggle coordinate system
                scene.useRightHandedSystem = !scene.useRightHandedSystem;
                scene.meshes.forEach((mesh) => {
                    if (mesh instanceof Mesh) {
                        mesh.overrideMaterialSideOrientation = mesh.overrideMaterialSideOrientation === Material.ClockWiseSideOrientation ? Material.CounterClockWiseSideOrientation : Material.ClockWiseSideOrientation;
                    }
                });
            }
        });
        return this._PreExportAsync(scene, options).then(() => {
            const glTFPrefix = filePrefix.replace(/\.[^/.]+$/, "");
            const gltfGenerator = new _Exporter(scene, options);
            return gltfGenerator._generateGLBAsync(glTFPrefix).then((glTFData) => {
                // Recreate __root__ node
                if (oldRoot) {
                    let newRoot = new Mesh(oldRoot.name, scene);
                    // Update hierarchy
                    oldRootChildren.forEach((oldRootChild) => {
                        oldRootChild.parent = newRoot;
                    });
                    newRoot.rotationQuaternion = new Quaternion(0, 1, 0, 0);
                    newRoot.scaling = new Vector3(1, 1, -1);
                    // Toggle coordinate system
                    scene.useRightHandedSystem = !scene.useRightHandedSystem;
                    scene.meshes.forEach((mesh) => {
                        if (mesh instanceof Mesh) {
                            mesh.overrideMaterialSideOrientation = mesh.overrideMaterialSideOrientation === Material.ClockWiseSideOrientation ? Material.CounterClockWiseSideOrientation : Material.ClockWiseSideOrientation;
                        }
                    });
                }
                return this._PostExportAsync(scene, glTFData, options);
            });
        });
    }
}
