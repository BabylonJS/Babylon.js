import { Nullable } from "babylonjs/types";
import { TransformNode } from "babylonjs/Meshes/transformNode";
import { INode, IAccessor } from "../glTFLoaderInterfaces";
import { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader, ArrayItem } from "../glTFLoader";
import { Vector3, Quaternion, Vector4 } from 'babylonjs/Maths/math.vector';

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
            return this._loader.loadNodeAsync(`#/nodes/${node.index}`, node, (babylonTransformNode) => {
                const promises = new Array<Promise<any>>();
                const attributeBuffers : { [name: string]: { buffer : Float32Array, accessor : IAccessor } } = {};
                const loadAttribute = (attribute: string) => {
                    if (extension.attributes[attribute] == undefined) {
                        return;
                    }
                    const accessor = ArrayItem.Get(`${extensionContext}/attributes/${attribute}`, this._loader.gltf.accessors, extension.attributes[attribute]);
                    promises.push(this._loader._loadFloatAccessorAsync(`/accessors/${accessor.bufferView}`, accessor).then((data) => {
                        attributeBuffers[attribute] = { buffer : data, accessor : accessor };
                    }));
                };
                const attributes = ["TRANSLATION", "ROTATION", "SCALE"];
                for (let i = 0; i < attributes.length; ++i) {
                    loadAttribute(attributes[i]);
                }

                return Promise.all(promises).then(() => {
                    const instanceCount = attributeBuffers[attributes[0]].accessor.count;
                    const digitLength = instanceCount.toString().length;
                    const padNumber = function(num:number, length: number){
                        var str = String(num);
                        while (str.length < (length)) {str = "0" + str;}
                        return str;
                    }

                    for (let i = 0; i < instanceCount; ++i) {
                        if (node._primitiveBabylonMeshes){
                            for (let j = 0; j < node._primitiveBabylonMeshes.length; ++j){
                                const babylonMeshPrimitive = node._primitiveBabylonMeshes[j];
                                const instance = babylonMeshPrimitive.clone((babylonMeshPrimitive.name || babylonMeshPrimitive.id) + "_" + padNumber(i, digitLength), babylonTransformNode, true);
    
                                if (instance) {
                                    attributeBuffers["TRANSLATION"] ? Vector3.FromArrayToRef(attributeBuffers["TRANSLATION"].buffer, i * 3, instance.position)
                                                                    : instance.position.set(0, 0, 0);
                                    attributeBuffers["ROTATION"] ? Quaternion.FromArrayToRef(attributeBuffers["ROTATION"].buffer, i * 4, instance.rotationQuaternion!)
                                                                 : instance.rotationQuaternion?.set(0, 0, 0, 1);
                                    attributeBuffers["SCALE"] ? Vector3.FromArrayToRef(attributeBuffers["SCALE"].buffer, i * 3, instance.scaling)
                                                              : instance.scaling.set(1, 1, 1);
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

GLTFLoader.RegisterExtension(NAME, (loader) => new KHR_mesh_instancing(loader));