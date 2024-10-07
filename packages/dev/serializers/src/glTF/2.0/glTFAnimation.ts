// import type { IAnimation, INode, IBufferView, IAccessor, IAnimationSampler, IAnimationChannel } from "babylonjs-gltf2interface";
// import { AnimationSamplerInterpolation, AnimationChannelTargetPath, AccessorType, AccessorComponentType } from "babylonjs-gltf2interface";
// import type { Node } from "core/node";
// import type { Nullable } from "core/types";
// import { Vector3, Quaternion } from "core/Maths/math.vector";
// import { Tools } from "core/Misc/tools";
// import { Animation } from "core/Animations/animation";
// import { TransformNode } from "core/Meshes/transformNode";
// import type { Scene } from "core/scene";
// import { MorphTarget } from "core/Morph/morphTarget";
// import { Mesh } from "core/Meshes/mesh";

// import type { _BinaryWriter } from "./glTFExporter";
// import { _GLTFUtilities } from "./glTFUtilities";
// import type { IAnimationKey } from "core/Animations/animationKey";
// import { AnimationKeyInterpolation } from "core/Animations/animationKey";

// import { Camera } from "core/Cameras/camera";
// import { Light } from "core/Lights/light";

// /**
//  * @internal
//  * Interface to store animation data.
//  */
// // eslint-disable-next-line @typescript-eslint/naming-convention
// export interface _IAnimationData {
//     /**
//      * Keyframe data.
//      */
//     inputs: number[];
//     /**
//      * Value data.
//      */
//     outputs: number[][];
//     /**
//      * Animation interpolation data.
//      */
//     samplerInterpolation: AnimationSamplerInterpolation;
//     /**
//      * Minimum keyframe value.
//      */
//     inputsMin: number;
//     /**
//      * Maximum keyframe value.
//      */
//     inputsMax: number;
// }

// /**
//  * @internal
//  */
// // eslint-disable-next-line @typescript-eslint/naming-convention
// export interface _IAnimationInfo {
//     /**
//      * The target channel for the animation
//      */
//     animationChannelTargetPath: AnimationChannelTargetPath;
//     /**
//      * The glTF accessor type for the data.
//      */
//     dataAccessorType: AccessorType.VEC3 | AccessorType.VEC4 | AccessorType.SCALAR;
//     /**
//      * Specifies if quaternions should be used.
//      */
//     useQuaternion: boolean;
// }

// /**
//  * @internal
//  * Enum for handling in tangent and out tangent.
//  */
// // eslint-disable-next-line @typescript-eslint/naming-convention
// enum _TangentType {
//     /**
//      * Specifies that input tangents are used.
//      */
//     INTANGENT,
//     /**
//      * Specifies that output tangents are used.
//      */
//     OUTTANGENT,
// }

// /**
//  * @internal
//  * Utility class for generating glTF animation data from BabylonJS.
//  */
// export class _GLTFAnimation {
//     /**
//      * Determine if a node is transformable - ie has properties it should be part of animation of transformation.
//      * @param babylonNode the node to test
//      * @returns true if can be animated, false otherwise. False if the parameter is null or undefined.
//      */
//     private static _IsTransformable(babylonNode: Node): boolean {
//         return babylonNode && (babylonNode instanceof TransformNode || babylonNode instanceof Camera || babylonNode instanceof Light);
//     }

//     /**
//      * @ignore
//      *
//      * Creates glTF channel animation from BabylonJS animation.
//      * @param babylonTransformNode - BabylonJS mesh.
//      * @param animation - animation.
//      * @param animationChannelTargetPath - The target animation channel.
//      * @param useQuaternion - Specifies if quaternions are used.
//      * @returns nullable IAnimationData
//      */
//     public static _CreateNodeAnimation(
//         babylonTransformNode: Node,
//         animation: Animation,
//         animationChannelTargetPath: AnimationChannelTargetPath,
//         useQuaternion: boolean,
//         animationSampleRate: number
//     ): Nullable<_IAnimationData> {
//         if (this._IsTransformable(babylonTransformNode)) {
//             const inputs: number[] = [];
//             const outputs: number[][] = [];
//             const keyFrames = animation.getKeys();
//             const minMaxKeyFrames = _GLTFAnimation._CalculateMinMaxKeyFrames(keyFrames);
//             const interpolationOrBake = _GLTFAnimation._DeduceInterpolation(keyFrames, animationChannelTargetPath, useQuaternion);

//             const interpolation = interpolationOrBake.interpolationType;
//             const shouldBakeAnimation = interpolationOrBake.shouldBakeAnimation;

//             if (shouldBakeAnimation) {
//                 _GLTFAnimation._CreateBakedAnimation(
//                     babylonTransformNode,
//                     animation,
//                     animationChannelTargetPath,
//                     minMaxKeyFrames.min,
//                     minMaxKeyFrames.max,
//                     animation.framePerSecond,
//                     animationSampleRate,
//                     inputs,
//                     outputs,
//                     minMaxKeyFrames,
//                     useQuaternion
//                 );
//             } else {
//                 if (interpolation === AnimationSamplerInterpolation.LINEAR || interpolation === AnimationSamplerInterpolation.STEP) {
//                     _GLTFAnimation._CreateLinearOrStepAnimation(babylonTransformNode, animation, animationChannelTargetPath, inputs, outputs, useQuaternion);
//                 } else if (interpolation === AnimationSamplerInterpolation.CUBICSPLINE) {
//                     _GLTFAnimation._CreateCubicSplineAnimation(babylonTransformNode, animation, animationChannelTargetPath, inputs, outputs, useQuaternion);
//                 } else {
//                     _GLTFAnimation._CreateBakedAnimation(
//                         babylonTransformNode,
//                         animation,
//                         animationChannelTargetPath,
//                         minMaxKeyFrames.min,
//                         minMaxKeyFrames.max,
//                         animation.framePerSecond,
//                         animationSampleRate,
//                         inputs,
//                         outputs,
//                         minMaxKeyFrames,
//                         useQuaternion
//                     );
//                 }
//             }

