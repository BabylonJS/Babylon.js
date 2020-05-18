import { Vector3, Quaternion, Matrix } from 'babylonjs/Maths/math.vector';
import { InstancedMesh } from 'babylonjs/Meshes/instancedMesh';
import { Mesh } from 'babylonjs/Meshes/mesh';
import { TransformNode } from "babylonjs/Meshes/transformNode";
import { StringTools } from 'babylonjs/Misc/stringTools';
import { Nullable } from "babylonjs/types";
import { GLTFLoader, ArrayItem } from "../glTFLoader";
import { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { INode } from "../glTFLoaderInterfaces";
import { AbstractMesh } from 'babylonjs/Meshes/abstractMesh';
import { TmpVectors } from 'babylonjs/Maths/math.vector';

const NAME = "EXT_mesh_gpu_instancing";

interface IEXTMeshGpuInstancing {
    mesh?: number;
    attributes: { [name: string]: number };
}

/**
 * [Proposed Specification](https://github.com/KhronosGroup/glTF/pull/1691)
 * [Playground Sample](https://playground.babylonjs.com/#QFIGLW#9)
 * !!! Experimental Extension Subject to Changes !!!
 */
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

    /** @hidden */
    constructor(loader: GLTFLoader) {
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
    }

    /** @hidden */
    public dispose() {
        delete this._loader;
    }

    /** @hidden */
    public loadNodeAsync(context: string, node: INode, assign: (babylonTransformNode: TransformNode) => void): Nullable<Promise<TransformNode>> {
        return GLTFLoader.LoadExtensionAsync<IEXTMeshGpuInstancing, TransformNode>(context, node, this.name, (extensionContext, extension) => {
            const promise = this._loader.loadNodeAsync(`#/nodes/${node.index}`, node, assign);

            if (!node._primitiveBabylonMeshes) {
                return promise;
            }

            let useThinInstancesForAllMeshes = true;
            let canUseThinInstances = false;

            // Hide the source meshes.
            for (const babylonMesh of node._primitiveBabylonMeshes) {
                if (!(babylonMesh as Mesh).thinInstanceSetBuffer) {
                    babylonMesh.isVisible = false;
                    useThinInstancesForAllMeshes = false;
                } else {
                    canUseThinInstances = true;
                    (babylonMesh as Mesh)._thinInstanceDataStorage.instancesCount = 1;  // make sure mesh.hasThinInstances returns true from now on (else async loading of the thin instance data will lead to problems
                                                                                        // as the mesh won't be considered as having thin instances until thinInstanceSetBuffer is called)
                }
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

            if (instanceCount == 0) {
                for (const babylonMesh of node._primitiveBabylonMeshes) {
                    if ((babylonMesh as any).thinInstanceSetBuffer) {
                        (babylonMesh as Mesh)._thinInstanceDataStorage.instancesCount = 0;
                    }
                }
                return promise;
            }

            if (!useThinInstancesForAllMeshes) {
                const digitLength = instanceCount.toString().length;
                for (let i = 0; i < instanceCount; ++i) {
                    for (const babylonMesh of node._primitiveBabylonMeshes!) {
                        if (!(babylonMesh as Mesh).thinInstanceSetBuffer) {
                            const instanceName = `${babylonMesh.name || babylonMesh.id}_${StringTools.PadNumber(i, digitLength)}`;
                            const babylonInstancedMesh = (babylonMesh as (InstancedMesh | Mesh)).createInstance(instanceName);
                            babylonInstancedMesh.setParent(babylonMesh);
                        }
                    }
                }
            }

            return promise.then((babylonTransformNode) => {
                return Promise.all(promises).then(([translationBuffer, rotationBuffer, scaleBuffer]) => {
                    const matrices = canUseThinInstances ? new Float32Array(instanceCount * 16) : null;

                    if (matrices) {
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
                    }

                    for (const babylonMesh of node._primitiveBabylonMeshes!) {
                        if (!(babylonMesh as Mesh).thinInstanceSetBuffer) {
                            const babylonInstancedMeshes = babylonMesh.getChildMeshes(true, (node) => (node as AbstractMesh).isAnInstance);
                            for (let i = 0; i < instanceCount; ++i) {
                                const babylonInstancedMesh = babylonInstancedMeshes[i];
                                translationBuffer && Vector3.FromArrayToRef(translationBuffer, i * 3, babylonInstancedMesh.position);
                                rotationBuffer && Quaternion.FromArrayToRef(rotationBuffer, i * 4, babylonInstancedMesh.rotationQuaternion!);
                                scaleBuffer && Vector3.FromArrayToRef(scaleBuffer, i * 3, babylonInstancedMesh.scaling);
                                babylonInstancedMesh.refreshBoundingInfo();
                            }
                        } else {
                            (babylonMesh as Mesh).thinInstanceSetBuffer("matrix", matrices, 16, true);
                        }
                    }

                    return babylonTransformNode;
                });
            });
        });
    }
}

GLTFLoader.RegisterExtension(NAME, (loader) => new EXT_mesh_gpu_instancing(loader));
