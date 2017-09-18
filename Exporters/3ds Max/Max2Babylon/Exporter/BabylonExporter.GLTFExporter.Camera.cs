using BabylonExport.Entities;
using GLTFExport.Entities;

namespace Max2Babylon
{
    partial class BabylonExporter
    {
        private GLTFCamera ExportCamera(BabylonCamera babylonCamera, GLTF gltf, GLTFNode gltfParentNode)
        {
            RaiseMessage("GLTFExporter.Camera | Export camera named: " + babylonCamera.name, 1);

            // --------------------------
            // ---------- Node ----------
            // --------------------------

            RaiseMessage("GLTFExporter.Camera | Node", 2);
            // Node
            var gltfNode = new GLTFNode();
            gltfNode.name = babylonCamera.name;
            gltfNode.index = gltf.NodesList.Count;
            gltf.NodesList.Add(gltfNode);

            // Hierarchy
            if (gltfParentNode != null)
            {
                RaiseMessage("GLTFExporter.Camera | Add " + babylonCamera.name + " as child to " + gltfParentNode.name, 3);
                gltfParentNode.ChildrenList.Add(gltfNode.index);
            }
            else
            {
                // It's a root node
                // Only root nodes are listed in a gltf scene
                RaiseMessage("GLTFExporter.Camera | Add " + babylonCamera.name + " as root node to scene", 3);
                gltf.scenes[0].NodesList.Add(gltfNode.index);
            }

            // Transform
            gltfNode.translation = babylonCamera.position;
            if (babylonCamera.rotationQuaternion != null)
            {
                gltfNode.rotation = babylonCamera.rotationQuaternion;
            }
            else
            {
                // Convert rotation vector to quaternion
                BabylonVector3 rotationVector3 = new BabylonVector3
                {
                    X = babylonCamera.rotation[0],
                    Y = babylonCamera.rotation[1],
                    Z = babylonCamera.rotation[2]
                };
                gltfNode.rotation = rotationVector3.toQuaternion().ToArray();
            }
            // No scaling defined for babylon camera. Use identity instead.
            gltfNode.scale = new float[3] { 1, 1, 1 };


            // --- prints ---

            RaiseMessage("GLTFExporter.Camera | babylonCamera data", 2);
            RaiseMessage("GLTFExporter.Camera | babylonCamera.type=" + babylonCamera.type, 3);
            RaiseMessage("GLTFExporter.Camera | babylonCamera.fov=" + babylonCamera.fov, 3);
            RaiseMessage("GLTFExporter.Camera | babylonCamera.maxZ=" + babylonCamera.maxZ, 3);
            RaiseMessage("GLTFExporter.Camera | babylonCamera.minZ=" + babylonCamera.minZ, 3);


            // --------------------------
            // ------- gltfCamera -------
            // --------------------------

            RaiseMessage("GLTFExporter.Camera | create gltfCamera", 2);

            // Camera
            var gltfCamera = new GLTFCamera { name = babylonCamera.name };
            gltfCamera.index = gltf.CamerasList.Count;
            gltf.CamerasList.Add(gltfCamera);
            gltfNode.camera = gltfCamera.index;
            gltfCamera.gltfNode = gltfNode;

            // Camera type
            switch (babylonCamera.mode)
            {
                case (BabylonCamera.CameraMode.ORTHOGRAPHIC_CAMERA):
                    var gltfCameraOrthographic = new GLTFCameraOrthographic();
                    gltfCameraOrthographic.xmag = 1; // Do not bother about it - still mandatory
                    gltfCameraOrthographic.ymag = 1; // Do not bother about it - still mandatory
                    gltfCameraOrthographic.zfar = babylonCamera.maxZ;
                    gltfCameraOrthographic.znear = babylonCamera.minZ;

                    gltfCamera.type = GLTFCamera.CameraType.orthographic.ToString();
                    gltfCamera.orthographic = gltfCameraOrthographic;
                    break;
                case (BabylonCamera.CameraMode.PERSPECTIVE_CAMERA):
                    var gltfCameraPerspective = new GLTFCameraPerspective();
                    gltfCameraPerspective.aspectRatio = null; // Do not bother about it - use default glTF value
                    gltfCameraPerspective.yfov = babylonCamera.fov; // Babylon camera fov mode is assumed to be vertical (FOVMODE_VERTICAL_FIXED)
                    gltfCameraPerspective.zfar = babylonCamera.maxZ;
                    gltfCameraPerspective.znear = babylonCamera.minZ;

                    gltfCamera.type = GLTFCamera.CameraType.perspective.ToString();
                    gltfCamera.perspective = gltfCameraPerspective;
                    break;
                default:
                    RaiseError("GLTFExporter.Camera | camera mode not found");
                    break;
            }
            
            return gltfCamera;
        }
    }
}
