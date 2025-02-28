import type { AbstractMesh } from "core/Meshes/abstractMesh";
import type { GLTFLoader } from "../glTFLoader";
import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";
import type { INode } from "../glTFLoaderInterfaces";
import { AddObjectAccessorToKey } from "./objectModelMapping";

const NAME = "KHR_node_visibility";

declare module "../../glTFFileLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc
    export interface GLTFLoaderExtensionOptions {
        /**
         * Defines options for the KHR_node_visibility extension.
         */
        // NOTE: Don't use NAME here as it will break the UMD type declarations.
        ["KHR_node_visibility"]: {};
    }
}

// object model extension for visibility
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

    private _loader: GLTFLoader;

    /**
     * @internal
     */
    constructor(loader: GLTFLoader) {
        this._loader = loader;
        this.enabled = loader.isExtensionUsed(NAME);
    }

    public async onReady(): Promise<void> {
        this._loader.gltf.nodes?.forEach((node) => {
            node._primitiveBabylonMeshes?.forEach((mesh) => {
                mesh.inheritVisibility = true;
            });
            // When the JSON Pointer is used we need to change both the transform node and the primitive meshes to the new value.
            if (node.extensions?.KHR_node_visibility) {
                if (node.extensions?.KHR_node_visibility.visible === false) {
                    if (node._babylonTransformNode) {
                        (node._babylonTransformNode as AbstractMesh).isVisible = false;
                    }
                    node._primitiveBabylonMeshes?.forEach((mesh) => {
                        mesh.isVisible = false;
                    });
                }
            }
        });
    }

    public dispose() {
        (this._loader as any) = null;
    }
}

unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new KHR_node_visibility(loader));
