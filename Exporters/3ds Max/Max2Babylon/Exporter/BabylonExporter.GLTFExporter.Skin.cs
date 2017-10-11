using BabylonExport.Entities;
using GLTFExport.Entities;
using System;
using System.Collections.Generic;

namespace Max2Babylon
{
    partial class BabylonExporter
    {
        // Bones stored in BabylonSkeleton array are not assumed to be tree-ordered
        // Meaning, first element could be a leaf thus resulting in exporting all its ancestors before himself
        // Store bones already exported to prevent multiple exportation of same bone
        private Dictionary<BabylonBone, GLTFNode> alreadyExportedBones;

        private GLTFSkin ExportSkin(BabylonSkeleton babylonSkeleton, GLTF gltf, GLTFNode gltfNode)
        {
            // Skin
            GLTFSkin gltfSkin = new GLTFSkin
            {
                name = babylonSkeleton.name
            };
            gltfSkin.index = gltf.SkinsList.Count;
            gltf.SkinsList.Add(gltfSkin);

            var bones = new List<BabylonBone>(babylonSkeleton.bones);

            // Compute and store world matrix of each bone
            var bonesWorldMatrices = new Dictionary<BabylonBone, BabylonMatrix>();
            foreach (var babylonBone in babylonSkeleton.bones)
            {
                if (!bonesWorldMatrices.ContainsKey(babylonBone))
                {
                    BabylonMatrix boneWorldMatrix = _getBoneWorldMatrix(babylonBone, bones);
                    bonesWorldMatrices.Add(babylonBone, boneWorldMatrix);
                }
            }

            // Buffer
            var buffer = GLTFBufferService.Instance.GetBuffer(gltf);

            // Accessor - InverseBindMatrices
            var accessorInverseBindMatrices = GLTFBufferService.Instance.CreateAccessor(
                gltf,
                GLTFBufferService.Instance.GetBufferViewFloatMat4(gltf, buffer),
                "accessorInverseBindMatrices",
                GLTFAccessor.ComponentType.FLOAT,
                GLTFAccessor.TypeEnum.MAT4
            );
            gltfSkin.inverseBindMatrices = accessorInverseBindMatrices.index;

            // World matrix of the node
            var invNodeWorldMatrix = BabylonMatrix.Invert(_getNodeWorldMatrix(gltfNode)); // inverted

            var gltfJoints = new List<int>();
            alreadyExportedBones = new Dictionary<BabylonBone, GLTFNode>();
            foreach (var babylonBone in babylonSkeleton.bones)
            {
                // Export bone as a new node
                var gltfBoneNode = _exportBone(babylonBone, gltf, babylonSkeleton, bones);
                gltfJoints.Add(gltfBoneNode.index);

                // Set this bone as skeleton if it is a root
                if (babylonBone.parentBoneIndex == -1)
                {
                    gltfSkin.skeleton = gltfBoneNode.index;
                }

                // Compute inverseBindMatrice for this bone when attached to this node
                var boneWorldMatrix = bonesWorldMatrices[babylonBone];
                var inverseBindMatrices = BabylonMatrix.Invert(boneWorldMatrix * invNodeWorldMatrix);

                // Populate accessor
                List<float> matrix = new List<float>(inverseBindMatrices.m);
                matrix.ForEach(n => accessorInverseBindMatrices.bytesList.AddRange(BitConverter.GetBytes(n)));
                accessorInverseBindMatrices.count++;
            }
            gltfSkin.joints = gltfJoints.ToArray();

            return gltfSkin;
        }

        private GLTFNode _exportBone(BabylonBone babylonBone, GLTF gltf, BabylonSkeleton babylonSkeleton, List<BabylonBone> bones)
        {
            if (alreadyExportedBones.ContainsKey(babylonBone))
            {
                return alreadyExportedBones[babylonBone];
            }

            RaiseMessage("GLTFExporter.Skin | Export bone named: " + babylonBone.name, 1);

            // Node
            var gltfNode = new GLTFNode
            {
                name = babylonBone.name
            };
            gltfNode.index = gltf.NodesList.Count;
            gltf.NodesList.Add(gltfNode);
            alreadyExportedBones.Add(babylonBone, gltfNode);

            // Hierarchy
            if (babylonBone.parentBoneIndex >= 0)
            {
                var babylonParentBone = bones.Find(_babylonBone => _babylonBone.index == babylonBone.parentBoneIndex);
                var gltfParentNode = _exportBone(babylonParentBone, gltf, babylonSkeleton, bones);
                RaiseMessage("GLTFExporter.Skin | Add " + babylonBone.name + " as child to " + gltfParentNode.name, 2);
                gltfParentNode.ChildrenList.Add(gltfNode.index);
                gltfNode.parent = gltfParentNode;
            }
            else
            {
                // It's a root node
                // Only root nodes are listed in a gltf scene
                RaiseMessage("GLTFExporter.Skin | Add " + babylonBone.name + " as root node to scene", 2);
                gltf.scenes[0].NodesList.Add(gltfNode.index);
            }

            // Transform
            // Bones transform are exported through translation/rotation/scale rather than matrix
            // Because gltf node animation can only target TRS properties, not the matrix one
            // Create matrix from array
            var babylonMatrix = new BabylonMatrix();
            babylonMatrix.m = babylonBone.matrix;
            // Decompose matrix into TRS
            var translationBabylon = new BabylonVector3();
            var rotationQuatBabylon = new BabylonQuaternion();
            var scaleBabylon = new BabylonVector3();
            babylonMatrix.decompose(scaleBabylon, rotationQuatBabylon, translationBabylon);
            // Store TRS values
            gltfNode.translation = translationBabylon.ToArray();
            gltfNode.rotation = rotationQuatBabylon.ToArray();
            gltfNode.scale = scaleBabylon.ToArray();

            // Animations
            ExportBoneAnimation(babylonBone, gltf, gltfNode);

            return gltfNode;
        }

        private BabylonMatrix _getNodeLocalMatrix(GLTFNode gltfNode)
        {
            return BabylonMatrix.Compose(
                BabylonVector3.FromArray(gltfNode.scale),
                BabylonQuaternion.FromArray(gltfNode.rotation),
                BabylonVector3.FromArray(gltfNode.translation)
            );
        }

        private BabylonMatrix _getNodeWorldMatrix(GLTFNode gltfNode)
        {
            if (gltfNode.parent == null)
            {
                return _getNodeLocalMatrix(gltfNode);
            }
            else
            {
                return _getNodeLocalMatrix(gltfNode) * _getNodeWorldMatrix(gltfNode.parent);
            }
        }

        private BabylonMatrix _getBoneWorldMatrix(BabylonBone babylonBone, List<BabylonBone> bones)
        {
            var boneLocalMatrix = new BabylonMatrix();
            boneLocalMatrix.m = babylonBone.matrix;
            if (babylonBone.parentBoneIndex == -1)
            {
                return boneLocalMatrix;
            }
            else
            {
                var parentBabylonBone = bones.Find(bone => bone.index == babylonBone.parentBoneIndex);
                var parentWorldMatrix = _getBoneWorldMatrix(parentBabylonBone, bones);
                return boneLocalMatrix * parentWorldMatrix;
            }
        }
    }
}
