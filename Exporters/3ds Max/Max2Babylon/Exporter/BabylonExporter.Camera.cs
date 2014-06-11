using System;
using BabylonExport.Entities;
using MaxSharp;

namespace Max2Babylon
{
    partial class BabylonExporter
    {
        private BabylonCamera ExportCamera(Node cameraNode, BabylonScene babylonScene)
        {
            var maxCamera = (cameraNode.Object as Camera)._Camera;
            var babylonCamera = new BabylonCamera();

            RaiseMessage(cameraNode.Name, true);
            babylonCamera.name = cameraNode.Name;
            babylonCamera.id = cameraNode.GetGuid().ToString();
            if (cameraNode.HasParent())
            {
                babylonCamera.parentId = cameraNode.Parent.GetGuid().ToString();
            }

            babylonCamera.fov = Tools.ConvertFov(maxCamera.GetFOV(0, Interval.Forever._IInterval));
            babylonCamera.minZ = maxCamera.GetEnvRange(0, 0, Interval.Forever._IInterval);
            babylonCamera.maxZ = maxCamera.GetEnvRange(0, 1, Interval.Forever._IInterval);

            if (babylonCamera.minZ == 0.0f)
            {
                babylonCamera.minZ = 0.1f;
            }

            // Control
            babylonCamera.speed = cameraNode._Node.GetFloatProperty("babylonjs_speed");
            babylonCamera.inertia = cameraNode._Node.GetFloatProperty("babylonjs_inertia");

            // Collisions
            babylonCamera.checkCollisions = cameraNode._Node.GetBoolProperty("babylonjs_checkcollisions");
            babylonCamera.applyGravity = cameraNode._Node.GetBoolProperty("babylonjs_applygravity");
            babylonCamera.ellipsoid = cameraNode._Node.GetVector3Property("babylonjs_ellipsoid");

            // Position
            var wm = cameraNode.GetWorldMatrix(0, cameraNode.HasParent());
            var position = wm.Trans;
            babylonCamera.position = position.ToArraySwitched();

            // Target
            var target = cameraNode._Node.Target;
            if (target != null)
            {
                babylonCamera.lockedTargetId = target.GetGuid().ToString();
            }
            else
            {
                var dir = wm.GetRow(2).MultiplyBy(-1);
                babylonCamera.target = dir.ToArraySwitched();
            }

            babylonScene.CamerasList.Add(babylonCamera);
            return babylonCamera;
        }
    }
}
