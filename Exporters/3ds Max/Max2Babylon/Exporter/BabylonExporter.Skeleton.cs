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

        //IISkin GetSkinModifier(IINode node, out IModifier skinModifier)
        //{
        //    skinModifier = null;
        //    var obj = node.ObjectRef;

        //    if (obj.SuperClassID != SClass_ID.GenDerivob)
        //    {
        //        return null;
        //    }

        //    var derivedObject = obj as IIDerivedObject;

        //    if (derivedObject == null)
        //    {
        //        return null;
        //    }

        //    for (var index = 0; index < derivedObject.NumModifiers; index++)
        //    {
        //        var modifier = derivedObject.GetModifier(index);

        //        if (modifier.ClassID.PartA == 9815843 && modifier.ClassID.PartB == 87654) // Skin
        //        {
        //            var skin = modifier.GetInterface((InterfaceID)0x00010000) as IISkin;

        //            if (!skins.Contains(skin))
        //            {
        //                skins.Add(skin);
        //            }
        //            skinModifier = modifier;
        //            return skin;
        //        }
        //    }


        //    return null;
        //}


        //float[] GetBoneBindPoseLocalMatrix(IISkin skin, IINode bone, bool hasParent)
        //{
        //    var matrix = Loader.Global.Matrix3.Create();
        //    var result = skin.GetBoneInitTM(bone, matrix, false);
        //    if (!hasParent)
        //    {
        //        return matrix.ToArray();
        //    }
        //    else
        //    {
        //        var parentInverse = Loader.Global.Matrix3.Create();

        //        result = skin.GetBoneInitTM(bone.ParentNode, matrix, false);
        //        parentInverse.Invert();
        //        return matrix.Multiply(parentInverse).ToArray();
        //    }

        //}
        //float[] GetBoneMatrixForFrame(IINode bone, int frame, bool hasParent)
        //{
        //    //            var nodeTM2 = bone.GetNodeTM(frame, Tools.Forever);
        //    //            var parent = bone.ParentNode;

        //    //            if (!hasParent)
        //    //            {
        //    //                parent = bone;
        //    //            }
        //    //            else
        //    //            {
        //    //                parent = bone.ParentNode;
        //    //            }
        //    //            var inverseParentTM = parent.GetNodeTM(frame, Tools.Forever);
        //    //            inverseParentTM.Invert();
        //    //            var localTransform = nodeTM2.Multiply(inverseParentTM);
        //    //            var vLocalPos = localTransform.Trans;
        //    //            var parts = Loader.Global.AffineParts.Create();
        //    //            Loader.Global.DecompAffine(localTransform, parts);
        //    //            IPoint3 eulerAngs = Loader.Global.Point3.Create();
        //    //#if MAX2015
        //    //            var eulerAngsPtr = eulerAngs.NativePointer;
        //    //#else
        //    //            var eulerAngsPtr = eulerAngs.Handle;
        //    //#endif
        //    //            //Loader.Global.QuatToEuler(parts.Q, eulerAngsPtr);

        //    //            return ( Matrix.RotationQuaternion(new Quaternion(parts.Q.X, parts.Q.Y, parts.Q.Z, parts.Q.W))*Matrix.Translation(vLocalPos.X, vLocalPos.Z, vLocalPos.Y)).ToArray();
        //    return Matrix.Identity.ToArray();
        //}

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
            //IGMatrix skinInitMatrix = Loader.Global.GMatrix.Create(Loader.Global.Matrix3.Create(true));
            //skin.GetInitSkinTM(skinInitMatrix);
            var skinIndex = skins.IndexOf(skin);
            var meshNode = skinnedNodes[skinIndex];
            var skinInitMatrix = meshNode.GetObjectTM(0);

            var bones = new List<BabylonBone>();
            var gameBones = new List<IIGameNode>();
            var boneIds = new List<int>();
            var bindPoseInfos = new List<BonePoseInfo>();
            for (var index = 0; index < skin.TotalSkinBoneCount; index++)
            {
                var gameBone = skin.GetIGameBone(index, false);
               
                if (gameBone == null)
                {
                    gameBones.Add(null);
                    boneIds.Add(-2);
                    bones.Add(new BabylonBone { index = index, name = "null-bone" });

                    bindPoseInfos.Add(new BonePoseInfo {  });
                }
                else
                {
                    gameBones.Add(gameBone);
                    boneIds.Add(gameBone.NodeID);
                    bones.Add(new BabylonBone { index = index, name = gameBone.Name });
                    //IGMatrix boneInitMatrix = Loader.Global.GMatrix.Create(Loader.Global.Matrix3.Create(true));

                    //skin.GetInitBoneTM(gameBone, boneInitMatrix);
                    var boneInitMatrix = gameBone.GetObjectTM(0);
                    bindPoseInfos.Add(new BonePoseInfo { AbsoluteTransform = boneInitMatrix });
                }
            }
            // fix hierarchy an generate animation keys
            for (var index = 0; index < skin.TotalSkinBoneCount; index++)
            {
                var gameBone = gameBones[index];
                if (gameBone == null)
                {

                    var babBone = bones[index];
                    bindPoseInfos[index].LocalTransform = Loader.Global.GMatrix.Create(Loader.Global.Matrix3.Create(true));
                    babBone.matrix = bindPoseInfos[index].LocalTransform.ToArray();
                }
                else
                {
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
                        dataType = BabylonAnimation.DataType.Matrix,
                        loopBehavior = BabylonAnimation.LoopBehavior.Cycle,
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
                        if (key == start || key == end || !(previous.IsEqualTo(current)))
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

            }

            //FixupHierarchy(Loader.Core.RootNode, skin.GetBone(0), bones);

            babylonSkeleton.bones = bones.ToArray();

            babylonScene.SkeletonsList.Add(babylonSkeleton);
        }

        //private void ExportSkin(IISkin skin, BabylonScene babylonScene)
        //{

        //    var babylonSkeleton = new BabylonSkeleton { id = skins.IndexOf(skin) };
        //    babylonSkeleton.name = "skeleton #" + babylonSkeleton.id;

        //    RaiseMessage(babylonSkeleton.name, 1);

        //    var bones = new List<BabylonBone>();

        //    for (var index = 0; index < skin.NumBones; index++)
        //    {
        //        var bone = new BabylonBone { name = skin.GetBoneName(index), index = index };

        //        var maxBone = skin.GetBone(index);
        //        var parentNode = maxBone.ParentNode;

        //        if (parentNode != null)
        //        {
        //            for (var recurseIndex = 0; recurseIndex < index; recurseIndex++)
        //            {
        //                if (skin.GetBone(recurseIndex).GetGuid() == parentNode.GetGuid())
        //                {
        //                    bone.parentBoneIndex = recurseIndex;
        //                    break;
        //                }
        //            }
        //        }
        //        var hasParent = bone.parentBoneIndex != -1;
        //        var currentBoneNeutralMatrix = GetBoneBindPoseLocalMatrix(skin, maxBone, hasParent);
        //        bone.matrix = currentBoneNeutralMatrix;

        //        // Animation
        //        var babylonAnimation = new BabylonAnimation
        //        {
        //            name = bone.name + "Animation",
        //            property = "_matrix",
        //            dataType = BabylonAnimation.DataType.Matrix,
        //            loopBehavior = BabylonAnimation.LoopBehavior.Cycle,
        //            framePerSecond = Loader.Global.FrameRate
        //        };

        //        var start = Loader.Core.AnimRange.Start;
        //        var end = Loader.Core.AnimRange.End;

        //        float[] previous = null;
        //        var keys = new List<BabylonAnimationKey>();
        //        for (var key = start; key <= end; key += Ticks)
        //        {
        //            var current = GetBoneMatrixForFrame(maxBone, key, hasParent);

        //            if (key == start || key == end || !(previous.IsEqualTo(current)))
        //            {
        //                keys.Add(new BabylonAnimationKey
        //                {
        //                    frame = key / Ticks,
        //                    values = current
        //                });
        //            }

        //            previous = current;
        //        }

        //        babylonAnimation.keys = keys.ToArray();
        //        bone.animation = babylonAnimation;

        //        bones.Add(bone);
        //    }
        //    //FixupHierarchy(Loader.Core.RootNode, skin.GetBone(0), bones);

        //    babylonSkeleton.bones = bones.ToArray();

        //    babylonScene.SkeletonsList.Add(babylonSkeleton);
        //}

        //private void FixupHierarchy(IINode sceneRoot, IINode skeletonRoot, List<BabylonBone> bones)
        //{
        //    var skeletonTransforms = new NodeTransforms(skeletonRoot, 0);
        //    var sceneRootTransforms = new NodeTransforms(sceneRoot, 0);
        //    var skelAbs = skeletonTransforms.AbsoluteTransform;
        //    var invSceneAbs = sceneRootTransforms.AbsoluteTransform;
        //    invSceneAbs.Invert();
        //    var skelAbsInvSceneAbs = skelAbs.Multiply(invSceneAbs);
        //    var invSkelLocalTransform = skeletonTransforms.LocalTransform;
        //    invSkelLocalTransform.Invert();
        //    var skelAbsInvSceneAbsXinvSkelLocalTransform = skelAbsInvSceneAbs.Multiply(invSkelLocalTransform);
        //    bones[0].matrix = skelAbsInvSceneAbs.ToArray();
        //    var matskelAbsInvSceneAbsXinvSkelLocalTransform = new Matrix(skelAbsInvSceneAbsXinvSkelLocalTransform.ToArray());
        //    foreach (var b in bones)
        //    {
        //        var oldTransform = new Matrix(b.matrix);
        //        b.matrix = (oldTransform * matskelAbsInvSceneAbsXinvSkelLocalTransform).ToArray();
        //        foreach(var frame in b.animation.keys)
        //        {

        //            var oldTransform2 = new Matrix(frame.values);
        //            frame.values = (oldTransform2 * matskelAbsInvSceneAbsXinvSkelLocalTransform).ToArray();
        //        }
        //    }


        //}
    }
}