//             if (inputs.length && outputs.length) {
//                 const result: _IAnimationData = {
//                     inputs: inputs,
//                     outputs: outputs,
//                     samplerInterpolation: interpolation,
//                     inputsMin: shouldBakeAnimation ? minMaxKeyFrames.min : Tools.FloatRound(minMaxKeyFrames.min / animation.framePerSecond),
//                     inputsMax: shouldBakeAnimation ? minMaxKeyFrames.max : Tools.FloatRound(minMaxKeyFrames.max / animation.framePerSecond),
//                 };

//                 return result;
//             }
//         }

//         return null;
//     }

//     private static _DeduceAnimationInfo(animation: Animation): Nullable<_IAnimationInfo> {
//         let animationChannelTargetPath: Nullable<AnimationChannelTargetPath> = null;
//         let dataAccessorType = AccessorType.VEC3;
//         let useQuaternion: boolean = false;
//         const property = animation.targetProperty.split(".");
//         switch (property[0]) {
//             case "scaling": {
//                 animationChannelTargetPath = AnimationChannelTargetPath.SCALE;
//                 break;
//             }
//             case "position": {
//                 animationChannelTargetPath = AnimationChannelTargetPath.TRANSLATION;
//                 break;
//             }
//             case "rotation": {
//                 dataAccessorType = AccessorType.VEC4;
//                 animationChannelTargetPath = AnimationChannelTargetPath.ROTATION;
//                 break;
//             }
//             case "rotationQuaternion": {
//                 dataAccessorType = AccessorType.VEC4;
//                 useQuaternion = true;
//                 animationChannelTargetPath = AnimationChannelTargetPath.ROTATION;
//                 break;
//             }
//             case "influence": {
//                 dataAccessorType = AccessorType.SCALAR;
//                 animationChannelTargetPath = AnimationChannelTargetPath.WEIGHTS;
//                 break;
//             }
//             default: {
//                 Tools.Error(`Unsupported animatable property ${property[0]}`);
//             }
//         }
//         if (animationChannelTargetPath) {
//             return { animationChannelTargetPath: animationChannelTargetPath, dataAccessorType: dataAccessorType, useQuaternion: useQuaternion };
//         } else {
//             Tools.Error("animation channel target path and data accessor type could be deduced");
//         }
//         return null;
//     }

//     /**
//      * @ignore
//      * Create node animations from the transform node animations
//      * @param babylonNode
//      * @param runtimeGLTFAnimation
//      * @param idleGLTFAnimations
//      * @param nodeMap
//      * @param nodes
//      * @param binaryWriter
//      * @param bufferViews
//      * @param accessors
//      * @param animationSampleRate
//      */
//     public static _CreateNodeAnimationFromNodeAnimations(
//         babylonNode: Node,
//         runtimeGLTFAnimation: IAnimation,
//         idleGLTFAnimations: IAnimation[],
//         nodeMap: { [key: number]: number },
//         nodes: INode[],
//         binaryWriter: _BinaryWriter,
//         bufferViews: IBufferView[],
//         accessors: IAccessor[],
//         animationSampleRate: number,
//         shouldExportAnimation?: (animation: Animation) => boolean
//     ) {
//         let glTFAnimation: IAnimation;
//         if (_GLTFAnimation._IsTransformable(babylonNode)) {
//             if (babylonNode.animations) {
//                 for (const animation of babylonNode.animations) {
//                     if (shouldExportAnimation && !shouldExportAnimation(animation)) {
//                         continue;
//                     }
//                     const animationInfo = _GLTFAnimation._DeduceAnimationInfo(animation);
//                     if (animationInfo) {
//                         glTFAnimation = {
//                             name: animation.name,
//                             samplers: [],
//                             channels: [],
//                         };
//                         _GLTFAnimation._AddAnimation(
//                             `${animation.name}`,
//                             animation.hasRunningRuntimeAnimations ? runtimeGLTFAnimation : glTFAnimation,
//                             babylonNode,
//                             animation,
//                             animationInfo.dataAccessorType,
//                             animationInfo.animationChannelTargetPath,
//                             nodeMap,
//                             binaryWriter,
//                             bufferViews,
//                             accessors,
//                             animationInfo.useQuaternion,
//                             animationSampleRate
//                         );
//                         if (glTFAnimation.samplers.length && glTFAnimation.channels.length) {
//                             idleGLTFAnimations.push(glTFAnimation);
//                         }
//                     }
//                 }
//             }
//         }
//     }

