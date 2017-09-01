using BabylonExport.Entities;
using GLTFExport.Entities;

namespace Max2Babylon
{
    partial class BabylonExporter
    {
        // TODO - Test if ok with a gltf viewer working with custom camera (babylon loader/sandbox doesn't load them)
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
            // Switch from left to right handed coordinate system
            //gltfNode.translation[0] *= -1;
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
                gltfNode.rotation = rotationVector3.toQuaternionGltf().ToArray();
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
                    gltfCameraOrthographic.xmag = 1; // TODO - How to retreive value from babylon? xmag:The floating-point horizontal magnification of the view
                    gltfCameraOrthographic.ymag = 1; // TODO - How to retreive value from babylon? ymag:The floating-point vertical magnification of the view
                    gltfCameraOrthographic.zfar = babylonCamera.maxZ;
                    gltfCameraOrthographic.znear = babylonCamera.minZ;

                    gltfCamera.type = GLTFCamera.CameraType.orthographic.ToString();
                    gltfCamera.orthographic = gltfCameraOrthographic;
                    break;
                case (BabylonCamera.CameraMode.PERSPECTIVE_CAMERA):
                    var gltfCameraPerspective = new GLTFCameraPerspective();
                    gltfCameraPerspective.aspectRatio = null; // 0.8f; // TODO - How to retreive value from babylon? The aspect ratio in babylon is computed based on the engine rather than set on a camera (aspectRatio = _gl.drawingBufferWidth / _gl.drawingBufferHeight)
                    gltfCameraPerspective.yfov = babylonCamera.fov; // WARNING - Babylon camera fov mode is assumed to be vertical (FOVMODE_VERTICAL_FIXED)
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
