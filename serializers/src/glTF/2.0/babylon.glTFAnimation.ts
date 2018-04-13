/// <reference path="../../../../dist/babylon.glTF2Interface.d.ts"/>

module BABYLON.GLTF2 {
    /**
     * @hidden
     * Interface to store animation data.
     */
    export interface _IAnimationData {
        /**
         * Keyframe data.
         */
        inputs: number[],
        /**
         * Value data.
         */
        outputs: number[][],
        /**
         * Animation interpolation data.
         */
        samplerInterpolation: AnimationSamplerInterpolation,
        /**
         * Minimum keyframe value.
         */
        inputsMin: number,
        /**
         * Maximum keyframe value.
         */
        inputsMax: number,
    }

    /**
     * @hidden
     */
    export interface _IAnimationInfo {
        /**
         * The target channel for the animation
         */
        animationChannelTargetPath: AnimationChannelTargetPath,
        /**
         * The glTF accessor type for the data.
         */
        dataAccessorType: AccessorType.VEC3 | AccessorType.VEC4,
        /**
         * Specifies if quaternions should be used.
         */
        useQuaternion: boolean
    }

    /**
     * @hidden
     * Enum for handling in tangent and out tangent.
     */
    enum _TangentType {
        /**
         * Specifies that input tangents are used.
         */
        INTANGENT,
        /**
         * Specifies that output tangents are used.
         */
        OUTTANGENT
    }
    /**
     * @hidden
     * Utility class for generating glTF animation data from BabylonJS.
     */
    export class _GLTFAnimation {
        /**
         * 
         * Creates glTF channel animation from BabylonJS animation.
         * @param babylonMesh - BabylonJS mesh.
         * @param animation - animation.
         * @param animationChannelTargetPath - The target animation channel. 
         * @param convertToRightHandedSystem - Specifies if the values should be converted to right-handed.
         * @param useQuaternion - Specifies if quaternions are used.
         * @returns nullable IAnimationData
         */
        public static _CreateNodeAnimation(babylonMesh: BABYLON.Mesh, animation: Animation, animationChannelTargetPath: AnimationChannelTargetPath, convertToRightHandedSystem: boolean, useQuaternion: boolean, animationSampleRate: number): Nullable<_IAnimationData> {
            const inputs: number[] = [];
            const outputs: number[][] = [];
            const keyFrames = animation.getKeys();
            const minMaxKeyFrames = _GLTFAnimation.calculateMinMaxKeyFrames(keyFrames);
            const interpolationOrBake = _GLTFAnimation._DeduceInterpolation(keyFrames, animationChannelTargetPath, useQuaternion);
            const frameDelta = minMaxKeyFrames.max - minMaxKeyFrames.min;

            const interpolation = interpolationOrBake.interpolationType;
            const shouldBakeAnimation = interpolationOrBake.shouldBakeAnimation;

            if (shouldBakeAnimation) {
                _GLTFAnimation._CreateBakedAnimation(babylonMesh, animation, animationChannelTargetPath, minMaxKeyFrames.min, minMaxKeyFrames.max, animation.framePerSecond, animationSampleRate, inputs, outputs, minMaxKeyFrames, convertToRightHandedSystem, useQuaternion);
            }
            else {
                if (interpolation === AnimationSamplerInterpolation.LINEAR || interpolation === AnimationSamplerInterpolation.STEP) {
                    _GLTFAnimation._CreateLinearOrStepAnimation(babylonMesh, animation, animationChannelTargetPath, frameDelta, inputs, outputs, convertToRightHandedSystem, useQuaternion);

                }
                else if (interpolation === AnimationSamplerInterpolation.CUBICSPLINE) {
                    _GLTFAnimation._CreateCubicSplineAnimation(babylonMesh, animation, animationChannelTargetPath, frameDelta, inputs, outputs, convertToRightHandedSystem, useQuaternion);
                }
                else {
                    _GLTFAnimation._CreateBakedAnimation(babylonMesh, animation, animationChannelTargetPath, minMaxKeyFrames.min, minMaxKeyFrames.max, animation.framePerSecond, animationSampleRate, inputs, outputs, minMaxKeyFrames, convertToRightHandedSystem, useQuaternion);
                }
            }

            if (inputs.length && outputs.length) {
                const result: _IAnimationData = {
                    inputs: inputs,
                    outputs: outputs,
                    samplerInterpolation: interpolation,
                    inputsMin: shouldBakeAnimation ? minMaxKeyFrames.min : Tools.FloatRound(minMaxKeyFrames.min / animation.framePerSecond),
                    inputsMax: shouldBakeAnimation ? minMaxKeyFrames.max : Tools.FloatRound(minMaxKeyFrames.max / animation.framePerSecond)
                }

                return result;
            }

            return null;
        }