//     /**
//      * @ignore
//      * Create individual morph animations from the mesh's morph target animation tracks
//      * @param babylonNode
//      * @param runtimeGLTFAnimation
//      * @param idleGLTFAnimations
//      * @param nodeMap
//      * @param nodes
//      * @param binaryWriter
//      * @param bufferViews
//      * @param accessors
//      * @param animationSampleRate
//      */
//     public static _CreateMorphTargetAnimationFromMorphTargetAnimations(
//         babylonNode: Node,
//         runtimeGLTFAnimation: IAnimation,
//         idleGLTFAnimations: IAnimation[],
//         nodeMap: { [key: number]: number },
//         nodes: INode[],
//         binaryWriter: _BinaryWriter,
//         bufferViews: IBufferView[],
//         accessors: IAccessor[],
//         animationSampleRate: number,
//         shouldExportAnimation?: (animation: Animation) => boolean
//     ) {
//         let glTFAnimation: IAnimation;
//         if (babylonNode instanceof Mesh) {
//             const morphTargetManager = babylonNode.morphTargetManager;
//             if (morphTargetManager) {
//                 for (let i = 0; i < morphTargetManager.numTargets; ++i) {
//                     const morphTarget = morphTargetManager.getTarget(i);
//                     for (const animation of morphTarget.animations) {
//                         if (shouldExportAnimation && !shouldExportAnimation(animation)) {
//                             continue;
//                         }
//                         const combinedAnimation = new Animation(
//                             `${animation.name}`,
//                             "influence",
//                             animation.framePerSecond,
//                             animation.dataType,
//                             animation.loopMode,
//                             animation.enableBlending
//                         );
//                         const combinedAnimationKeys: IAnimationKey[] = [];
//                         const animationKeys = animation.getKeys();

//                         for (let j = 0; j < animationKeys.length; ++j) {
//                             const animationKey = animationKeys[j];
//                             for (let k = 0; k < morphTargetManager.numTargets; ++k) {
//                                 if (k == i) {
//                                     combinedAnimationKeys.push(animationKey);
//                                 } else {
//                                     combinedAnimationKeys.push({ frame: animationKey.frame, value: 0 });
//                                 }
//                             }
//                         }
//                         combinedAnimation.setKeys(combinedAnimationKeys);
//                         const animationInfo = _GLTFAnimation._DeduceAnimationInfo(combinedAnimation);
//                         if (animationInfo) {
//                             glTFAnimation = {
//                                 name: combinedAnimation.name,
//                                 samplers: [],
//                                 channels: [],
//                             };
//                             _GLTFAnimation._AddAnimation(
//                                 animation.name,
//                                 animation.hasRunningRuntimeAnimations ? runtimeGLTFAnimation : glTFAnimation,
//                                 babylonNode,
//                                 combinedAnimation,
//                                 animationInfo.dataAccessorType,
//                                 animationInfo.animationChannelTargetPath,
//                                 nodeMap,
//                                 binaryWriter,
//                                 bufferViews,
//                                 accessors,
//                                 animationInfo.useQuaternion,
//                                 animationSampleRate,
//                                 morphTargetManager.numTargets
//                             );
//                             if (glTFAnimation.samplers.length && glTFAnimation.channels.length) {
//                                 idleGLTFAnimations.push(glTFAnimation);
//                             }
//                         }
//                     }
//                 }
//             }
//         }
//     }

