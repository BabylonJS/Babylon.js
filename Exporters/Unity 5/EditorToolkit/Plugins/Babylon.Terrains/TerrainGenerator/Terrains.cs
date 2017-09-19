using System;
using System.Collections.Generic;
using UnityEngine;

namespace UnityEditor
{
    [System.Serializable]
    public class MeshData
    {
        public string name = string.Empty;
        public Vector3[] vertices;
        public int[] triangles;
        public Vector2[] uv;
        public Vector2[] uv2;
        public Vector3[] normals;
        public Vector4[] tangents;

        public void Clear()
        {
            this.vertices = (Vector3[])null;
            this.triangles = (int[])null;
            this.uv = (Vector2[])null;
            this.uv2 = (Vector2[])null;
            this.normals = (Vector3[])null;
            this.tangents = (Vector4[])null;
        }
    }

    [System.Serializable]
    public class TerrainInfo
    {
        public const int maxVertexCount = 65000;
        public int chunkCountHorizontal;
        public int chunkCountVertical;
        public int vertexCountHorizontal;
        public int vertexCountVertical;

        public TerrainInfo()
        {
            this.chunkCountHorizontal = 1;
            this.chunkCountVertical = 1;
            this.vertexCountHorizontal = 33;
            this.vertexCountVertical = 33;
        }

        public int GetChunkCount()
        {
            if (this.chunkCountHorizontal < 1)
                this.chunkCountHorizontal = 1;
            if (this.chunkCountVertical < 1)
                this.chunkCountVertical = 1;
            return this.chunkCountHorizontal * this.chunkCountVertical;
        }

        public int GetVertexCountPerChunk()
        {
            return this.vertexCountHorizontal * this.vertexCountVertical;
        }

        public int GetVertexCountTotal()
        {
            return this.GetChunkCount() * this.GetVertexCountPerChunk();
        }

        public int GetTriangleCountPerChunk()
        {
            return (this.vertexCountHorizontal - 1) * (this.vertexCountVertical - 1) * 2;
        }

        public int GetTriangleCountTotal()
        {
            return this.GetChunkCount() * this.GetTriangleCountPerChunk();
        }
    }

    public static class TerrainGenerator
    {
        private static Terrain terrain;

        private static TerrainInfo terrainConvertInfo;

        public static Mesh[] ConvertTerrain(Terrain _terrain, TerrainInfo _terrainConvertInfo)
        {
            if (_terrain == null)
            {
                Debug.LogWarning("[Terrain Generator]: Can not convert 'Terrain' is null.\n");
                return null;
            }
            if (_terrainConvertInfo == null)
            {
                _terrainConvertInfo = new TerrainInfo();
            }
            if (_terrainConvertInfo.chunkCountHorizontal < 1)
            {
                _terrainConvertInfo.chunkCountHorizontal = 1;
            }
            if (_terrainConvertInfo.chunkCountVertical < 1)
            {
                _terrainConvertInfo.chunkCountVertical = 1;
            }
            if (_terrainConvertInfo.vertexCountHorizontal < 2)
            {
                _terrainConvertInfo.vertexCountHorizontal = 2;
            }
            if (_terrainConvertInfo.vertexCountVertical < 2)
            {
                _terrainConvertInfo.vertexCountVertical = 2;
            }
            if (_terrainConvertInfo.GetVertexCountPerChunk() > 65000)
            {
                Debug.LogWarning("[Terrain Generator]: Mesh vertex count limit exceeded.\nUnity mesh can have maximum 65.000 vertices.\n");
                return null;
            }
            Vector3 position = _terrain.transform.position;
            Quaternion rotation = _terrain.transform.rotation;
            Vector3 localScale = _terrain.transform.localScale;
            TerrainGenerator.terrain = _terrain;
            TerrainGenerator.terrain.transform.position = Vector3.zero;
            TerrainGenerator.terrain.transform.rotation = Quaternion.identity;
            TerrainGenerator.terrain.transform.localScale = Vector3.one;
            TerrainGenerator.terrainConvertInfo = _terrainConvertInfo;
            Mesh[] array;
            if (TerrainGenerator.terrainConvertInfo.chunkCountHorizontal * TerrainGenerator.terrainConvertInfo.chunkCountVertical == 1)
            {
                array = new Mesh[] { TerrainGenerator.GenerateTerrainMesh() };
            }
            else
            {
                MeshData[] array2 = null;
                TerrainGenerator.GenerateTerrainBaseChunks(ref array2);
                array = new Mesh[array2.Length];
                int num = -1;
                for (int i = 0; i < TerrainGenerator.terrainConvertInfo.chunkCountHorizontal; i++)
                {
                    for (int j = 0; j < TerrainGenerator.terrainConvertInfo.chunkCountVertical; j++)
                    {
                        float num2 = TerrainGenerator.terrain.terrainData.size.x / (float)TerrainGenerator.terrainConvertInfo.chunkCountHorizontal;
                        float chunkH_StartOffset = (float)i * num2;
                        float num3 = TerrainGenerator.terrain.terrainData.size.z / (float)TerrainGenerator.terrainConvertInfo.chunkCountVertical;
                        float chunkV_StartOffset = (float)j * num3;

                        num++;
                        array[num] = TerrainGenerator.GenerateTerrainMainChunks(ref array2[num], num2, chunkH_StartOffset, num3, chunkV_StartOffset);
                        array[num].RecalculateBounds();
                    }
                }
            }
            _terrain.transform.position = position;
            _terrain.transform.rotation = rotation;
            _terrain.transform.localScale = localScale;
            return array;
        }

