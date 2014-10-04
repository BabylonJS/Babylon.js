using System;
using System.IO;
using System.Collections.Generic;
using System.Runtime.Serialization;
using System.Net;

using Vertice.Core;
using BabylonExport.Core;
using Newtonsoft.Json;


namespace BabylonBinaryConverter
{
    public enum VertexAttributes
    {
        Undefined = 0,
        Position = 2,
        Color = 4,
        Normal = 8,
        Uv1 = 16,
        Uv2 = 32,
        HPos = 64
    }

    public enum DataType
    {
        Byte,
        UByte,
        Int16,
        UInt16,
        Int32,
        UInt32,
        Int64,
        UInt64,
        Float,
        Double
    }


    [DataContract]
    public class IncrMeshData
    {
        [DataMember]
        public float[] positions { get; set; }

        [DataMember]
        public float[] colors { get; set; }

        [DataMember]
        public float[] normals { get; set; }

        [DataMember]
        public float[] uvs { get; set; }

        [DataMember]
        public float[] uvs2 { get; set; }

        [DataMember]
        public int[] indices { get; set; }

        [DataMember]
        public int[] matricesIndices { get; set; }

        [DataMember]
        public float[] matricesWeights { get; set; }

        [DataMember]
        public BabylonSubMesh[] subMeshes { get; set; }
    }


    [DataContract]
    public class AttrDesc
    {
        [DataMember]
        public int count;

        [DataMember]
        public int stride;

        [DataMember]
        public long offset;

        [DataMember]
        public DataType dataType;

        
        public AttrDesc()
        {
            count = 0;
            stride = 0;
            offset = 0;
            dataType = DataType.Float;
        }


        public AttrDesc(int _count, int _stride, long _offset, DataType _dataType)
        {
            count = _count;
            stride = _stride;
            offset = _offset;
            dataType = _dataType;
        }
    }


    [DataContract]
    public class BabylonLodMesh : BabylonMesh
    {
        [DataMember]
        public int lod { get; set; }

        [DataMember]
        public float distance { get; set; }

        [DataMember]
        public string delayLoadingFile { get; set; }

        [DataMember]
        public float[] boundingBoxMinimum { get; set; }

        [DataMember]
        public float[] boundingBoxMaximum { get; set; }

        [DataMember]
        public bool hasUVs { get; set; }

        [DataMember]
        public bool hasUVs2 { get; set; }

        [DataMember]
        public bool hasColors { get; set; }

        [DataMember]
        public bool hasMatricesIndices { get; set; }

        [DataMember]
        public bool hasMatricesWeights { get; set; }

        [DataMember]
        public AttrDesc positionsAttrDesc { get; set; }

        [DataMember]
        public AttrDesc colorsAttrDesc { get; set; }

        [DataMember]
        public AttrDesc normalsAttrDesc { get; set; }

        [DataMember]
        public AttrDesc uvsAttrDesc { get; set; }

        [DataMember]
        public AttrDesc uvs2AttrDesc { get; set; }

        [DataMember]
        public AttrDesc indicesAttrDesc { get; set; }

        [DataMember]
        public AttrDesc matricesIndicesAttrDesc { get; set; }

        [DataMember]
        public AttrDesc matricesWeightsAttrDesc { get; set; }

        [DataMember]
        public AttrDesc subMeshesAttrDesc { get; set; }

        [DataMember]
        public AttrDesc combinedAttrDesc { get; set; }

        [DataMember]
        public VertexAttributes vertexAttributes { get; set; }
        
        const string fileEXT = ".binarymesh.babylon";

        
        public BabylonLodMesh() : base()
        {
            lod = 0;
            distance = 0.0f;
            delayLoadingFile = "";

            positionsAttrDesc = new AttrDesc();
            colorsAttrDesc = new AttrDesc();
            normalsAttrDesc = new AttrDesc();
            uvsAttrDesc = new AttrDesc();
            uvs2AttrDesc = new AttrDesc();

            indicesAttrDesc = new AttrDesc();

            matricesIndicesAttrDesc = new AttrDesc();
            matricesWeightsAttrDesc = new AttrDesc();

            subMeshesAttrDesc = new AttrDesc();

            combinedAttrDesc = new AttrDesc();
            vertexAttributes = VertexAttributes.Undefined;
        }