//     /**
//      * @internal
//      * Create node and morph animations from the animation groups
//      * @param babylonScene
//      * @param glTFAnimations
//      * @param nodeMap
//      * @param nodes
//      * @param binaryWriter
//      * @param bufferViews
//      * @param accessors
//      * @param animationSampleRate
//      */
//     public static _CreateNodeAndMorphAnimationFromAnimationGroups(
//         babylonScene: Scene,
//         glTFAnimations: IAnimation[],
//         nodeMap: { [key: number]: number },
//         binaryWriter: _BinaryWriter,
//         bufferViews: IBufferView[],
//         accessors: IAccessor[],
//         animationSampleRate: number,
//         shouldExportAnimation?: (animation: Animation) => boolean
//     ) {
//         let glTFAnimation: IAnimation;
//         if (babylonScene.animationGroups) {
//             const animationGroups = babylonScene.animationGroups;
//             for (const animationGroup of animationGroups) {
//                 const morphAnimations: Map<Mesh, Map<MorphTarget, Animation>> = new Map();
//                 const sampleAnimations: Map<Mesh, Animation> = new Map();
//                 const morphAnimationMeshes: Set<Mesh> = new Set();
//                 const animationGroupFrameDiff = animationGroup.to - animationGroup.from;
//                 glTFAnimation = {
//                     name: animationGroup.name,
//                     channels: [],
//                     samplers: [],
//                 };
//                 for (let i = 0; i < animationGroup.targetedAnimations.length; ++i) {
//                     const targetAnimation = animationGroup.targetedAnimations[i];
//                     const target = targetAnimation.target;
//                     const animation = targetAnimation.animation;
//                     if (shouldExportAnimation && !shouldExportAnimation(animation)) {
//                         continue;
//                     }
//                     if (this._IsTransformable(target) || (target.length === 1 && this._IsTransformable(target[0]))) {
//                         const animationInfo = _GLTFAnimation._DeduceAnimationInfo(targetAnimation.animation);
//                         if (animationInfo) {
//                             const babylonTransformNode = this._IsTransformable(target) ? target : this._IsTransformable(target[0]) ? target[0] : null;
//                             if (babylonTransformNode) {
//                                 _GLTFAnimation._AddAnimation(
//                                     `${animation.name}`,
//                                     glTFAnimation,
//                                     babylonTransformNode,
//                                     animation,
//                                     animationInfo.dataAccessorType,
//                                     animationInfo.animationChannelTargetPath,
//                                     nodeMap,
//                                     binaryWriter,
//                                     bufferViews,
//                                     accessors,
//                                     animationInfo.useQuaternion,
//                                     animationSampleRate
//                                 );
//                             }
//                         }
//                     } else if (target instanceof MorphTarget || (target.length === 1 && target[0] instanceof MorphTarget)) {
//                         const animationInfo = _GLTFAnimation._DeduceAnimationInfo(targetAnimation.animation);
//                         if (animationInfo) {
//                             const babylonMorphTarget = target instanceof MorphTarget ? (target as MorphTarget) : (target[0] as MorphTarget);
//                             if (babylonMorphTarget) {
//                                 const babylonMorphTargetManager = babylonScene.morphTargetManagers.find((morphTargetManager) => {
//                                     for (let j = 0; j < morphTargetManager.numTargets; ++j) {
//                                         if (morphTargetManager.getTarget(j) === babylonMorphTarget) {
//                                             return true;
//                                         }
//                                     }
//                                     return false;
//                                 });
//                                 if (babylonMorphTargetManager) {
//                                     const babylonMesh = babylonScene.meshes.find((mesh) => {
//                                         return (mesh as Mesh).morphTargetManager === babylonMorphTargetManager;
//                                     }) as Mesh;
//                                     if (babylonMesh) {
//                                         if (!morphAnimations.has(babylonMesh)) {
//                                             morphAnimations.set(babylonMesh, new Map());
//                                         }
//                                         morphAnimations.get(babylonMesh)?.set(babylonMorphTarget, animation);
//                                         morphAnimationMeshes.add(babylonMesh);
//                                         sampleAnimations.set(babylonMesh, animation);
//                                     }
//                                 }
//                             }
//                         }
//                     } else {
//                         // this is the place for the KHR_animation_pointer.
//                     }
//                 }
//                 morphAnimationMeshes.forEach((mesh) => {
//                     const morphTargetManager = mesh.morphTargetManager!;
//                     let combinedAnimationGroup: Nullable<Animation> = null;
//                     const animationKeys: IAnimationKey[] = [];
//                     const sampleAnimation = sampleAnimations.get(mesh)!;
//                     const sampleAnimationKeys = sampleAnimation.getKeys();
//                     const numAnimationKeys = sampleAnimationKeys.length;
//                     /*
//                         Due to how glTF expects morph target animation data to be formatted, we need to rearrange the individual morph target animation tracks,
//                         such that we have a single animation, where a given keyframe input value has successive output values for each morph target belonging to the manager.
//                         See: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#animations

//                         We do this via constructing a new Animation track, and interleaving the frames of each morph target animation track in the current Animation Group
//                         We reuse the Babylon Animation data structure for ease of handling export of cubic spline animation keys, and to reuse the
//                         existing _GLTFAnimation.AddAnimation codepath with minimal modification, however the constructed Babylon Animation is NOT intended for use in-engine.
//                     */
//                     for (let i = 0; i < numAnimationKeys; ++i) {
//                         for (let j = 0; j < morphTargetManager.numTargets; ++j) {
//                             const morphTarget = morphTargetManager.getTarget(j);
//                             const animationsByMorphTarget = morphAnimations.get(mesh);
//                             if (animationsByMorphTarget) {
//                                 const morphTargetAnimation = animationsByMorphTarget.get(morphTarget);
//                                 if (morphTargetAnimation) {
//                                     if (!combinedAnimationGroup) {
//                                         combinedAnimationGroup = new Animation(
//                                             `${animationGroup.name}_${mesh.name}_MorphWeightAnimation`,
//                                             "influence",
//                                             morphTargetAnimation.framePerSecond,
//                                             Animation.ANIMATIONTYPE_FLOAT,
//                                             morphTargetAnimation.loopMode,
//                                             morphTargetAnimation.enableBlending
//                                         );
//                                     }
//                                     animationKeys.push(morphTargetAnimation.getKeys()[i]);
//                                 } else {
//                                     animationKeys.push({
//                                         frame: animationGroup.from + (animationGroupFrameDiff / numAnimationKeys) * i,
//                                         value: morphTarget.influence,
//                                         inTangent: sampleAnimationKeys[0].inTangent ? 0 : undefined,
//                                         outTangent: sampleAnimationKeys[0].outTangent ? 0 : undefined,
//                                     });
//                                 }
//                             }
//                         }
//                     }
//                     combinedAnimationGroup!.setKeys(animationKeys);
//                     const animationInfo = _GLTFAnimation._DeduceAnimationInfo(combinedAnimationGroup!);
//                     if (animationInfo) {
//                         _GLTFAnimation._AddAnimation(
//                             `${animationGroup.name}_${mesh.name}_MorphWeightAnimation`,
//                             glTFAnimation,
//                             mesh,
//                             combinedAnimationGroup!,
//                             animationInfo.dataAccessorType,
//                             animationInfo.animationChannelTargetPath,
//                             nodeMap,
//                             binaryWriter,
//                             bufferViews,
//                             accessors,
//                             animationInfo.useQuaternion,
//                             animationSampleRate,
//                             morphTargetManager?.numTargets
//                         );
//                     }
//                 });
//                 if (glTFAnimation.channels.length && glTFAnimation.samplers.length) {
//                     glTFAnimations.push(glTFAnimation);
//                 }
//             }
//         }
//     }

