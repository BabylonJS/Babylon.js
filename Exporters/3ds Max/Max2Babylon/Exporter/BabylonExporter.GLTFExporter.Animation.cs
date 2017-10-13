using BabylonExport.Entities;
using GLTFExport.Entities;
using System;
using System.Collections.Generic;

namespace Max2Babylon
{
    partial class BabylonExporter
    {
        private static float FPS_FACTOR = 30.0f; // TODO - Which FPS factor ?

        private GLTFAnimation ExportNodeAnimation(BabylonNode babylonNode, GLTF gltf, GLTFNode gltfNode, BabylonScene babylonScene = null)
        {
            var channelList = new List<GLTFChannel>();
            var samplerList = new List<GLTFAnimationSampler>();

            if (babylonNode.animations != null && babylonNode.animations.Length > 0)
            {
                RaiseMessage("GLTFExporter.Animation | Export animation of node named: " + babylonNode.name, 2);

                foreach (BabylonAnimation babylonAnimation in babylonNode.animations)
                {
                    // Target
                    var gltfTarget = new GLTFChannelTarget
                    {
                        node = gltfNode.index
                    };
                    gltfTarget.path = _getTargetPath(babylonAnimation.property);
                    if (gltfTarget.path == null)
                    {
                        // Unkown babylon animation property
                        RaiseWarning("GLTFExporter.Animation | Unkown animation property '" + babylonAnimation.property + "'", 3);
                        // Ignore this babylon animation
                        continue;
                    }

                    // --- Input ---
                    var accessorInput = _createAndPopulateInput(gltf, babylonAnimation);

                    // --- Output ---
                    GLTFAccessor accessorOutput = _createAccessorOfPath(gltfTarget.path, gltf);
                    // Populate accessor
                    foreach (var babylonAnimationKey in babylonAnimation.keys)
                    {
                        var outputValues = babylonAnimationKey.values;
                        // Store values as bytes
                        foreach (var outputValue in outputValues)
                        {
                            accessorOutput.bytesList.AddRange(BitConverter.GetBytes(outputValue));
                        }
                    };
                    accessorOutput.count = babylonAnimation.keys.Length;

                    // Animation sampler
                    var gltfAnimationSampler = new GLTFAnimationSampler
                    {
                        input = accessorInput.index,
                        output = accessorOutput.index
                    };
                    gltfAnimationSampler.index = samplerList.Count;
                    samplerList.Add(gltfAnimationSampler);

                    // Channel
                    var gltfChannel = new GLTFChannel
                    {
                        sampler = gltfAnimationSampler.index,
                        target = gltfTarget
                    };
                    channelList.Add(gltfChannel);
                }
            }

            if (babylonNode.GetType() == typeof(BabylonMesh))
            {
                var babylonMesh = babylonNode as BabylonMesh;

                // Morph targets
                var babylonMorphTargetManager = GetBabylonMorphTargetManager(babylonScene, babylonMesh);
                if (babylonMorphTargetManager != null)
                {
                    ExportMorphTargetWeightAnimation(babylonMorphTargetManager, gltf, gltfNode, channelList, samplerList);
                }
            }

            // Do not export empty arrays
            if (channelList.Count > 0)
            {
                // Animation
                var gltfAnimation = new GLTFAnimation
                {
                    channels = channelList.ToArray(),
                    samplers = samplerList.ToArray()
                };
                gltf.AnimationsList.Add(gltfAnimation);
                return gltfAnimation;
            }
            else
            {
                return null;
            }
        }

