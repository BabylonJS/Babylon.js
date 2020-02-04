import { Nullable } from "babylonjs/types";
import { PBRMaterial } from "babylonjs/Materials/PBR/pbrMaterial";
import { Material } from "babylonjs/Materials/material";
import { TransformNode } from "babylonjs/Meshes/transformNode"

import { INode, IBufferView, IAccessor } from "../glTFLoaderInterfaces";
import { IGLTF } from "../glTFLoaderInterfaces";
import { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader, ArrayItem } from "../glTFLoader";
import { Color3 } from 'babylonjs/Maths/math.color';
import { Mesh, InstancedMesh } from 'babylonjs';
import { Vector3, Vector4, Quaternion, Matrix } from 'babylonjs/Maths/math.vector';
import { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } from 'constants';

const NAME = "KHR_mesh_instancing";

interface IKHRMeshInstancing {
    mesh?: number;
    attributes: { [name: string]: number };
}

/**
 * [Proposed Specification](https://github.com/KhronosGroup/glTF/pull/1688)
 * [Playground Sample](https://www.babylonjs-playground.com/frame.html#BNIZX6#4)
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
            delete node.mesh;
            const promise = this._loader.loadNodeAsync(`#/nodes/${node.index}`, node, (babylonTransformNode) => {
                const attributeBufferPromises = new Array<Promise<any>>();
                const attributeBuffers : { [name: string]: { buffer : Float32Array, accessor : IAccessor } } = {};
                const mesh = ArrayItem.Get(`${context}/mesh`, this._loader.gltf.meshes, extension.mesh || nodeMesh);
                this._loader._loadMeshAsync(`/meshes/${mesh.index}`, node, mesh, (babylonChildTransformNode) => {
                    // read all the attributes
                    Promise.all(attributeBufferPromises).then(() => {
                        attributeKeys = Object.keys(attributeBuffers);
                        if (attributeKeys.length > 0){
                            let instanceCount = attributeBuffers[attributeKeys[0]].accessor.count;
                            // loop through all the instances and create instances, parent to original transform
                            for (let i = 0; i < instanceCount; ++i){
                                const instance = babylonChildTransformNode.instantiateHierarchy();
                                if (instance){
                                    instance.parent = babylonTransformNode;
                                    instance.position = attributeBuffers["TRANSLATION"] ? new Vector3(attributeBuffers["TRANSLATION"].buffer[i * 3],
                                                                                                      attributeBuffers["TRANSLATION"].buffer[i * 3 + 1],
                                                                                                      attributeBuffers["TRANSLATION"].buffer[i * 3 + 2])
                                                                                        : Vector3.Zero();
                                    instance.rotationQuaternion = attributeBuffers["ROTATION"] ? new Quaternion(attributeBuffers["ROTATION"].buffer[i * 4],
                                                                                                                attributeBuffers["ROTATION"].buffer[i * 4 + 1],
                                                                                                                attributeBuffers["ROTATION"].buffer[i * 4 + 2],
                                                                                                                attributeBuffers["ROTATION"].buffer[i * 4 + 4])
                                                                                               : Quaternion.Identity();
                                    instance.scaling = attributeBuffers["SCALE"] ? new Vector3(attributeBuffers["SCALE"].buffer[i * 3],
                                                                                               attributeBuffers["SCALE"].buffer[i * 3 + 1],
                                                                                               attributeBuffers["SCALE"].buffer[i * 3 + 2])
                                                                                 : Vector3.One();
                                }
                            }
                        }
                    });
                });
                // Read extension json to populate attribute data
                // Do stuff with the data and push any additional asynchronous work to promises
                let attributes = extension.attributes;
                let attributeKeys = Object.keys(attributes);
                for (let i = 0; i < attributes.length; ++i){
                    let attributeKey = attributeKeys[i];
                    let accessor = ArrayItem.Get(`${extensionContext}/attributes/${attributeKey}`, this._loader.gltf.accessors, attributes[attributeKey]);
                    attributeBufferPromises.push(this._loader._loadFloatAccessorAsync(`/accessors/${accessor.bufferView}`, accessor).then((data) => {
                        attributeBuffers[attributeKey] = { buffer : data, accessor : accessor };
                    }));
                }
                return babylonTransformNode;
            });

            // Is this really necessary?
            if (nodeMesh) {
                node.mesh = nodeMesh;
            }
            return promise!;
        });
    }
}

GLTFLoader.RegisterExtension(NAME, (loader) => new KHR_mesh_instancing(loader));