//     private static _AddAnimation(
//         name: string,
//         glTFAnimation: IAnimation,
//         babylonTransformNode: Node,
//         animation: Animation,
//         dataAccessorType: AccessorType,
//         animationChannelTargetPath: AnimationChannelTargetPath,
//         nodeMap: { [key: number]: number },
//         binaryWriter: _BinaryWriter,
//         bufferViews: IBufferView[],
//         accessors: IAccessor[],
//         useQuaternion: boolean,
//         animationSampleRate: number,
//         morphAnimationChannels?: number
//     ) {
//         const animationData = _GLTFAnimation._CreateNodeAnimation(babylonTransformNode, animation, animationChannelTargetPath, useQuaternion, animationSampleRate);
//         let bufferView: IBufferView;
//         let accessor: IAccessor;
//         let keyframeAccessorIndex: number;
//         let dataAccessorIndex: number;
//         let outputLength: number;
//         let animationSampler: IAnimationSampler;
//         let animationChannel: IAnimationChannel;

//         if (animationData) {
//             /*
//              * Now that we have the glTF converted morph target animation data,
//              * we can remove redundant input data so that we have n input frames,
//              * and morphAnimationChannels * n output frames
//              */
//             if (morphAnimationChannels) {
//                 let index = 0;
//                 let currentInput: number = 0;
//                 const newInputs: number[] = [];
//                 while (animationData.inputs.length > 0) {
//                     currentInput = animationData.inputs.shift()!;
//                     if (index % morphAnimationChannels == 0) {
//                         newInputs.push(currentInput);
//                     }
//                     index++;
//                 }
//                 animationData.inputs = newInputs;
//             }

//             const nodeIndex = nodeMap[babylonTransformNode.uniqueId];

//             // Creates buffer view and accessor for key frames.
//             let byteLength = animationData.inputs.length * 4;
//             bufferView = _GLTFUtilities._CreateBufferView(0, binaryWriter.getByteOffset(), byteLength, undefined, `${name}  keyframe data view`);
//             bufferViews.push(bufferView);
//             animationData.inputs.forEach(function (input) {
//                 binaryWriter.setFloat32(input);
//             });

//             accessor = _GLTFUtilities._CreateAccessor(
//                 bufferViews.length - 1,
//                 `${name}  keyframes`,
//                 AccessorType.SCALAR,
//                 AccessorComponentType.FLOAT,
//                 animationData.inputs.length,
//                 null,
//                 [animationData.inputsMin],
//                 [animationData.inputsMax]
//             );
//             accessors.push(accessor);
//             keyframeAccessorIndex = accessors.length - 1;

//             // create bufferview and accessor for keyed values.
//             outputLength = animationData.outputs.length;
//             byteLength = _GLTFUtilities._GetDataAccessorElementCount(dataAccessorType) * 4 * animationData.outputs.length;

//             // check for in and out tangents
//             bufferView = _GLTFUtilities._CreateBufferView(0, binaryWriter.getByteOffset(), byteLength, undefined, `${name}  data view`);
//             bufferViews.push(bufferView);

//             animationData.outputs.forEach(function (output) {
//                 output.forEach(function (entry) {
//                     binaryWriter.setFloat32(entry);
//                 });
//             });

//             accessor = _GLTFUtilities._CreateAccessor(bufferViews.length - 1, `${name}  data`, dataAccessorType, AccessorComponentType.FLOAT, outputLength, null, null, null);
//             accessors.push(accessor);
//             dataAccessorIndex = accessors.length - 1;

//             // create sampler
//             animationSampler = {
//                 interpolation: animationData.samplerInterpolation,
//                 input: keyframeAccessorIndex,
//                 output: dataAccessorIndex,
//             };
//             glTFAnimation.samplers.push(animationSampler);

//             // create channel
//             animationChannel = {
//                 sampler: glTFAnimation.samplers.length - 1,
//                 target: {
//                     node: nodeIndex,
//                     path: animationChannelTargetPath,
//                 },
//             };
//             glTFAnimation.channels.push(animationChannel);
//         }
//     }

//     /**
//      * Create a baked animation
//      * @param babylonTransformNode BabylonJS mesh
//      * @param animation BabylonJS animation corresponding to the BabylonJS mesh
//      * @param animationChannelTargetPath animation target channel
//      * @param minFrame minimum animation frame
//      * @param maxFrame maximum animation frame
//      * @param fps frames per second of the animation
//      * @param sampleRate
//      * @param inputs input key frames of the animation
//      * @param outputs output key frame data of the animation
//      * @param minMaxFrames
//      * @param minMaxFrames.min
//      * @param minMaxFrames.max
//      * @param useQuaternion specifies if quaternions should be used
//      */
//     private static _CreateBakedAnimation(
//         babylonTransformNode: Node,
//         animation: Animation,
//         animationChannelTargetPath: AnimationChannelTargetPath,
//         minFrame: number,
//         maxFrame: number,
//         fps: number,
//         sampleRate: number,
//         inputs: number[],
//         outputs: number[][],
//         minMaxFrames: { min: number; max: number },
//         useQuaternion: boolean
//     ) {
//         let value: number | Vector3 | Quaternion;
//         const quaternionCache: Quaternion = Quaternion.Identity();
//         let previousTime: Nullable<number> = null;
//         let time: number;
//         let maxUsedFrame: Nullable<number> = null;
//         let currKeyFrame: Nullable<IAnimationKey> = null;
//         let nextKeyFrame: Nullable<IAnimationKey> = null;
//         let prevKeyFrame: Nullable<IAnimationKey> = null;
//         let endFrame: Nullable<number> = null;
//         minMaxFrames.min = Tools.FloatRound(minFrame / fps);