        public void Convert(string srcPath, string dstPath, bool _combined = false, int _lod = 0, float _distance = 0.0f)
        {
            lod = _lod;
            distance = _distance;

            if (Path.GetExtension(delayLoadingFile).CompareTo(".babylonmeshdata") == 0)
                LoadMeshData(Path.Combine(srcPath, delayLoadingFile));

            if (string.IsNullOrEmpty(delayLoadingFile))
                //delayLoadingFile = name + fileEXT;
                delayLoadingFile = id + fileEXT;
            else
                delayLoadingFile = Path.GetFileNameWithoutExtension(delayLoadingFile) + fileEXT;

            
            string fullPath = Path.Combine(dstPath, delayLoadingFile);

            if (localMatrix == null)
                localMatrix = Matrix.Identity.ToArray();

            CalculateBoundingBox();

            if (!_combined)
                WriteMultipleBuffers(fullPath);

            else
                VertexBuffer(fullPath);
        }


        private void LoadMeshData(string srcFilename)
        {
            try
            {
                string filename = WebUtility.UrlDecode(srcFilename);

                IncrMeshData incrMeshData = JsonConvert.DeserializeObject<IncrMeshData>(File.ReadAllText(filename));

                positions = incrMeshData.positions;
                colors = incrMeshData.colors;
                normals = incrMeshData.normals;
                uvs = incrMeshData.uvs;
                uvs2 = incrMeshData.uvs2;
                indices = incrMeshData.indices;

                matricesIndices = incrMeshData.matricesIndices;
                matricesWeights = incrMeshData.matricesWeights;

                subMeshes = incrMeshData.subMeshes;
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine();
                Console.WriteLine(ex.Message);
                Console.ForegroundColor = ConsoleColor.DarkCyan;
                Console.WriteLine(ex);
                Console.ResetColor();
            }
        }
        
        
        private void WriteMultipleBuffers(string fullPath)
        {
            try
            {
                using (var stream = File.Open(WebUtility.UrlDecode(fullPath), FileMode.Create))
                {
                    BinaryWriter writer = new BinaryWriter(stream);

                    if (positions != null && positions.Length > 0)
                    {
                        positionsAttrDesc.count = positions.Length;
                        positionsAttrDesc.stride = 3;
                        positionsAttrDesc.offset = stream.Length;
                        positionsAttrDesc.dataType = DataType.Float;

                        for (int x = 0; x < positions.Length; x++)
                            writer.Write(positions[x]);

                        positions = null;
                    }

                    if (colors != null && colors.Length > 0)
                    {
                        colorsAttrDesc.count = colors.Length;
                        colorsAttrDesc.stride = 3;
                        colorsAttrDesc.offset = stream.Length;
                        colorsAttrDesc.dataType = DataType.Float;

                        for (int x = 0; x < colors.Length; x++)
                            writer.Write(colors[x]);

                        hasColors = true;

                        colors = null;
                    }

                    if (normals != null && normals.Length > 0)
                    {
                        normalsAttrDesc.count = normals.Length;
                        normalsAttrDesc.stride = 3;
                        normalsAttrDesc.offset = stream.Length;
                        normalsAttrDesc.dataType = DataType.Float;

                        for (int x = 0; x < normals.Length; x++)
                            writer.Write(normals[x]);

                        normals = null;
                    }

                    if (uvs != null && uvs.Length > 0)
                    {
                        uvsAttrDesc.count = uvs.Length;
                        uvsAttrDesc.stride = 2;
                        uvsAttrDesc.offset = stream.Length;
                        uvsAttrDesc.dataType = DataType.Float;

                        for (int x = 0; x < uvs.Length; x++)
                            writer.Write(uvs[x]);

                        hasUVs = true;

                        writer.Flush();

                        uvs = null;
                    }

                    if (uvs2 != null && uvs2.Length > 0)
                    {
                        uvs2AttrDesc.count = uvs2.Length;
                        uvs2AttrDesc.stride = 2;
                        uvs2AttrDesc.offset = stream.Length;
                        uvs2AttrDesc.dataType = DataType.Float;

                        for (int x = 0; x < uvs2.Length; x++)
                            writer.Write(uvs2[x]);

                        hasUVs2 = true;

                        writer.Flush();

                        uvs2 = null;
                    }

                    if (indices != null && indices.Length > 0)
                    {
                        indicesAttrDesc.count = indices.Length;
                        indicesAttrDesc.stride = 1;
                        indicesAttrDesc.offset = stream.Length;
                        indicesAttrDesc.dataType = DataType.Int32;

                        for (int x = 0; x < indices.Length; x++)
                            writer.Write(indices[x]);

                        indices = null;
                    }

                    if (matricesIndices != null && matricesIndices.Length > 0)
                    {
                        matricesIndicesAttrDesc.count = matricesIndices.Length;
                        matricesIndicesAttrDesc.stride = 1;
                        matricesIndicesAttrDesc.offset = stream.Length;
                        matricesIndicesAttrDesc.dataType = DataType.Int32;

                        for (int x = 0; x < matricesIndices.Length; x++)
                            writer.Write(matricesIndices[x]);

                        hasMatricesIndices = true;

                        matricesIndices = null;
                    }

                    if (matricesWeights != null && matricesWeights.Length > 0)
                    {
                        matricesWeightsAttrDesc.count = matricesWeights.Length;
                        matricesWeightsAttrDesc.stride = 2;
                        matricesWeightsAttrDesc.offset = stream.Length;
                        matricesWeightsAttrDesc.dataType = DataType.Float;

                        for (int x = 0; x < matricesWeights.Length; x++)
                            writer.Write(matricesWeights[x]);

                        hasMatricesWeights = true;

                        matricesWeights = null;
                    }

                    if(subMeshes != null && subMeshes.Length > 0)
                    {
                        subMeshesAttrDesc.count = subMeshes.Length;
                        subMeshesAttrDesc.stride = 5;
                        subMeshesAttrDesc.offset = stream.Length;
                        subMeshesAttrDesc.dataType = DataType.Int32;

                        int[] smData = new int[5];

                        for (int x = 0; x < subMeshes.Length; x++)
                        {
                            smData[0] = subMeshes[x].materialIndex;
                            smData[1] = subMeshes[x].verticesStart;
                            smData[2] = subMeshes[x].verticesCount;
                            smData[3] = subMeshes[x].indexStart;
                            smData[4] = subMeshes[x].indexCount;

                            for (int y = 0; y < smData.Length; y++)
                                writer.Write(smData[y]);
                        }

                        subMeshes = null;
                    }
                }
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine();
                Console.WriteLine(ex.Message);
                Console.ForegroundColor = ConsoleColor.DarkCyan;
                Console.WriteLine(ex);
                Console.ResetColor();
            }
        }

        
        private void VertexBuffer(string fullPath)
        {
            combinedAttrDesc.count = positions.Length;
            combinedAttrDesc.stride = 0;
            combinedAttrDesc.offset = 0;

            vertexAttributes = VertexAttributes.Undefined;


            if (positions != null && positions.Length > 0)
            {
                vertexAttributes |= VertexAttributes.Position;
                combinedAttrDesc.stride += 3;
            }

            if (colors != null && colors.Length > 0)
            {
                vertexAttributes |= VertexAttributes.Color;
                combinedAttrDesc.stride += 4;
            }

            if (normals != null && normals.Length > 0)
            {
                vertexAttributes |= VertexAttributes.Normal;
                combinedAttrDesc.stride += 3;
            }

            if (uvs != null && uvs.Length > 0)
            {
                vertexAttributes |= VertexAttributes.Uv1;
                combinedAttrDesc.stride += 2;
            }

            if (uvs2 != null && uvs2.Length > 0)
            {
                vertexAttributes |= VertexAttributes.Uv2;
                combinedAttrDesc.stride += 2;
            }

            
            List<float> data = new List<float>();

            using (var stream = File.Open(WebUtility.UrlDecode(fullPath), FileMode.Create))
            {
            }
        }


