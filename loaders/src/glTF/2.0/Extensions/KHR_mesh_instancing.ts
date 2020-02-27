import { Nullable } from "babylonjs/types";
import { TransformNode } from "babylonjs/Meshes/transformNode";
import { Mesh } from 'babylonjs/Meshes/mesh';
import { INode, IAccessor } from "../glTFLoaderInterfaces";
import { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader, ArrayItem } from "../glTFLoader";
import { Vector3, Quaternion } from 'babylonjs/Maths/math.vector';

const NAME = "KHR_mesh_instancing";

interface IKHRMeshInstancing {
    mesh?: number;
    attributes: { [name: string]: number };
}

/**
 * [Proposed Specification](https://github.com/KhronosGroup/glTF/pull/1691)
 * [Playground Sample](//TODO)
 * !!! Experimental Extension Subject to Changes !!!
 */
export class KHR_mesh_instancing implements IGLTFLoaderExtension {
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
        return GLTFLoader.LoadExtensionAsync<IKHRMeshInstancing, TransformNode>(context, node, this.name, (extensionContext, extension) => {
            const nodeMesh = node.mesh;
            const promise = this._loader.loadNodeAsync(`#/nodes/${node.index}`, node, (babylonTransformNode) => {
                babylonTransformNode.parent = this._loader.rootBabylonMesh;
                const attributeBufferPromises = new Array<Promise<any>>();

                let attributes = extension.attributes;
                let attributeKeys = Object.keys(attributes);
                const attributeBuffers : { [name: string]: { buffer : Float32Array, accessor : IAccessor } } = {};
                for (let i = 0; i < attributeKeys.length; ++i) {
                    let attributeKey = attributeKeys[i];
                    let accessor = ArrayItem.Get(`${extensionContext}/attributes/${attributeKey}`, this._loader.gltf.accessors, attributes[attributeKey]);
                    attributeBufferPromises.push(this._loader._loadFloatAccessorAsync(`/accessors/${accessor.bufferView}`, accessor).then((data) => {
                        attributeBuffers[attributeKey] = { buffer : data, accessor : accessor };
                    }));
                }

                const mesh = ArrayItem.Get(`${context}/mesh`, this._loader.gltf.meshes, extension.mesh || nodeMesh);
                this._loader._loadMeshAsync(`/meshes/${mesh.index}`, node, mesh, (babylonMeshInstanceNode) => {
                    Promise.all(attributeBufferPromises).then(() => {
                        attributeKeys = Object.keys(attributeBuffers);

                        if (attributeKeys.length > 0) {
                            let instanceCount = attributeBuffers[attributeKeys[0]].accessor.count;
                            let digitLength = instanceCount.toString().length;
                            for (let i = 0; i < instanceCount; ++i) {
                                let instance;
                                if (i == 0) {
                                    instance = babylonMeshInstanceNode;
                                    instance.setParent(babylonTransformNode);
                                } else {
                                    instance = babylonMeshInstanceNode.clone((babylonMeshInstanceNode.name || babylonMeshInstanceNode.id) + "_" + String(i).padStart(digitLength, '0'), babylonTransformNode, true);
                                }

                                if (instance) {
                                    instance.position = attributeBuffers["TRANSLATION"] ? Vector3.FromArray(attributeBuffers["TRANSLATION"].buffer, i * 3)
                                                                                        : Vector3.Zero();
                                    instance.rotationQuaternion = attributeBuffers["ROTATION"] ? Quaternion.FromArray(attributeBuffers["ROTATION"].buffer, i * 4)
                                                                                            : Quaternion.Identity();
                                    instance.scaling = attributeBuffers["SCALE"] ? Vector3.FromArray(attributeBuffers["SCALE"].buffer, i * 3)
                                                                                    : Vector3.One();
                                    instance.computeWorldMatrix(true);
                                }
                            }
                        }
                        let babylonMesh = (babylonTransformNode as Mesh);
                        if (babylonMesh) {
                            babylonMesh.isVisible = false;
                        }
                    });
                });
                assign(babylonTransformNode);
                return babylonTransformNode;
            });

            if (nodeMesh) {
                node.mesh = nodeMesh;
            }

            return promise!;
        });
    }
}

GLTFLoader.RegisterExtension(NAME, (loader) => new KHR_mesh_instancing(loader));