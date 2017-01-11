using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Reflection;
using System.Diagnostics;
using System.Collections.Generic;
using Microsoft.Ajax.Utilities;
using UnityEngine;
using UnityEditor;

using JsonFx.Json;
using JsonFx.Json.Resolvers;
using JsonFx.Serialization;
using JsonFx.Serialization.Resolvers;
using BabylonExport.Entities;

namespace Unity3D2Babylon
{
    public static class Tools
    {
        public static BindingFlags FullBinding = BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.Static | BindingFlags.GetField | BindingFlags.SetField | BindingFlags.GetProperty | BindingFlags.SetProperty;
        
        public static float[] ToFloat(this Color color)
        {
            var result = new float[4];
            result[0] = color.r;
            result[1] = color.g;
            result[2] = color.b;
            result[3] = color.a;

            return result;
        }

        public static float[] ToFloat(this Vector3 vector3)
        {
            var result = new float[3];
            result[0] = vector3.x;
            result[1] = vector3.y;
            result[2] = vector3.z;

            return result;
        }

        public static float[] ToFloat(this Vector4 vector4)
        {
            var result = new float[4];
            result[0] = vector4.x;
            result[1] = vector4.y;
            result[2] = vector4.z;
            result[3] = vector4.w;

            return result;
        }

        public static float[] ToFloat(this SerializableVector3 vector3)
        {
            var result = new float[3];
            result[0] = vector3.X;
            result[1] = vector3.Y;
            result[2] = vector3.Z;

            return result;
        }

        public static float[] ToFloat(this Quaternion quaternion)
        {
            var result = new float[4];
            result[0] = quaternion.x;
            result[1] = quaternion.y;
            result[2] = quaternion.z;
            result[3] = quaternion.w;

            return result;
        }

        public static Texture2D BlurImage(Texture2D image, int blurSize)
        {
            Texture2D blurred = new Texture2D(image.width, image.height);



            blurred.Apply();
            return blurred;
        }

        public static string FirstUpper(this string value)
        {
            string result = value;
            if (!String.IsNullOrEmpty(value))
            {
                result = char.ToUpper(result[0]) + result.Substring(1);
            }
            return result;
        }

        public static string FirstLower(this string value)
        {
            string result = value;
            if (!String.IsNullOrEmpty(value))
            {
                result = char.ToLower(result[0]) + result.Substring(1);
            }
            return result;
        }

        public static void CopyTo(this Stream source, Stream destination, bool finalFlush = false, int bufferSize = 4096, long maxCount = -1)
        {
            byte[] buffer = new byte[bufferSize];
            long totalBytesWritten = 0;
            while (true)
            {
                int count = buffer.Length;
                if (maxCount > 0)
                {
                    if (totalBytesWritten > maxCount - count)
                    {
                        count = (int)(maxCount - totalBytesWritten);
                        if (count <= 0)
                        {
                            break;
                        }
                    }
                }
                int read = source.Read(buffer, 0, count);
                if (read <= 0)
                {
                    break;
                }
                destination.Write(buffer, 0, read);
                totalBytesWritten += read;
            }
            if (finalFlush)
            {
                try { destination.Flush(); } catch { }
            }
        }

        public static string LoadTextAsset(string filename)
        {
            string apath = Application.dataPath.Replace("/Assets", "");
            string asset = Path.Combine(apath, filename);
            return File.ReadAllText(asset);
        }

        public static List<Texture> GetTextures(this Material source)
        {
            Shader shader = source.shader;
            List<Texture> materials = new List<Texture>();
            for (int i = 0; i < ShaderUtil.GetPropertyCount(shader); i++)
            {
                if (ShaderUtil.GetPropertyType(shader, i) == ShaderUtil.ShaderPropertyType.TexEnv)
                {
                    materials.Add(source.GetTexture(ShaderUtil.GetPropertyName(shader, i)));
                }
            }
            return materials;
        }

        public static List<string> GetTextureNames(this Material source)
        {
            Shader shader = source.shader;
            List<string> names = new List<string>();
            for (int i = 0; i < ShaderUtil.GetPropertyCount(shader); i++)
            {
                if (ShaderUtil.GetPropertyType(shader, i) == ShaderUtil.ShaderPropertyType.TexEnv)
                {
                    names.Add(ShaderUtil.GetPropertyName(shader, i));
                }
            }
            return names;
        }

        public static List<string> GetFloatNames(this Material source)
        {
            Shader shader = source.shader;
            List<string> names = new List<string>();
            for (int i = 0; i < ShaderUtil.GetPropertyCount(shader); i++)
            {
                if (ShaderUtil.GetPropertyType(shader, i) == ShaderUtil.ShaderPropertyType.Float)
                {
                    names.Add(ShaderUtil.GetPropertyName(shader, i));
                }
            }
            return names;
        }

        public static List<string> GetRangeNames(this Material source)
        {
            Shader shader = source.shader;
            List<string> names = new List<string>();
            for (int i = 0; i < ShaderUtil.GetPropertyCount(shader); i++)
            {
                if (ShaderUtil.GetPropertyType(shader, i) == ShaderUtil.ShaderPropertyType.Range)
                {
                    names.Add(ShaderUtil.GetPropertyName(shader, i));
                }
            }
            return names;
        }

        public static List<string> GetColorNames(this Material source)
        {
            Shader shader = source.shader;
            List<string> names = new List<string>();
            for (int i = 0; i < ShaderUtil.GetPropertyCount(shader); i++)
            {
                if (ShaderUtil.GetPropertyType(shader, i) == ShaderUtil.ShaderPropertyType.Color)
                {
                    names.Add(ShaderUtil.GetPropertyName(shader, i));
                }
            }
            return names;
        }

        public static List<string> GetVectorNames(this Material source)
        {
            Shader shader = source.shader;
            List<string> names = new List<string>();
            for (int i = 0; i < ShaderUtil.GetPropertyCount(shader); i++)
            {
                if (ShaderUtil.GetPropertyType(shader, i) == ShaderUtil.ShaderPropertyType.Vector)
                {
                    names.Add(ShaderUtil.GetPropertyName(shader, i));
                }
            }
            return names;
        }

        public static object GetInstanceField(Type type, object instance, string fieldName)
        {
            BindingFlags bindFlags = BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Static | BindingFlags.GetField | BindingFlags.GetProperty;
            FieldInfo field = type.GetField(fieldName, bindFlags);
            return field.GetValue(instance);
        }

        public static void EnableRemoteCertificates()
        {
            System.Net.ServicePointManager.ServerCertificateValidationCallback = new System.Net.Security.RemoteCertificateValidationCallback(delegate { return true; });
        }

