import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { ArrayItem, GLTFLoader } from "../glTFLoader";
import type { Nullable } from "core/types";
import { AnimationGroup } from "core/Animations/animationGroup";
import { Animation } from "core/Animations/animation";
import type { IAnimation, IAnimationChannel } from "../glTFLoaderInterfaces";

import { AnimationChannelTargetPath, AnimationSamplerInterpolation } from "babylonjs-gltf2interface";
import { AnimationKeyInterpolation } from "core/Animations/animationKey";
import { CoreAnimationPointerMap, IAnimationPointerPropertyInfos } from "./KHR_animation_pointer.map";

const NAME = "KHR_animation_pointer";

interface IAnimationChannelTarget {
    stride: number;
    target: any;
    properties: Array<IAnimationPointerPropertyInfos>;
}

/**
 * [Specification PR](https://github.com/KhronosGroup/glTF/pull/2147)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_animation_pointer implements IGLTFLoaderExtension {
    /**
     * used to gently ignore invalid pointer. If false, invalid pointer will throw exception.
     */
    public static IgnoreInvalidPointer: boolean = false;

    /**
     * Used internally to determine how much data to be gather from input buffer.
     * @param infos the informations
     * @returns
     */
    static GetAnimationOutputStride(infos: Array<IAnimationPointerPropertyInfos>): number {
        let stride = 0;
        for (const info of infos) {
            switch (info.type) {
                case Animation.ANIMATIONTYPE_FLOAT: {
                    stride++;
                    break;
                }
                case Animation.ANIMATIONTYPE_VECTOR2:
                case Animation.ANIMATIONTYPE_SIZE: {
                    stride += 2;
                    break;
                }

                case Animation.ANIMATIONTYPE_VECTOR3:
                case Animation.ANIMATIONTYPE_COLOR3: {
                    stride += 3;
                    break;
                }

                case Animation.ANIMATIONTYPE_COLOR4:
                case Animation.ANIMATIONTYPE_QUATERNION: {
                    stride += 4;
                    break;
                }

                case Animation.ANIMATIONTYPE_MATRIX: {
                    stride += 16;
                    break;
                }
            }
        }
        return stride;
    }

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
     * @param loader
     * @hidden
     */
    constructor(loader: GLTFLoader) {
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
    }

    /** @hidden */
    public dispose() {
        (this._loader as any) = null;
    }

    /**
     * according to specification,
     * It is not allowed to animate a glTFid property, as it does change the structure of the glTF in general
     * It is not allowed to animate a name property in general.
     * @param property
     * @hidden
     */
    public accept(property: string): boolean {
        return property != "name";
    }

    public loadAnimationAsync?(context: string, animation: IAnimation): Nullable<Promise<AnimationGroup>> {
        this._loader.babylonScene._blockEntityCollection = !!this._loader._assetContainer;
        const babylonAnimationGroup = new AnimationGroup(animation.name || `animation${animation.index}`, this._loader.babylonScene);
        babylonAnimationGroup._parentContainer = this._loader._assetContainer;
        this._loader.babylonScene._blockEntityCollection = false;
        animation._babylonAnimationGroup = babylonAnimationGroup;

        const promises = new Array<Promise<any>>();
        ArrayItem.Assign(animation.channels);
        ArrayItem.Assign(animation.samplers);

        for (const channel of animation.channels) {
            promises.push(this._loadAnimationChannelAsync(`${context}/channels/${channel.index}`, context, animation, channel));
        }

        return Promise.all(promises).then(() => {
            babylonAnimationGroup.normalize(0);
            return babylonAnimationGroup;
        });
    }

    /**
     * @hidden Loads a glTF animation channel.
     * @param context The context when loading the asset
     * @param animationContext The context of the animation when loading the asset
     * @param animation The glTF animation property
     * @param channel The glTF animation channel property
     * @returns A void promise when the channel load is complete
     */
    public _loadAnimationChannelAsync(context: string, animationContext: string, animation: IAnimation, channel: IAnimationChannel): Promise<void> {
        if (channel.target.path != AnimationChannelTargetPath.POINTER) {
            throw new Error(`${context}/target/path: Invalid value (${channel.target.path})`);
        }

        if (channel.target.node != undefined) {
            // According to KHR_animation_pointer specification
            // If this extension is used, the animation.channel.target.node must not be set.
            // Because the node isn’t defined, the channel is ignored and not animated due to the specification.
            return Promise.resolve();
        }

        const pointer = channel.target.extensions?.KHR_animation_pointer?.pointer;
        if (!pointer) {
            throw new Error(`${context}/target/extensions.KHR_animation_pointer.pointer MUST be set.`);
        }

        const sampler = ArrayItem.Get(`${context}/sampler`, animation.samplers, channel.sampler);

        return this._loader._loadAnimationSamplerAsync(`${context}/samplers/${channel.sampler}`, sampler).then((data) => {
            // this is where we process the pointer.
            const animationTarget = this._parseAnimationPointer(`${context}/extensions/${this.name}/pointer`, pointer);

            if (animationTarget) {
                // build the keys
                // build the animations into the group
                const babylonAnimationGroup = animation._babylonAnimationGroup;
                if (babylonAnimationGroup) {
                    // stride is the size of each element stored into the output buffer.
                    // stride is the sum of property size or as per defined into the info.
                    const stride = animationTarget.stride ?? KHR_animation_pointer.GetAnimationOutputStride(animationTarget.properties);
                    const fps = this._loader.parent.targetFps;

                    // we extract the corresponding values from the readed value.
                    // the reason for that is one GLTF value may be dispatched to several Babylon properties
                    // one of example is baseColorFactor which is a Color4 under GLTF and dispatched to
                    // - albedoColor as Color3(Color4.r,Color4.g,Color4.b)
                    // - alpha as Color4.a
                    for (const propertyInfo of animationTarget.properties) {
                        // Ignore animations that have no animation valid targets.
                        if (!propertyInfo.isValid(animationTarget.target)) {
                            return Promise.resolve();
                        }

                        // build the keys.
                        const keys = new Array(data.input.length);
                        let outputOffset = 0;

                        switch (data.interpolation) {
                            case AnimationSamplerInterpolation.STEP: {
                                for (let frameIndex = 0; frameIndex < data.input.length; frameIndex++) {
                                    keys[frameIndex] = {
                                        frame: data.input[frameIndex] * fps,
                                        value: propertyInfo.get(animationTarget.target, data.output, outputOffset),
                                        interpolation: AnimationKeyInterpolation.STEP,
                                    };
                                    outputOffset += stride;
                                }
                                break;
                            }
                            case AnimationSamplerInterpolation.CUBICSPLINE: {
                                const invfps = 1 / fps;
                                for (let frameIndex = 0; frameIndex < data.input.length; frameIndex++) {
                                    const k: any = {
                                        frame: data.input[frameIndex] * fps,
                                    };

                                    (k.inTangent = propertyInfo.get(animationTarget.target, data.output, outputOffset, invfps)), (outputOffset += stride);
                                    (k.value = propertyInfo.get(animationTarget.target, data.output, outputOffset)), (outputOffset += stride);
                                    (k.outTangent = propertyInfo.get(animationTarget.target, data.output, outputOffset, invfps)), (outputOffset += stride);

                                    keys[frameIndex] = k;
                                }
                                break;
                            }
                            case AnimationSamplerInterpolation.LINEAR:
                            default: {
                                for (let frameIndex = 0; frameIndex < data.input.length; frameIndex++) {
                                    keys[frameIndex] = {
                                        frame: data.input[frameIndex] * fps,
                                        value: propertyInfo.get(animationTarget.target, data.output, outputOffset),
                                    };
                                    outputOffset += stride;
                                }
                                break;
                            }
                        }

                        // each properties has its own build animation process.
                        propertyInfo.buildAnimations(animationTarget.target, fps, keys, babylonAnimationGroup);
                    }
                }
            }
        });
    }

    /**
     * parsing animation pointer is the core of animation channel.
     * Animation pointer is a Json pointer, which mean it locate an item into the json hierarchy.
     * Consequentely the pointer has the following BNF
   
     * <animationPointer> := <sep><assetContainer><sep><assetIndex><sep><propertyPath>
     * <assetContainer> := "nodes" | "materials" | "meshes" | "cameras" | "extensions" 
     * <assetIndex> := <digit> | <name>
     * <propertyPath> := <extensionPath> | <standardPath>
     * <extensionPath> := "extensions"<sep><name><sep><standardPath>
     * <standardPath> := <name> | <name><sep><standardPath> 
     * <sep>:= "/"
     * <name> := W+
     * <digit> := D+
     * 
     * examples of pointer are
     *  - "/nodes/0/rotation"
     *  - "/materials/2/emissiveFactor"
     *  - "/materials/2/pbrMetallicRoughness/baseColorFactor"
     *  - "/materials/2/extensions/KHR_materials_emissive_strength/emissiveStrength"
     * @param context 
     * @param pointer 
     * @return 
     */
    private _parseAnimationPointer(context: string, pointer: string): Nullable<IAnimationChannelTarget> {
        const parts = pointer.split("/");
        // we have a least 3 part
        if (parts.length >= 3) {
            let node = CoreAnimationPointerMap; // the map of possible path
            let index: string = "";
            for (let i = 0; i != parts.length; i++) {
                const part = parts[i];
                if (node.hasIndex) {
                    index = part;
                    // move to the next part
                    continue;
                }
                node = node[part];
                if (!node) {
                    // nothing to do so far
                    break;
                }
                if (node.getTarget) {
                    // this is a leaf
                    const t = node.getTarget(this._loader.gltf, index);
                    if (t != null) {
                        return {
                            target: t,
                            stride: node.getStride ? node.getStride(t) : KHR_animation_pointer.GetAnimationOutputStride(node.properties),
                            properties: node.properties,
                        };
                    }
                }
            }
        }
        if (KHR_animation_pointer.IgnoreInvalidPointer) {
            return null;
        }
        throw new Error(`${context} invalid pointer. ${pointer}`);
    }
}

GLTFLoader.RegisterExtension(NAME, (loader) => new KHR_animation_pointer(loader));
