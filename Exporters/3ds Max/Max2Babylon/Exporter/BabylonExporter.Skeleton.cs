using System;
using System.Collections.Generic;
using Autodesk.Max;
using BabylonExport.Entities;
using SharpDX;

namespace Max2Babylon
{
    internal class BonePoseInfo
    {
        public IGMatrix AbsoluteTransform { get; set; }
        public IGMatrix LocalTransform { get; set; }
    }
    partial class BabylonExporter
    {
        readonly List<IIGameSkin> skins = new List<IIGameSkin>();
        readonly List<IIGameNode> skinnedNodes = new List<IIGameNode>();

        IGMatrix WithNoScale(IGMatrix mat)
        {
            var mat3 = mat.ExtractMatrix3();
            mat3.NoScale();
            return Loader.Global.GMatrix.Create(mat3);
        }
        private void ExportSkin(IIGameSkin skin, BabylonScene babylonScene)
        {
            var babylonSkeleton = new BabylonSkeleton { id = skins.IndexOf(skin) };
            babylonSkeleton.name = "skeleton #" + babylonSkeleton.id;

            RaiseMessage(babylonSkeleton.name, 1);

            var skinIndex = skins.IndexOf(skin);
            var meshNode = skinnedNodes[skinIndex];
            var skinInitMatrix = meshNode.GetObjectTM(0);

            var bones = new List<BabylonBone>();
            var gameBones = new List<IIGameNode>();
            var boneIds = new List<int>();
            var bindPoseInfos = new List<BonePoseInfo>();
            for(int i = 0; i < skin.TotalSkinBoneCount; ++i)
            {
                bones.Add(null);
                gameBones.Add(null);
                boneIds.Add(-1);
                bindPoseInfos.Add(null);
            }
            for (var index = 0; index < skin.TotalSkinBoneCount; index++)
            {
                var gameBone = skin.GetIGameBone(index, false);

                var sortedIndex = skinSortedBones[skin].IndexOf(gameBone.NodeID);

                gameBones[sortedIndex] = (gameBone);
                boneIds[sortedIndex] =(gameBone.NodeID);
                bones[sortedIndex]=(new BabylonBone { index = sortedIndex, name = gameBone.Name });

                var boneInitMatrix = gameBone.GetObjectTM(0);
                bindPoseInfos[sortedIndex] = (new BonePoseInfo { AbsoluteTransform = boneInitMatrix });
            }

            // fix hierarchy an generate animation keys
            var exportNonOptimizedAnimations = Loader.Core.RootNode.GetBoolProperty("babylonjs_exportnonoptimizedanimations");

            for (var index = 0; index < skin.TotalSkinBoneCount; index++)
            {
                var gameBone = gameBones[index];
                var parent = gameBone.NodeParent;
                var babBone = bones[index];
                if (parent != null)
                {
                    babBone.parentBoneIndex = boneIds.IndexOf(parent.NodeID);
                }
                if (babBone.parentBoneIndex == -1)
                {
                    bindPoseInfos[index].LocalTransform = bindPoseInfos[index].AbsoluteTransform.Multiply(skinInitMatrix.Inverse);
                }
                else
                {
                    var parentBindPoseInfos = bindPoseInfos[babBone.parentBoneIndex];
                    bindPoseInfos[index].LocalTransform = bindPoseInfos[index].AbsoluteTransform.Multiply(parentBindPoseInfos.AbsoluteTransform.Inverse);
                }
                babBone.matrix = bindPoseInfos[index].LocalTransform.ToArray();

                var babylonAnimation = new BabylonAnimation
                {
                    name = gameBone.Name + "Animation",
                    property = "_matrix",
                    dataType = (int)BabylonAnimation.DataType.Matrix,
                    loopBehavior = (int)BabylonAnimation.LoopBehavior.Cycle,
                    framePerSecond = Loader.Global.FrameRate
                };

                var start = Loader.Core.AnimRange.Start;
                var end = Loader.Core.AnimRange.End;

                float[] previous = null;
                var keys = new List<BabylonAnimationKey>();
                for (var key = start; key <= end; key += Ticks)
                {
                    var objectTM = gameBone.GetObjectTM(key);
                    var parentNode = gameBone.NodeParent;
                    IGMatrix mat;
                    if (parentNode == null || babBone.parentBoneIndex == -1)
                    {
                        mat = objectTM.Multiply(meshNode.GetObjectTM(key).Inverse);
                    }
                    else
                    {
                        mat = objectTM.Multiply(parentNode.GetObjectTM(key).Inverse);
                    }

                    var current = mat.ToArray();
                    if (key == start || key == end || exportNonOptimizedAnimations || !(previous.IsEqualTo(current)))
                    {
                        keys.Add(new BabylonAnimationKey
                        {
                            frame = key / Ticks,
                            values = current
                        });
                    }

                    previous = current;
                }

                babylonAnimation.keys = keys.ToArray();
                babBone.animation = babylonAnimation;
            }

            babylonSkeleton.bones = bones.ToArray();

            babylonScene.SkeletonsList.Add(babylonSkeleton);
        }
    }
}