        public static bool DownloadFile(string url, string dest)
        {
            bool result = false;
            string tempfile = Path.GetTempFileName();
            try
            {
                using (var webClient = new System.Net.WebClient())
                {
                    webClient.DownloadFile(url, tempfile);
                }
            }
            catch (System.Exception ex)
            {
                string msg = System.String.Format("Failed to download: {0} - {1}", url, ex.Message);
                UnityEngine.Debug.LogWarning(msg);
            }
            finally
            {
                FileInfo info = new FileInfo(tempfile);
                result = (info.Exists && info.Length > 0);
                if (result == true)
                {
                    File.Copy(tempfile, dest, true);
                }
                try { info.Delete(); } catch { }
            }
            return result;
        }

        public static BabylonSceneController GetSceneController()
        {
            BabylonSceneController result = null;
            var gameObjects = UnityEngine.Object.FindObjectsOfType<GameObject>();
            if (gameObjects != null && gameObjects.Length > 0)
            {
                foreach (var gameObject in gameObjects)
                {
                    var controller = gameObject.GetComponent<BabylonSceneController>();
                    if (controller != null)
                    {
                        result = controller;
                        break;
                    }
                }
            }
            return result;
        }

        public static string FormatBase64(string text)
        {
            return Convert.ToBase64String(Encoding.UTF8.GetBytes(text));
        }

        public static string FormatSafePath(string path)
        {
            return path.Replace("\\", "/");
        }

        public static string MakeRelativePath(string filePath, string referencePath)
        {
            var fileUri = new Uri(filePath);
            var referenceUri = new Uri(referencePath);
            return referenceUri.MakeRelativeUri(fileUri).ToString();
        }

        public static string MinifyJavascriptCode(string script)
        {
            var minifier = new Minifier();
            var settings = new CodeSettings();
            settings.EvalTreatment = EvalTreatment.MakeAllSafe;
            string min_script = minifier.MinifyJavaScript(script, settings);
            if (minifier.Errors.Count > 0)
            {
                foreach (string error in minifier.Errors)
                {
                    if (!String.IsNullOrEmpty(error))
                    {
                        UnityEngine.Debug.LogError("Javascript Minifier: " + error);
                    }
                }
            }
            return min_script;
        }

        public static List<I> FindObjectsOfInterface<I>() where I : class
        {
            MonoBehaviour[] monoBehaviours = UnityEngine.Object.FindObjectsOfType<MonoBehaviour>();
            List<I> list = new List<I>();

            foreach (MonoBehaviour behaviour in monoBehaviours)
            {

                I component = behaviour.GetComponent(typeof(I)) as I;

                if (component != null)
                {
                    list.Add(component);
                }
            }

            return list;
        }

