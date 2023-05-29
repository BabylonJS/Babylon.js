import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";
import type { IAnimationTargetInfo } from "../glTFLoader";
import type { Nullable } from "core/types";
import type { Animation } from "core/Animations/animation";
import type { IAnimatable } from "core/Animations/animatable.interface";
import type { IAnimation, IAnimationChannel } from "../glTFLoaderInterfaces";
import type { IKHRAnimationPointer } from "babylonjs-gltf2interface";
import { AnimationChannelTargetPath } from "babylonjs-gltf2interface";
import { Logger } from "core/Misc/logger";
import { animationPointerTree } from "./KHR_animation_pointer.data";

const NAME = "KHR_animation_pointer";

/**
 * [Specification PR](https://github.com/KhronosGroup/glTF/pull/2147)
 * !!! Experimental Extension Subject to Changes !!!
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_animation_pointer implements IGLTFLoaderExtension {
    /**
     * The name of this extension.
     */
    public readonly name = NAME;

    private _loader: GLTFLoader;

    /**
     * @internal
     */
    constructor(loader: GLTFLoader) {
        this._loader = loader;
    }

    /**
     * Defines whether this extension is enabled.
     */
    public get enabled(): boolean {
        return this._loader.isExtensionUsed(NAME);
    }

    /** @internal */
    public dispose() {
        (this._loader as any) = null;
    }

    /**
     * Loads a glTF animation channel.
     * @param context The context when loading the asset
     * @param animationContext The context of the animation when loading the asset
     * @param animation The glTF animation property
     * @param channel The glTF animation channel property
     * @param onLoad Called for each animation loaded
     * @returns A void promise that resolves when the load is complete or null if not handled
     */
    public _loadAnimationChannelAsync(
        context: string,
        animationContext: string,
        animation: IAnimation,
        channel: IAnimationChannel,
        onLoad: (babylonAnimatable: IAnimatable, babylonAnimation: Animation) => void
    ): Nullable<Promise<void>> {
        const extension = channel.target.extensions?.KHR_animation_pointer as IKHRAnimationPointer;
        if (!extension) {
            return null;
        }

        if (channel.target.path !== AnimationChannelTargetPath.POINTER) {
            Logger.Warn(`${context}/target/path: Value (${channel.target.path}) must be (${AnimationChannelTargetPath.POINTER}) when using the ${this.name} extension`);
        }

        if (channel.target.node != undefined) {
            Logger.Warn(`${context}/target/node: Value (${channel.target.node}) must not be present when using the ${this.name} extension`);
        }

        const extensionContext = `${context}/extensions/${this.name}`;

        const pointer = extension.pointer;
        if (!pointer) {
            throw new Error(`${extensionContext}: Pointer is missing`);
        }

        const targetInfo = this._parseAnimationPointer(`${extensionContext}/pointer`, pointer);
        if (!targetInfo) {
            Logger.Warn(`${extensionContext}/pointer: Invalid pointer (${pointer}) skipped`);
            return null;
        }

        return this._loader._loadAnimationChannelFromTargetInfoAsync(context, animationContext, animation, channel, targetInfo, onLoad);
    }

    /**
     * The pointer string is represented by a [JSON pointer](https://datatracker.ietf.org/doc/html/rfc6901).
     * <animationPointer> := /<rootNode>/<assetIndex>/<propertyPath>
     * <rootNode> := "nodes" | "materials" | "meshes" | "cameras" | "extensions"
     * <assetIndex> := <digit> | <name>
     * <propertyPath> := <extensionPath> | <standardPath>
     * <extensionPath> := "extensions"/<name>/<standardPath>
     * <standardPath> := <name> | <name>/<standardPath>
     * <name> := W+
     * <digit> := D+
     *
     * Examples:
     *  - "/nodes/0/rotation"
     *  - "/materials/2/emissiveFactor"
     *  - "/materials/2/pbrMetallicRoughness/baseColorFactor"
     *  - "/materials/2/extensions/KHR_materials_emissive_strength/emissiveStrength"
     */
    private _parseAnimationPointer(context: string, pointer: string): Nullable<IAnimationTargetInfo> {
        if (!pointer.startsWith("/")) {
            Logger.Warn(`${context}: Value (${pointer}) must start with a slash`);
            return null;
        }

        const parts = pointer.split("/");

        // Remove the first part since it will be empty string as pointers must start with a slash.
        parts.shift();

        let node: any = animationPointerTree;
        let gltfCurrentNode: any = this._loader.gltf;
        let gltfTargetNode: any = undefined;
        for (const part of parts) {
            if (node.__array__) {
                node = node.__array__;
            } else {
                node = node[part];
                if (!node) {
                    return null;
                }
            }

            gltfCurrentNode = gltfCurrentNode && gltfCurrentNode[part];

            if (node.__target__) {
                gltfTargetNode = gltfCurrentNode;
            }
        }

        if (!gltfTargetNode || !Array.isArray(node)) {
            return null;
        }

        return {
            target: gltfTargetNode,
            properties: node,
        };
    }
}

GLTFLoader.RegisterExtension(NAME, (loader) => new KHR_animation_pointer(loader));