        private static _DeduceAnimationInfo(animation: Animation): Nullable<_IAnimationInfo> {
            let animationChannelTargetPath: Nullable<AnimationChannelTargetPath> = null;
            let dataAccessorType = AccessorType.VEC3;
            let useQuaternion: boolean = false;
            let property = animation.targetProperty.split('.');
            switch (property[0]) {
                case 'scaling': {
                    animationChannelTargetPath = AnimationChannelTargetPath.SCALE;
                    break;
                }
                case 'position': {
                    animationChannelTargetPath = AnimationChannelTargetPath.TRANSLATION;
                    break;
                }
                case 'rotation': {
                    dataAccessorType = AccessorType.VEC4;
                    animationChannelTargetPath = AnimationChannelTargetPath.ROTATION;
                    break;
                }
                case 'rotationQuaternion': {
                    dataAccessorType = AccessorType.VEC4;
                    useQuaternion = true;
                    animationChannelTargetPath = AnimationChannelTargetPath.ROTATION;
                    break;
                }
                default: {
                    Tools.Error(`Unsupported animatable property ${property[0]}`);
                }
            }
            if (animationChannelTargetPath) {
                return { animationChannelTargetPath: animationChannelTargetPath, dataAccessorType: dataAccessorType, useQuaternion: useQuaternion };
            }
            else {
                Tools.Error('animation channel target path and data accessor type could be deduced');
            }
            return null;
        }

        /**
         * 
         * @param babylonMesh 
         * @param runtimeGLTFAnimation 
         * @param idleGLTFAnimations 
         * @param nodeMap 
         * @param nodes 
         * @param binaryWriter 
         * @param bufferViews 
         * @param accessors 
         * @param convertToRightHandedSystem 
         */
        public static _CreateNodeAnimationFromMeshAnimations(babylonMesh: Mesh, runtimeGLTFAnimation: IAnimation, idleGLTFAnimations: IAnimation[], nodeMap: { [key: number]: number }, nodes: INode[], binaryWriter: _BinaryWriter, bufferViews: IBufferView[], accessors: IAccessor[], convertToRightHandedSystem: boolean, animationSampleRate: number) {
            let glTFAnimation: IAnimation;
            if (babylonMesh.animations) {
                babylonMesh.animations.forEach(function (animation) {
                    let animationInfo = _GLTFAnimation._DeduceAnimationInfo(animation);
                    if (animationInfo) {
                        glTFAnimation = {
                            name: animation.name,
                            samplers: [],
                            channels: []
                        }
                        _GLTFAnimation.AddAnimation(`${animation.name}`,
                            animation.hasRunningRuntimeAnimations ? runtimeGLTFAnimation : glTFAnimation,
                            babylonMesh,
                            animation,
                            animationInfo.dataAccessorType,
                            animationInfo.animationChannelTargetPath,
                            nodeMap,
                            binaryWriter,
                            bufferViews,
                            accessors,
                            convertToRightHandedSystem,
                            animationInfo.useQuaternion,
                            animationSampleRate
                        );
                        if (glTFAnimation.samplers.length && glTFAnimation.channels.length) {
                            idleGLTFAnimations.push(glTFAnimation);
                        }
                    }
                });
            }
        }