        private static void GenerateTerrainBaseChunks(ref MeshData[] _preMeshes)
        {
            _preMeshes = new MeshData[TerrainGenerator.terrainConvertInfo.chunkCountHorizontal * TerrainGenerator.terrainConvertInfo.chunkCountVertical];
            TerrainData terrainData = TerrainGenerator.terrain.terrainData;
            int num = TerrainGenerator.terrainConvertInfo.vertexCountVertical - 1;
            int num2 = TerrainGenerator.terrainConvertInfo.vertexCountHorizontal - 1;
            if (num < 1)
            {
                num = 1;
            }
            if (num2 < 1)
            {
                num2 = 1;
            }
            int num3 = -1;
            for (int i = 0; i < TerrainGenerator.terrainConvertInfo.chunkCountHorizontal; i++)
            {
                for (int j = 0; j < TerrainGenerator.terrainConvertInfo.chunkCountVertical; j++)
                {
                    float num4 = TerrainGenerator.terrain.terrainData.size.x / (float)TerrainGenerator.terrainConvertInfo.chunkCountHorizontal;
                    float num5 = (float)i * num4;
                    float num6 = TerrainGenerator.terrain.terrainData.size.z / (float)TerrainGenerator.terrainConvertInfo.chunkCountVertical;
                    float num7 = (float)j * num6;
                    float num8 = num4 / (float)num2;
                    float num9 = num6 / (float)num;
                    int num10 = num + 1 + 2;
                    int num11 = num2 + 1 + 2;
                    List<Vector3> list = new List<Vector3>(num11 * num10);
                    List<int> list2 = new List<int>((num + 2) * (num2 + 2) * 2 * 3);
                    Vector2[] array = new Vector2[num11 * num10];
                    int num12 = -1;
                    for (int k = 0; k < num10; k++)
                    {
                        for (int l = 0; l < num11; l++)
                        {
                            Vector3 vector = new Vector3(num5 + (float)l * num8 - num8, 0f, num7 + (float)k * num9 - num9);
                            vector.y = TerrainGenerator.terrain.SampleHeight(vector);
                            num12++;
                            list.Add(vector);
                            array[num12] = new Vector2(Mathf.Clamp01(vector.x / terrainData.size.x), Mathf.Clamp01(vector.z / terrainData.size.z));
                        }
                    }
                    int num13 = 0;
                    num12 = -1;
                    for (int m = 0; m < num + 2; m++)
                    {
                        int num14 = m * num11;
                        num13 += num11;
                        for (int n = 0; n < num2 + 2; n++)
                        {
                            list2.Add(num14 + n);
                            list2.Add(num13 + n);
                            list2.Add(num13 + n + 1);
                            list2.Add(num14 + n + 1);
                            list2.Add(num14 + n);
                            list2.Add(num13 + n + 1);
                            num12 += 6;
                        }
                    }
                    _preMeshes[++num3] = new MeshData();
                    _preMeshes[num3].name = TerrainGenerator.terrain.gameObject.name + string.Format("_x{0}_y{1}", i, j);
                    _preMeshes[num3].vertices = list.ToArray();
                    _preMeshes[num3].triangles = list2.ToArray();
                    _preMeshes[num3].uv = array;
                    _preMeshes[num3].uv2 = array;
                    TerrainGenerator.GenerateTerrainNormals(_preMeshes[num3].vertices, _preMeshes[num3].triangles, out _preMeshes[num3].normals);
                    TerrainGenerator.GenerateTerrainTangents(_preMeshes[num3].vertices, _preMeshes[num3].triangles, _preMeshes[num3].normals, _preMeshes[num3].uv, out _preMeshes[num3].tangents);
                }
            }
        }