        private GLTFAnimation ExportBoneAnimation(BabylonBone babylonBone, GLTF gltf, GLTFNode gltfNode)
        {
            var channelList = new List<GLTFChannel>();
            var samplerList = new List<GLTFAnimationSampler>();

            if (babylonBone.animation != null && babylonBone.animation.property == "_matrix")
            {
                RaiseMessage("GLTFExporter.Animation | Export animation of bone named: " + babylonBone.name, 2);

                var babylonAnimation = babylonBone.animation;

                // --- Input ---
                var accessorInput = _createAndPopulateInput(gltf, babylonAnimation);

                // --- Output ---
                var paths = new string[] { "translation", "rotation", "scale" };
                var accessorOutputByPath = new Dictionary<string, GLTFAccessor>();

                foreach (string path in paths)
                {
                    GLTFAccessor accessorOutput = _createAccessorOfPath(path, gltf);
                    accessorOutputByPath.Add(path, accessorOutput);
                }

                // Populate accessors
                foreach (var babylonAnimationKey in babylonAnimation.keys)
                {
                    var matrix = new BabylonMatrix();
                    matrix.m = babylonAnimationKey.values;

                    var translationBabylon = new BabylonVector3();
                    var rotationQuatBabylon = new BabylonQuaternion();
                    var scaleBabylon = new BabylonVector3();
                    matrix.decompose(scaleBabylon, rotationQuatBabylon, translationBabylon);

                    var outputValuesByPath = new Dictionary<string, float[]>();
                    outputValuesByPath.Add("translation", translationBabylon.ToArray());
                    outputValuesByPath.Add("rotation", rotationQuatBabylon.ToArray());
                    outputValuesByPath.Add("scale", scaleBabylon.ToArray());

                    // Store values as bytes
                    foreach (string path in paths)
                    {
                        var accessorOutput = accessorOutputByPath[path];
                        var outputValues = outputValuesByPath[path];
                        foreach (var outputValue in outputValues)
                        {
                            accessorOutput.bytesList.AddRange(BitConverter.GetBytes(outputValue));
                        }
                        accessorOutput.count++;
                    }
                };

                foreach (string path in paths)
                {
                    var accessorOutput = accessorOutputByPath[path];

                    // Animation sampler
                    var gltfAnimationSampler = new GLTFAnimationSampler
                    {
                        input = accessorInput.index,
                        output = accessorOutput.index
                    };
                    gltfAnimationSampler.index = samplerList.Count;
                    samplerList.Add(gltfAnimationSampler);

                    // Target
                    var gltfTarget = new GLTFChannelTarget
                    {
                        node = gltfNode.index
                    };
                    gltfTarget.path = path;

                    // Channel
                    var gltfChannel = new GLTFChannel
                    {
                        sampler = gltfAnimationSampler.index,
                        target = gltfTarget
                    };
                    channelList.Add(gltfChannel);
                }
            }

            // Do not export empty arrays
            if (channelList.Count > 0)
            {
                // Animation
                var gltfAnimation = new GLTFAnimation
                {
                    channels = channelList.ToArray(),
                    samplers = samplerList.ToArray()
                };
                gltf.AnimationsList.Add(gltfAnimation);
                return gltfAnimation;
            }
            else
            {
                return null;
            }
        }

        private GLTFAccessor _createAndPopulateInput(GLTF gltf, BabylonAnimation babylonAnimation)
        {
            var buffer = GLTFBufferService.Instance.GetBuffer(gltf);
            var accessorInput = GLTFBufferService.Instance.CreateAccessor(
                gltf,
                GLTFBufferService.Instance.GetBufferViewAnimationFloatScalar(gltf, buffer),
                "accessorAnimationInput",
                GLTFAccessor.ComponentType.FLOAT,
                GLTFAccessor.TypeEnum.SCALAR
            );
            // Populate accessor
            accessorInput.min = new float[] { float.MaxValue };
            accessorInput.max = new float[] { float.MinValue };
            foreach (var babylonAnimationKey in babylonAnimation.keys)
            {
                var inputValue = babylonAnimationKey.frame / FPS_FACTOR;
                // Store values as bytes
                accessorInput.bytesList.AddRange(BitConverter.GetBytes(inputValue));
                // Update min and max values
                GLTFBufferService.UpdateMinMaxAccessor(accessorInput, inputValue);
            };
            accessorInput.count = babylonAnimation.keys.Length;
            return accessorInput;
        }

        private GLTFAccessor _createAccessorOfPath(string path, GLTF gltf)
        {
            var buffer = GLTFBufferService.Instance.GetBuffer(gltf);
            GLTFAccessor accessorOutput = null;
            switch (path)
            {
                case "translation":
                    accessorOutput = GLTFBufferService.Instance.CreateAccessor(
                        gltf,
                        GLTFBufferService.Instance.GetBufferViewAnimationFloatVec3(gltf, buffer),
                        "accessorAnimationPositions",
                        GLTFAccessor.ComponentType.FLOAT,
                        GLTFAccessor.TypeEnum.VEC3
                    );
                    break;
                case "rotation":
                    accessorOutput = GLTFBufferService.Instance.CreateAccessor(
                        gltf,
                        GLTFBufferService.Instance.GetBufferViewAnimationFloatVec4(gltf, buffer),
                        "accessorAnimationRotations",
                        GLTFAccessor.ComponentType.FLOAT,
                        GLTFAccessor.TypeEnum.VEC4
                    );
                    break;
                case "scale":
                    accessorOutput = GLTFBufferService.Instance.CreateAccessor(
                        gltf,
                        GLTFBufferService.Instance.GetBufferViewAnimationFloatVec3(gltf, buffer),
                        "accessorAnimationScales",
                        GLTFAccessor.ComponentType.FLOAT,
                        GLTFAccessor.TypeEnum.VEC3
                    );
                    break;
            }
            return accessorOutput;
        }

