using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System;
using System.Linq;
using System.Runtime.Serialization.Json;
using SharpDX;
using BabylonExport;

namespace BabylonExport.Core.Exporters
{
    public partial class ObjExporter : IExporter
    {
        readonly List<Vector3> positions = new List<Vector3>();
        readonly List<Vector3> normals = new List<Vector3>();
        readonly List<Vector2> textureCoordinates = new List<Vector2>();
        readonly List<PositionNormalTextured> stagingVertices = new List<PositionNormalTextured>();
        readonly List<int> stagingIndices = new List<int>();
        readonly Dictionary<string, int> registeredVertices = new Dictionary<string, int>();
        readonly Dictionary<StandardMaterial, Mesh<PositionNormalTextured>> meshParts = new Dictionary<StandardMaterial, Mesh<PositionNormalTextured>>();

        int positionsIndexOffset = 1;
        int normalsIndexOffset = 1;
        int textureCoordinatesIndexOffset = 1;

        StandardMaterial defaultMaterial;

        public event Action<int> OnImportProgressChanged;

        public string SupportedExtensions
        {
            get
            {
                return ".obj";
            }
        }

        public void GenerateBabylonFile(string file, string outputFile, bool skinned, bool rightToLeft)
        {
            var text = File.ReadAllText(file);

            Environment.CurrentDirectory = Path.GetDirectoryName(file);

            // Scene
            var scene = new BabylonScene(Path.GetDirectoryName(outputFile));

            // Loading
            var objDocument = new Document<ObjLine>(text);

            materials.Clear();

            int currentProgression = 0;

            int total = objDocument.Blocks.Sum(lines => lines.Count);

            string currentName = "";
            StandardMaterial currentMaterial = null;

            foreach (var lines in objDocument.Blocks)
            {
                if (lines[0].Tokens[0] == lines[0].BlockSperator)
                {
                    AppendNewPart(currentName, currentMaterial);
                }
                foreach (ObjLine line in lines)
                {
                    currentProgression++;
                    ReportProgressChanged((currentProgression * 100) / total);

                    switch (line.Header)
                    {
                        case ObjHeader.Vertices:
                            positions.Add(line.ToVector3());
                            break;
                        case ObjHeader.TextureCoordinates:
                            Vector2 tv = line.ToVector2();
                            textureCoordinates.Add(tv);
                            break;
                        case ObjHeader.Normals:
                            normals.Add(line.ToVector3());
                            break;
                        case ObjHeader.Group:
                            currentName = line.Tokens.Length > 1 ? line.Tokens[1] : "noname";
                            break;
                        case ObjHeader.Faces:
                            AppendFace(line);
                            break;
                        case ObjHeader.MaterialLibrary:
                            ImportMaterialLibraries(line, scene);
                            break;
                        case ObjHeader.Material:
                            string materialName = line.Tokens[1];
                            currentMaterial = materials.FirstOrDefault(e => e.Name == materialName);
                            break;
                    }
                }
            }

            if (positions.Count > 0)
            {
                AppendNewPart(currentName, currentMaterial);
            }

            if (meshParts.Count > 1)
            {
                var proxyID = ProxyMesh.CreateBabylonMesh(currentName, scene);
                foreach (Mesh<PositionNormalTextured> part in meshParts.Values)
                {
                    part.CreateBabylonMesh(scene, proxyID);
                }
            }
            else
            {
                meshParts.Values.First().CreateBabylonMesh(scene);
            }

            // Output
            scene.Prepare();
            using (var outputStream = new FileStream(outputFile, FileMode.Create, FileAccess.Write))
            {
                var ser = new DataContractJsonSerializer(typeof (BabylonScene));
                ser.WriteObject(outputStream, scene);
            }
        }

        void ReportProgressChanged(int progress)
        {
            if (OnImportProgressChanged != null)
            {
                OnImportProgressChanged(progress);
            }
        }

        void AppendFace(ObjLine line)
        {
            // Line
            if (line.Tokens.Length == 3)
            {
                AppendIndex(1, line);
                AppendIndex(2, line);
                AppendIndex(2, line);

                return;
            }

            // Triangle
            if (line.Tokens.Length == 4)
            {
                for (int index = 1; index <= 3; index++)
                {
                    AppendIndex(index, line);
                }

                return;
            }

            // Quad
            if (line.Tokens.Length == 5)
            {
                for (int index = 1; index <= 3; index++)
                {
                    AppendIndex(index, line);
                }

                AppendIndex(1, line);
                AppendIndex(3, line);
                AppendIndex(4, line);
            }
        }

        void AppendIndex(int index, ObjLine line)
        {
            string[] indices = line.Tokens[index].Split('/');

            // Required: Position
            int positionIndex = int.Parse(indices[0], CultureInfo.InvariantCulture) - positionsIndexOffset;
            int texCoordIndex = -1;
            int normalIndex = -1;

            // Optional: Texture coordinate
            if (indices.Length > 1 && indices[1].Equals(string.Empty) == false)
            {
                texCoordIndex = int.Parse(indices[1]) - textureCoordinatesIndexOffset;
            }

            // Optional: Normal
            if (indices.Length > 2 && indices[2].Equals(string.Empty) == false)
            {
                normalIndex = int.Parse(indices[2]) - normalsIndexOffset;
            }

            // Build vertex
            var vertex = new PositionNormalTextured { Position = positions[positionIndex] };

            if (texCoordIndex >= 0)
                vertex.TextureCoordinates = textureCoordinates[texCoordIndex];

            if (normalIndex >= 0)
                vertex.Normal = normals[normalIndex];

            // check if the vertex does not already exists
            string hash = vertex.ToString();
            int vertexIndex;

            if (!registeredVertices.TryGetValue(hash, out vertexIndex))
            {
                stagingVertices.Add(vertex);
                vertexIndex = stagingVertices.Count - 1;
                registeredVertices.Add(hash, vertexIndex);
            }

            stagingIndices.Add(vertexIndex);
        }

        void AppendNewPart(string name, StandardMaterial currentMaterial)
        {
            if (stagingVertices.Count == 0)
                return;

            if (currentMaterial == null)
            {
                if (defaultMaterial == null)
                {
                    defaultMaterial = new StandardMaterial("empty");
                }

                currentMaterial = defaultMaterial;
            }

            Mesh<PositionNormalTextured> part;

            if (!meshParts.TryGetValue(currentMaterial, out part))
            {
                part = new Mesh<PositionNormalTextured>(currentMaterial == defaultMaterial ? null : currentMaterial);
                meshParts.Add(currentMaterial, part);
            }

            part.AddPart(name, stagingVertices, stagingIndices);

            positionsIndexOffset += positions.Count;
            positions.Clear();

            normalsIndexOffset += normals.Count;
            normals.Clear();

            textureCoordinatesIndexOffset += textureCoordinates.Count;
            textureCoordinates.Clear();

            stagingVertices.Clear();
            stagingIndices.Clear();
            registeredVertices.Clear();
        }
    }
}