        private static Mesh GenerateTerrainMainChunks(ref MeshData _preMesh, float _chunkH_Width, float _chunkH_StartOffset, float _chunkV_Length, float _chunkV_StartOffset)
        {
            int arg_1B_0 = TerrainGenerator.terrainConvertInfo.vertexCountVertical - 1;
            int num = TerrainGenerator.terrainConvertInfo.vertexCountHorizontal - 1;
            if (num < 1)
            {
            }
            List<Vector3> list = new List<Vector3>(_preMesh.vertices);
            List<int> list2 = new List<int>();
            list2 = new List<int>(_preMesh.triangles);
            list = new List<Vector3>(_preMesh.vertices);
            int[] array = new int[2 * TerrainGenerator.terrainConvertInfo.vertexCountHorizontal + 2 * TerrainGenerator.terrainConvertInfo.vertexCountVertical + 4];
            int num2 = 0;
            for (int i = 0; i < TerrainGenerator.terrainConvertInfo.vertexCountHorizontal + 2; i++)
            {
                array[num2++] = i;
            }
            int num3 = TerrainGenerator.terrainConvertInfo.vertexCountHorizontal + 1;
            for (int j = 0; j < TerrainGenerator.terrainConvertInfo.vertexCountVertical; j++)
            {
                num3++;
                array[num2++] = num3;
                num3 += TerrainGenerator.terrainConvertInfo.vertexCountHorizontal + 1;
                array[num2++] = num3;
            }
            for (int k = 1; k < TerrainGenerator.terrainConvertInfo.vertexCountHorizontal + 3; k++)
            {
                array[num2++] = num3 + k;
            }
            int[] array2 = new int[4 * (TerrainGenerator.terrainConvertInfo.vertexCountHorizontal - 1) + 4 * (TerrainGenerator.terrainConvertInfo.vertexCountVertical - 1) + 8];
            num2 = 0;
            num3 = 0;
            for (int l = 0; l < TerrainGenerator.terrainConvertInfo.vertexCountHorizontal + 1; l++)
            {
                array2[num2++] = num3++;
                array2[num2++] = num3++;
            }
            for (int m = 0; m < TerrainGenerator.terrainConvertInfo.vertexCountVertical - 1; m++)
            {
                array2[num2++] = num3++;
                array2[num2++] = num3++;
                num3 += 2 * (TerrainGenerator.terrainConvertInfo.vertexCountHorizontal - 1);
                array2[num2++] = num3++;
                array2[num2++] = num3++;
            }
            for (int n = 0; n < TerrainGenerator.terrainConvertInfo.vertexCountHorizontal + 1; n++)
            {
                array2[num2++] = num3++;
                array2[num2++] = num3++;
            }
            for (int num4 = array2.Length - 1; num4 >= 0; num4--)
            {
                int num5 = array2[num4];
                list2.RemoveAt(num5 * 3 + 2);
                list2.RemoveAt(num5 * 3 + 1);
                list2.RemoveAt(num5 * 3);
            }
            int num6 = TerrainGenerator.terrainConvertInfo.vertexCountHorizontal + 3;
            int num7 = -1;
            for (int num8 = 0; num8 < TerrainGenerator.terrainConvertInfo.vertexCountVertical - 1; num8++)
            {
                for (int num9 = 0; num9 < TerrainGenerator.terrainConvertInfo.vertexCountHorizontal - 1; num9++)
                {
                    List<int> list3 = list2;
                    int index;
                    num7 = (index = num7 + 1);
                    list3[index] -= num6;
                    int num10 = list2[num7];
                    list2[++num7] = num10 + TerrainGenerator.terrainConvertInfo.vertexCountHorizontal;
                    list2[++num7] = num10 + TerrainGenerator.terrainConvertInfo.vertexCountHorizontal + 1;
                    list2[++num7] = num10 + 1;
                    list2[++num7] = num10;
                    list2[++num7] = num10 + TerrainGenerator.terrainConvertInfo.vertexCountHorizontal + 1;
                }
                num6 += 2;
            }
            List<Vector2> list4 = new List<Vector2>(_preMesh.uv);
            List<Vector2> list5 = new List<Vector2>(_preMesh.uv2);
            List<Vector3> list6 = new List<Vector3>(_preMesh.normals);
            List<Vector4> list7 = new List<Vector4>(_preMesh.tangents);
            for (int num11 = array.Length - 1; num11 >= 0; num11--)
            {
                list.RemoveAt(array[num11]);
            }
            for (int num12 = array.Length - 1; num12 >= 0; num12--)
            {
                list4.RemoveAt(array[num12]);
            }
            for (int num13 = array.Length - 1; num13 >= 0; num13--)
            {
                list5.RemoveAt(array[num13]);
            }
            for (int num14 = array.Length - 1; num14 >= 0; num14--)
            {
                list6.RemoveAt(array[num14]);
            }
            for (int num15 = array.Length - 1; num15 >= 0; num15--)
            {
                list7.RemoveAt(array[num15]);
            }
            _preMesh.Clear();
            Mesh expr_445 = new Mesh();
            expr_445.name = _preMesh.name;
            expr_445.vertices = list.ToArray();
            expr_445.triangles = list2.ToArray();
            expr_445.uv = list4.ToArray();
            expr_445.uv2 = list5.ToArray();
            expr_445.normals = list6.ToArray();
            expr_445.tangents = list7.ToArray();
            return expr_445;
        }

