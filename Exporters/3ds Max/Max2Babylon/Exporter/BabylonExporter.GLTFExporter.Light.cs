using BabylonExport.Entities;
using GLTFExport.Entities;

namespace Max2Babylon
{
    partial class BabylonExporter
    {
        private GLTFNode ExportLight(BabylonLight babylonLight, GLTF gltf, GLTFNode gltfParentNode)
        {
            RaiseMessage("GLTFExporter.Light | ExportLight babylonLight.name=" + babylonLight.name, 1);

            // --------------------------
            // ---------- Node ----------
            // --------------------------

            RaiseMessage("GLTFExporter.Light | Node", 2);
            // Node
            var gltfNode = new GLTFNode();
            gltfNode.name = babylonLight.name;
            gltfNode.index = gltf.NodesList.Count;
            gltf.NodesList.Add(gltfNode);

            // Hierarchy
            if (gltfParentNode != null)
            {
                RaiseMessage("GLTFExporter.Light | Add " + babylonLight.name + " as child to " + gltfParentNode.name, 3);
                gltfParentNode.ChildrenList.Add(gltfNode.index);
            }
            else
            {
                // It's a root node
                // Only root nodes are listed in a gltf scene
                RaiseMessage("GLTFExporter.Light | Add " + babylonLight.name + " as root node to scene", 3);
                gltf.scenes[0].NodesList.Add(gltfNode.index);
            }

            // Transform
            gltfNode.translation = babylonLight.position;
            // Switch from left to right handed coordinate system
            //gltfNode.translation[0] *= -1;
            // No rotation defined for babylon light. Use identity instead.
            gltfNode.rotation = new float[4] { 0, 0, 0, 1 };
            // No scaling defined for babylon light. Use identity instead.
            gltfNode.scale = new float[3] { 1, 1, 1 };

            return gltfNode;
        }
    }
}