//         const keyFrames = animation.getKeys();

//         for (let i = 0, length = keyFrames.length; i < length; ++i) {
//             endFrame = null;
//             currKeyFrame = keyFrames[i];

//             if (i + 1 < length) {
//                 nextKeyFrame = keyFrames[i + 1];
//                 if ((currKeyFrame.value.equals && currKeyFrame.value.equals(nextKeyFrame.value)) || currKeyFrame.value === nextKeyFrame.value) {
//                     if (i === 0) {
//                         // set the first frame to itself
//                         endFrame = currKeyFrame.frame;
//                     } else {
//                         continue;
//                     }
//                 } else {
//                     endFrame = nextKeyFrame.frame;
//                 }
//             } else {
//                 // at the last key frame
//                 prevKeyFrame = keyFrames[i - 1];
//                 if ((currKeyFrame.value.equals && currKeyFrame.value.equals(prevKeyFrame.value)) || currKeyFrame.value === prevKeyFrame.value) {
//                     continue;
//                 } else {
//                     endFrame = maxFrame;
//                 }
//             }
//             if (endFrame) {
//                 for (let f = currKeyFrame.frame; f <= endFrame; f += sampleRate) {
//                     time = Tools.FloatRound(f / fps);
//                     if (time === previousTime) {
//                         continue;
//                     }
//                     previousTime = time;
//                     maxUsedFrame = time;
//                     const state = {
//                         key: 0,
//                         repeatCount: 0,
//                         loopMode: animation.loopMode,
//                     };
//                     value = animation._interpolate(f, state);

//                     _GLTFAnimation._SetInterpolatedValue(babylonTransformNode, value, time, animation, animationChannelTargetPath, quaternionCache, inputs, outputs, useQuaternion);
//                 }
//             }
//         }
//         if (maxUsedFrame) {
//             minMaxFrames.max = maxUsedFrame;
//         }
//     }

//     private static _ConvertFactorToVector3OrQuaternion(
//         factor: number,
//         babylonTransformNode: Node,
//         animation: Animation,
//         animationChannelTargetPath: AnimationChannelTargetPath,
//         useQuaternion: boolean
//     ): Vector3 | Quaternion {
//         const basePositionRotationOrScale = _GLTFAnimation._GetBasePositionRotationOrScale(babylonTransformNode, animationChannelTargetPath, useQuaternion);
//         // handles single component x, y, z or w component animation by using a base property and animating over a component.
//         const property = animation.targetProperty.split(".");
//         const componentName = property ? property[1] : ""; // x, y, z, or w component
//         const value = useQuaternion ? Quaternion.FromArray(basePositionRotationOrScale).normalize() : Vector3.FromArray(basePositionRotationOrScale);

//         switch (componentName) {
//             case "x":
//             case "y":
//             case "z": {
//                 value[componentName] = factor;
//                 break;
//             }
//             case "w": {
//                 (value as Quaternion).w = factor;
//                 break;
//             }
//             default: {
//                 Tools.Error(`glTFAnimation: Unsupported component name "${componentName}"!`);
//             }
//         }

//         return value;
//     }

//     private static _SetInterpolatedValue(
//         babylonTransformNode: Node,
//         value: number | Vector3 | Quaternion,
//         time: number,
//         animation: Animation,
//         animationChannelTargetPath: AnimationChannelTargetPath,
//         quaternionCache: Quaternion,
//         inputs: number[],
//         outputs: number[][],
//         useQuaternion: boolean
//     ) {
//         let cacheValue: Vector3 | Quaternion | number;
//         inputs.push(time);

//         if (animationChannelTargetPath === AnimationChannelTargetPath.WEIGHTS) {
//             outputs.push([value as number]);
//             return;
//         }

//         if (animation.dataType === Animation.ANIMATIONTYPE_FLOAT) {
//             value = this._ConvertFactorToVector3OrQuaternion(value as number, babylonTransformNode, animation, animationChannelTargetPath, useQuaternion);
//         }

//         if (animationChannelTargetPath === AnimationChannelTargetPath.ROTATION) {
//             if (useQuaternion) {
//                 quaternionCache = value as Quaternion;
//             } else {
//                 cacheValue = value as Vector3;
//                 Quaternion.RotationYawPitchRollToRef(cacheValue.y, cacheValue.x, cacheValue.z, quaternionCache);
//             }
//             outputs.push(quaternionCache.asArray());
//         } else {
//             // scaling and position animation
//             cacheValue = value as Vector3;
//             outputs.push(cacheValue.asArray());
//         }
//     }