        /**
         * 
         * @param babylonScene 
         * @param glTFAnimations 
         * @param nodeMap 
         * @param nodes 
         * @param binaryWriter 
         * @param bufferViews 
         * @param accessors 
         * @param convertToRightHandedSystem 
         */
        public static _CreateNodeAnimationFromAnimationGroups(babylonScene: Scene, glTFAnimations: IAnimation[], nodeMap: { [key: number]: number }, nodes: INode[], binaryWriter: _BinaryWriter, bufferViews: IBufferView[], accessors: IAccessor[], convertToRightHandedSystem: boolean, animationSampleRate: number) {
            let glTFAnimation: IAnimation;
            if (babylonScene.animationGroups) {
                let animationGroups = babylonScene.animationGroups;

                animationGroups.forEach(function (animationGroup) {
                    glTFAnimation = {
                        name: animationGroup.name,
                        channels: [],
                        samplers: []
                    }
                    animationGroup.targetedAnimations.forEach(function (targetAnimation) {
                        let target = targetAnimation.target;
                        let animation = targetAnimation.animation;
                        if (target instanceof Mesh) {
                            let animationInfo = _GLTFAnimation._DeduceAnimationInfo(targetAnimation.animation);
                            if (animationInfo) {
                                let babylonMesh = target as Mesh;
                                _GLTFAnimation.AddAnimation(`${animation.name}`,
                                    glTFAnimation,
                                    babylonMesh,
                                    animation,
                                    animationInfo.dataAccessorType,
                                    animationInfo.animationChannelTargetPath,
                                    nodeMap,
                                    binaryWriter,
                                    bufferViews,
                                    accessors,
                                    convertToRightHandedSystem,
                                    animationInfo.useQuaternion,
                                    animationSampleRate
                                );
                            }
                        }
                    });
                    if (glTFAnimation.channels.length && glTFAnimation.samplers.length) {
                        glTFAnimations.push(glTFAnimation);
                    }
                });
            }
        }

        private static AddAnimation(name: string, glTFAnimation: IAnimation, babylonMesh: Mesh, animation: Animation, dataAccessorType: AccessorType, animationChannelTargetPath: AnimationChannelTargetPath, nodeMap: { [key: number]: number }, binaryWriter: _BinaryWriter, bufferViews: IBufferView[], accessors: IAccessor[], convertToRightHandedSystem: boolean, useQuaternion: boolean, animationSampleRate: number) {
            let animationData = _GLTFAnimation._CreateNodeAnimation(babylonMesh, animation, animationChannelTargetPath, convertToRightHandedSystem, useQuaternion, animationSampleRate);
            let bufferView: IBufferView;
            let accessor: IAccessor;
            let keyframeAccessorIndex: number;
            let dataAccessorIndex: number;
            let outputLength: number;
            let animationSampler: IAnimationSampler;
            let animationChannel: IAnimationChannel;

            if (animationData) {
                let nodeIndex = nodeMap[babylonMesh.uniqueId];

                // Creates buffer view and accessor for key frames.
                let byteLength = animationData.inputs.length * 4;
                bufferView = _GLTFUtilities.CreateBufferView(0, binaryWriter.getByteOffset(), byteLength, undefined, `${name}  keyframe data view`);
                bufferViews.push(bufferView);

                animationData.inputs.forEach(function (input) {
                    binaryWriter.setFloat32(input);
                });

                accessor = _GLTFUtilities.CreateAccessor(bufferViews.length - 1, `${name}  keyframes`, AccessorType.SCALAR, AccessorComponentType.FLOAT, animationData.inputs.length, null, [animationData.inputsMin], [animationData.inputsMax]);
                accessors.push(accessor);
                keyframeAccessorIndex = accessors.length - 1;

                // create bufferview and accessor for keyed values.
                outputLength = animationData.outputs.length;
                byteLength = dataAccessorType === AccessorType.VEC3 ? animationData.outputs.length * 12 : animationData.outputs.length * 16;

                // check for in and out tangents
                bufferView = _GLTFUtilities.CreateBufferView(0, binaryWriter.getByteOffset(), byteLength, undefined, `${name}  data view`);
                bufferViews.push(bufferView);

                animationData.outputs.forEach(function (output) {
                    output.forEach(function (entry) {
                        binaryWriter.setFloat32(entry);
                    });
                });

                accessor = _GLTFUtilities.CreateAccessor(bufferViews.length - 1, `${name}  data`, dataAccessorType, AccessorComponentType.FLOAT, outputLength, null, null, null);
                accessors.push(accessor);
                dataAccessorIndex = accessors.length - 1;

                // create sampler
                animationSampler = {
                    interpolation: animationData.samplerInterpolation,
                    input: keyframeAccessorIndex,
                    output: dataAccessorIndex
                }
                glTFAnimation.samplers.push(animationSampler);

                // create channel
                animationChannel = {
                    sampler: glTFAnimation.samplers.length - 1,
                    target: {
                        node: nodeIndex,
                        path: animationChannelTargetPath
                    }
                }
                glTFAnimation.channels.push(animationChannel);
            }
        }