        private static Mesh GenerateTerrainMesh()
        {
            TerrainData terrainData = TerrainGenerator.terrain.terrainData;
            int num = TerrainGenerator.terrainConvertInfo.vertexCountVertical - 1;
            int num2 = TerrainGenerator.terrainConvertInfo.vertexCountHorizontal - 1;
            if (num < 1)
            {
                num = 1;
            }
            if (num2 < 1)
            {
                num2 = 1;
            }
            float arg_4A_0 = terrainData.size.x;
            float z = terrainData.size.z;
            float num3 = arg_4A_0 / (float)num2;
            float num4 = z / (float)num;
            int num5 = num + 1;
            int num6 = num2 + 1;
            Vector3[] array = new Vector3[num6 * num5];
            int[] array2 = new int[num * num2 * 2 * 3];
            Vector2[] array3 = new Vector2[num6 * num5];
            int num7 = -1;
            for (int i = 0; i < num5; i++)
            {
                for (int j = 0; j < num6; j++)
                {
                    Vector3 vector = new Vector3((float)j * num3, 0f, (float)i * num4);
                    vector.y = TerrainGenerator.terrain.SampleHeight(vector);
                    array[++num7] = vector;
                    array3[num7] = new Vector2(Mathf.Clamp01(vector.x / terrainData.size.x), Mathf.Clamp01(vector.z / terrainData.size.z));
                }
            }
            int num8 = 0;
            num7 = -1;
            for (int k = 0; k < num; k++)
            {
                int num9 = k * num6;
                num8 += num6;
                for (int l = 0; l < num2; l++)
                {
                    array2[++num7] = num9 + l;
                    array2[++num7] = num8 + l;
                    array2[++num7] = num8 + l + 1;
                    array2[++num7] = num9 + l + 1;
                    array2[++num7] = num9 + l;
                    array2[++num7] = num8 + l + 1;
                }
            }
            Mesh expr_1CC = new Mesh();
            expr_1CC.name = TerrainGenerator.terrain.gameObject.name;
            expr_1CC.hideFlags = (HideFlags)61;
            expr_1CC.vertices = array;
            expr_1CC.triangles = array2;
            expr_1CC.RecalculateBounds();
            expr_1CC.uv = array3;
            expr_1CC.uv2 = array3;
            expr_1CC.RecalculateNormals();
            Vector3[] normals = expr_1CC.normals;
            Vector4[] tangents = null;
            TerrainGenerator.GenerateTerrainTangents(array, array2, normals, array3, out tangents);
            expr_1CC.tangents = tangents;
            return expr_1CC;
        }