//     /**
//      * Creates linear animation from the animation key frames
//      * @param babylonTransformNode BabylonJS mesh
//      * @param animation BabylonJS animation
//      * @param animationChannelTargetPath The target animation channel
//      * @param inputs Array to store the key frame times
//      * @param outputs Array to store the key frame data
//      * @param useQuaternion Specifies if quaternions are used in the animation
//      */
//     private static _CreateLinearOrStepAnimation(
//         babylonTransformNode: Node,
//         animation: Animation,
//         animationChannelTargetPath: AnimationChannelTargetPath,
//         inputs: number[],
//         outputs: number[][],
//         useQuaternion: boolean
//     ) {
//         for (const keyFrame of animation.getKeys()) {
//             inputs.push(keyFrame.frame / animation.framePerSecond); // keyframes in seconds.
//             _GLTFAnimation._AddKeyframeValue(keyFrame, animation, outputs, animationChannelTargetPath, babylonTransformNode, useQuaternion);
//         }
//     }

//     /**
//      * Creates cubic spline animation from the animation key frames
//      * @param babylonTransformNode BabylonJS mesh
//      * @param animation BabylonJS animation
//      * @param animationChannelTargetPath The target animation channel
//      * @param inputs Array to store the key frame times
//      * @param outputs Array to store the key frame data
//      * @param useQuaternion Specifies if quaternions are used in the animation
//      */
//     private static _CreateCubicSplineAnimation(
//         babylonTransformNode: Node,
//         animation: Animation,
//         animationChannelTargetPath: AnimationChannelTargetPath,
//         inputs: number[],
//         outputs: number[][],
//         useQuaternion: boolean
//     ) {
//         animation.getKeys().forEach(function (keyFrame) {
//             inputs.push(keyFrame.frame / animation.framePerSecond); // keyframes in seconds.
//             _GLTFAnimation._AddSplineTangent(_TangentType.INTANGENT, outputs, animationChannelTargetPath, AnimationSamplerInterpolation.CUBICSPLINE, keyFrame, useQuaternion);
//             _GLTFAnimation._AddKeyframeValue(keyFrame, animation, outputs, animationChannelTargetPath, babylonTransformNode, useQuaternion);

//             _GLTFAnimation._AddSplineTangent(_TangentType.OUTTANGENT, outputs, animationChannelTargetPath, AnimationSamplerInterpolation.CUBICSPLINE, keyFrame, useQuaternion);
//         });
//     }

//     private static _GetBasePositionRotationOrScale(babylonTransformNode: Node, animationChannelTargetPath: AnimationChannelTargetPath, useQuaternion: boolean) {
//         let basePositionRotationOrScale: number[];
//         if (animationChannelTargetPath === AnimationChannelTargetPath.ROTATION) {
//             if (useQuaternion) {
//                 const q = (babylonTransformNode as TransformNode).rotationQuaternion;
//                 basePositionRotationOrScale = (q ?? Quaternion.Identity()).asArray();
//             } else {
//                 const r: Vector3 = (babylonTransformNode as TransformNode).rotation;
//                 basePositionRotationOrScale = (r ?? Vector3.Zero()).asArray();
//             }
//         } else if (animationChannelTargetPath === AnimationChannelTargetPath.TRANSLATION) {
//             const p: Vector3 = (babylonTransformNode as TransformNode).position;
//             basePositionRotationOrScale = (p ?? Vector3.Zero()).asArray();
//         } else {
//             // scale
//             const s: Vector3 = (babylonTransformNode as TransformNode).scaling;
//             basePositionRotationOrScale = (s ?? Vector3.One()).asArray();
//         }
//         return basePositionRotationOrScale;
//     }

//     /**
//      * Adds a key frame value
//      * @param keyFrame
//      * @param animation
//      * @param outputs
//      * @param animationChannelTargetPath
//      * @param babylonTransformNode
//      * @param useQuaternion
//      */
//     private static _AddKeyframeValue(
//         keyFrame: IAnimationKey,
//         animation: Animation,
//         outputs: number[][],
//         animationChannelTargetPath: AnimationChannelTargetPath,
//         babylonTransformNode: Node,
//         useQuaternion: boolean
//     ) {
//         let newPositionRotationOrScale: Nullable<Vector3 | Quaternion | number>;
//         const animationType = animation.dataType;
//         if (animationType === Animation.ANIMATIONTYPE_VECTOR3) {
//             let value = keyFrame.value.asArray();
//             if (animationChannelTargetPath === AnimationChannelTargetPath.ROTATION) {
//                 const array = Vector3.FromArray(value);
//                 const rotationQuaternion = Quaternion.RotationYawPitchRoll(array.y, array.x, array.z);
//                 value = rotationQuaternion.asArray();
//             }
//             outputs.push(value); // scale  vector.
//         } else if (animationType === Animation.ANIMATIONTYPE_FLOAT) {
//             if (animationChannelTargetPath === AnimationChannelTargetPath.WEIGHTS) {
//                 outputs.push([keyFrame.value]);
//             } else {
//                 // handles single component x, y, z or w component animation by using a base property and animating over a component.
//                 newPositionRotationOrScale = this._ConvertFactorToVector3OrQuaternion(
//                     keyFrame.value as number,
//                     babylonTransformNode,
//                     animation,
//                     animationChannelTargetPath,
//                     useQuaternion
//                 );
//                 if (newPositionRotationOrScale) {
//                     if (animationChannelTargetPath === AnimationChannelTargetPath.ROTATION) {
//                         const posRotScale = useQuaternion
//                             ? (newPositionRotationOrScale as Quaternion)
//                             : Quaternion.RotationYawPitchRoll(newPositionRotationOrScale.y, newPositionRotationOrScale.x, newPositionRotationOrScale.z).normalize();
//                         outputs.push(posRotScale.asArray());
//                     }
//                     outputs.push(newPositionRotationOrScale.asArray());
//                 }
//             }
//         } else if (animationType === Animation.ANIMATIONTYPE_QUATERNION) {
//             outputs.push((keyFrame.value as Quaternion).normalize().asArray());
//         } else {
//             Tools.Error("glTFAnimation: Unsupported key frame values for animation!");
//         }
//     }