        private void CalculateBoundingBox()
        {
            Vector3 min = new Vector3(0.0f, 0.0f, 0.0f);
            Vector3 max = new Vector3(0.0f, 0.0f, 0.0f);

            if (positions != null && positions.Length > 0)
            {
                Vector3 src = new Vector3(positions[0], positions[1], positions[2]);
                min = src;
                max = src;

                for (int x = 3; x < positions.Length; x += 3)
                {
                    if (x + 2 < positions.Length)
                    {
                        src.X = positions[x + 0];
                        src.Y = positions[x + 1];
                        src.Z = positions[x + 2];

                        VecMin(src, ref min);
                        VecMax(src, ref max);
                    }
                }
            }

            boundingBoxMinimum = min.ToArray();
            boundingBoxMaximum = max.ToArray();
        }


        private void VecMin(Vector3 src, ref Vector3 dst)
        {
            if (src.X < dst.X)
                dst.X = src.X;

            if (src.Y < dst.Y)
                dst.Y = src.Y;

            if (src.Z < dst.Z)
                dst.Z = src.Z;
        }


        private void VecMax(Vector3 src, ref Vector3 dst)
        {
            if (src.X > dst.X)
                dst.X = src.X;

            if (src.Y > dst.Y)
                dst.Y = src.Y;

            if (src.Z > dst.Z)
                dst.Z = src.Z;
        }
    }
}
