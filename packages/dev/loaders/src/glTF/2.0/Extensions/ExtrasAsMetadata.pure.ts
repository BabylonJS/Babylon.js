import { type Nullable } from "core/types";
import { type TransformNode } from "core/Meshes/transformNode.pure";
import { type Camera } from "core/Cameras/camera.pure";
import { type AnimationGroup } from "core/Animations/animationGroup.pure";

import { type IProperty } from "babylonjs-gltf2interface";
import { type INode, type ICamera, type IMaterial, type IAnimation } from "../glTFLoaderInterfaces";
import { type IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { type GLTFLoader } from "../glTFLoader.pure";
import { type Material } from "core/Materials/material";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";

const NAME = "ExtrasAsMetadata";

interface IObjectWithMetadata {
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

    private _assignExtras(babylonObject: IObjectWithMetadata, gltfProp: IProperty): void {
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
    // eslint-disable-next-line no-restricted-syntax
    public loadNodeAsync(context: string, node: INode, assign: (babylonTransformNode: TransformNode) => void): Nullable<Promise<TransformNode>> {
        return this._loader.loadNodeAsync(context, node, (babylonTransformNode): void => {
            this._assignExtras(babylonTransformNode, node);
            assign(babylonTransformNode);
        });
    }

    /**
     * @internal
     */
    // eslint-disable-next-line no-restricted-syntax
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

    /**
     * @internal
     */
    // eslint-disable-next-line no-restricted-syntax
    public loadAnimationAsync(context: string, animation: IAnimation): Nullable<Promise<AnimationGroup>> {
        // eslint-disable-next-line github/no-then
        return this._loader.loadAnimationAsync(context, animation).then((babylonAnimation: AnimationGroup) => {
            this._assignExtras(babylonAnimation, animation);
            return babylonAnimation;
        });
    }
}

let _Registered = false;
/**
 * Registers the ExtrasAsMetadata glTF loader extension.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterExtrasAsMetadata(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    unregisterGLTFExtension(NAME);

    registerGLTFExtension(NAME, false, (loader) => new ExtrasAsMetadata(loader));
}