        private bool ExportMorphTargetWeightAnimation(BabylonMorphTargetManager babylonMorphTargetManager, GLTF gltf, GLTFNode gltfNode, List<GLTFChannel> channelList, List<GLTFAnimationSampler> samplerList)
        {
            if (!_isBabylonMorphTargetManagerAnimationValid(babylonMorphTargetManager))
            {
                return false;
            }

            RaiseMessage("GLTFExporter.Animation | Export animation of morph target manager with id: " + babylonMorphTargetManager.id, 2);

            var influencesPerFrame = _getTargetManagerAnimationsData(babylonMorphTargetManager);
            var frames = new List<int>(influencesPerFrame.Keys);
            frames.Sort(); // Mandatory otherwise gltf loader of babylon doesn't understand

            // Target
            var gltfTarget = new GLTFChannelTarget
            {
                node = gltfNode.index
            };
            gltfTarget.path = "weights";

            // Buffer
            var buffer = GLTFBufferService.Instance.GetBuffer(gltf);

            // --- Input ---
            var accessorInput = GLTFBufferService.Instance.CreateAccessor(
                gltf,
                GLTFBufferService.Instance.GetBufferViewAnimationFloatScalar(gltf, buffer),
                "accessorAnimationInput",
                GLTFAccessor.ComponentType.FLOAT,
                GLTFAccessor.TypeEnum.SCALAR
            );
            // Populate accessor
            accessorInput.min = new float[] { float.MaxValue };
            accessorInput.max = new float[] { float.MinValue };

            foreach (var frame in frames)
            {
                var inputValue = frame / FPS_FACTOR;
                // Store values as bytes
                accessorInput.bytesList.AddRange(BitConverter.GetBytes(inputValue));
                // Update min and max values
                GLTFBufferService.UpdateMinMaxAccessor(accessorInput, inputValue);
            }
            accessorInput.count = influencesPerFrame.Count;

            // --- Output ---
            GLTFAccessor accessorOutput = GLTFBufferService.Instance.CreateAccessor(
                gltf,
                GLTFBufferService.Instance.GetBufferViewAnimationFloatScalar(gltf, buffer),
                "accessorAnimationWeights",
                GLTFAccessor.ComponentType.FLOAT,
                GLTFAccessor.TypeEnum.SCALAR
            );
            // Populate accessor
            foreach (var frame in frames)
            {
                var outputValues = influencesPerFrame[frame];
                // Store values as bytes
                foreach (var outputValue in outputValues)
                {
                    accessorOutput.count++;
                    accessorOutput.bytesList.AddRange(BitConverter.GetBytes(outputValue));
                }
            }

            // Animation sampler
            var gltfAnimationSampler = new GLTFAnimationSampler
            {
                input = accessorInput.index,
                output = accessorOutput.index
            };
            gltfAnimationSampler.index = samplerList.Count;
            samplerList.Add(gltfAnimationSampler);

            // Channel
            var gltfChannel = new GLTFChannel
            {
                sampler = gltfAnimationSampler.index,
                target = gltfTarget
            };
            channelList.Add(gltfChannel);

            return true;
        }

        private bool _isBabylonMorphTargetManagerAnimationValid(BabylonMorphTargetManager babylonMorphTargetManager)
        {
            bool hasAnimation = false;
            bool areAnimationsValid = true;
            foreach (var babylonMorphTarget in babylonMorphTargetManager.targets)
            {
                if (babylonMorphTarget.animations != null && babylonMorphTarget.animations.Length > 0)
                {
                    hasAnimation = true;

                    // Ensure target has only one animation
                    if (babylonMorphTarget.animations.Length > 1)
                    {
                        areAnimationsValid = false;
                        RaiseWarning("GLTFExporter.Animation | Only one animation is supported for morph targets", 3);
                        continue;
                    }

                    // Ensure the target animation property is 'influence'
                    bool targetHasInfluence = false;
                    foreach (BabylonAnimation babylonAnimation in babylonMorphTarget.animations)
                    {
                        if (babylonAnimation.property == "influence")
                        {
                            targetHasInfluence = true;
                        }
                    }
                    if (targetHasInfluence == false)
                    {
                        areAnimationsValid = false;
                        RaiseWarning("GLTFExporter.Animation | Only 'influence' animation is supported for morph targets", 3);
                        continue;
                    }
                }
            }

            return hasAnimation && areAnimationsValid;
        }

