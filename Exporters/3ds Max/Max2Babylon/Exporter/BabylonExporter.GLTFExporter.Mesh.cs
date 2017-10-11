using Autodesk.Max;
using BabylonExport.Entities;
using GLTFExport.Entities;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Max2Babylon
{
    partial class BabylonExporter
    {
        private GLTFMesh ExportMesh(BabylonMesh babylonMesh, GLTF gltf, BabylonScene babylonScene)
        {
            RaiseMessage("GLTFExporter.Mesh | Export mesh named: " + babylonMesh.name, 1);

            // --------------------------
            // --- Mesh from babylon ----
            // --------------------------

            if (babylonMesh.positions == null)
            {
                RaiseMessage("GLTFExporter.Mesh | Mesh is a dummy", 2);
                return null;
            }

            RaiseMessage("GLTFExporter.Mesh | Mesh from babylon", 2);
            // Retreive general data from babylon mesh
            int nbVertices = babylonMesh.positions.Length / 3;
            bool hasUV = babylonMesh.uvs != null && babylonMesh.uvs.Length > 0;
            bool hasUV2 = babylonMesh.uvs2 != null && babylonMesh.uvs2.Length > 0;
            bool hasColor = babylonMesh.colors != null && babylonMesh.colors.Length > 0;
            bool hasBones = babylonMesh.matricesIndices != null && babylonMesh.matricesIndices.Length > 0;

            RaiseMessage("GLTFExporter.Mesh | nbVertices=" + nbVertices, 3);
            RaiseMessage("GLTFExporter.Mesh | hasUV=" + hasUV, 3);
            RaiseMessage("GLTFExporter.Mesh | hasUV2=" + hasUV2, 3);
            RaiseMessage("GLTFExporter.Mesh | hasColor=" + hasColor, 3);
            RaiseMessage("GLTFExporter.Mesh | hasBones=" + hasBones, 3);

            // Retreive vertices data from babylon mesh
            List<GLTFGlobalVertex> globalVertices = new List<GLTFGlobalVertex>();
            for (int indexVertex = 0; indexVertex < nbVertices; indexVertex++)
            {
                GLTFGlobalVertex globalVertex = new GLTFGlobalVertex();
                globalVertex.Position = Tools.CreateIPoint3FromArray(babylonMesh.positions, indexVertex);
                globalVertex.Normal = Tools.CreateIPoint3FromArray(babylonMesh.normals, indexVertex);
                if (hasUV)
                {
                    globalVertex.UV = Tools.CreateIPoint2FromArray(babylonMesh.uvs, indexVertex);
                    // For glTF, the origin of the UV coordinates (0, 0) corresponds to the upper left corner of a texture image
                    // While for Babylon, it corresponds to the lower left corner of a texture image
                    globalVertex.UV.Y = 1 - globalVertex.UV.Y;
                }
                if (hasUV2)
                {
                    globalVertex.UV2 = Tools.CreateIPoint2FromArray(babylonMesh.uvs2, indexVertex);
                    // For glTF, the origin of the UV coordinates (0, 0) corresponds to the upper left corner of a texture image
                    // While for Babylon, it corresponds to the lower left corner of a texture image
                    globalVertex.UV2.Y = 1 - globalVertex.UV2.Y;
                }
                if (hasColor)
                {
                    globalVertex.Color = Tools.CreateIPoint4FromArray(babylonMesh.colors, indexVertex).ToArray();
                }
                if (hasBones)
                {
					// In babylon, the 4 bones indices are stored in a single int
					// Each bone index is a byte thus 8-bit offset from the next
                    int bonesIndicesMerged = babylonMesh.matricesIndices[indexVertex];
                    int bone3 = bonesIndicesMerged >> 24;
                    bonesIndicesMerged -= bone3 << 24;
                    int bone2 = bonesIndicesMerged >> 16;
                    bonesIndicesMerged -= bone2 << 16;
                    int bone1 = bonesIndicesMerged >> 8;
                    bonesIndicesMerged -= bone1 << 8;
                    int bone0 = bonesIndicesMerged >> 0;
                    bonesIndicesMerged -= bone0 << 0;
                    var bonesIndicesArray = new byte[] { (byte)bone0, (byte)bone1, (byte)bone2, (byte)bone3 };
                    globalVertex.BonesIndices = bonesIndicesArray;
                    globalVertex.BonesWeights = Tools.CreateIPoint4FromArray(babylonMesh.matricesWeights, indexVertex).ToArray();
                }

                globalVertices.Add(globalVertex);
            }

            // Retreive indices from babylon mesh
            List<ushort> babylonIndices = new List<ushort>();
            babylonIndices = babylonMesh.indices.ToList().ConvertAll(new Converter<int, ushort>(n => (ushort)n));


            // --------------------------
            // ------- Init glTF --------
            // --------------------------

            RaiseMessage("GLTFExporter.Mesh | Init glTF", 2);
            // Mesh
            var gltfMesh = new GLTFMesh { name = babylonMesh.name };
            gltfMesh.index = gltf.MeshesList.Count;
            gltf.MeshesList.Add(gltfMesh);
            gltfMesh.idGroupInstance = babylonMesh.idGroupInstance;
            if (hasBones)
            {
                gltfMesh.idBabylonSkeleton = babylonMesh.skeletonId;
            }

            // --------------------------
            // ---- glTF primitives -----
            // --------------------------

            RaiseMessage("GLTFExporter.Mesh | glTF primitives", 2);
            var meshPrimitives = new List<GLTFMeshPrimitive>();
            var weights = new List<float>();
            foreach (BabylonSubMesh babylonSubMesh in babylonMesh.subMeshes)
            {
                // --------------------------
                // ------ SubMesh data ------
                // --------------------------

                List<GLTFGlobalVertex> globalVerticesSubMesh = globalVertices.GetRange(babylonSubMesh.verticesStart, babylonSubMesh.verticesCount);

                List<ushort> gltfIndices = babylonIndices.GetRange(babylonSubMesh.indexStart, babylonSubMesh.indexCount);
                // In gltf, indices of each mesh primitive are 0-based (ie: min value is 0)
                // Thus, the gltf indices list is a concatenation of sub lists all 0-based
                // Example for 2 triangles, each being a submesh:
                //      babylonIndices = {0,1,2, 3,4,5} gives as result gltfIndicies = {0,1,2, 0,1,2}
                var minIndiceValue = gltfIndices.Min(); // Should be equal to babylonSubMesh.indexStart
                for (int indexIndice = 0; indexIndice < gltfIndices.Count; indexIndice++)
                {
                    gltfIndices[indexIndice] -= minIndiceValue;
                }

                // --------------------------
                // ----- Mesh primitive -----
                // --------------------------

                // MeshPrimitive
                var meshPrimitive = new GLTFMeshPrimitive
                {
                    attributes = new Dictionary<string, int>()
                };
                meshPrimitives.Add(meshPrimitive);

                // Material
                if (babylonMesh.materialId != null)
                {
                    // Retreive the babylon material
                    var babylonMaterialId = babylonMesh.materialId;
                    var babylonMaterials = new List<BabylonMaterial>(babylonScene.materials);
                    var babylonMaterial = babylonMaterials.Find(_babylonMaterial => _babylonMaterial.id == babylonMaterialId);
                    if (babylonMaterial == null)
                    {
                        // It's a multi material
                        var babylonMultiMaterials = new List<BabylonMultiMaterial>(babylonScene.multiMaterials);
                        var babylonMultiMaterial = babylonMultiMaterials.Find(_babylonMultiMaterial => _babylonMultiMaterial.id == babylonMesh.materialId);
                        babylonMaterialId = babylonMultiMaterial.materials[babylonSubMesh.materialIndex];
                        babylonMaterial = babylonMaterials.Find(_babylonMaterial => _babylonMaterial.id == babylonMaterialId);
                    }

                    // Update primitive material index
                    var indexMaterial = babylonMaterialsToExport.FindIndex(_babylonMaterial => _babylonMaterial == babylonMaterial);
                    if (indexMaterial == -1)
                    {
                        // Store material for exportation
                        indexMaterial = babylonMaterialsToExport.Count;
                        babylonMaterialsToExport.Add(babylonMaterial);
                    }
                    meshPrimitive.material = indexMaterial;

                    // TODO - Add and retreive info from babylon material
                    meshPrimitive.mode = GLTFMeshPrimitive.FillMode.TRIANGLES;
                }

                // --------------------------
                // ------- Accessors --------
                // --------------------------

                // Buffer
                var buffer = GLTFBufferService.Instance.GetBuffer(gltf);

                // --- Indices ---
                var accessorIndices = GLTFBufferService.Instance.CreateAccessor(
                    gltf,
                    GLTFBufferService.Instance.GetBufferViewScalar(gltf, buffer),
                    "accessorIndices",
                    GLTFAccessor.ComponentType.UNSIGNED_SHORT,
                    GLTFAccessor.TypeEnum.SCALAR
                );
                meshPrimitive.indices = accessorIndices.index;
                // Populate accessor
                gltfIndices.ForEach(n => accessorIndices.bytesList.AddRange(BitConverter.GetBytes(n)));
                accessorIndices.count = gltfIndices.Count;
                
                // --- Positions ---
                var accessorPositions = GLTFBufferService.Instance.CreateAccessor(
                    gltf,
                    GLTFBufferService.Instance.GetBufferViewFloatVec3(gltf, buffer),
                    "accessorPositions",
                    GLTFAccessor.ComponentType.FLOAT,
                    GLTFAccessor.TypeEnum.VEC3
                );
                meshPrimitive.attributes.Add(GLTFMeshPrimitive.Attribute.POSITION.ToString(), accessorPositions.index);
                // Populate accessor
                accessorPositions.min = new float[] { float.MaxValue, float.MaxValue, float.MaxValue };
                accessorPositions.max = new float[] { float.MinValue, float.MinValue, float.MinValue };
                globalVerticesSubMesh.ForEach((globalVertex) =>
                {
                    var positions = new float[] { globalVertex.Position.X, globalVertex.Position.Y, globalVertex.Position.Z };
                    // Store values as bytes
                    foreach (var position in positions)
                    {
                        accessorPositions.bytesList.AddRange(BitConverter.GetBytes(position));
                    }
                    // Update min and max values
                    GLTFBufferService.UpdateMinMaxAccessor(accessorPositions, positions);
                });
                accessorPositions.count = globalVerticesSubMesh.Count;
                
                // --- Normals ---
                var accessorNormals = GLTFBufferService.Instance.CreateAccessor(
                    gltf,
                    GLTFBufferService.Instance.GetBufferViewFloatVec3(gltf, buffer),
                    "accessorNormals",
                    GLTFAccessor.ComponentType.FLOAT,
                    GLTFAccessor.TypeEnum.VEC3
                );
                meshPrimitive.attributes.Add(GLTFMeshPrimitive.Attribute.NORMAL.ToString(), accessorNormals.index);
                // Populate accessor
                List<float> normals = globalVerticesSubMesh.SelectMany(v => new[] { v.Normal.X, v.Normal.Y, v.Normal.Z }).ToList();
                normals.ForEach(n => accessorNormals.bytesList.AddRange(BitConverter.GetBytes(n)));
                accessorNormals.count = globalVerticesSubMesh.Count;
                
                // --- Colors ---
                if (hasColor)
                {
                    var accessorColors = GLTFBufferService.Instance.CreateAccessor(
                        gltf,
                        GLTFBufferService.Instance.GetBufferViewFloatVec4(gltf, buffer),
                        "accessorColors",
                        GLTFAccessor.ComponentType.FLOAT,
                        GLTFAccessor.TypeEnum.VEC4
                    );
                    meshPrimitive.attributes.Add(GLTFMeshPrimitive.Attribute.COLOR_0.ToString(), accessorColors.index);
                    // Populate accessor
                    List<float> colors = globalVerticesSubMesh.SelectMany(v => new[] { v.Color[0], v.Color[1], v.Color[2], v.Color[3] }).ToList();
                    colors.ForEach(n => accessorColors.bytesList.AddRange(BitConverter.GetBytes(n)));
                    accessorColors.count = globalVerticesSubMesh.Count;
                }
                
                // --- UV ---
                if (hasUV)
                {
                    var accessorUVs = GLTFBufferService.Instance.CreateAccessor(
                        gltf,
                        GLTFBufferService.Instance.GetBufferViewFloatVec2(gltf, buffer),
                        "accessorUVs",
                        GLTFAccessor.ComponentType.FLOAT,
                        GLTFAccessor.TypeEnum.VEC2
                    );
                    meshPrimitive.attributes.Add(GLTFMeshPrimitive.Attribute.TEXCOORD_0.ToString(), accessorUVs.index);
                    // Populate accessor
                    List<float> uvs = globalVerticesSubMesh.SelectMany(v => new[] { v.UV.X, v.UV.Y }).ToList();
                    uvs.ForEach(n => accessorUVs.bytesList.AddRange(BitConverter.GetBytes(n)));
                    accessorUVs.count = globalVerticesSubMesh.Count;
                }
                
                // --- UV2 ---
                if (hasUV2)
                {
                    var accessorUV2s = GLTFBufferService.Instance.CreateAccessor(
                        gltf,
                        GLTFBufferService.Instance.GetBufferViewFloatVec2(gltf, buffer),
                        "accessorUV2s",
                        GLTFAccessor.ComponentType.FLOAT,
                        GLTFAccessor.TypeEnum.VEC2
                    );
                    meshPrimitive.attributes.Add(GLTFMeshPrimitive.Attribute.TEXCOORD_1.ToString(), accessorUV2s.index);
                    // Populate accessor
                    List<float> uvs2 = globalVerticesSubMesh.SelectMany(v => new[] { v.UV2.X, v.UV2.Y }).ToList();
                    uvs2.ForEach(n => accessorUV2s.bytesList.AddRange(BitConverter.GetBytes(n)));
                    accessorUV2s.count = globalVerticesSubMesh.Count;
                }

                // --- Bones ---
                if (hasBones)
                {
                    // --- Joints ---
                    var accessorJoints = GLTFBufferService.Instance.CreateAccessor(
                        gltf,
                        GLTFBufferService.Instance.GetBufferViewUnsignedShortVec4(gltf, buffer),
                        "accessorJoints",
                        GLTFAccessor.ComponentType.UNSIGNED_SHORT,
                        GLTFAccessor.TypeEnum.VEC4
                    );
                    meshPrimitive.attributes.Add(GLTFMeshPrimitive.Attribute.JOINTS_0.ToString(), accessorJoints.index);
                    // Populate accessor
                    List<byte> joints = globalVerticesSubMesh.SelectMany(v => new[] { v.BonesIndices[0], v.BonesIndices[1], v.BonesIndices[2], v.BonesIndices[3] }).ToList();
                    joints.ForEach(n => accessorJoints.bytesList.Add(n));
                    accessorJoints.count = globalVerticesSubMesh.Count;

                    // --- Weights ---
                    var accessorWeights = GLTFBufferService.Instance.CreateAccessor(
                        gltf,
                        GLTFBufferService.Instance.GetBufferViewFloatVec4(gltf, buffer),
                        "accessorWeights",
                        GLTFAccessor.ComponentType.FLOAT,
                        GLTFAccessor.TypeEnum.VEC4
                    );
                    meshPrimitive.attributes.Add(GLTFMeshPrimitive.Attribute.WEIGHTS_0.ToString(), accessorWeights.index);
                    // Populate accessor
                    List<float> weightBones = globalVerticesSubMesh.SelectMany(v => new[] { v.BonesWeights[0], v.BonesWeights[1], v.BonesWeights[2], v.BonesWeights[3] }).ToList();
                    weightBones.ForEach(n => accessorWeights.bytesList.AddRange(BitConverter.GetBytes(n)));
                    accessorWeights.count = globalVerticesSubMesh.Count;
                }

                // Morph targets
                var babylonMorphTargetManager = GetBabylonMorphTargetManager(babylonScene, babylonMesh);
                if (babylonMorphTargetManager != null)
                {
                    _exportMorphTargets(babylonMesh, babylonMorphTargetManager, gltf, buffer, meshPrimitive, weights);
                }
            }
            gltfMesh.primitives = meshPrimitives.ToArray();
            if (weights.Count > 0)
            {
                gltfMesh.weights = weights.ToArray();
            }

            return gltfMesh;
        }

        private BabylonMorphTargetManager GetBabylonMorphTargetManager(BabylonScene babylonScene, BabylonMesh babylonMesh)
        {
            if (babylonMesh.morphTargetManagerId.HasValue)
            {
                if (babylonScene.morphTargetManagers == null)
                {
                    RaiseWarning("GLTFExporter.Mesh | morphTargetManagers is not defined", 3);
                }
                else
                {
                    var babylonMorphTargetManager = babylonScene.morphTargetManagers.ElementAtOrDefault(babylonMesh.morphTargetManagerId.Value);

                    if (babylonMorphTargetManager == null)
                    {
                        RaiseWarning($"GLTFExporter.Mesh | morphTargetManager with index {babylonMesh.morphTargetManagerId.Value} not found", 3);
                    }
                    return babylonMorphTargetManager;
                }
            }
            return null;
        }

        private void _exportMorphTargets(BabylonMesh babylonMesh, BabylonMorphTargetManager babylonMorphTargetManager, GLTF gltf, GLTFBuffer buffer, GLTFMeshPrimitive meshPrimitive, List<float> weights)
        {
            var gltfMorphTargets = new List<GLTFMorphTarget>();
            foreach (var babylonMorphTarget in babylonMorphTargetManager.targets)
            {
                var gltfMorphTarget = new GLTFMorphTarget();

                // Positions
                if (babylonMorphTarget.positions != null)
                {
                    var accessorTargetPositions = GLTFBufferService.Instance.CreateAccessor(
                        gltf,
                        GLTFBufferService.Instance.GetBufferViewFloatVec3(gltf, buffer),
                        "accessorTargetPositions",
                        GLTFAccessor.ComponentType.FLOAT,
                        GLTFAccessor.TypeEnum.VEC3
                    );
                    gltfMorphTarget.Add(GLTFMorphTarget.Attribute.POSITION.ToString(), accessorTargetPositions.index);
                    // Populate accessor
                    accessorTargetPositions.min = new float[] { float.MaxValue, float.MaxValue, float.MaxValue };
                    accessorTargetPositions.max = new float[] { float.MinValue, float.MinValue, float.MinValue };
                    for (int indexPosition = 0; indexPosition < babylonMorphTarget.positions.Length; indexPosition += 3)
                    {
                        var positionTarget = Tools.SubArray(babylonMorphTarget.positions, indexPosition, 3);

                        // Babylon stores morph target information as final data while glTF expects deltas from mesh primitive
                        var positionMesh = Tools.SubArray(babylonMesh.positions, indexPosition, 3);
                        for (int indexCoordinate = 0; indexCoordinate < positionTarget.Length; indexCoordinate++)
                        {
                            positionTarget[indexCoordinate] = positionTarget[indexCoordinate] - positionMesh[indexCoordinate];
                        }

                        // Store values as bytes
                        foreach (var coordinate in positionTarget)
                        {
                            accessorTargetPositions.bytesList.AddRange(BitConverter.GetBytes(coordinate));
                        }
                        // Update min and max values
                        GLTFBufferService.UpdateMinMaxAccessor(accessorTargetPositions, positionTarget);
                    }
                    accessorTargetPositions.count = babylonMorphTarget.positions.Length / 3;
                }

                // Normals
                if (babylonMorphTarget.normals != null)
                {
                    var accessorTargetNormals = GLTFBufferService.Instance.CreateAccessor(
                        gltf,
                        GLTFBufferService.Instance.GetBufferViewFloatVec3(gltf, buffer),
                        "accessorTargetNormals",
                        GLTFAccessor.ComponentType.FLOAT,
                        GLTFAccessor.TypeEnum.VEC3
                    );
                    gltfMorphTarget.Add(GLTFMorphTarget.Attribute.NORMAL.ToString(), accessorTargetNormals.index);
                    // Populate accessor
                    for (int indexNormal = 0; indexNormal < babylonMorphTarget.positions.Length; indexNormal += 3)
                    {
                        var normalTarget = Tools.SubArray(babylonMorphTarget.normals, indexNormal, 3);

                        // Babylon stores morph target information as final data while glTF expects deltas from mesh primitive
                        var normalMesh = Tools.SubArray(babylonMesh.normals, indexNormal, 3);
                        for (int indexCoordinate = 0; indexCoordinate < normalTarget.Length; indexCoordinate++)
                        {
                            normalTarget[indexCoordinate] = normalTarget[indexCoordinate] - normalMesh[indexCoordinate];
                        }

                        // Store values as bytes
                        foreach (var coordinate in normalTarget)
                        {
                            accessorTargetNormals.bytesList.AddRange(BitConverter.GetBytes(coordinate));
                        }
                    }
                    accessorTargetNormals.count = babylonMorphTarget.normals.Length / 3;
                }

                if (gltfMorphTarget.Count > 0)
                {
                    gltfMorphTargets.Add(gltfMorphTarget);
                    weights.Add(babylonMorphTarget.influence);
                }
            }
            if (gltfMorphTargets.Count > 0)
            {
                meshPrimitive.targets = gltfMorphTargets.ToArray();
            }
        }
    }
}
