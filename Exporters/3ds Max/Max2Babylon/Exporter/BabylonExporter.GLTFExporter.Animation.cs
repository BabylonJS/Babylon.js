using BabylonExport.Entities;
using GLTFExport.Entities;
using System;
using System.Collections.Generic;

namespace Max2Babylon
{
    partial class BabylonExporter
    {
        private GLTFAnimation ExportNodeAnimation(BabylonAbstractMesh babylonAbstractMesh, GLTF gltf, GLTFNode gltfNode)
        {
            if (babylonAbstractMesh.animations != null && babylonAbstractMesh.animations.Length > 0)
            {
                RaiseMessage("GLTFExporter.Animation | Export animation of mesh named: " + babylonAbstractMesh.name, 2);

                var channelList = new List<GLTFChannel>();
                var samplerList = new List<GLTFAnimationSampler>();

                foreach (BabylonAnimation babylonAnimation in babylonAbstractMesh.animations)
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
                        RaiseWarning("GLTFExporter.AbstractMesh | Unkown animation property '" + babylonAnimation.property + "'", 3);
                        // Ignore this babylon animation
                        continue;
                    }

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
                    foreach (var babylonAnimationKey in babylonAnimation.keys)
                    {
                        var inputValue = babylonAnimationKey.frame / 60.0f; // TODO - Which FPS factor ?
                        // Store values as bytes
                        accessorInput.bytesList.AddRange(BitConverter.GetBytes(inputValue));
                        // Update min and max values
                        GLTFBufferService.UpdateMinMaxAccessor(accessorInput, inputValue);
                    };
                    accessorInput.count = babylonAnimation.keys.Length;

                    // --- Output ---
                    GLTFAccessor accessorOutput = null;
                    switch (gltfTarget.path)
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
            else
            {
                return null;
            }
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