        /**
         * Create a baked animation
         * @param babylonMesh BabylonJS mesh
         * @param animation BabylonJS animation corresponding to the BabylonJS mesh
         * @param animationChannelTargetPath animation target channel
         * @param minFrame minimum animation frame
         * @param maxFrame maximum animation frame
         * @param fps frames per second of the animation
         * @param inputs input key frames of the animation
         * @param outputs output key frame data of the animation
         * @param convertToRightHandedSystem converts the values to right-handed
         * @param useQuaternion specifies if quaternions should be used
         */
        private static _CreateBakedAnimation(babylonMesh: Mesh, animation: Animation, animationChannelTargetPath: AnimationChannelTargetPath, minFrame: number, maxFrame: number, fps: number, sampleRate: number, inputs: number[], outputs: number[][], minMaxFrames: { min: number, max: number }, convertToRightHandedSystem: boolean, useQuaternion: boolean) {
            let value: number | Vector3 | Quaternion;
            let quaternionCache: Quaternion = Quaternion.Identity();
            let previousTime: Nullable<number> = null;
            let time: number;
            let maxUsedFrame: Nullable<number> = null;
            let currKeyFrame: Nullable<IAnimationKey> = null;
            let nextKeyFrame: Nullable<IAnimationKey> = null;
            let prevKeyFrame: Nullable<IAnimationKey> = null;
            let endFrame: Nullable<number> = null;
            minMaxFrames.min = Tools.FloatRound(minFrame / fps);

            let keyFrames = animation.getKeys();

            for (let i = 0, length = keyFrames.length; i < length; ++i) {
                endFrame = null;
                currKeyFrame = keyFrames[i];

                if (i + 1 < length) {
                    nextKeyFrame = keyFrames[i + 1];
                    if (currKeyFrame.value.equals(nextKeyFrame.value)) {
                        if (i === 0) { // set the first frame to itself
                            endFrame = currKeyFrame.frame;
                        }
                        else {
                            continue;
                        }
                    }
                    else {
                        endFrame = nextKeyFrame.frame;
                    }
                }
                else {
                    // at the last key frame
                    prevKeyFrame = keyFrames[i - 1];
                    if (currKeyFrame.value.equals(prevKeyFrame.value)) {
                        continue;
                    }
                    else {
                        endFrame = maxFrame;
                    }
                }
                if (endFrame) {
                    for (let f = currKeyFrame.frame; f <= endFrame; f += sampleRate) {
                        time = Tools.FloatRound(f / fps);
                        if (time === previousTime) {
                            continue;
                        }
                        previousTime = time;
                        maxUsedFrame = time;
                        value = animation._interpolate(f, 0, undefined, animation.loopMode);

                        _GLTFAnimation._SetInterpolatedValue(babylonMesh, value, time, animation, animationChannelTargetPath, quaternionCache, inputs, outputs, convertToRightHandedSystem, useQuaternion);
                    }
                }
            }
            if (maxUsedFrame) {
                minMaxFrames.max = maxUsedFrame;
            }
        }

        private static _ConvertFactorToVector3OrQuaternion(factor: number, babylonMesh: Mesh, animation: Animation, animationType: number, animationChannelTargetPath: AnimationChannelTargetPath, convertToRightHandedSystem: boolean, useQuaternion: boolean): Nullable<Vector3 | Quaternion> {
            let property: string[];
            let componentName: string;
            let value: Nullable<Quaternion | Vector3> = null;
            const basePositionRotationOrScale = _GLTFAnimation._GetBasePositionRotationOrScale(babylonMesh, animationChannelTargetPath, convertToRightHandedSystem, useQuaternion);
            if (animationType === Animation.ANIMATIONTYPE_FLOAT) { // handles single component x, y, z or w component animation by using a base property and animating over a component.
                property = animation.targetProperty.split('.');
                componentName = property ? property[1] : ''; // x, y, or z component
                value = useQuaternion ? BABYLON.Quaternion.FromArray(basePositionRotationOrScale).normalize() : BABYLON.Vector3.FromArray(basePositionRotationOrScale);

                switch (componentName) {
                    case 'x':
                    case 'y': {
                        value[componentName] = (convertToRightHandedSystem && useQuaternion) ? -factor : factor;
                        break;
                    }
                    case 'z': {
                        value[componentName] = (convertToRightHandedSystem && !useQuaternion && !(animationChannelTargetPath === AnimationChannelTargetPath.SCALE)) ? -factor : factor;
                        break;
                    }
                    case 'w': {
                        (value as Quaternion).w = factor;
                        break;
                    }
                    default: {
                        Tools.Error(`glTFAnimation: Unsupported component type "${componentName}" for scale animation!`);
                    }
                }
            }

            return value;
        }

