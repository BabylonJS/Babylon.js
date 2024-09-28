import type { Nullable } from "core/types";
import type { TransformNode } from "core/Meshes/transformNode";
import type { Camera } from "core/Cameras/camera";

import type { IProperty } from "babylonjs-gltf2interface";
import type { INode, ICamera, IMaterial } from "../glTFLoaderInterfaces";
import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import type { GLTFLoader } from "../glTFLoader";
import type { Material } from "core/Materials/material";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";

const NAME = "ExtrasAsMetadata";

declare module "../../glTFFileLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc
    export interface GLTFLoaderExtensionOptions {
        /**
         * Defines options for the ExtrasAsMetadata extension.
         */
        // NOTE: Don't use NAME here as it will break the UMD type declarations.
        ["ExtrasAsMetadata"]: {};
    }
}

interface ObjectWithMetadata {
    metadata: any;
}

/**
 * Store glTF extras (if present) in BJS objects' metadata
 */
export class ExtrasAsMetadata implements IGLTFLoaderExtension {
    /**
     * The name of this extension.
     */
    public readonly name = NAME;

    /**
     * Defines whether this extension is enabled.
     */
    public enabled = true;

    private _loader: GLTFLoader;

    private _assignExtras(babylonObject: ObjectWithMetadata, gltfProp: IProperty): void {
        if (gltfProp.extras && Object.keys(gltfProp.extras).length > 0) {
            const metadata = (babylonObject.metadata = babylonObject.metadata || {});
            const gltf = (metadata.gltf = metadata.gltf || {});
            gltf.extras = gltfProp.extras;
        }
    }

    /**
     * @internal
     */
    public constructor(loader: GLTFLoader) {
        this._loader = loader;
    }

    /** @internal */
    public dispose(): void {
        (this._loader as any) = null;
    }

    /**
     * @internal
     */
    public loadNodeAsync(context: string, node: INode, assign: (babylonTransformNode: TransformNode) => void): Nullable<Promise<TransformNode>> {
        return this._loader.loadNodeAsync(context, node, (babylonTransformNode): void => {
            this._assignExtras(babylonTransformNode, node);
            assign(babylonTransformNode);
        });
    }

    /**
     * @internal
     */
    public loadCameraAsync(context: string, camera: ICamera, assign: (babylonCamera: Camera) => void): Nullable<Promise<Camera>> {
        return this._loader.loadCameraAsync(context, camera, (babylonCamera): void => {
            this._assignExtras(babylonCamera, camera);
            assign(babylonCamera);
        });
    }

    /**
     * @internal
     */
    public createMaterial(context: string, material: IMaterial, babylonDrawMode: number): Nullable<Material> {
        const babylonMaterial = this._loader.createMaterial(context, material, babylonDrawMode);
        this._assignExtras(babylonMaterial, material);
        return babylonMaterial;
    }
}

unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, false, (loader) => new ExtrasAsMetadata(loader));
