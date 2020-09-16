import { Nullable } from "babylonjs/types";
import { TransformNode } from "babylonjs/Meshes/transformNode";
import { Camera } from "babylonjs/Cameras/camera";

import { IProperty } from "babylonjs-gltf2interface";
import { INode, ICamera, IMaterial } from "../glTFLoaderInterfaces";
import { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";
import { Material } from "babylonjs/Materials/material";

const NAME = "ExtrasAsMetadata";

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

    private _assignExtras(
        babylonObject: ObjectWithMetadata,
        gltfProp: IProperty
    ): void {
        if (gltfProp.extras && Object.keys(gltfProp.extras).length > 0) {
            const metadata = (babylonObject.metadata = babylonObject.metadata || {});
            const gltf = (metadata.gltf = metadata.gltf || {});
            gltf.extras = gltfProp.extras;
        }
    }

    /** @hidden */
    public constructor(loader: GLTFLoader) {
        this._loader = loader;
    }

    /** @hidden */
    public dispose(): void {
        (this._loader as any) = null;
    }

    /** @hidden */
    public loadNodeAsync(
        context: string,
        node: INode,
        assign: (babylonTransformNode: TransformNode) => void
    ): Nullable<Promise<TransformNode>> {
        return this._loader.loadNodeAsync(
            context,
            node,
            (babylonTransformNode): void => {
                this._assignExtras(babylonTransformNode, node);
                assign(babylonTransformNode);
            }
        );
    }

    /** @hidden */
    public loadCameraAsync(
        context: string,
        camera: ICamera,
        assign: (babylonCamera: Camera) => void
    ): Nullable<Promise<Camera>> {
        return this._loader.loadCameraAsync(
            context,
            camera,
            (babylonCamera): void => {
                this._assignExtras(babylonCamera, camera);
                assign(babylonCamera);
            }
        );
    }

    /** @hidden */
    public createMaterial(
        context: string,
        material: IMaterial,
        babylonDrawMode: number
    ): Nullable<Material> {
        const babylonMaterial = this._loader.createMaterial(
            context,
            material,
            babylonDrawMode
        );
        this._assignExtras(babylonMaterial, material);
        return babylonMaterial;
    }
}

GLTFLoader.RegisterExtension(
    NAME,
    (loader): IGLTFLoaderExtension => new ExtrasAsMetadata(loader)
);