        /// <summary>
        /// The keys of each BabylonMorphTarget animation ARE NOT assumed to be identical.
        /// This function merges together all keys and binds to each an influence value for all targets.
        /// A target influence value is automatically computed when necessary.
        /// Computation rules are:
        /// - linear interpolation between target key range
        /// - constant value outside target key range
        /// </summary>
        /// <example>
        /// When:
        /// animation1.keys = {0, 25, 50, 100}
        /// animation2.keys = {50, 75, 100}
        /// 
        /// Gives:
        /// mergedKeys = {0, 25, 50, 100, 75}
        /// range1=[0, 100]
        /// range2=[50, 100]
        /// for animation1, the value associated to key=75 is the interpolation of its values between 50 and 100
        /// for animation2, the value associated to key=0 is equal to the one at key=50 since 0 is out of range [50, 100] (same for key=25)</example>
        /// <param name="babylonMorphTargetManager"></param>
        /// <returns>A map which for each frame, gives the influence value of all targets</returns>
        private Dictionary<int, List<float>> _getTargetManagerAnimationsData(BabylonMorphTargetManager babylonMorphTargetManager)
        {
            // Merge all keys into a single set (no duplicated frame)
            var mergedFrames = new HashSet<int>();
            foreach (var babylonMorphTarget in babylonMorphTargetManager.targets)
            {
                if (babylonMorphTarget.animations != null)
                {
                    var animation = babylonMorphTarget.animations[0];
                    foreach (BabylonAnimationKey animationKey in animation.keys)
                    {
                        mergedFrames.Add(animationKey.frame);
                    }
                }
            }

            // For each frame, gives the influence value of all targets (gltf structure)
            var influencesPerFrame = new Dictionary<int, List<float>>();
            foreach (var frame in mergedFrames)
            {
                influencesPerFrame.Add(frame, new List<float>());
            }
            foreach (var babylonMorphTarget in babylonMorphTargetManager.targets)
            {
                // For a given target, for each frame, gives the influence value of the target (babylon structure)
                var influencePerFrameForTarget = new Dictionary<int, float>();

                if (babylonMorphTarget.animations != null && babylonMorphTarget.animations.Length > 0)
                {
                    var animation = babylonMorphTarget.animations[0];

                    if (animation.keys.Length == 1)
                    {
                        // Same influence for all frames
                        var influence = animation.keys[0].values[0];
                        foreach (var frame in mergedFrames)
                        {
                            influencePerFrameForTarget.Add(frame, influence);
                        }
                    }
                    else
                    {
                        // Retreive target animation key range [min, max]
                        var babylonAnimationKeys = new List<BabylonAnimationKey>(animation.keys);
                        babylonAnimationKeys.Sort();
                        var minAnimationKey = babylonAnimationKeys[0];
                        var maxAnimationKey = babylonAnimationKeys[babylonAnimationKeys.Count - 1];
                        
                        foreach (var frame in mergedFrames)
                        {
                            // Surround the current frame with closest keys available for the target
                            BabylonAnimationKey lowerAnimationKey = minAnimationKey;
                            BabylonAnimationKey upperAnimationKey = maxAnimationKey;
                            foreach (BabylonAnimationKey animationKey in animation.keys)
                            {
                                if (lowerAnimationKey.frame < animationKey.frame && animationKey.frame <= frame)
                                {
                                    lowerAnimationKey = animationKey;
                                }
                                if (frame <= animationKey.frame && animationKey.frame < upperAnimationKey.frame)
                                {
                                    upperAnimationKey = animationKey;
                                }
                            }

                            // In case the target has a key for this frame
                            // or the current frame is out of target animation key range
                            if (lowerAnimationKey.frame == upperAnimationKey.frame)
                            {
                                influencePerFrameForTarget.Add(frame, lowerAnimationKey.values[0]);
                            }
                            else
                            {
                                // Interpolate influence values
                                var t = 1.0f * (frame - lowerAnimationKey.frame) / (upperAnimationKey.frame - lowerAnimationKey.frame);
                                var influence = Tools.Lerp(lowerAnimationKey.values[0], upperAnimationKey.values[0], t);
                                influencePerFrameForTarget.Add(frame, influence);
                            }
                        }
                    }
                }
                else
                {
                    // Target is not animated
                    // Fill all frames with 0
                    foreach (var frame in mergedFrames)
                    {
                        influencePerFrameForTarget.Add(frame, 0);
                    }
                }

                // Switch from babylon to gltf storage representation
                foreach (var frame in mergedFrames)
                {
                    List<float> influences = influencesPerFrame[frame];
                    influences.Add(influencePerFrameForTarget[frame]);
                }
            }

            return influencesPerFrame;
        }

        private string _getTargetPath(string babylonProperty)
        {
            switch (babylonProperty)
            {
                case "position":
                    return "translation";
                case "rotationQuaternion":
                    return "rotation";
                case "scaling":
                    return "scale";
                default:
                    return null;
            }
        }
    }
}
