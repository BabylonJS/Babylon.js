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

        private void ExportSkin(IIGameSkin skin, BabylonScene babylonScene)
        {
            var babylonSkeleton = new BabylonSkeleton { id = skins.IndexOf(skin) };
            babylonSkeleton.name = "skeleton #" + babylonSkeleton.id;

            RaiseMessage(babylonSkeleton.name, 1);

            var skinIndex = skins.IndexOf(skin);

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

            // fix hierarchy and generate animation keys
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
                    bindPoseInfos[index].LocalTransform = bindPoseInfos[index].AbsoluteTransform;
                }
                else
                {
                    var parentBindPoseInfos = bindPoseInfos[babBone.parentBoneIndex];
                    bindPoseInfos[index].LocalTransform = bindPoseInfos[index].AbsoluteTransform.Multiply(parentBindPoseInfos.AbsoluteTransform.Inverse);
                }

                babBone.matrix = bindPoseInfos[index].LocalTransform.ToArray();

                var babylonAnimation = ExportMatrixAnimation("_matrix", key =>
                {
                    var objectTM = gameBone.GetObjectTM(key);
                    var parentNode = gameBone.NodeParent;
                    IGMatrix mat;
                    if (parentNode == null || babBone.parentBoneIndex == -1)
                    {
                        mat = objectTM;
                    }
                    else
                    {
                        mat = objectTM.Multiply(parentNode.GetObjectTM(key).Inverse);
                    }
                    return mat.ToArray();
                },
                false); // Do not remove linear animation keys for bones

                if (babylonAnimation != null)
                {
                    babylonAnimation.name = gameBone.Name + "Animation"; // override default animation name
                    babBone.animation = babylonAnimation;
                }
            }

            babylonSkeleton.needInitialSkinMatrix = true;
            babylonSkeleton.bones = bones.ToArray();

            babylonScene.SkeletonsList.Add(babylonSkeleton);
        }
    }
}
