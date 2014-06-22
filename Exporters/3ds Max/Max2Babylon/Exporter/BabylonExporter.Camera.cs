using System.Collections.Generic;
using Autodesk.Max;
using BabylonExport.Entities;

namespace Max2Babylon
{
    partial class BabylonExporter
    {
        private void ExportCamera(IINode cameraNode, BabylonScene babylonScene)
        {
            if (cameraNode.GetBoolProperty("babylonjs_noexport"))
            {
                return;
            }

            var maxCamera = (cameraNode.ObjectRef as ICameraObject);
            var babylonCamera = new BabylonCamera();

            RaiseMessage(cameraNode.Name, 1);
            babylonCamera.name = cameraNode.Name;
            babylonCamera.id = cameraNode.GetGuid().ToString();
            if (cameraNode.HasParent())
            {
                babylonCamera.parentId = cameraNode.ParentNode.GetGuid().ToString();
            }

            babylonCamera.fov = Tools.ConvertFov(maxCamera.GetFOV(0, Tools.Forever));
            babylonCamera.minZ = maxCamera.GetEnvRange(0, 0, Tools.Forever);
            babylonCamera.maxZ = maxCamera.GetEnvRange(0, 1, Tools.Forever);

            if (babylonCamera.minZ == 0.0f)
            {
                babylonCamera.minZ = 0.1f;
            }

            // Control
            babylonCamera.speed = cameraNode.GetFloatProperty("babylonjs_speed", 1.0f);
            babylonCamera.inertia = cameraNode.GetFloatProperty("babylonjs_inertia", 0.9f);

            // Collisions
            babylonCamera.checkCollisions = cameraNode.GetBoolProperty("babylonjs_checkcollisions");
            babylonCamera.applyGravity = cameraNode.GetBoolProperty("babylonjs_applygravity");
            babylonCamera.ellipsoid = cameraNode.GetVector3Property("babylonjs_ellipsoid");

            // Position
            var wm = cameraNode.GetWorldMatrix(0, cameraNode.HasParent());
            var position = wm.Trans;
            babylonCamera.position = position.ToArraySwitched();

            // Target
            var target = cameraNode.Target;
            if (target != null)
            {
                babylonCamera.lockedTargetId = target.GetGuid().ToString();
            }
            else
            {
                var dir = wm.GetRow(2).MultiplyBy(-1);
                babylonCamera.target = position.Add(dir).ToArraySwitched();
            }

            // Animations
            var animations = new List<BabylonAnimation>();
            if (!ExportVector3Controller(cameraNode.TMController.PositionController, "position", animations))
            {
                ExportVector3Animation("position", animations, key =>
                {
                    var worldMatrix = cameraNode.GetWorldMatrix(key, cameraNode.HasParent());
                    return worldMatrix.Trans.ToArraySwitched();
                });
            }

            ExportFloatAnimation("fov", animations, key => new[] {Tools.ConvertFov(maxCamera.GetFOV(key, Tools.Forever))});

            babylonCamera.animations = animations.ToArray();

            if (cameraNode.GetBoolProperty("babylonjs_autoanimate"))
            {
                babylonCamera.autoAnimate = true;
                babylonCamera.autoAnimateFrom = (int)cameraNode.GetFloatProperty("babylonjs_autoanimate_from");
                babylonCamera.autoAnimateTo = (int)cameraNode.GetFloatProperty("babylonjs_autoanimate_to");
                babylonCamera.autoAnimateLoop = cameraNode.GetBoolProperty("babylonjs_autoanimateloop");
            }

            babylonScene.CamerasList.Add(babylonCamera);
        }
    }
}