        private static _SetInterpolatedValue(babylonMesh: Mesh, value: Nullable<number | Vector3 | Quaternion>, time: number, animation: Animation, animationChannelTargetPath: AnimationChannelTargetPath, quaternionCache: Quaternion, inputs: number[], outputs: number[][], convertToRightHandedSystem: boolean, useQuaternion: boolean) {
            const animationType = animation.dataType;
            let cacheValue: Vector3 | Quaternion;
            inputs.push(time);
            if (typeof value === "number") {
                value = this._ConvertFactorToVector3OrQuaternion(value as number, babylonMesh, animation, animationType, animationChannelTargetPath, convertToRightHandedSystem, useQuaternion);
            }
            if (value) {
                if (animationChannelTargetPath === AnimationChannelTargetPath.ROTATION) {
                    if (useQuaternion) {
                        quaternionCache = value as Quaternion;
                    }
                    else {
                        cacheValue = value as Vector3;
                        Quaternion.RotationYawPitchRollToRef(cacheValue.y, cacheValue.x, cacheValue.z, quaternionCache);
                    }
                    if (convertToRightHandedSystem) {
                        quaternionCache.x *= -1;
                        quaternionCache.y *= -1;
                        outputs.push(quaternionCache.asArray());
                    }
                }
                else {
                    cacheValue = value as Vector3;
                    if (convertToRightHandedSystem && (animationChannelTargetPath !== AnimationChannelTargetPath.SCALE)) {
                        cacheValue.z *= -1;
                    }

                    outputs.push(cacheValue.asArray());
                }
            }
        }

        /**
         * Creates linear animation from the animation key frames
         * @param babylonMesh BabylonJS mesh
         * @param animation BabylonJS animation
         * @param animationChannelTargetPath The target animation channel
         * @param frameDelta The difference between the last and first frame of the animation
         * @param inputs Array to store the key frame times
         * @param outputs Array to store the key frame data
         * @param convertToRightHandedSystem Specifies if the position data should be converted to right handed
         * @param useQuaternion Specifies if quaternions are used in the animation
         */
        private static _CreateLinearOrStepAnimation(babylonMesh: Mesh, animation: Animation, animationChannelTargetPath: AnimationChannelTargetPath, frameDelta: number, inputs: number[], outputs: number[][], convertToRightHandedSystem: boolean, useQuaternion: boolean) {
            animation.getKeys().forEach(function (keyFrame) {
                inputs.push(keyFrame.frame / animation.framePerSecond); // keyframes in seconds.
                _GLTFAnimation._AddKeyframeValue(keyFrame, animation, outputs, animationChannelTargetPath, babylonMesh, convertToRightHandedSystem, useQuaternion);
            });
        }

        /**
         * Creates cubic spline animation from the animation key frames
         * @param babylonMesh BabylonJS mesh
         * @param animation BabylonJS animation
         * @param animationChannelTargetPath The target animation channel
         * @param frameDelta The difference between the last and first frame of the animation
         * @param inputs Array to store the key frame times
         * @param outputs Array to store the key frame data
         * @param convertToRightHandedSystem Specifies if the position data should be converted to right handed
         * @param useQuaternion Specifies if quaternions are used in the animation
         */
        private static _CreateCubicSplineAnimation(babylonMesh: Mesh, animation: Animation, animationChannelTargetPath: AnimationChannelTargetPath, frameDelta: number, inputs: number[], outputs: number[][], convertToRightHandedSystem: boolean, useQuaternion: boolean) {
            animation.getKeys().forEach(function (keyFrame) {
                inputs.push(keyFrame.frame / animation.framePerSecond); // keyframes in seconds.
                _GLTFAnimation.AddSplineTangent(
                    _TangentType.INTANGENT,
                    outputs,
                    animationChannelTargetPath,
                    AnimationSamplerInterpolation.CUBICSPLINE,
                    keyFrame,
                    frameDelta,
                    useQuaternion,
                    convertToRightHandedSystem
                );
                _GLTFAnimation._AddKeyframeValue(keyFrame, animation, outputs, animationChannelTargetPath, babylonMesh, convertToRightHandedSystem, useQuaternion);

                _GLTFAnimation.AddSplineTangent(
                    _TangentType.OUTTANGENT,
                    outputs,
                    animationChannelTargetPath,
                    AnimationSamplerInterpolation.CUBICSPLINE,
                    keyFrame,
                    frameDelta,
                    useQuaternion,
                    convertToRightHandedSystem
                );
            });
        }