        public static T[] GetAssetsOfType<T>(string fileExtension) where T : UnityEngine.Object
        {
            List<T> tempObjects = new List<T>();
            DirectoryInfo directory = new DirectoryInfo(Application.dataPath);
            FileInfo[] goFileInfo = directory.GetFiles("*" + fileExtension, SearchOption.AllDirectories);

            int i = 0; int goFileInfoLength = goFileInfo.Length;
            FileInfo tempGoFileInfo; string tempFilePath;
            T tempGO;
            for (; i < goFileInfoLength; i++)
            {
                tempGoFileInfo = goFileInfo[i];
                if (tempGoFileInfo == null)
                    continue;

                tempFilePath = tempGoFileInfo.FullName;
                tempFilePath = tempFilePath.Replace(@"\", "/").Replace(Application.dataPath, "Assets");
                tempGO = AssetDatabase.LoadAssetAtPath(tempFilePath, typeof(T)) as T;
                if (tempGO == null)
                {
                    continue;
                }
                else if (!(tempGO is T))
                {
                    continue;
                }

                tempObjects.Add(tempGO);
            }

            return tempObjects.ToArray();
        }

        public static T GetReflectionField<T>(object source, string name)
        {
            object result = null;
            var field = source.GetType().GetField(name, Tools.FullBinding);
            if (field != null)
            {
                result = field.GetValue(source);
            }
            return (T)result;
        }

        public static T GetReflectionProperty<T>(object source, string name)
        {
            object result = null;
            var property = source.GetType().GetProperty(name, Tools.FullBinding);
            if (property != null)
            {
                result = property.GetGetMethod(true).Invoke(source, null);
            }
            return (T)result;
        }

        public static void SetReflectionField(object source, string name, object value)
        {
            var field = source.GetType().GetField(name, Tools.FullBinding);
            if (field != null)
            {
                field.SetValue(source, value);
            }
        }

        public static void SetReflectionProperty(object source, string name, object value)
        {
            var property = source.GetType().GetProperty(name, Tools.FullBinding);
            if (property != null)
            {
                property.GetSetMethod(true).Invoke(source, new object[] { value });
            }
        }

        public static void CallReflectionMethod(object source, string method, params object[] args)
        {
            Tools.CallReflectionMethod<object>(source, method, args);
        }

        public static T CallReflectionMethod<T>(object source, string method, params object[] args)
        {
            object result = null;
            var caller = source.GetType().GetMethod(method, Tools.FullBinding);
            if (caller != null)
            {
                result = caller.Invoke(source, args);
            }
            return (T)result;
        }

        public static T GetStaticReflectionField<T>(Type type, string name)
        {
            object result = null;
            var field = type.GetField(name, Tools.FullBinding);
            if (field != null)
            {
                result = field.GetValue(null);
            }
            return (T)result;
        }
        public static T GetStaticReflectionProperty<T>(Type type, string name)
        {
            object result = null;
            var property = type.GetProperty(name, Tools.FullBinding);
            if (property != null)
            {
                result = property.GetGetMethod(true).Invoke(null, null);
            }
            return (T)result;
        }

        public static void SetStaticReflectionField(Type type, string name, object value)
        {
            var field = type.GetField(name, Tools.FullBinding);
            if (field != null)
            {
                field.SetValue(null, value);
            }
        }

        public static void SetStaticReflectionProperty(Type type, string name, object value)
        {
            var property = type.GetProperty(name, Tools.FullBinding);
            if (property != null)
            {
                property.GetSetMethod(true).Invoke(null, new object[] { value });
            }
        }

        public static void CallStaticReflectionMethod(Type type, string method, params object[] args)
        {
            Tools.CallStaticReflectionMethod<object>(type, method, args);
        }

        public static T CallStaticReflectionMethod<T>(Type type, string method, params object[] args)
        {
            object result = null;
            var caller = type.GetMethod(method, Tools.FullBinding);
            if (caller != null)
            {
                result = caller.Invoke(null, args);
            }
            return (T)result;
        }

        public static Type GetTypeFromAllAssemblies(string typeName)
        {
            Assembly[] assemblies = System.AppDomain.CurrentDomain.GetAssemblies();
            foreach (Assembly assembly in assemblies)
            {
                Type[] types = assembly.GetTypes();
                foreach (Type type in types)
                {
                    if (type.Name.Equals(typeName, StringComparison.CurrentCultureIgnoreCase) || type.Name.Contains('+' + typeName)) //+ check for inline classes
                        return type;
                }
            }
            return null;
        }

        public static Mesh CreateBoxMesh(float x = 1f, float y = 1f, float z = 1f)
        {
            Mesh result = new Mesh();
            float length = x;
            float width = y;
            float height = z;

            // Vertices
            Vector3 p0 = new Vector3(-length * .5f, -width * .5f, height * .5f);
            Vector3 p1 = new Vector3(length * .5f, -width * .5f, height * .5f);
            Vector3 p2 = new Vector3(length * .5f, -width * .5f, -height * .5f);
            Vector3 p3 = new Vector3(-length * .5f, -width * .5f, -height * .5f);
            Vector3 p4 = new Vector3(-length * .5f, width * .5f, height * .5f);
            Vector3 p5 = new Vector3(length * .5f, width * .5f, height * .5f);
            Vector3 p6 = new Vector3(length * .5f, width * .5f, -height * .5f);
            Vector3 p7 = new Vector3(-length * .5f, width * .5f, -height * .5f);
            Vector3[] vertices = new Vector3[] {
                // Bottom
                p0, p1, p2, p3,
                // Left
                p7, p4, p0, p3,
                // Front
                p4, p5, p1, p0,
                // Back
                p6, p7, p3, p2,
                // Right
                p5, p6, p2, p1,
                // Top
                p7, p6, p5, p4
            };

            // Normales
            Vector3 up = Vector3.up;
            Vector3 down = Vector3.down;
            Vector3 front = Vector3.forward;
            Vector3 back = Vector3.back;
            Vector3 left = Vector3.left;
            Vector3 right = Vector3.right;
            Vector3[] normales = new Vector3[] {
                // Bottom
                down, down, down, down,
                // Left
                left, left, left, left,
                // Front
                front, front, front, front,
                // Back
                back, back, back, back,
                // Right
                right, right, right, right,
                // Top
                up, up, up, up
            };

            // UVs
            Vector2 _00 = new Vector2(0f, 0f);
            Vector2 _10 = new Vector2(1f, 0f);
            Vector2 _01 = new Vector2(0f, 1f);
            Vector2 _11 = new Vector2(1f, 1f);
            Vector2[] uvs = new Vector2[] {
                // Bottom
                _11, _01, _00, _10,
                // Left
                _11, _01, _00, _10,
                // Front
                _11, _01, _00, _10,
                // Back
                _11, _01, _00, _10,
                // Right
                _11, _01, _00, _10,
                // Top
                _11, _01, _00, _10,
            };

            // Triangles
            int[] triangles = new int[] {
                // Bottom
                3, 1, 0,
                3, 2, 1,			
                // Left
                3 + 4 * 1, 1 + 4 * 1, 0 + 4 * 1,
                3 + 4 * 1, 2 + 4 * 1, 1 + 4 * 1,
                // Front
                3 + 4 * 2, 1 + 4 * 2, 0 + 4 * 2,
                3 + 4 * 2, 2 + 4 * 2, 1 + 4 * 2,
                // Back
                3 + 4 * 3, 1 + 4 * 3, 0 + 4 * 3,
                3 + 4 * 3, 2 + 4 * 3, 1 + 4 * 3,
                // Right
                3 + 4 * 4, 1 + 4 * 4, 0 + 4 * 4,
                3 + 4 * 4, 2 + 4 * 4, 1 + 4 * 4,
                // Top
                3 + 4 * 5, 1 + 4 * 5, 0 + 4 * 5,
                3 + 4 * 5, 2 + 4 * 5, 1 + 4 * 5,
            };
            // Mesh Result
            result.vertices = vertices;
            result.normals = normales;
            result.uv = uvs;
            result.triangles = triangles;
            result.RecalculateBounds();
            return result;
        }

        public static Mesh CreateWheelMesh(float height = 1f, float radius = 0.5f, int segments = 24)
        {
            Mesh result = new Mesh();
            float topRadius = radius;
            float bottomRadius = radius;
            int nbSides = segments;
            int nbHeightSeg = 1; // Not implemented yet

            int nbVerticesCap = nbSides + 1;
            // Vertices

            // bottom + top + sides
            Vector3[] vertices = new Vector3[nbVerticesCap + nbVerticesCap + nbSides * nbHeightSeg * 2 + 2];
            int vert = 0;
            float _2pi = Mathf.PI * 2f;

            // Bottom cap
            vertices[vert++] = new Vector3(0f, 0f, 0f);
            while (vert <= nbSides)
            {
                float rad = (float)vert / nbSides * _2pi;
                vertices[vert] = new Vector3(Mathf.Cos(rad) * bottomRadius, 0f, Mathf.Sin(rad) * bottomRadius);
                vert++;
            }

            // Top cap
            vertices[vert++] = new Vector3(0f, height, 0f);
            while (vert <= nbSides * 2 + 1)
            {
                float rad = (float)(vert - nbSides - 1) / nbSides * _2pi;
                vertices[vert] = new Vector3(Mathf.Cos(rad) * topRadius, height, Mathf.Sin(rad) * topRadius);
                vert++;
            }

            // Sides
            int v = 0;
            while (vert <= vertices.Length - 4)
            {
                float rad = (float)v / nbSides * _2pi;
                vertices[vert] = new Vector3(Mathf.Cos(rad) * topRadius, height, Mathf.Sin(rad) * topRadius);
                vertices[vert + 1] = new Vector3(Mathf.Cos(rad) * bottomRadius, 0, Mathf.Sin(rad) * bottomRadius);
                vert += 2;
                v++;
            }
            vertices[vert] = vertices[nbSides * 2 + 2];
            vertices[vert + 1] = vertices[nbSides * 2 + 3];

            // Normales

            // bottom + top + sides
            Vector3[] normales = new Vector3[vertices.Length];
            vert = 0;

            // Bottom cap
            while (vert <= nbSides)
            {
                normales[vert++] = Vector3.down;
            }

            // Top cap
            while (vert <= nbSides * 2 + 1)
            {
                normales[vert++] = Vector3.up;
            }

            // Sides
            v = 0;
            while (vert <= vertices.Length - 4)
            {
                float rad = (float)v / nbSides * _2pi;
                float cos = Mathf.Cos(rad);
                float sin = Mathf.Sin(rad);

                normales[vert] = new Vector3(cos, 0f, sin);
                normales[vert + 1] = normales[vert];

                vert += 2;
                v++;
            }
            normales[vert] = normales[nbSides * 2 + 2];
            normales[vert + 1] = normales[nbSides * 2 + 3];

            // UVs
            Vector2[] uvs = new Vector2[vertices.Length];

            // Bottom cap
            int u = 0;
            uvs[u++] = new Vector2(0.5f, 0.5f);
            while (u <= nbSides)
            {
                float rad = (float)u / nbSides * _2pi;
                uvs[u] = new Vector2(Mathf.Cos(rad) * .5f + .5f, Mathf.Sin(rad) * .5f + .5f);
                u++;
            }

            // Top cap
            uvs[u++] = new Vector2(0.5f, 0.5f);
            while (u <= nbSides * 2 + 1)
            {
                float rad = (float)u / nbSides * _2pi;
                uvs[u] = new Vector2(Mathf.Cos(rad) * .5f + .5f, Mathf.Sin(rad) * .5f + .5f);
                u++;
            }

            // Sides
            int u_sides = 0;
            while (u <= uvs.Length - 4)
            {
                float t = (float)u_sides / nbSides;
                uvs[u] = new Vector3(t, 1f);
                uvs[u + 1] = new Vector3(t, 0f);
                u += 2;
                u_sides++;
            }
            uvs[u] = new Vector2(1f, 1f);
            uvs[u + 1] = new Vector2(1f, 0f);

            // Triangles
            int nbTriangles = nbSides + nbSides + nbSides * 2;
            int[] triangles = new int[nbTriangles * 3 + 3];

            // Bottom cap
            int tri = 0;
            int i = 0;
            while (tri < nbSides - 1)
            {
                triangles[i] = 0;
                triangles[i + 1] = tri + 1;
                triangles[i + 2] = tri + 2;
                tri++;
                i += 3;
            }
            triangles[i] = 0;
            triangles[i + 1] = tri + 1;
            triangles[i + 2] = 1;
            tri++;
            i += 3;

            // Top cap
            //tri++;
            while (tri < nbSides * 2)
            {
                triangles[i] = tri + 2;
                triangles[i + 1] = tri + 1;
                triangles[i + 2] = nbVerticesCap;
                tri++;
                i += 3;
            }

            triangles[i] = nbVerticesCap + 1;
            triangles[i + 1] = tri + 1;
            triangles[i + 2] = nbVerticesCap;
            tri++;
            i += 3;
            tri++;

            // Sides
            while (tri <= nbTriangles)
            {
                triangles[i] = tri + 2;
                triangles[i + 1] = tri + 1;
                triangles[i + 2] = tri + 0;
                tri++;
                i += 3;

                triangles[i] = tri + 1;
                triangles[i + 1] = tri + 2;
                triangles[i + 2] = tri + 0;
                tri++;
                i += 3;
            }
            // Mesh Result
            result.vertices = vertices;
            result.normals = normales;
            result.uv = uvs;
            result.triangles = triangles;
            result.RecalculateBounds();
            return result;
        }

        public static Mesh CreateSphereMesh(float radius = 0.5f, int segments = 24)
        {
            Mesh result = new Mesh();
            // Longitude |||
            int nbLong = segments; //24;
                                   // Latitude ---
            int nbLat = segments; //16;

            // Vertices
            Vector3[] vertices = new Vector3[(nbLong + 1) * nbLat + 2];
            float _pi = Mathf.PI;
            float _2pi = _pi * 2f;
            vertices[0] = Vector3.up * radius;
            for (int lat = 0; lat < nbLat; lat++)
            {
                float a1 = _pi * (float)(lat + 1) / (nbLat + 1);
                float sin1 = Mathf.Sin(a1);
                float cos1 = Mathf.Cos(a1);

                for (int lon = 0; lon <= nbLong; lon++)
                {
                    float a2 = _2pi * (float)(lon == nbLong ? 0 : lon) / nbLong;
                    float sin2 = Mathf.Sin(a2);
                    float cos2 = Mathf.Cos(a2);

                    vertices[lon + lat * (nbLong + 1) + 1] = new Vector3(sin1 * cos2, cos1, sin1 * sin2) * radius;
                }
            }
            vertices[vertices.Length - 1] = Vector3.up * -radius;

            // Normales		
            Vector3[] normales = new Vector3[vertices.Length];
            for (int n = 0; n < vertices.Length; n++)
            {
                normales[n] = vertices[n].normalized;
            }

            // UVs
            Vector2[] uvs = new Vector2[vertices.Length];
            uvs[0] = Vector2.up;
            uvs[uvs.Length - 1] = Vector2.zero;
            for (int lat = 0; lat < nbLat; lat++)
            {
                for (int lon = 0; lon <= nbLong; lon++)
                {
                    uvs[lon + lat * (nbLong + 1) + 1] = new Vector2((float)lon / nbLong, 1f - (float)(lat + 1) / (nbLat + 1));
                }
            }

            // Triangles
            int nbFaces = vertices.Length;
            int nbTriangles = nbFaces * 2;
            int nbIndexes = nbTriangles * 3;
            int[] triangles = new int[nbIndexes];

            // Top Cap
            int i = 0;
            for (int lon = 0; lon < nbLong; lon++)
            {
                triangles[i++] = lon + 2;
                triangles[i++] = lon + 1;
                triangles[i++] = 0;
            }

            // Middle
            for (int lat = 0; lat < nbLat - 1; lat++)
            {
                for (int lon = 0; lon < nbLong; lon++)
                {
                    int current = lon + lat * (nbLong + 1) + 1;
                    int next = current + nbLong + 1;

                    triangles[i++] = current;
                    triangles[i++] = current + 1;
                    triangles[i++] = next + 1;

                    triangles[i++] = current;
                    triangles[i++] = next + 1;
                    triangles[i++] = next;
                }
            }

            //Bottom Cap
            for (int lon = 0; lon < nbLong; lon++)
            {
                triangles[i++] = vertices.Length - 1;
                triangles[i++] = vertices.Length - (lon + 2) - 1;
                triangles[i++] = vertices.Length - (lon + 1) - 1;
            }
            // Mesh Result
            result.vertices = vertices;
            result.normals = normales;
            result.uv = uvs;
            result.triangles = triangles;
            result.RecalculateBounds();
            return result;
        }

        public static Mesh CreateCapsuleMesh(float height = 2f, float radius = 0.5f, int segments = 24)
        {
            Mesh result = new Mesh();
            // Make segments an even number
            if (segments % 2 != 0)
            {
                segments++;
            }
            // Extra vertex on the seam
            int points = segments + 1;
            // Calculate points around a circle
            float[] pX = new float[points];
            float[] pZ = new float[points];
            float[] pY = new float[points];
            float[] pR = new float[points];
            float calcH = 0f;
            float calcV = 0f;
            for (int i = 0; i < points; i++)
            {
                pX[i] = Mathf.Sin(calcH * Mathf.Deg2Rad);
                pZ[i] = Mathf.Cos(calcH * Mathf.Deg2Rad);
                pY[i] = Mathf.Cos(calcV * Mathf.Deg2Rad);
                pR[i] = Mathf.Sin(calcV * Mathf.Deg2Rad);

                calcH += 360f / (float)segments;
                calcV += 180f / (float)segments;
            }
            // Vertices and UVs
            Vector3[] vertices = new Vector3[points * (points + 1)];
            Vector2[] uvs = new Vector2[vertices.Length];
            int ind = 0;
            // Y-Offset is half the height minus the diameter
            float yOff = (height - (radius * 2f)) * 0.5f;
            if (yOff < 0) yOff = 0;
            // UV Calculations
            float stepX = 1f / ((float)(points - 1));
            float uvX, uvY;
            // Top Hemisphere
            int top = Mathf.CeilToInt((float)points * 0.5f);
            for (int y = 0; y < top; y++)
            {
                for (int x = 0; x < points; x++)
                {
                    vertices[ind] = new Vector3(pX[x] * pR[y], pY[y], pZ[x] * pR[y]) * radius;
                    vertices[ind].y = yOff + vertices[ind].y;

                    uvX = 1f - (stepX * (float)x);
                    uvY = (vertices[ind].y + (height * 0.5f)) / height;
                    uvs[ind] = new Vector2(uvX, uvY);

                    ind++;
                }
            }
            // Bottom Hemisphere
            int btm = Mathf.FloorToInt((float)points * 0.5f);
            for (int y = btm; y < points; y++)
            {
                for (int x = 0; x < points; x++)
                {
                    vertices[ind] = new Vector3(pX[x] * pR[y], pY[y], pZ[x] * pR[y]) * radius;
                    vertices[ind].y = -yOff + vertices[ind].y;

                    uvX = 1f - (stepX * (float)x);
                    uvY = (vertices[ind].y + (height * 0.5f)) / height;
                    uvs[ind] = new Vector2(uvX, uvY);

                    ind++;
                }
            }
            // Triangles
            int[] triangles = new int[(segments * (segments + 1) * 2 * 3)];
            for (int y = 0, t = 0; y < segments + 1; y++)
            {
                for (int x = 0; x < segments; x++, t += 6)
                {
                    triangles[t + 0] = ((y + 0) * (segments + 1)) + x + 0;
                    triangles[t + 1] = ((y + 1) * (segments + 1)) + x + 0;
                    triangles[t + 2] = ((y + 1) * (segments + 1)) + x + 1;

                    triangles[t + 3] = ((y + 0) * (segments + 1)) + x + 1;
                    triangles[t + 4] = ((y + 0) * (segments + 1)) + x + 0;
                    triangles[t + 5] = ((y + 1) * (segments + 1)) + x + 1;
                }
            }
            // Mesh Result
            result.vertices = vertices;
            result.uv = uvs;
            result.triangles = triangles;
            result.RecalculateBounds();
            result.RecalculateNormals();
            return result;
        }

        public static BabylonTerrainData CreateTerrainData(TerrainData terrain, int resolution, Vector3 position, bool invert = false)
        {
            BabylonTerrainData result = new BabylonTerrainData();
            int w = terrain.heightmapWidth;
            int h = terrain.heightmapHeight;
            Vector3 meshScale = terrain.size;
            int tRes = (int)Mathf.Pow(2, resolution);
            meshScale = new Vector3(meshScale.x / (w - 1) * tRes, meshScale.y, meshScale.z / (h - 1) * tRes);
            Vector2 uvScale = new Vector2(1.0f / (w - 1), 1.0f / (h - 1));
            float[,] tData = terrain.GetHeights(0, 0, w, h);
            w = (w - 1) / tRes + 1;
            h = (h - 1) / tRes + 1;
            result.vertices = new Vector3[w * h];
            result.normals = new Vector3[w * h];
            result.uvs = new Vector2[w * h];
            result.triangles = new int[(w - 1) * (h - 1) * 6];
            // Build vertices and UVs
            for (int y = 0; y < h; y++)
            {
                for (int x = 0; x < w; x++)
                {
                    if (invert)
                    {
                        result.vertices[x * w + y] = Vector3.Scale(meshScale, new Vector3(y, tData[x * tRes, y * tRes], x)) + position;
                        result.normals[x * w + y] = new Vector3(0, 0, 0);
                        result.uvs[x * w + y] = Vector2.Scale(new Vector2(x * tRes, y * tRes), uvScale);
                    }
                    else
                    {
                        result.vertices[y * w + x] = Vector3.Scale(meshScale, new Vector3(-y, tData[x * tRes, y * tRes], x)) + position;
                        result.normals[y * w + x] = new Vector3(0, 0, 0);
                        result.uvs[y * w + x] = Vector2.Scale(new Vector2(x * tRes, y * tRes), uvScale);
                    }
                }
            }
            int index = 0;
            // Build triangle indices: 3 indices into vertex array for each triangle
            for (int y = 0; y < h - 1; y++)
            {
                for (int x = 0; x < w - 1; x++)
                {
                    // For each grid cell output two triangles
                    result.triangles[index++] = (y * w) + x;
                    result.triangles[index++] = ((y + 1) * w) + x;
                    result.triangles[index++] = (y * w) + x + 1;

                    result.triangles[index++] = ((y + 1) * w) + x;
                    result.triangles[index++] = ((y + 1) * w) + x + 1;
                    result.triangles[index++] = (y * w) + x + 1;
                }
            }
            return result;
        }

        public static void GenerateBabylonMeshData(Mesh mesh, BabylonMesh babylonMesh, BabylonScene babylonScene = null, Transform transform = null)
        {
            int index = 0;
            babylonMesh.positions = new float[mesh.vertexCount * 3];
            foreach (Vector3 vv in mesh.vertices)
            {
                babylonMesh.positions[index * 3] = vv.x;
                babylonMesh.positions[(index * 3) + 1] = vv.y;
                babylonMesh.positions[(index * 3) + 2] = vv.z;
                if (babylonScene != null && transform != null)
                {
                    // Computing world extends
                    Vector3 worldPosition = transform.TransformPoint(vv);
                    if (worldPosition.x > babylonScene.MaxVector.X)
                    {
                        babylonScene.MaxVector.X = worldPosition.x;
                    }
                    if (worldPosition.y > babylonScene.MaxVector.Y)
                    {
                        babylonScene.MaxVector.Y = worldPosition.y;
                    }
                    if (worldPosition.z > babylonScene.MaxVector.Z)
                    {
                        babylonScene.MaxVector.Z = worldPosition.z;
                    }

                    if (worldPosition.x < babylonScene.MinVector.X)
                    {
                        babylonScene.MinVector.X = worldPosition.x;
                    }
                    if (worldPosition.y < babylonScene.MinVector.Y)
                    {
                        babylonScene.MinVector.Y = worldPosition.y;
                    }
                    if (worldPosition.z < babylonScene.MinVector.Z)
                    {
                        babylonScene.MinVector.Z = worldPosition.z;
                    }
                }
                index++;
            }
            index = 0;
            babylonMesh.normals = new float[mesh.vertexCount * 3];
            foreach (Vector3 nn in mesh.normals)
            {
                babylonMesh.normals[index * 3] = nn.x;
                babylonMesh.normals[(index * 3) + 1] = nn.y;
                babylonMesh.normals[(index * 3) + 2] = nn.z;
                index++;
            }
            index = 0;
            babylonMesh.uvs = new float[mesh.vertexCount * 2];
            foreach (Vector3 v in mesh.uv)
            {
                babylonMesh.uvs[index * 2] = v.x;
                babylonMesh.uvs[(index * 2) + 1] = v.y;
                index++;
            }
            index = 0;
            babylonMesh.uvs2 = new float[mesh.vertexCount * 2];
            if (mesh.uv2 != null && mesh.uv2.Length > 0)
            {
                index = 0;
                foreach (Vector3 v in mesh.uv2)
                {
                    babylonMesh.uvs2[index * 2] = v.x;
                    babylonMesh.uvs2[(index * 2) + 1] = v.y;
                    index++;
                }
            }
            else
            {
                index = 0;
                foreach (Vector3 v in mesh.uv)
                {
                    babylonMesh.uvs2[index * 2] = v.x;
                    babylonMesh.uvs2[(index * 2) + 1] = v.y;
                    index++;
                }
            }
            index = 0;
            int loop = 0;
            babylonMesh.indices = new int[mesh.triangles.Length];
            List<Vector3> vectors = new List<Vector3>();
            Vector3 vector = new Vector3(0, 0, 0);
            foreach (int poly in mesh.triangles)
            {
                if (loop == 0)
                {
                    vector = new Vector3(0, 0, 0);
                    vector.z = poly;
                }
                else if (loop == 1)
                {
                    vector.y = poly;
                }
                else if (loop == 2)
                {
                    vector.x = poly;
                    vectors.Add(vector);
                }
                loop++;
                if (loop >= 3) loop = 0;
            }
            index = 0;
            foreach (Vector3 vvv in vectors)
            {
                babylonMesh.indices[index * 3] = (int)vvv.x;
                babylonMesh.indices[(index * 3) + 1] = (int)vvv.y;
                babylonMesh.indices[(index * 3) + 2] = (int)vvv.z;
                index++;
            }
        }

        public static void GenerateBabylonMeshTerrainData(BabylonTerrainData terrainData, BabylonMesh babylonMesh, bool reverseNormals = false, BabylonScene babylonScene = null, Transform transform = null)
        {
            int index = 0;
            babylonMesh.positions = new float[terrainData.vertices.Length * 3];
            foreach (Vector3 vv in terrainData.vertices)
            {
                babylonMesh.positions[index * 3] = vv.x;
                babylonMesh.positions[(index * 3) + 1] = vv.y;
                babylonMesh.positions[(index * 3) + 2] = vv.z;
                if (babylonScene != null && transform != null)
                {
                    // Computing world extends
                    Vector3 worldPosition = transform.TransformPoint(vv);
                    if (worldPosition.x > babylonScene.MaxVector.X)
                    {
                        babylonScene.MaxVector.X = worldPosition.x;
                    }
                    if (worldPosition.y > babylonScene.MaxVector.Y)
                    {
                        babylonScene.MaxVector.Y = worldPosition.y;
                    }
                    if (worldPosition.z > babylonScene.MaxVector.Z)
                    {
                        babylonScene.MaxVector.Z = worldPosition.z;
                    }

                    if (worldPosition.x < babylonScene.MinVector.X)
                    {
                        babylonScene.MinVector.X = worldPosition.x;
                    }
                    if (worldPosition.y < babylonScene.MinVector.Y)
                    {
                        babylonScene.MinVector.Y = worldPosition.y;
                    }
                    if (worldPosition.z < babylonScene.MinVector.Z)
                    {
                        babylonScene.MinVector.Z = worldPosition.z;
                    }
                }
                index++;
            }
            index = 0;
            babylonMesh.normals = new float[terrainData.vertices.Length * 3];
            foreach (Vector3 nn in terrainData.normals)
            {
                babylonMesh.normals[index * 3] = nn.x;
                babylonMesh.normals[(index * 3) + 1] = nn.y;
                babylonMesh.normals[(index * 3) + 2] = nn.z;
                index++;
            }
            index = 0;
            babylonMesh.uvs = new float[terrainData.vertices.Length * 2];
            foreach (Vector3 v in terrainData.uvs)
            {
                babylonMesh.uvs[index * 2] = v.x;
                babylonMesh.uvs[(index * 2) + 1] = v.y;
                index++;
            }
            index = 0;
            babylonMesh.uvs2 = new float[terrainData.vertices.Length * 2];
            foreach (Vector3 v in terrainData.uvs)
            {
                babylonMesh.uvs2[index * 2] = v.x;
                babylonMesh.uvs2[(index * 2) + 1] = v.y;
                index++;
            }
            index = 0;
            int loop = 0;
            babylonMesh.indices = new int[terrainData.triangles.Length];
            List<Vector3> vectors = new List<Vector3>();
            Vector3 vector = new Vector3(0, 0, 0);
            foreach (int poly in terrainData.triangles)
            {
                if (loop == 0)
                {
                    vector = new Vector3(0, 0, 0);
                    vector.z = poly;
                }
                else if (loop == 1)
                {
                    vector.y = poly;
                }
                else if (loop == 2)
                {
                    vector.x = poly;
                    vectors.Add(vector);
                }
                loop++;
                if (loop >= 3) loop = 0;
            }
            index = 0;
            foreach (Vector3 vvv in vectors)
            {
                babylonMesh.indices[index * 3] = (int)vvv.x;
                babylonMesh.indices[(index * 3) + 1] = (int)vvv.y;
                babylonMesh.indices[(index * 3) + 2] = (int)vvv.z;
                index++;
            }
            Tools.RecalculateMeshNormals(babylonMesh, reverseNormals);
        }

        public static void RecalculateMeshNormals(BabylonMesh mesh, bool flip = false)
        {
            int index = 0;

            float p1p2x = 0.0f;
            float p1p2y = 0.0f;
            float p1p2z = 0.0f;
            float p3p2x = 0.0f;
            float p3p2y = 0.0f;
            float p3p2z = 0.0f;
            float faceNormalx = 0.0f;
            float faceNormaly = 0.0f;
            float faceNormalz = 0.0f;

            float length = 0.0f;

            int i1 = 0;
            int i2 = 0;
            int i3 = 0;

            // indice triplet = 1 face
            var nbFaces = mesh.indices.Length / 3;
            for (index = 0; index < nbFaces; index++)
            {
                i1 = mesh.indices[index * 3];            // get the indexes of each vertex of the face
                i2 = mesh.indices[index * 3 + 1];
                i3 = mesh.indices[index * 3 + 2];

                p1p2x = mesh.positions[i1 * 3] - mesh.positions[i2 * 3];          // compute two vectors per face
                p1p2y = mesh.positions[i1 * 3 + 1] - mesh.positions[i2 * 3 + 1];
                p1p2z = mesh.positions[i1 * 3 + 2] - mesh.positions[i2 * 3 + 2];

                p3p2x = mesh.positions[i3 * 3] - mesh.positions[i2 * 3];
                p3p2y = mesh.positions[i3 * 3 + 1] - mesh.positions[i2 * 3 + 1];
                p3p2z = mesh.positions[i3 * 3 + 2] - mesh.positions[i2 * 3 + 2];

                faceNormalx = p1p2y * p3p2z - p1p2z * p3p2y;            // compute the face normal with cross product
                faceNormaly = p1p2z * p3p2x - p1p2x * p3p2z;
                faceNormalz = p1p2x * p3p2y - p1p2y * p3p2x;

                length = (float)Math.Sqrt(faceNormalx * faceNormalx + faceNormaly * faceNormaly + faceNormalz * faceNormalz);
                length = (length == 0) ? 1.0f : length;
                faceNormalx /= length;                                  // normalize this normal
                faceNormaly /= length;
                faceNormalz /= length;

                mesh.normals[i1 * 3] += faceNormalx;                         // accumulate all the normals per face
                mesh.normals[i1 * 3 + 1] += faceNormaly;
                mesh.normals[i1 * 3 + 2] += faceNormalz;
                mesh.normals[i2 * 3] += faceNormalx;
                mesh.normals[i2 * 3 + 1] += faceNormaly;
                mesh.normals[i2 * 3 + 2] += faceNormalz;
                mesh.normals[i3 * 3] += faceNormalx;
                mesh.normals[i3 * 3 + 1] += faceNormaly;
                mesh.normals[i3 * 3 + 2] += faceNormalz;
            }

            // last normalization of each normal
            float flipValue = (flip) ? -1.0f : 1.0f;
            for (index = 0; index < mesh.normals.Length / 3; index++)
            {
                faceNormalx = mesh.normals[index * 3];
                faceNormaly = mesh.normals[index * 3 + 1];
                faceNormalz = mesh.normals[index * 3 + 2];

                length = (float)Math.Sqrt(faceNormalx * faceNormalx + faceNormaly * faceNormaly + faceNormalz * faceNormalz);
                length = (length == 0) ? 1.0f : length;
                faceNormalx /= length;
                faceNormaly /= length;
                faceNormalz /= length;

                mesh.normals[index * 3] = (faceNormalx * flipValue);
                mesh.normals[index * 3 + 1] = (faceNormaly * flipValue);
                mesh.normals[index * 3 + 2] = (faceNormalz * flipValue);
            }

            // flip triangles for all normals
            if (flip)
            {
                int[] triangles = mesh.indices;
                for (int i = 0; i < triangles.Length; i += 3)
                {
                    int temp = triangles[i + 0];
                    triangles[i + 0] = triangles[i + 1];
                    triangles[i + 1] = temp;
                }
                mesh.indices = triangles;
            }
        }

        public static EditorWindow GetAssetStoreWindow()
        {
            EditorWindow result = null;
            Type AssetWindowType = typeof(EditorWindow).Assembly.GetType("UnityEditor.AssetStoreWindow");
            if (AssetWindowType != null)
            {
                result = (EditorWindow)AssetWindowType.GetMethod("Init", Tools.FullBinding).Invoke(null, null);
            }
            return result;
        }

        public static EditorWindow AttachToAssetStoreWindow(string title, string url)
        {
            EditorWindow result = null;
            EditorWindow assetStore = GetAssetStoreWindow();
            if (assetStore != null)
            {
                object webView = Unity3D2Babylon.Tools.GetInstanceField(assetStore.GetType(), assetStore, "webView");
                if (webView != null)
                {
                    if (!String.IsNullOrEmpty(url))
                    {
                        webView.GetType().GetMethod("LoadURL", Tools.FullBinding).Invoke(webView, new object[] { url });
                        result = assetStore;
                        if (!String.IsNullOrEmpty(title))
                        {
                            assetStore.titleContent.text = title;
                        }
                    }
                }
                assetStore.Show();
            }
            return result;
        }

        public static string GetDefaultTypeScriptPath()
        {
            string result = "tsc";
            if (Application.platform == RuntimePlatform.OSXEditor)
            {
                result = "/usr/local/bin/tsc";
            }
            else if (Application.platform == RuntimePlatform.WindowsEditor)
            {
                result = "C:/Program Files/nodejs/node_modules/typescript/bin/tsc";
            }
            return result;
        }

        public static string GetDefaultNodeRuntimePath()
        {
            string result = "node";
            if (Application.platform == RuntimePlatform.OSXEditor)
            {
                result = "/usr/local/bin/node";
            }
            else if (Application.platform == RuntimePlatform.WindowsEditor)
            {
                result = "C:/Program Files/nodejs/node.exe";
            }
            return result;
        }

        public static string FormatProjectJavaScript(string buildFolder, string outputFile)
        {
            string javascriptFile = outputFile + ".js";
            if (File.Exists(javascriptFile))
            {
                try
                {
                    File.Delete(javascriptFile);
                }
                catch (Exception ex1)
                {
                    UnityEngine.Debug.LogException(ex1);
                }
            }
            if (File.Exists(javascriptFile))
            {
                UnityEngine.Debug.LogError("Failed to clear build file: " + javascriptFile);
            }
            return javascriptFile;
        }

        public static void GenerateProjectIndexPage(string project, bool debug, string scenePath, string sceneFilename, string scriptPath, string projectScript)
        {
            string responseText = String.Empty;
            string previewLibrary = Path.Combine(Application.dataPath, "Babylon/Library/");
            string previewTemplate = Path.Combine(Application.dataPath, "Babylon/Templates/Config/Index.html");
            if (!String.IsNullOrEmpty(previewTemplate) && File.Exists(previewTemplate))
            {
                responseText = File.ReadAllText(previewTemplate);
            }
            string scripts = Path.Combine(project, scriptPath);
            string[] libs = Directory.GetFiles(previewLibrary, "*.bjs");
            if (libs != null && libs.Length > 0)
            {
                foreach (string lib in libs)
                {
                    string script = Path.Combine(scripts, (Path.GetFileNameWithoutExtension(lib) + ".js"));
                    try
                    {
                        File.Copy(lib, script, true);
                    }
                    catch (Exception ex0)
                    {
                        UnityEngine.Debug.LogException(ex0);
                    }
                }
            }
            responseText = responseText.Replace("###PROJECT###", projectScript);
            responseText = responseText.Replace("###TITLE###", Application.productName);
            responseText = responseText.Replace("###SCENE###", sceneFilename);
            responseText = responseText.Replace("###DEBUG###", debug.ToString().ToLower());
            responseText = responseText.Replace("###SCRIPT###", scriptPath.TrimStart('/').TrimEnd('/').ToLower());
            responseText = responseText.Replace("###PATH###", scenePath.TrimStart('/').TrimEnd('/').ToLower());
            string page = Path.Combine(project, "Index.html");
            File.WriteAllText(page, responseText);
        }

        public static void BuildProjectJavaScript(string buildFolder, string outputFile, string javascriptFile)
        {
            StreamWriter streamWriter = new StreamWriter(new FileStream(javascriptFile, FileMode.Create, FileAccess.Write));
            try
            {
                DefaultAsset[] assets = Tools.GetAssetsOfType<DefaultAsset>(".bjs");
                if (assets != null && assets.Length > 0)
                {
                    foreach (var asset in assets)
                    {
                        string path = AssetDatabase.GetAssetPath(asset);
                        if (!String.IsNullOrEmpty(path) && File.Exists(path))
                        {
                            if (path.IndexOf("/Babylon/Library/", StringComparison.OrdinalIgnoreCase) < 0)
                            {
                                string javascript = File.ReadAllText(path);
                                if (!String.IsNullOrEmpty(javascript))
                                {
                                    string name = Path.GetFileName(path).Replace(".bjs", ".js");
                                    string work = Path.Combine(buildFolder, name);
                                    File.WriteAllText(work, javascript);
                                    string jsminify = Tools.MinifyJavascriptCode(javascript);
                                    if (!String.IsNullOrEmpty(jsminify))
                                    {
                                        streamWriter.Write(String.Format("// {0}\r\n", name));
                                        streamWriter.Write(jsminify);
                                        streamWriter.Write("\r\n\r\n");
                                    }
                                }
                            }
                        }
                    }
                }
            }
            catch (Exception ex2)
            {
                UnityEngine.Debug.LogException(ex2);
            }
            finally
            {
                streamWriter.Close();
            }
        }

        public static int BuildProjectTypeScript(string nodePath, string tscPath, string buildFolder, string javascriptFile, string tsconfigJson = null)
        {
            int result = -1;
            bool tscExists = (!String.IsNullOrEmpty(tscPath) && File.Exists(tscPath));
            bool nodeExists = (!String.IsNullOrEmpty(nodePath) && File.Exists(nodePath));
            if (nodeExists && tscExists)
            {
                string work = Path.Combine(buildFolder, Path.GetFileName(javascriptFile.Replace(".babylon", "")));
                string root = Application.dataPath.Replace("/Assets", "");
                string json = Path.Combine(root, "tsconfig.json");
                string config = @" {
                    ""compilerOptions"": {
                    ""target"": ""ES5"",
                    ""module"": ""system"",
                    ""allowJs"": false,
                    ""declaration"": true,
                    ""outFile"": ""###OUTFILE###"",
                    ""sourceMap"": false
                    }
                }";
                if (String.IsNullOrEmpty(tsconfigJson))
                {
                    tsconfigJson = config;
                }
                tsconfigJson = tsconfigJson.Replace("###OUTFILE###", Tools.FormatSafePath(work));
                tsconfigJson = tsconfigJson.Replace("###OUTDIR###", Tools.FormatSafePath(buildFolder));
                File.WriteAllText(json, tsconfigJson);
                //* Execute typescript compiler
                Process process = new Process();
                process.StartInfo.FileName = nodePath;
                process.StartInfo.Arguments = String.Format("{0} -p .", tscPath);
                process.StartInfo.CreateNoWindow = true;
                process.StartInfo.WorkingDirectory = root;
                process.StartInfo.UseShellExecute = false;
                process.StartInfo.RedirectStandardOutput = true;
                process.StartInfo.RedirectStandardError = true;
                //* Set ONLY ONE handler here.
                process.ErrorDataReceived += new DataReceivedEventHandler(OnBuildProjectTypeScriptError);
                //* Start process
                process.Start();
                //* Read one element asynchronously
                process.BeginErrorReadLine();
                //* Read the other one synchronously
                string output = process.StandardOutput.ReadToEnd();
                //* Log compiler output issues
                if (!String.IsNullOrEmpty(output))
                {
                    if (output.IndexOf("): error", StringComparison.OrdinalIgnoreCase) >= 0)
                    {
                        UnityEngine.Debug.LogError(output);
                    }
                    else
                    {
                        UnityEngine.Debug.LogWarning(output);
                    }
                }
                process.WaitForExit();
                result = process.ExitCode;
                if (result == 0)
                {
                    //* Parse compiled output files
                    if (File.Exists(work))
                    {
                        string javascript = File.ReadAllText(work);
                        if (!String.IsNullOrEmpty(javascript))
                        {
                            UnityEngine.Debug.Log("Project typescript build successful.");
                            StreamWriter streamWriter = new StreamWriter(new FileStream(javascriptFile, FileMode.Append, FileAccess.Write));
                            try
                            {
                                string jsminify = Tools.MinifyJavascriptCode(javascript);
                                if (!String.IsNullOrEmpty(jsminify))
                                {
                                    streamWriter.Write(String.Format("// {0}.ts\r\n", Path.GetFileNameWithoutExtension(javascriptFile).Replace(".babylon", "")));
                                    streamWriter.Write(jsminify);
                                    streamWriter.Write("\r\n\r\n");
                                }
                            }
                            catch (Exception ex)
                            {
                                UnityEngine.Debug.LogException(ex);
                            }
                            finally
                            {
                                streamWriter.Close();
                            }

                        }
                        else
                        {
                            UnityEngine.Debug.LogError("Failed to parse output work script");
                        }
                    }
                }
                else
                {
                    UnityEngine.Debug.LogError("Failed to compile project script files");
                }
            }
            else
            {
                UnityEngine.Debug.LogWarning("Typescript files not compiled. Failed to locate typescript compilers.");
            }
            return result;
        }

        private static void OnBuildProjectTypeScriptError(object sendingProcess, DataReceivedEventArgs outLine)
        {
            // * Log process output error
            if (!String.IsNullOrEmpty(outLine.Data))
            {
                UnityEngine.Debug.LogError(outLine.Data);
            }
        }
    }

    public class BabylonSceneContractResolver : DataContractResolverStrategy
    {
        public BabylonSceneContractResolver()
        {
            // TODO: Append BabylonClassAttribute And BabylonPropertyAttribute To DataContract And DataMember Checks 
        }
    }
}
