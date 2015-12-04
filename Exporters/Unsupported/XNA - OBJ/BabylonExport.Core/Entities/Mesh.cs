using System;
using System.Collections.Generic;
using BabylonExport.Core.Exporters;
using SharpDX;

namespace BabylonExport.Core
{
    public class Mesh<T> where T : struct, IDumpable, IQueryable
    {
        readonly List<T> vertices = new List<T>();
        readonly List<int> indices = new List<int>();
        string concatenatedName = "";

        public Guid ID 
        {
            get;
            private set;
        }

        public StandardMaterial Material { get; private set; }
        
        public Mesh(StandardMaterial material)
        {
            ID = Guid.NewGuid();
            Material = material;
        }

        public void AddPart(string name, List<T> addedVertices, List<int> addedIndices)
        {
            if (concatenatedName == "")
                concatenatedName += "#"; // ProfessorF-Removed spaces before and after #

            concatenatedName += name;

            var offset = vertices.Count;
            vertices.AddRange(addedVertices);

            foreach (int index in addedIndices)
            {
                indices.Add(index + offset);
            }
        }

        public void CreateBabylonMesh(BabylonScene scene, Guid? parentID = null, BabylonSkeleton skeleton = null)
        {
            var babylonMesh = new BabylonMesh();
            scene.MeshesList.Add(babylonMesh);

            // Guid
            babylonMesh.id = ID.ToString();

            // Name
            babylonMesh.name = concatenatedName;

            // Parent
            if (parentID.HasValue)
                babylonMesh.parentId = parentID.Value.ToString();
            else
                babylonMesh.parentId = "";

            // Material ID
            if (Material == null)
            {
                babylonMesh.materialId = "";
            }
            else
            {
                babylonMesh.materialId = Material.ID.ToString();
            }

            // Skeleton ID
            if (skeleton != null)
            {
                babylonMesh.skeletonId = skeleton.id;
            }

            // Position
            babylonMesh.position = Vector3.Zero.ToArray();

            // Vertices
            var positions = new List<float>();
            var normals = new List<float>();
            var uvs = new List<float>();
            var uvs2 = new List<float>();
            var colors = new List<float>();
            var matricesIndices = new List<int>();
            var matricesWeights = new List<float>();

            for (int index = 0; index < vertices.Count; index++)
            {
                var position = vertices[index].GetPosition();

                scene.MinVector = Vector3.Min(scene.MinVector, position);
                scene.MaxVector = Vector3.Max(scene.MaxVector, position);

                vertices[index].DumpPositions(positions);
                vertices[index].DumpNormals(normals);
                vertices[index].DumpUVs(uvs);
                vertices[index].DumpUVs2(uvs2);
                vertices[index].DumpColors(colors);
                vertices[index].DumpMatricesIndices(matricesIndices);
                vertices[index].DumpMatricesWeights(matricesWeights);
            }

            if (positions.Count > 0)
            {
                babylonMesh.positions = positions.ToArray();
            }
            if (normals.Count > 0)
            {
                babylonMesh.normals = normals.ToArray();
            }
            if (uvs.Count > 0)
            {
                babylonMesh.uvs = uvs.ToArray();
            }
            if (uvs2.Count > 0)
            {
                babylonMesh.uvs2 = uvs2.ToArray();
            }
            if (colors.Count > 0)
            {
                babylonMesh.colors = colors.ToArray();
            }
            if (matricesIndices.Count > 0)
            {
                babylonMesh.matricesIndices = matricesIndices.ToArray();
            }
            if (matricesWeights.Count > 0)
            {
                babylonMesh.matricesWeights = matricesWeights.ToArray();
            }

            // Faces
            babylonMesh.indices = indices.ToArray();
        }
    }
}
