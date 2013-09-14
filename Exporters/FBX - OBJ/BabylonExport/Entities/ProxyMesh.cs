using System;
using BabylonExport.Exporters;
using SharpDX;

namespace BabylonExport
{
    public class ProxyMesh
    {
        public static Guid CreateBabylonMesh(string name, BabylonScene scene)
        {
            var babylonMesh = new BabylonMesh();
            scene.MeshesList.Add(babylonMesh);

            // Guid
            var id = Guid.NewGuid();
            babylonMesh.id = id.ToString();

            // Name
            babylonMesh.name = name;

            // Parent
            babylonMesh.parentId = "";

            // Visible
            babylonMesh.isVisible = false;

            // Material ID
            babylonMesh.materialId = "";

            // Position
            babylonMesh.position = Vector3.Zero.ToArray();

            // Vertices
            babylonMesh.positions = null;

            // Faces
            babylonMesh.indices = null;

            return id;
        }
    }
}