        private static _GetBasePositionRotationOrScale(babylonMesh: Mesh, animationChannelTargetPath: AnimationChannelTargetPath, convertToRightHandedSystem: boolean, useQuaternion: boolean) {
            let basePositionRotationOrScale: number[];
            if (animationChannelTargetPath === AnimationChannelTargetPath.ROTATION) {
                if (useQuaternion) {
                    if (babylonMesh.rotationQuaternion) {
                        basePositionRotationOrScale = babylonMesh.rotationQuaternion.asArray();
                        if (convertToRightHandedSystem) {
                            basePositionRotationOrScale[0] *= -1;
                            basePositionRotationOrScale[1] *= -1;
                        }
                    }
                    else {
                        basePositionRotationOrScale = BABYLON.Quaternion.Identity().asArray();
                    }
                }
                else {
                    basePositionRotationOrScale = babylonMesh.rotation.asArray();
                    basePositionRotationOrScale[2] *= -1;
                }
            }
            else if (animationChannelTargetPath === AnimationChannelTargetPath.TRANSLATION) {
                basePositionRotationOrScale = babylonMesh.position.asArray();
                if (convertToRightHandedSystem) {
                    basePositionRotationOrScale[2] *= -1;
                }
            }
            else { // scale
                basePositionRotationOrScale = babylonMesh.scaling.asArray();
            }
            return basePositionRotationOrScale;
        }

        /**
         * Adds a key frame value
         * @param keyFrame 
         * @param animation 
         * @param outputs 
         * @param animationChannelTargetPath 
         * @param basePositionRotationOrScale 
         * @param convertToRightHandedSystem 
         * @param useQuaternion 
         */
        private static _AddKeyframeValue(keyFrame: IAnimationKey, animation: Animation, outputs: number[][], animationChannelTargetPath: AnimationChannelTargetPath, babylonMesh: Mesh, convertToRightHandedSystem: boolean, useQuaternion: boolean) {
            let value: number[];
            let newPositionRotationOrScale: Nullable<Vector3 | Quaternion>;
            const animationType = animation.dataType;
            if (animationType === Animation.ANIMATIONTYPE_VECTOR3) {
                value = keyFrame.value.asArray();
                if (convertToRightHandedSystem && !(animationChannelTargetPath === AnimationChannelTargetPath.SCALE)) {
                    value[2] *= -1;
                }
                if (animationChannelTargetPath === AnimationChannelTargetPath.ROTATION) {
                    outputs.push(Vector3.FromArray(value).toQuaternion().asArray());
                }
                else {
                    outputs.push(value); // scale or position vector.
                }
            }
            else if (animationType === Animation.ANIMATIONTYPE_FLOAT) { // handles single component x, y, z or w component animation by using a base property and animating over a component.
                newPositionRotationOrScale = this._ConvertFactorToVector3OrQuaternion(keyFrame.value as number, babylonMesh, animation, animationType, animationChannelTargetPath, convertToRightHandedSystem, useQuaternion)
                if (newPositionRotationOrScale) {
                    if (animationChannelTargetPath === AnimationChannelTargetPath.ROTATION) {
                        useQuaternion ? outputs.push(newPositionRotationOrScale.normalize().asArray()) : outputs.push((newPositionRotationOrScale as Vector3).toQuaternion().normalize().asArray());
                    }
                    else {
                        outputs.push(newPositionRotationOrScale.asArray());
                    }
                }
            }
            else if (animationType === Animation.ANIMATIONTYPE_QUATERNION) {
                value = (keyFrame.value as Quaternion).normalize().asArray();

                if (convertToRightHandedSystem) {
                    value[0] *= -1;
                    value[1] *= -1;
                }
                outputs.push(value);
            }
            else {
                Tools.Error('glTFAnimation: Unsupported key frame values for animation!');
            }
        }

