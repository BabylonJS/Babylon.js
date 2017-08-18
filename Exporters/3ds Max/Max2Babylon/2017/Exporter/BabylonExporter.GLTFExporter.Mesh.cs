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
        private GLTFMesh ExportMesh(BabylonMesh babylonMesh, GLTF gltf, GLTFNode gltfParentNode)
        {
            RaiseMessage("GLTFExporter.Mesh | ExportMesh babylonMesh.name=" + babylonMesh.name, 1);

            // --------------------------
            // ---------- Node ----------
            // --------------------------

            RaiseMessage("GLTFExporter.Mesh | Node", 1);
            // Node
            var gltfNode = new GLTFNode();
            gltfNode.name = babylonMesh.name;
            gltfNode.index = gltf.NodesList.Count;
            gltf.NodesList.Add(gltfNode);

            // Hierarchy
            if (gltfParentNode != null)
            {
                RaiseMessage("GLTFExporter.Mesh | Add " + babylonMesh.name + " as child to " + gltfParentNode.name, 2);
                gltfParentNode.ChildrenList.Add(gltfNode.index);
            }
            else
            {
                // It's a root node
                // Only root nodes are listed in a gltf scene
                RaiseMessage("GLTFExporter.Mesh | Add " + babylonMesh.name + " as root node to scene", 2);
                gltf.scenes[0].NodesList.Add(gltfNode.index);
            }

            // Transform
            gltfNode.translation = babylonMesh.position;
            if (babylonMesh.rotationQuaternion != null)
            {
                gltfNode.rotation = babylonMesh.rotationQuaternion;
            }
            else
            {
                // Convert rotation vector to quaternion
                // TODO - Fix it
                BabylonVector3 rotationVector3 = new BabylonVector3
                {
                    X = babylonMesh.rotation[0],
                    Y = babylonMesh.rotation[1],
                    Z = babylonMesh.rotation[2]
                };
                gltfNode.rotation = rotationVector3.toQuaternion().ToArray();

                RaiseMessage("GLTFExporter.Mesh | rotationVector3=[" + rotationVector3.X + "; " + rotationVector3.Y + "; " + rotationVector3.Z + "]", 2);
                RaiseMessage("GLTFExporter.Mesh | gltfNode.rotation=[" + gltfNode.rotation[0] + "; " + gltfNode.rotation[1] + "; " + gltfNode.rotation[2] + "; " + gltfNode.rotation[3] + "]", 2);
            }
            gltfNode.scale = babylonMesh.scaling;


            // --------------------------
            // --- Mesh from babylon ----
            // --------------------------

            RaiseMessage("GLTFExporter.Mesh | Mesh from babylon", 1);
            // Retreive general data from babylon mesh
            int nbVertices = babylonMesh.positions.Length / 3;
            bool hasUV = babylonMesh.uvs != null && babylonMesh.uvs.Length > 0;
            bool hasUV2 = babylonMesh.uvs2 != null && babylonMesh.uvs2.Length > 0;
            bool hasColor = babylonMesh.colors != null && babylonMesh.colors.Length > 0;

            RaiseMessage("GLTFExporter.Mesh | nbVertices=" + nbVertices, 2);
            RaiseMessage("GLTFExporter.Mesh | hasUV=" + hasUV, 2);
            RaiseMessage("GLTFExporter.Mesh | hasUV2=" + hasUV2, 2);
            RaiseMessage("GLTFExporter.Mesh | hasColor=" + hasColor, 2);

            // Retreive vertices data from babylon mesh
            List<GLTFGlobalVertex> globalVertices = new List<GLTFGlobalVertex>();
            for (int i = 0; i < nbVertices; i++)
            {
                GLTFGlobalVertex globalVertex = new GLTFGlobalVertex();
                globalVertex.Position = createIPoint3(babylonMesh.positions, i);
                globalVertex.Normal = createIPoint3(babylonMesh.normals, i);
                if (hasUV)
                {
                    globalVertex.UV = createIPoint2(babylonMesh.uvs, i);
                    // For glTF, the origin of the UV coordinates (0, 0) corresponds to the upper left corner of a texture image
                    // While for Babylon, it corresponds to the lower left corner of a texture image
                    globalVertex.UV.Y = 1 - globalVertex.UV.Y;
                }
                if (hasUV2)
                {
                    globalVertex.UV2 = createIPoint2(babylonMesh.uvs2, i);
                    // For glTF, the origin of the UV coordinates (0, 0) corresponds to the upper left corner of a texture image
                    // While for Babylon, it corresponds to the lower left corner of a texture image
                    globalVertex.UV2.Y = 1 - globalVertex.UV2.Y;
                }
                if (hasColor)
                {
                    globalVertex.Color = createIPoint4(babylonMesh.colors, i).ToArray();
                }

                globalVertices.Add(globalVertex);
            }

            // Retreive indices from babylon mesh
            List<ushort> indices = new List<ushort>();
            indices = babylonMesh.indices.ToList().ConvertAll(new Converter<int, ushort>(n => (ushort)n));
            // Swap face side
            for (int i = 0; i < indices.Count; i += 3)
            { 
                var tmp = indices[i];
                indices[i] = indices[i + 2];
                indices[i+2] = tmp;
            }


            // --------------------------
            // ------- Init glTF --------
            // --------------------------

            RaiseMessage("GLTFExporter.Mesh | Init glTF", 1);
            // Mesh
            var gltfMesh = new GLTFMesh { name = babylonMesh.name };
            gltfMesh.index = gltf.MeshesList.Count;
            gltf.MeshesList.Add(gltfMesh);
            gltfNode.mesh = gltfMesh.index;
            gltfMesh.gltfNode = gltfNode;

            // MeshPrimitive
            var meshPrimitives = new List<GLTFMeshPrimitive>();
            var meshPrimitive = new GLTFMeshPrimitive
            {
                attributes = new Dictionary<string, int>(),
                mode = GLTFMeshPrimitive.FillMode.TRIANGLES // TODO reteive info from babylon material
            };
            meshPrimitives.Add(meshPrimitive);

            // Buffer
            var buffer = new GLTFBuffer
            {
                uri = gltfMesh.name + ".bin"
            };
            buffer.index = gltf.BuffersList.Count;
            gltf.BuffersList.Add(buffer);

            // BufferView - Scalar
            var bufferViewScalar = new GLTFBufferView
            {
                name = "bufferViewScalar",
                buffer = buffer.index,
                Buffer = buffer
            };
            bufferViewScalar.index = gltf.BufferViewsList.Count;
            gltf.BufferViewsList.Add(bufferViewScalar);

            // BufferView - Vector3
            var bufferViewFloatVec3 = new GLTFBufferView
            {
                name = "bufferViewFloatVec3",
                buffer = buffer.index,
                Buffer = buffer,
                byteOffset = 0,
                byteStride = 12 // Field only defined for buffer views that contain vertex attributes. A vertex needs 3 * 4 bytes
            };
            bufferViewFloatVec3.index = gltf.BufferViewsList.Count;
            gltf.BufferViewsList.Add(bufferViewFloatVec3);

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

            // BufferView - Vector4
            GLTFBufferView bufferViewFloatVec4 = null;
            // Accessor - Colors
            GLTFAccessor accessorColors = null;
            if (hasColor)
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

            // BufferView - Vector2
            GLTFBufferView bufferViewFloatVec2 = null;
            if (hasUV ||hasUV2)
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
            // ------ Mesh as glTF ------
            // --------------------------

            RaiseMessage("GLTFExporter.Mesh | Mesh as glTF", 1);
            // Material
            //TODO - Handle multimaterials
            GLTFMaterial gltfMaterial = gltf.MaterialsList.Find(material => material.id == babylonMesh.materialId);
            if (gltfMaterial != null)
            {
                meshPrimitive.material = gltfMaterial.index;
            }

            // Update min and max vertex position for each component (X, Y, Z)
            globalVertices.ForEach((globalVertex) =>
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
            AddElementsToAccessor(accessorIndices, indices.Count);
            // Vector3
            bufferViewFloatVec3.byteOffset = buffer.byteLength;
            AddElementsToAccessor(accessorPositions, globalVertices.Count);
            AddElementsToAccessor(accessorNormals, globalVertices.Count);
            // Vector4
            if (hasColor)
            {
                bufferViewFloatVec4.byteOffset = buffer.byteLength;
                AddElementsToAccessor(accessorColors, globalVertices.Count);
            }
            // Vector2
            if (hasUV || hasUV2)
            {
                bufferViewFloatVec2.byteOffset = buffer.byteLength;

                if (hasUV)
                {
                    AddElementsToAccessor(accessorUVs, globalVertices.Count);
                }
                if (hasUV2)
                {
                    AddElementsToAccessor(accessorUV2s, globalVertices.Count);
                }
            }


            // --------------------------
            // --------- Saving ---------
            // --------------------------

            string outputBinaryFile = Path.Combine(gltf.OutputPath,  gltfMesh.name + ".bin");
            RaiseMessage("GLTFExporter.Mesh | Saving " + outputBinaryFile, 1);

            using (BinaryWriter writer = new BinaryWriter(File.Open(outputBinaryFile, FileMode.Create)))
            {
                // Binary arrays
                List<float> vertices = globalVertices.SelectMany(v => new[] { v.Position.X, v.Position.Y, v.Position.Z }).ToList();
                List<float> normals = globalVertices.SelectMany(v => new[] { v.Normal.X, v.Normal.Y, v.Normal.Z }).ToList();

                List<float> colors = new List<float>();
                if (hasColor)
                {
                    colors = globalVertices.SelectMany(v => new[] { v.Color[0], v.Color[1], v.Color[2], v.Color[3] }).ToList();
                }

                List<float> uvs = new List<float>();
                if (hasUV)
                {
                    uvs = globalVertices.SelectMany(v => new[] { v.UV.X, v.UV.Y }).ToList(); // No symetry required to perform 3dsMax => gltf conversion
                }

                List<float> uvs2 = new List<float>();
                if (hasUV2)
                {
                    uvs2 = globalVertices.SelectMany(v => new[] { v.UV2.X, v.UV2.Y }).ToList(); // No symetry required to perform 3dsMax => gltf conversion
                }

                // Write data to binary file
                indices.ForEach(n => writer.Write(n));
                vertices.ForEach(n => writer.Write(n));
                normals.ForEach(n => writer.Write(n));
                colors.ForEach(n => writer.Write(n));
                uvs.ForEach(n => writer.Write(n));
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
