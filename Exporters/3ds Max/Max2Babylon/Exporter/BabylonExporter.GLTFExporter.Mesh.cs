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

            RaiseMessage("GLTFExporter.Mesh | nbVertices=" + nbVertices, 3);
            RaiseMessage("GLTFExporter.Mesh | hasUV=" + hasUV, 3);
            RaiseMessage("GLTFExporter.Mesh | hasUV2=" + hasUV2, 3);
            RaiseMessage("GLTFExporter.Mesh | hasColor=" + hasColor, 3);

            // Retreive vertices data from babylon mesh
            List<GLTFGlobalVertex> globalVertices = new List<GLTFGlobalVertex>();
            for (int indexVertex = 0; indexVertex < nbVertices; indexVertex++)
            {
                GLTFGlobalVertex globalVertex = new GLTFGlobalVertex();
                globalVertex.Position = createIPoint3(babylonMesh.positions, indexVertex);
                // Switch from left to right handed coordinate system
                //globalVertex.Position.X *= -1;
                globalVertex.Normal = createIPoint3(babylonMesh.normals, indexVertex);
                if (hasUV)
                {
                    globalVertex.UV = createIPoint2(babylonMesh.uvs, indexVertex);
                    // For glTF, the origin of the UV coordinates (0, 0) corresponds to the upper left corner of a texture image
                    // While for Babylon, it corresponds to the lower left corner of a texture image
                    globalVertex.UV.Y = 1 - globalVertex.UV.Y;
                }
                if (hasUV2)
                {
                    globalVertex.UV2 = createIPoint2(babylonMesh.uvs2, indexVertex);
                    // For glTF, the origin of the UV coordinates (0, 0) corresponds to the upper left corner of a texture image
                    // While for Babylon, it corresponds to the lower left corner of a texture image
                    globalVertex.UV2.Y = 1 - globalVertex.UV2.Y;
                }
                if (hasColor)
                {
                    globalVertex.Color = createIPoint4(babylonMesh.colors, indexVertex).ToArray();
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

            // --------------------------
            // ---- glTF primitives -----
            // --------------------------

            RaiseMessage("GLTFExporter.Mesh | glTF primitives", 2);
            var meshPrimitives = new List<GLTFMeshPrimitive>();
            
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
            }
            gltfMesh.primitives = meshPrimitives.ToArray();

            return gltfMesh;
        }

        private IPoint2 createIPoint2(float[] array, int index)
        {
            var startIndex = index * 2;
            return Loader.Global.Point2.Create(array[startIndex], array[startIndex + 1]);
        }

        private IPoint3 createIPoint3(float[] array, int index)
        {
            var startIndex = index * 3;
            return Loader.Global.Point3.Create(array[startIndex], array[startIndex + 1], array[startIndex + 2]);
        }

        private IPoint4 createIPoint4(float[] array, int index)
        {
            var startIndex = index * 4;
            return Loader.Global.Point4.Create(array[startIndex], array[startIndex + 1], array[startIndex + 2], array[startIndex + 3]);
        }
    }
}