//     /**
//      * @internal
//      * Determine the interpolation based on the key frames
//      * @param keyFrames
//      * @param animationChannelTargetPath
//      * @param useQuaternion
//      */
//     private static _DeduceInterpolation(
//         keyFrames: IAnimationKey[],
//         animationChannelTargetPath: AnimationChannelTargetPath,
//         useQuaternion: boolean
//     ): { interpolationType: AnimationSamplerInterpolation; shouldBakeAnimation: boolean } {
//         let interpolationType: AnimationSamplerInterpolation | undefined;
//         let shouldBakeAnimation = false;
//         let key: IAnimationKey;

//         if (animationChannelTargetPath === AnimationChannelTargetPath.ROTATION && !useQuaternion) {
//             return { interpolationType: AnimationSamplerInterpolation.LINEAR, shouldBakeAnimation: true };
//         }

//         for (let i = 0, length = keyFrames.length; i < length; ++i) {
//             key = keyFrames[i];
//             if (key.inTangent || key.outTangent) {
//                 if (interpolationType) {
//                     if (interpolationType !== AnimationSamplerInterpolation.CUBICSPLINE) {
//                         interpolationType = AnimationSamplerInterpolation.LINEAR;
//                         shouldBakeAnimation = true;
//                         break;
//                     }
//                 } else {
//                     interpolationType = AnimationSamplerInterpolation.CUBICSPLINE;
//                 }
//             } else {
//                 if (interpolationType) {
//                     if (
//                         interpolationType === AnimationSamplerInterpolation.CUBICSPLINE ||
//                         (key.interpolation && key.interpolation === AnimationKeyInterpolation.STEP && interpolationType !== AnimationSamplerInterpolation.STEP)
//                     ) {
//                         interpolationType = AnimationSamplerInterpolation.LINEAR;
//                         shouldBakeAnimation = true;
//                         break;
//                     }
//                 } else {
//                     if (key.interpolation && key.interpolation === AnimationKeyInterpolation.STEP) {
//                         interpolationType = AnimationSamplerInterpolation.STEP;
//                     } else {
//                         interpolationType = AnimationSamplerInterpolation.LINEAR;
//                     }
//                 }
//             }
//         }
//         if (!interpolationType) {
//             interpolationType = AnimationSamplerInterpolation.LINEAR;
//         }

//         return { interpolationType: interpolationType, shouldBakeAnimation: shouldBakeAnimation };
//     }

//     /**
//      * Adds an input tangent or output tangent to the output data
//      * If an input tangent or output tangent is missing, it uses the zero vector or zero quaternion
//      * @param tangentType Specifies which type of tangent to handle (inTangent or outTangent)
//      * @param outputs The animation data by keyframe
//      * @param animationChannelTargetPath The target animation channel
//      * @param interpolation The interpolation type
//      * @param keyFrame The key frame with the animation data
//      * @param useQuaternion Specifies if quaternions are used
//      */
//     private static _AddSplineTangent(
//         tangentType: _TangentType,
//         outputs: number[][],
//         animationChannelTargetPath: AnimationChannelTargetPath,
//         interpolation: AnimationSamplerInterpolation,
//         keyFrame: IAnimationKey,
//         useQuaternion: boolean
//     ) {
//         let tangent: number[];
//         const tangentValue: Vector3 | Quaternion | number = tangentType === _TangentType.INTANGENT ? keyFrame.inTangent : keyFrame.outTangent;
//         if (interpolation === AnimationSamplerInterpolation.CUBICSPLINE) {
//             if (animationChannelTargetPath === AnimationChannelTargetPath.ROTATION) {
//                 if (tangentValue) {
//                     if (useQuaternion) {
//                         tangent = (tangentValue as Quaternion).asArray();
//                     } else {
//                         const array = tangentValue as Vector3;
//                         tangent = Quaternion.RotationYawPitchRoll(array.y, array.x, array.z).asArray();
//                     }
//                 } else {
//                     tangent = [0, 0, 0, 0];
//                 }
//             } else if (animationChannelTargetPath === AnimationChannelTargetPath.WEIGHTS) {
//                 if (tangentValue) {
//                     tangent = [tangentValue as number];
//                 } else {
//                     tangent = [0];
//                 }
//             } else {
//                 if (tangentValue) {
//                     tangent = (tangentValue as Vector3).asArray();
//                 } else {
//                     tangent = [0, 0, 0];
//                 }
//             }

//             outputs.push(tangent);
//         }
//     }

//     /**
//      * Get the minimum and maximum key frames' frame values
//      * @param keyFrames animation key frames
//      * @returns the minimum and maximum key frame value
//      */
//     private static _CalculateMinMaxKeyFrames(keyFrames: IAnimationKey[]): { min: number; max: number } {
//         let min: number = Infinity;
//         let max: number = -Infinity;
//         keyFrames.forEach(function (keyFrame) {
//             min = Math.min(min, keyFrame.frame);
//             max = Math.max(max, keyFrame.frame);
//         });

//         return { min: min, max: max };
//     }
// }