        private static _DeduceInterpolation(keyFrames: IAnimationKey[], animationChannelTargetPath: AnimationChannelTargetPath, useQuaternion: boolean): { interpolationType: AnimationSamplerInterpolation, shouldBakeAnimation: boolean } {
            let interpolationType: AnimationSamplerInterpolation | undefined;
            let shouldBakeAnimation = false;
            let key: IAnimationKey;

            if (animationChannelTargetPath === AnimationChannelTargetPath.ROTATION && !useQuaternion) {
                return { interpolationType: AnimationSamplerInterpolation.LINEAR, shouldBakeAnimation: true };
            }

            for (let i = 0, length = keyFrames.length; i < length; ++i) {
                key = keyFrames[i];
                if (key.inTangent || key.outTangent) {
                    if (interpolationType) {
                        if (interpolationType !== AnimationSamplerInterpolation.CUBICSPLINE) {
                            interpolationType = AnimationSamplerInterpolation.LINEAR;
                            shouldBakeAnimation = true;
                            break;
                        }
                    }
                    else {
                        interpolationType = AnimationSamplerInterpolation.CUBICSPLINE;
                    }
                }
                else {
                    if (interpolationType) {
                        if (interpolationType === AnimationSamplerInterpolation.CUBICSPLINE ||
                            (key.interpolation && (key.interpolation === AnimationKeyInterpolation.STEP) && interpolationType !== AnimationSamplerInterpolation.STEP)) {
                            interpolationType = AnimationSamplerInterpolation.LINEAR;
                            shouldBakeAnimation = true;
                            break;
                        }
                    }
                    else {
                        if (key.interpolation && (key.interpolation === AnimationKeyInterpolation.STEP)) {
                            interpolationType = AnimationSamplerInterpolation.STEP;
                        }
                        else {
                            interpolationType = AnimationSamplerInterpolation.LINEAR;
                        }
                    }
                }
            }
            if (!interpolationType) {
                interpolationType = AnimationSamplerInterpolation.LINEAR;
            }

            return { interpolationType: interpolationType, shouldBakeAnimation: shouldBakeAnimation };
        }

        /**
         * Adds an input tangent or output tangent to the output data
         * If an input tangent or output tangent is missing, it uses the zero vector or zero quaternion
         * @param tangentType Specifies which type of tangent to handle (inTangent or outTangent)
         * @param outputs The animation data by keyframe
         * @param animationChannelTargetPath The target animation channel
         * @param interpolation The interpolation type
         * @param keyFrame The key frame with the animation data
         * @param frameDelta Time difference between two frames used to scale the tangent by the frame delta
         * @param useQuaternion Specifies if quaternions are used
         * @param convertToRightHandedSystem Specifies if the values should be converted to right-handed
         */
        private static AddSplineTangent(tangentType: _TangentType, outputs: number[][], animationChannelTargetPath: AnimationChannelTargetPath, interpolation: AnimationSamplerInterpolation, keyFrame: IAnimationKey, frameDelta: number, useQuaternion: boolean, convertToRightHandedSystem: boolean) {
            let tangent: number[];
            let tangentValue: Vector3 | Quaternion = tangentType === _TangentType.INTANGENT ? keyFrame.inTangent : keyFrame.outTangent;
            if (interpolation === AnimationSamplerInterpolation.CUBICSPLINE) {
                if (animationChannelTargetPath === AnimationChannelTargetPath.ROTATION) {
                    if (tangentValue) {
                        tangent = useQuaternion ? (tangentValue as Quaternion).scale(frameDelta).asArray() : (tangentValue as Vector3).scale(frameDelta).toQuaternion().asArray();
                        if (convertToRightHandedSystem) {
                            tangent[0] *= -1;
                            tangent[1] *= -1;
                        }
                    }
                    else {
                        tangent = [0, 0, 0, 0];
                    }
                }
                else {
                    if (tangentValue) {
                        tangent = (tangentValue as Vector3).scale(frameDelta).asArray();
                        if (convertToRightHandedSystem) {
                            tangent[2] *= -1;
                        }
                    }
                    else {
                        tangent = [0, 0, 0];
                    }
                }

                outputs.push(tangent);
            }
        }

        /**
         * Get the minimum and maximum key frames' frame values
         * @param keyFrames animation key frames
         * @returns the minimum and maximum key frame value
         */
        private static calculateMinMaxKeyFrames(keyFrames: IAnimationKey[]): { min: number, max: number } {
            let min: number = Infinity;
            let max: number = -Infinity;
            keyFrames.forEach(function (keyFrame) {
                min = Math.min(min, keyFrame.frame);
                max = Math.max(max, keyFrame.frame);
            });

            return { min: min, max: max };

        }
    }
}