        private static void GenerateTerrainNormals(Vector3[] _vertices, int[] _trinagles, out Vector3[] _normals)
        {
            _normals = new Vector3[_vertices.Length];
            List<List<Vector3>> list = new List<List<Vector3>>();
            for (int i = 0; i < _vertices.Length; i++)
            {
                list.Add(new List<Vector3>());
            }
            for (int j = 0; j < _trinagles.Length; j += 3)
            {
                Vector3 vector = _vertices[_trinagles[j]];
                Vector3 vector2 = _vertices[_trinagles[j + 1]];
                Vector3 arg_5A_0 = _vertices[_trinagles[j + 2]];
                Vector3 vector3 = vector2 - vector;
                Vector3 vector4 = arg_5A_0 - vector;
                Vector3 item = Vector3.Cross(vector3, vector4);
                item.Normalize();
                list[_trinagles[j]].Add(item);
                list[_trinagles[j + 1]].Add(item);
                list[_trinagles[j + 2]].Add(item);
            }
            for (int k = 0; k < _vertices.Length; k++)
            {
                Vector3 vector5 = Vector3.zero;
                for (int l = 0; l < list[k].Count; l++)
                {
                    vector5 += list[k][l];
                }
                _normals[k] = vector5 / (float)list[k].Count;
            }
        }

        private static void GenerateTerrainTangents(Vector3[] _vertices, int[] _triangles, Vector3[] _normals, Vector2[] _texcoords, out Vector4[] _tangents)
        {
            int num = _vertices.Length;
            int num2 = _triangles.Length / 3;
            _tangents = new Vector4[num];
            Vector3[] array = new Vector3[num];
            Vector3[] array2 = new Vector3[num];
            int num3 = 0;
            for (int i = 0; i < num2; i++)
            {
                int num4 = _triangles[num3];
                int num5 = _triangles[num3 + 1];
                int num6 = _triangles[num3 + 2];
                Vector3 vector = _vertices[num4];
                Vector3 arg_7C_0 = _vertices[num5];
                Vector3 vector2 = _vertices[num6];
                Vector2 vector3 = _texcoords[num4];
                Vector2 vector4 = _texcoords[num5];
                Vector2 vector5 = _texcoords[num6];
                float num7 = arg_7C_0.x - vector.x;
                float num8 = vector2.x - vector.x;
                float num9 = arg_7C_0.y - vector.y;
                float num10 = vector2.y - vector.y;
                float num11 = arg_7C_0.z - vector.z;
                float num12 = vector2.z - vector.z;
                float num13 = vector4.x - vector3.x;
                float num14 = vector5.x - vector3.x;
                float num15 = vector4.y - vector3.y;
                float num16 = vector5.y - vector3.y;
                float num17 = 0.0001f;
                if (num13 * num16 - num14 * num15 != 0f)
                {
                    num17 = 1f / (num13 * num16 - num14 * num15);
                }
                Vector3 vector6 = new Vector3((num16 * num7 - num15 * num8) * num17, (num16 * num9 - num15 * num10) * num17, (num16 * num11 - num15 * num12) * num17);
                Vector3 vector7 = new Vector3((num13 * num8 - num14 * num7) * num17, (num13 * num10 - num14 * num9) * num17, (num13 * num12 - num14 * num11) * num17);
                array[num4] += vector6;
                array[num5] += vector6;
                array[num6] += vector6;
                array2[num4] += vector7;
                array2[num5] += vector7;
                array2[num6] += vector7;
                num3 += 3;
            }
            for (int j = 0; j < num; j++)
            {
                Vector3 vector8 = _normals[j];
                Vector3 vector9 = array[j];
                Vector3.OrthoNormalize(ref vector8, ref vector9);
                _tangents[j].x = vector9.x;
                _tangents[j].y = vector9.y;
                _tangents[j].z = vector9.z;
                _tangents[j].w = ((Vector3.Dot(Vector3.Cross(vector8, vector9), array2[j]) < 0f) ? -1f : 1f);
            }
        }
    }
}
