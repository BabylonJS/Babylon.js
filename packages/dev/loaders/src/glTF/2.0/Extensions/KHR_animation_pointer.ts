import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { ArrayItem, GLTFLoader } from "../glTFLoader";
import type { Nullable } from "core/types";
import { AnimationGroup } from "core/Animations/animationGroup";
import type { IAnimatable } from "core/Animations/animatable.interface";
import type { IAnimation, IAnimationChannel, _IAnimationSamplerData, IAnimationSampler } from "../glTFLoaderInterfaces";

import { AnimationChannelTargetPath, AnimationSamplerInterpolation } from "babylonjs-gltf2interface";
import { AnimationKeyInterpolation } from "core/Animations/animationKey";
import { CoreAnimationPointerMap } from "./KHR_animation_pointer.map";
import type { GetGltfNodeTargetFn, IAnimationPointerPropertyInfos } from "./KHR_animation_pointer.map";
import { getDataAccessorElementCount } from "../glTFUtilities";

const NAME = GLTFLoader._KHRAnimationPointerName;

interface IAnimationChannelTarget {
    stride?: number;
    target: any;
    properties: Array<IAnimationPointerPropertyInfos>;
    params: any;
}

/**
 * [Specification PR](https://github.com/KhronosGroup/glTF/pull/2147)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_animation_pointer implements IGLTFLoaderExtension {
    /**
     * used to gently ignore invalid pointer. If false, invalid pointer will throw exception.
     */
    public ignoreInvalidPointer: boolean = true;

    /**
     * The name of this extension.
     */
    public readonly name = NAME;

    private _loader: GLTFLoader;

    /**
     * @param loader
     * @hidden
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

    public loadAnimationAsync(context: string, animation: IAnimation): Nullable<Promise<AnimationGroup>> {
        // ensure an animation group is present.
        if (!animation._babylonAnimationGroup) {
            this._loader.babylonScene._blockEntityCollection = !!this._loader._assetContainer;
            const group = new AnimationGroup(animation.name || `animation${animation.index}`, this._loader.babylonScene);
            group._parentContainer = this._loader._assetContainer;
            this._loader.babylonScene._blockEntityCollection = false;
            animation._babylonAnimationGroup = group;
        }
        const babylonAnimationGroup = animation._babylonAnimationGroup;

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
     * @param animationTargetOverride The babylon animation channel target override property. My be null.
     * @returns A void promise when the channel load is complete
     */
    public _loadAnimationChannelAsync(
        context: string,
        animationContext: string,
        animation: IAnimation,
        channel: IAnimationChannel,
        animationTargetOverride: Nullable<IAnimatable> = null
    ): Promise<void> {
        if (channel.target.path != AnimationChannelTargetPath.POINTER) {
            throw new Error(`${context}/target/path: Invalid value (${channel.target.path})`);
        }

        if (channel.target.node != undefined) {
            // According to KHR_animation_pointer specification
            // If this extension is used, the animation.channel.target.node must not be set.
            // Because the node is defined, the channel is ignored and not animated due to the specification.
            return Promise.resolve();
        }

        const pointer = channel.target.extensions?.KHR_animation_pointer?.pointer;
        if (!pointer) {
            throw new Error(`${context}/target/extensions/${this.name}: Pointer is missing`);
        }

        const sampler = ArrayItem.Get(`${context}/sampler`, animation.samplers, channel.sampler);

        return this._loadAnimationSamplerAsync(`${context}/samplers/${channel.sampler}`, sampler).then((data) => {
            // this is where we process the pointer.
            const animationTarget = this._parseAnimationPointer(`${context}/extensions/${this.name}/pointer`, pointer);

            if (!animationTarget) {
                return;
            }
            // build the keys
            // build the animations into the group
            const babylonAnimationGroup = animation._babylonAnimationGroup;
            if (!babylonAnimationGroup) {
                return;
            }

            const outputAccessor = ArrayItem.Get(`${context}/output`, this._loader.gltf.accessors, sampler.output);
            // stride is the size of each element stored into the output buffer.
            const stride = animationTarget.stride ?? getDataAccessorElementCount(outputAccessor.type);
            const fps = this._loader.parent.targetFps;

            // we extract the corresponding values from the read value.
            // the reason for that is one GLTF value may be dispatched to several Babylon properties
            // one of example is baseColorFactor which is a Color4 under GLTF and dispatched to
            // - albedoColor as Color3(Color4.r,Color4.g,Color4.b)
            // - alpha as Color4.a
            for (const propertyInfo of animationTarget.properties) {
                // Ignore animations that have no animation valid targets.
                if (!propertyInfo.isValid(animationTarget.target)) {
                    return;
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
                // these logics are located into KHR_animation_pointer.map.ts
                propertyInfo.buildAnimations(animationTarget.target, fps, keys, babylonAnimationGroup, animationTargetOverride, animationTarget.params);
            }
        });
    }

    private _loadAnimationSamplerAsync(context: string, sampler: IAnimationSampler): Promise<_IAnimationSamplerData> {
        if (sampler._data) {
            return sampler._data;
        }

        const interpolation = sampler.interpolation || AnimationSamplerInterpolation.LINEAR;
        switch (interpolation) {
            case AnimationSamplerInterpolation.STEP:
            case AnimationSamplerInterpolation.LINEAR:
            case AnimationSamplerInterpolation.CUBICSPLINE: {
                break;
            }
            default: {
                throw new Error(`${context}/interpolation: Invalid value (${sampler.interpolation})`);
            }
        }

        const inputAccessor = ArrayItem.Get(`${context}/input`, this._loader.gltf.accessors, sampler.input);
        const outputAccessor = ArrayItem.Get(`${context}/output`, this._loader.gltf.accessors, sampler.output);
        sampler._data = Promise.all([
            this._loader._loadFloatAccessorAsync(`/accessors/${inputAccessor.index}`, inputAccessor),
            this._loader._loadFloatAccessorAsync(`/accessors/${outputAccessor.index}`, outputAccessor),
        ]).then(([inputData, outputData]) => {
            return {
                input: inputData,
                interpolation: interpolation,
                output: outputData,
            };
        });

        return sampler._data;
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
        const sep = "/";
        if (pointer.charAt(0) == sep) {
            pointer = pointer.substring(1);
        }
        const parts = pointer.split(sep);
        // we have a least 3 part
        if (parts.length >= 3) {
            let node = CoreAnimationPointerMap; // the map of possible path
            const indices = [];
            let getTarget: Nullable<GetGltfNodeTargetFn> = null;
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                node = node[part];

                if (!node) {
                    // nothing to do so far
                    break;
                }

                if (node.getTarget) {
                    getTarget = node.getTarget;
                }

                if (node.hasIndex) {
                    indices.push(parts[++i]);
                    // move to the next part
                    continue;
                }

                if (node.isIndex) {
                    indices.push(part);
                    // move to the next part
                    continue;
                }

                if (node.properties && getTarget) {
                    const t = getTarget(this._loader.gltf, indices[0]);
                    if (t != null) {
                        return {
                            target: t,
                            stride: node.getStride ? node.getStride(t) : undefined,
                            properties: node.properties,
                            params: indices,
                        };
                    }
                }
            }
        }
        if (this.ignoreInvalidPointer) {
            return null;
        }
        throw new Error(`${context} invalid pointer. ${pointer}`);
    }
}

GLTFLoader.RegisterExtension(NAME, (loader) => new KHR_animation_pointer(loader));
