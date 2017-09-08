using BabylonExport.Entities;
using GLTFExport.Entities;

namespace Max2Babylon
{
    partial class BabylonExporter
    {
        private GLTFNode ExportAbstractMesh(BabylonAbstractMesh babylonAbstractMesh, GLTF gltf, GLTFNode gltfParentNode)
        {
            RaiseMessage("GLTFExporter.AbstractMesh | Export abstract mesh named: " + babylonAbstractMesh.name, 1);

            // Node
            var gltfNode = new GLTFNode();
            gltfNode.name = babylonAbstractMesh.name;
            gltfNode.index = gltf.NodesList.Count;
            gltf.NodesList.Add(gltfNode);

            // Hierarchy
            if (gltfParentNode != null)
            {
                RaiseMessage("GLTFExporter.AbstractMesh | Add " + babylonAbstractMesh.name + " as child to " + gltfParentNode.name, 2);
                gltfParentNode.ChildrenList.Add(gltfNode.index);
            }
            else
            {
                // It's a root node
                // Only root nodes are listed in a gltf scene
                RaiseMessage("GLTFExporter.AbstractMesh | Add " + babylonAbstractMesh.name + " as root node to scene", 2);
                gltf.scenes[0].NodesList.Add(gltfNode.index);
            }

            // Transform
            gltfNode.translation = babylonAbstractMesh.position;
            // TODO - Choose between this method and the extra root node
            // Switch from left to right handed coordinate system
            //gltfNode.translation[0] *= -1;
            if (babylonAbstractMesh.rotationQuaternion != null)
            {
                gltfNode.rotation = babylonAbstractMesh.rotationQuaternion;
            }
            else
            {
                // Convert rotation vector to quaternion
                BabylonVector3 rotationVector3 = new BabylonVector3
                {
                    X = babylonAbstractMesh.rotation[0],
                    Y = babylonAbstractMesh.rotation[1],
                    Z = babylonAbstractMesh.rotation[2]
                };
                gltfNode.rotation = rotationVector3.toQuaternion().ToArray();
            }
            gltfNode.scale = babylonAbstractMesh.scaling;

            // Mesh
            var gltfMesh = gltf.MeshesList.Find(_gltfMesh => _gltfMesh.idGroupInstance == babylonAbstractMesh.idGroupInstance);
            if (gltfMesh != null)
            {
                gltfNode.mesh = gltfMesh.index;
            }

            return gltfNode;
        }
    }
}
