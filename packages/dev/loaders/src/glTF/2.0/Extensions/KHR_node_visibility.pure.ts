import { type GLTFLoader } from "../glTFLoader.pure";
import { type IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";
import { type AbstractMesh } from "core/Meshes/abstractMesh";
import { type INode } from "../glTFLoaderInterfaces";
import { AddObjectAccessorToKey } from "./objectModelMapping";

const NAME = "KHR_node_visibility";

// object model extension for visibility

/**
 * Loader extension for KHR_node_visibility
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_node_visibility implements IGLTFLoaderExtension {
    /**
     * The name of this extension.
     */
    public readonly name = NAME;

    /**
     * Defines whether this extension is enabled.
     */
    public enabled: boolean;

    private _loader?: GLTFLoader;

    /**
     * @internal
     */
    constructor(loader: GLTFLoader) {
        this._loader = loader;
        this.enabled = loader.isExtensionUsed(NAME);
    }

    public onReady(): void {
        if (!this._loader) {
            return;
        }

        const nodes = this._loader.gltf.nodes;
        if (nodes) {
            for (const node of nodes) {
                const babylonTransformNode = node._babylonTransformNode;
                if (babylonTransformNode) {
                    babylonTransformNode.inheritVisibility = true;
                    if (node.extensions && node.extensions.KHR_node_visibility && node.extensions.KHR_node_visibility.visible === false) {
                        babylonTransformNode.isVisible = false;
                    }
                }
            }
        }
    }

    public dispose() {
        delete this._loader;
    }
}

let _Registered = false;
/**
 * Registers the KHR_node_visibility glTF loader extension.
 * Safe to call multiple times; only the first call has an effect.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function RegisterKHR_node_visibility(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    AddObjectAccessorToKey("/nodes/{}/extensions/KHR_node_visibility/visible", {
        get: (node: INode) => {
            const tn = node._babylonTransformNode as any;
            if (tn && tn.isVisible !== undefined) {
                return tn.isVisible;
            }
            return true;
        },
        set: (value: boolean, node: INode) => {
            node._primitiveBabylonMeshes?.forEach((mesh) => {
                mesh.inheritVisibility = true;
            });
            if (node._babylonTransformNode) {
                (node._babylonTransformNode as AbstractMesh).isVisible = value;
            }
            node._primitiveBabylonMeshes?.forEach((mesh) => {
                mesh.isVisible = value;
            });
        },
        getTarget: (node: INode) => node._babylonTransformNode,
        getPropertyName: [() => "isVisible"],
        type: "boolean",
    });

    unregisterGLTFExtension(NAME);

    registerGLTFExtension(NAME, true, (loader) => new KHR_node_visibility(loader));
}
