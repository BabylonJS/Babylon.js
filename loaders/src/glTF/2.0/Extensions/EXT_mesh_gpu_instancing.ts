import { Vector3, Quaternion } from 'babylonjs/Maths/math.vector';
import { InstancedMesh } from 'babylonjs/Meshes/instancedMesh';
import { Mesh } from 'babylonjs/Meshes/mesh';
import { TransformNode } from "babylonjs/Meshes/transformNode";
import { StringTools } from 'babylonjs/Misc/stringTools';
import { Nullable } from "babylonjs/types";
import { GLTFLoader, ArrayItem } from "../glTFLoader";
import { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { INode } from "../glTFLoaderInterfaces";

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
            return this._loader.loadNodeAsync(`#/nodes/${node.index}`, node, (babylonTransformNode) => {
                const promises = new Array<Promise<any>>();
                let instanceCount: Nullable<number> = null;
                const loadAttribute = (attribute: string, assignBufferFunc: (data: Float32Array) => void) => {
                    if (extension.attributes[attribute] == undefined) {
                        return;
                    }
                    const accessor = ArrayItem.Get(`${extensionContext}/attributes/${attribute}`, this._loader.gltf.accessors, extension.attributes[attribute]);
                    if (instanceCount === null) {
                        instanceCount = accessor.count;
                    } else if (instanceCount !== accessor.count) {
                        throw new Error(`${extensionContext}/attributes: Instance buffer accessors do not have the same count.`);
                    }
                    promises.push(this._loader._loadFloatAccessorAsync(`/accessors/${accessor.bufferView}`, accessor).then((data) => {
                        assignBufferFunc(data);
                    }));
                };
                let translationBuffer: Nullable<Float32Array> = null;
                let rotationBuffer: Nullable<Float32Array> = null;
                let scaleBuffer: Nullable<Float32Array> = null;

                loadAttribute("TRANSLATION", (data) => { translationBuffer = data; });
                loadAttribute("ROTATION", (data) => { rotationBuffer = data; });
                loadAttribute("SCALE", (data) => { scaleBuffer = data; });

                return Promise.all(promises).then(() => {
                    if (instanceCount) {
                        let instanceName: string = "";
                        let instance: Nullable<TransformNode> = null;
                        const digitLength = instanceCount.toString().length;

                        for (let i = 0; i < instanceCount; ++i) {
                            if (node._primitiveBabylonMeshes) {
                                for (let j = 0; j < node._primitiveBabylonMeshes.length; ++j) {
                                    const babylonMeshPrimitive = node._primitiveBabylonMeshes[j];
                                    instanceName = (babylonMeshPrimitive.name || babylonMeshPrimitive.id) + "_" + StringTools.PadNumber(i, digitLength);
                                    if (babylonMeshPrimitive.isAnInstance) {
                                        instance = (babylonMeshPrimitive as InstancedMesh).sourceMesh.createInstance(instanceName);
                                    } else if ((babylonMeshPrimitive as Mesh).createInstance) {
                                        instance = (babylonMeshPrimitive as Mesh).createInstance(instanceName);
                                    }
                                    if (instance) {
                                        instance.setParent(babylonMeshPrimitive);
                                        translationBuffer ? Vector3.FromArrayToRef(translationBuffer, i * 3, instance.position)
                                            : instance.position.set(0, 0, 0);
                                        rotationBuffer ? Quaternion.FromArrayToRef(rotationBuffer, i * 4, instance.rotationQuaternion!)
                                            : instance.rotationQuaternion!.set(0, 0, 0, 1);
                                        scaleBuffer ? Vector3.FromArrayToRef(scaleBuffer, i * 3, instance.scaling)
                                            : instance.scaling.set(1, 1, 1);
                                    }
                                }
                            }
                        }
                    }
                    assign(babylonTransformNode);
                    return babylonTransformNode;
                });
            });
        });
    }
}

GLTFLoader.RegisterExtension(NAME, (loader) => new EXT_mesh_gpu_instancing(loader));
