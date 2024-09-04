import { Vector3, Quaternion, Matrix, TmpVectors } from "core/Maths/math.vector";
import type { Mesh } from "core/Meshes/mesh";
import type { TransformNode } from "core/Meshes/transformNode";
import type { Nullable } from "core/types";
import { GLTFLoader, ArrayItem } from "../glTFLoader";
import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import type { INode } from "../glTFLoaderInterfaces";
import type { IEXTMeshGpuInstancing } from "babylonjs-gltf2interface";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";

import "core/Meshes/thinInstanceMesh";

const NAME = "EXT_mesh_gpu_instancing";

declare module "../../glTFFileLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc
    export interface GLTFLoaderExtensionOptions {
        /**
         * Defines options for the EXT_mesh_gpu_instancing extension.
         */
        // NOTE: Don't use NAME here as it will break the UMD type declarations.
        ["EXT_mesh_gpu_instancing"]: {};
    }
}

/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Vendor/EXT_mesh_gpu_instancing/README.md)
 * [Playground Sample](https://playground.babylonjs.com/#QFIGLW#9)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class EXT_mesh_gpu_instancing implements IGLTFLoaderExtension {
    /**
     * The name of this extension.
     */
    public readonly name = NAME;

    /**
     * Defines whether this extension is enabled.
     */
    public enabled: boolean;

    private _loader: GLTFLoader;

    /**
     * @internal
     */
    constructor(loader: GLTFLoader) {
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
    }

    /** @internal */
    public dispose() {
        (this._loader as any) = null;
    }

    /**
     * @internal
     */
    public loadNodeAsync(context: string, node: INode, assign: (babylonTransformNode: TransformNode) => void): Nullable<Promise<TransformNode>> {
        return GLTFLoader.LoadExtensionAsync<IEXTMeshGpuInstancing, TransformNode>(context, node, this.name, (extensionContext, extension) => {
            this._loader._disableInstancedMesh++;

            const promise = this._loader.loadNodeAsync(`/nodes/${node.index}`, node, assign);

            this._loader._disableInstancedMesh--;

            if (!node._primitiveBabylonMeshes) {
                return promise;
            }

            const promises = new Array<Promise<Nullable<Float32Array>>>();
            let instanceCount = 0;

            const loadAttribute = (attribute: string) => {
                if (extension.attributes[attribute] == undefined) {
                    promises.push(Promise.resolve(null));
                    return;
                }

                const accessor = ArrayItem.Get(`${extensionContext}/attributes/${attribute}`, this._loader.gltf.accessors, extension.attributes[attribute]);
                promises.push(this._loader._loadFloatAccessorAsync(`/accessors/${accessor.bufferView}`, accessor));

                if (instanceCount === 0) {
                    instanceCount = accessor.count;
                } else if (instanceCount !== accessor.count) {
                    throw new Error(`${extensionContext}/attributes: Instance buffer accessors do not have the same count.`);
                }
            };

            loadAttribute("TRANSLATION");
            loadAttribute("ROTATION");
            loadAttribute("SCALE");

            return promise.then((babylonTransformNode) => {
                return Promise.all(promises).then(([translationBuffer, rotationBuffer, scaleBuffer]) => {
                    const matrices = new Float32Array(instanceCount * 16);

                    TmpVectors.Vector3[0].copyFromFloats(0, 0, 0); // translation
                    TmpVectors.Quaternion[0].copyFromFloats(0, 0, 0, 1); // rotation
                    TmpVectors.Vector3[1].copyFromFloats(1, 1, 1); // scale

                    for (let i = 0; i < instanceCount; ++i) {
                        translationBuffer && Vector3.FromArrayToRef(translationBuffer, i * 3, TmpVectors.Vector3[0]);
                        rotationBuffer && Quaternion.FromArrayToRef(rotationBuffer, i * 4, TmpVectors.Quaternion[0]);
                        scaleBuffer && Vector3.FromArrayToRef(scaleBuffer, i * 3, TmpVectors.Vector3[1]);

                        Matrix.ComposeToRef(TmpVectors.Vector3[1], TmpVectors.Quaternion[0], TmpVectors.Vector3[0], TmpVectors.Matrix[0]);

                        TmpVectors.Matrix[0].copyToArray(matrices, i * 16);
                    }

                    for (const babylonMesh of node._primitiveBabylonMeshes!) {
                        (babylonMesh as Mesh).thinInstanceSetBuffer("matrix", matrices, 16, true);
                    }

                    return babylonTransformNode;
                });
            });
        });
    }
}

unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new EXT_mesh_gpu_instancing(loader));
