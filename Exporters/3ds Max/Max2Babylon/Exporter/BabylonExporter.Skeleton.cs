using System.Collections.Generic;
using Autodesk.Max;
using BabylonExport.Entities;
using SharpDX;

namespace Max2Babylon
{
    partial class BabylonExporter
    {
        readonly List<IISkin> skins = new List<IISkin>();

        IISkin GetSkinModifier(IINode node)
        {
            var obj = node.ObjectRef;

            if (obj.SuperClassID != SClass_ID.GenDerivob)
            {
                return null;
            }

            var derivedObject = obj as IIDerivedObject;

            if (derivedObject == null)
            {
                return null;
            }

            for (var index = 0; index < derivedObject.NumModifiers; index++)
            {
                var modifier = derivedObject.GetModifier(index);

                if (modifier.ClassID.PartA == 9815843 && modifier.ClassID.PartB == 87654) // Skin
                {
                    var skin = modifier.GetInterface((InterfaceID)0x00010000) as IISkin;

                    if (!skins.Contains(skin))
                    {
                        skins.Add(skin);                        
                    }

                    return skin;
                }
            }


            return null;
        }

        float[] GetBoneMatrix(IISkin skin, IINode bone, int t, bool hasParent)
        {
            var maxMatrix = bone.GetWorldMatrix(t, hasParent);

            //var initialMatrix = Loader.Global.Matrix3.Create();
            //skin.GetBoneInitTM(bone, initialMatrix, false);

            //initialMatrix.Invert();

            //maxMatrix = maxMatrix.MultiplyBy(initialMatrix);

            //if (!hasParent)
            //{
            //    initialMatrix = Loader.Global.Matrix3.Create();
            //    skin.GetSkinInitTM(bone, initialMatrix, false);

            //    initialMatrix.Invert();

            //    maxMatrix = maxMatrix.MultiplyBy(initialMatrix);
            //}

            maxMatrix.NoScale();

            var trans = maxMatrix.Trans;

            var parts = Loader.Global.AffineParts.Create();
            Loader.Global.DecompAffine(maxMatrix, parts);

            var rotationQuaternion = new Quaternion(parts.Q.X, parts.Q.Z, parts.Q.Y, parts.Q.W);

            var matrix = Matrix.RotationQuaternion(rotationQuaternion) * Matrix.Translation(trans.X, trans.Z, trans.Y);

            return matrix.ToArray();
        }

        private void ExportSkin(IISkin skin, BabylonScene babylonScene)
        {
            var babylonSkeleton = new BabylonSkeleton {id = skins.IndexOf(skin)};
            babylonSkeleton.name = "skeleton #" + babylonSkeleton.id;

            RaiseMessage(babylonSkeleton.name, 1);

            var bones = new List<BabylonBone>();

            for (var index = 0; index < skin.NumBones; index++)
            {
                var bone = new BabylonBone {name = skin.GetBoneName(index), index = index};

                var maxBone = skin.GetBone(index);
                var parentNode = maxBone.ParentNode;

                if (parentNode != null)
                {
                    for (var recurseIndex = 0; recurseIndex < index; recurseIndex++)
                    {
                        if (skin.GetBone(recurseIndex).GetGuid() == parentNode.GetGuid())
                        {
                            bone.parentBoneIndex = recurseIndex;
                            break;
                        }
                    }
                }
                var hasParent = bone.parentBoneIndex != -1;
                bone.matrix = GetBoneMatrix(skin, maxBone, 0, hasParent);

                // Animation
                var babylonAnimation = new BabylonAnimation
                {
                    name = bone.name + "Animation", 
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
                    var current = GetBoneMatrix(skin, maxBone, key, hasParent);

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
                bone.animation = babylonAnimation;

                bones.Add(bone);
            }

            babylonSkeleton.bones = bones.ToArray();

            babylonScene.SkeletonsList.Add(babylonSkeleton);
        }
    }
}
