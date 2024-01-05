import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";
import type { Nullable } from "core/types";
import type { Animation } from "core/Animations/animation";
import type { IAnimatable } from "core/Animations/animatable.interface";
import type { IAnimation, IAnimationChannel, IGLTF } from "../glTFLoaderInterfaces";
import type { IKHRAnimationPointer } from "babylonjs-gltf2interface";
import { AnimationChannelTargetPath } from "babylonjs-gltf2interface";
import { Logger } from "core/Misc/logger";
import { animationPointerTree } from "./KHR_animation_pointer.data";
import { GLTFPathToObjectConverter } from "./gltfPathToObjectConverter";
import type { AnimationPropertyInfo } from "../glTFLoaderAnimation";

const NAME = "KHR_animation_pointer";

/**
 * Class to convert an animation pointer path to a smart object that
 * gets data from the animation buffer and creates animations.
 */
class AnimationPointerPathToObjectConverter extends GLTFPathToObjectConverter<AnimationPropertyInfo[]> {
    public constructor(gltf: IGLTF) {
        super(gltf, animationPointerTree);
    }
}

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
    private _pathToObjectConverter?: AnimationPointerPathToObjectConverter;

    /**
     * @internal
     */
    constructor(loader: GLTFLoader) {
        this._loader = loader;
        this._pathToObjectConverter = new AnimationPointerPathToObjectConverter(this._loader.gltf);
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
        delete this._pathToObjectConverter; // GC
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
        if (!extension || !this._pathToObjectConverter) {
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

        try {
            const targetInfo = this._pathToObjectConverter.convert(pointer);
            return this._loader._loadAnimationChannelFromTargetInfoAsync(context, animationContext, animation, channel, targetInfo, onLoad);
        } catch (e) {
            Logger.Warn(`${extensionContext}/pointer: Invalid pointer (${pointer}) skipped`);
            return null;
        }
    }
}

GLTFLoader.RegisterExtension(NAME, (loader) => new KHR_animation_pointer(loader));
