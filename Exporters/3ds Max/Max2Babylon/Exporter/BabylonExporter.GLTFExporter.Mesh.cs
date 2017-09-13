using Autodesk.Max;
using BabylonExport.Entities;
using GLTFExport.Entities;
using System;
using System.Collections.Generic;
using System.IO;
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
            // For triangle primitives in gltf, the front face has a counter-clockwise (CCW) winding order
            // Swap face side
            //for (int i = 0; i < babylonIndices.Count; i += 3)
            //{
            //    var tmp = babylonIndices[i];
            //    babylonIndices[i] = babylonIndices[i + 2];
            //    babylonIndices[i + 2] = tmp;
            //}


            // --------------------------
            // ------- Init glTF --------
            // --------------------------

            RaiseMessage("GLTFExporter.Mesh | Init glTF", 2);
            // Mesh
            var gltfMesh = new GLTFMesh { name = babylonMesh.name };
            gltfMesh.index = gltf.MeshesList.Count;
            gltf.MeshesList.Add(gltfMesh);
            gltfMesh.idGroupInstance = babylonMesh.idGroupInstance;

            // Buffer
            var buffer = gltf.buffer;
            if (buffer == null)
            {
                buffer = new GLTFBuffer
                {
                    uri = gltf.OutputFile + ".bin"
                };
                buffer.index = gltf.BuffersList.Count;
                gltf.BuffersList.Add(buffer);
                gltf.buffer = buffer;
            }

            // BufferView - Scalar
            var bufferViewScalar = gltf.bufferViewScalar;
            if (bufferViewScalar == null)
            {
                bufferViewScalar = new GLTFBufferView
                {
                    name = "bufferViewScalar",
                    buffer = buffer.index,
                    Buffer = buffer
                };
                bufferViewScalar.index = gltf.BufferViewsList.Count;
                gltf.BufferViewsList.Add(bufferViewScalar);
                gltf.bufferViewScalar = bufferViewScalar;
            }

            // BufferView - Vector3
            var bufferViewFloatVec3 = gltf.bufferViewFloatVec3;
            if (bufferViewFloatVec3 == null)
            {
                bufferViewFloatVec3 = new GLTFBufferView
                {
                    name = "bufferViewFloatVec3",
                    buffer = buffer.index,
                    Buffer = buffer,
                    byteOffset = 0,
                    byteStride = 12 // Field only defined for buffer views that contain vertex attributes. A vertex needs 3 * 4 bytes
                };
                bufferViewFloatVec3.index = gltf.BufferViewsList.Count;
                gltf.BufferViewsList.Add(bufferViewFloatVec3);
                gltf.bufferViewFloatVec3 = bufferViewFloatVec3;
            }

            // BufferView - Vector4
            GLTFBufferView bufferViewFloatVec4 = null;
            if (hasColor)
            {
                bufferViewFloatVec4 = gltf.bufferViewFloatVec4;
                if (bufferViewFloatVec4 == null)
                {
                    bufferViewFloatVec4 = new GLTFBufferView
                    {
                        name = "bufferViewFloatVec4",
                        buffer = buffer.index,
                        Buffer = buffer,
                        byteOffset = 0,
                        byteStride = 16 // Field only defined for buffer views that contain vertex attributes. A vertex needs 4 * 4 bytes
                    };
                    bufferViewFloatVec4.index = gltf.BufferViewsList.Count;
                    gltf.BufferViewsList.Add(bufferViewFloatVec4);
                    gltf.bufferViewFloatVec4 = bufferViewFloatVec4;
                }
            }

            // BufferView - Vector2
            GLTFBufferView bufferViewFloatVec2 = null;
            if (hasUV || hasUV2)
            {
                bufferViewFloatVec2 = gltf.bufferViewFloatVec2;
                if (bufferViewFloatVec2 == null)
                {
                    bufferViewFloatVec2 = new GLTFBufferView
                    {
                        name = "bufferViewFloatVec2",
                        buffer = buffer.index,
                        Buffer = buffer,
                        byteStride = 8 // Field only defined for buffer views that contain vertex attributes. A vertex needs 2 * 4 bytes
                    };
                    bufferViewFloatVec2.index = gltf.BufferViewsList.Count;
                    gltf.BufferViewsList.Add(bufferViewFloatVec2);
                    gltf.bufferViewFloatVec2 = bufferViewFloatVec2;
                }
            }

            // --------------------------
            // ---- glTF primitives -----
            // --------------------------

            RaiseMessage("GLTFExporter.Mesh | glTF primitives", 2);
            var meshPrimitives = new List<GLTFMeshPrimitive>();

            // Global vertices are sorted per submesh
            var globalVerticesSubMeshes = new List<List<GLTFGlobalVertex>>();

            // In gltf, indices of each mesh primitive are 0-based (ie: min value is 0)
            // Thus, the gltf indices list is a concatenation of sub lists all 0-based
            // Example for 2 triangles, each being a submesh:
            //      babylonIndices = {0,1,2, 3,4,5} gives as result gltfIndicies = {0,1,2, 0,1,2}
            var gltfIndices = new List<ushort>();
            
            foreach (BabylonSubMesh babylonSubMesh in babylonMesh.subMeshes)
            {
                // --------------------------
                // ------ SubMesh data ------
                // --------------------------

                List<GLTFGlobalVertex> globalVerticesSubMesh = globalVertices.GetRange(babylonSubMesh.verticesStart, babylonSubMesh.verticesCount);
                globalVerticesSubMeshes.Add(globalVerticesSubMesh);

                List<ushort> _indices = babylonIndices.GetRange(babylonSubMesh.indexStart, babylonSubMesh.indexCount);
                // Indices of this submesh / primitive are updated to be 0-based
                var minIndiceValue = _indices.Min(); // Should be equal to babylonSubMesh.indexStart
                for (int indexIndice = 0; indexIndice < _indices.Count; indexIndice++)
                {
                    _indices[indexIndice] -= minIndiceValue;
                }
                gltfIndices.AddRange(_indices);

                // --------------------------
                // -- Init glTF primitive ---
                // --------------------------

                // MeshPrimitive
                var meshPrimitive = new GLTFMeshPrimitive
                {
                    attributes = new Dictionary<string, int>()
                };
                meshPrimitives.Add(meshPrimitive);

                // Accessor - Indices
                var accessorIndices = new GLTFAccessor
                {
                    name = "accessorIndices",
                    bufferView = bufferViewScalar.index,
                    BufferView = bufferViewScalar,
                    componentType = GLTFAccessor.ComponentType.UNSIGNED_SHORT,
                    type = GLTFAccessor.TypeEnum.SCALAR.ToString()
                };
                accessorIndices.index = gltf.AccessorsList.Count;
                gltf.AccessorsList.Add(accessorIndices);
                meshPrimitive.indices = accessorIndices.index;

                // Accessor - Positions
                var accessorPositions = new GLTFAccessor
                {
                    name = "accessorPositions",
                    bufferView = bufferViewFloatVec3.index,
                    BufferView = bufferViewFloatVec3,
                    componentType = GLTFAccessor.ComponentType.FLOAT,
                    type = GLTFAccessor.TypeEnum.VEC3.ToString(),
                    min = new float[] { float.MaxValue, float.MaxValue, float.MaxValue },
                    max = new float[] { float.MinValue, float.MinValue, float.MinValue }
                };
                accessorPositions.index = gltf.AccessorsList.Count;
                gltf.AccessorsList.Add(accessorPositions);
                meshPrimitive.attributes.Add(GLTFMeshPrimitive.Attribute.POSITION.ToString(), accessorPositions.index);

                // Accessor - Normals
                var accessorNormals = new GLTFAccessor
                {
                    name = "accessorNormals",
                    bufferView = bufferViewFloatVec3.index,
                    BufferView = bufferViewFloatVec3,
                    componentType = GLTFAccessor.ComponentType.FLOAT,
                    type = GLTFAccessor.TypeEnum.VEC3.ToString()
                };
                accessorNormals.index = gltf.AccessorsList.Count;
                gltf.AccessorsList.Add(accessorNormals);
                meshPrimitive.attributes.Add(GLTFMeshPrimitive.Attribute.NORMAL.ToString(), accessorNormals.index);

                // Accessor - Colors
                GLTFAccessor accessorColors = null;
                if (hasColor)
                {
                    accessorColors = new GLTFAccessor
                    {
                        name = "accessorColors",
                        bufferView = bufferViewFloatVec4.index,
                        BufferView = bufferViewFloatVec4,
                        componentType = GLTFAccessor.ComponentType.FLOAT,
                        type = GLTFAccessor.TypeEnum.VEC4.ToString()
                    };
                    accessorColors.index = gltf.AccessorsList.Count;
                    gltf.AccessorsList.Add(accessorColors);
                    meshPrimitive.attributes.Add(GLTFMeshPrimitive.Attribute.COLOR_0.ToString(), accessorColors.index);
                }

                // Accessor - UV
                GLTFAccessor accessorUVs = null;
                if (hasUV)
                {
                    accessorUVs = new GLTFAccessor
                    {
                        name = "accessorUVs",
                        bufferView = bufferViewFloatVec2.index,
                        BufferView = bufferViewFloatVec2,
                        componentType = GLTFAccessor.ComponentType.FLOAT,
                        type = GLTFAccessor.TypeEnum.VEC2.ToString()
                    };
                    accessorUVs.index = gltf.AccessorsList.Count;
                    gltf.AccessorsList.Add(accessorUVs);
                    meshPrimitive.attributes.Add(GLTFMeshPrimitive.Attribute.TEXCOORD_0.ToString(), accessorUVs.index);
                }

                // Accessor - UV2
                GLTFAccessor accessorUV2s = null;
                if (hasUV2)
                {
                    accessorUV2s = new GLTFAccessor
                    {
                        name = "accessorUV2s",
                        bufferView = bufferViewFloatVec2.index,
                        BufferView = bufferViewFloatVec2,
                        componentType = GLTFAccessor.ComponentType.FLOAT,
                        type = GLTFAccessor.TypeEnum.VEC2.ToString()
                    };
                    accessorUV2s.index = gltf.AccessorsList.Count;
                    gltf.AccessorsList.Add(accessorUV2s);
                    meshPrimitive.attributes.Add(GLTFMeshPrimitive.Attribute.TEXCOORD_1.ToString(), accessorUV2s.index);
                }

                
                // --------------------------
                // - Update glTF primitive --
                // --------------------------

                RaiseMessage("GLTFExporter.Mesh | Mesh as glTF", 3);

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

                // Update min and max vertex position for each component (X, Y, Z)
                globalVerticesSubMesh.ForEach((globalVertex) =>
                {
                    var positionArray = new float[] { globalVertex.Position.X, globalVertex.Position.Y, globalVertex.Position.Z };
                    for (int indexComponent = 0; indexComponent < positionArray.Length; indexComponent++)
                    {
                        if (positionArray[indexComponent] < accessorPositions.min[indexComponent])
                        {
                            accessorPositions.min[indexComponent] = positionArray[indexComponent];
                        }
                        if (positionArray[indexComponent] > accessorPositions.max[indexComponent])
                        {
                            accessorPositions.max[indexComponent] = positionArray[indexComponent];
                        }
                    }
                });

                // Update byte length and count of accessors, bufferViews and buffers
                // Scalar
                AddElementsToAccessor(accessorIndices, _indices.Count);
                // Ensure the byteoffset is a multiple of 4
                // Indices accessor element size if 2
                // So the count needs to be even
                if (gltfIndices.Count % 2 != 0)
                {
                    gltfIndices.Add(0);
                    bufferViewScalar.byteLength += 2;
                    buffer.byteLength += 2;
                }
                // Vector3
                AddElementsToAccessor(accessorPositions, globalVerticesSubMesh.Count);
                AddElementsToAccessor(accessorNormals, globalVerticesSubMesh.Count);
                // Vector4
                if (hasColor)
                {
                    AddElementsToAccessor(accessorColors, globalVerticesSubMesh.Count);
                }
                // Vector2
                if (hasUV)
                {
                    AddElementsToAccessor(accessorUVs, globalVerticesSubMesh.Count);
                }
                if (hasUV2)
                {
                    AddElementsToAccessor(accessorUV2s, globalVerticesSubMesh.Count);
                }
            }
            gltfMesh.primitives = meshPrimitives.ToArray();
            
            // Update byte offset of bufferViews
            GLTFBufferView lastBufferView = null;
            gltf.BufferViewsList.FindAll(bufferView => bufferView.buffer == buffer.index).ForEach(bufferView =>
            {
                if (lastBufferView != null)
                {
                    bufferView.byteOffset = lastBufferView.byteOffset + lastBufferView.byteLength;
                }
                lastBufferView = bufferView;
            });


            // --------------------------
            // --------- Saving ---------
            // --------------------------

            RaiseMessage("GLTFExporter.Mesh | saving", 2);

            // BufferView - Scalar
            gltfIndices.ForEach(n => bufferViewScalar.bytesList.AddRange(BitConverter.GetBytes(n)));

            // BufferView - Vector3
            globalVerticesSubMeshes.ForEach(globalVerticesSubMesh =>
            {
                List<float> vertices = globalVerticesSubMesh.SelectMany(v => new[] { v.Position.X, v.Position.Y, v.Position.Z }).ToList();
                vertices.ForEach(n => bufferViewFloatVec3.bytesList.AddRange(BitConverter.GetBytes(n)));

                List<float> normals = globalVerticesSubMesh.SelectMany(v => new[] { v.Normal.X, v.Normal.Y, v.Normal.Z }).ToList();
                normals.ForEach(n => bufferViewFloatVec3.bytesList.AddRange(BitConverter.GetBytes(n)));
            });

            // BufferView - Vector4
            globalVerticesSubMeshes.ForEach(globalVerticesSubMesh =>
            {
                if (hasColor)
                {
                    List<float> colors = globalVerticesSubMesh.SelectMany(v => new[] { v.Color[0], v.Color[1], v.Color[2], v.Color[3] }).ToList();
                    colors.ForEach(n => bufferViewFloatVec4.bytesList.AddRange(BitConverter.GetBytes(n)));
                }
            });

            // BufferView - Vector2
            globalVerticesSubMeshes.ForEach(globalVerticesSubMesh =>
            {
                if (hasUV)
                {
                    List<float> uvs = globalVerticesSubMesh.SelectMany(v => new[] { v.UV.X, v.UV.Y }).ToList();
                    uvs.ForEach(n => bufferViewFloatVec2.bytesList.AddRange(BitConverter.GetBytes(n)));
                }

                if (hasUV2)
                {
                    List<float> uvs2 = globalVerticesSubMesh.SelectMany(v => new[] { v.UV2.X, v.UV2.Y }).ToList();
                    uvs2.ForEach(n => bufferViewFloatVec2.bytesList.AddRange(BitConverter.GetBytes(n)));
                }
            });

            //// Write data to binary file
            //string outputBinaryFile = Path.Combine(gltf.OutputPath, gltfMesh.name + ".bin");
            //RaiseMessage("GLTFExporter.Mesh | Saving " + outputBinaryFile, 2);
            //using (BinaryWriter writer = new BinaryWriter(File.Open(outputBinaryFile, FileMode.Create)))
            //{
            //    bytesList.ForEach(b => writer.Write(b));
            //}

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

        private void AddElementsToAccessor(GLTFAccessor accessor, int count)
        {
            GLTFBufferView bufferView = accessor.BufferView;
            GLTFBuffer buffer = bufferView.Buffer;

            accessor.byteOffset = bufferView.byteLength;
            accessor.count += count;
            bufferView.byteLength += accessor.getByteLength();
            buffer.byteLength += accessor.getByteLength();
        }
    }
}
