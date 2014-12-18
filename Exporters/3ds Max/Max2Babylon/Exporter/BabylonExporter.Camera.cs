using System.Collections.Generic;
using Autodesk.Max;
using BabylonExport.Entities;

namespace Max2Babylon
{
    partial class BabylonExporter
    {
        private void ExportCamera(IIGameNode cameraNode, BabylonScene babylonScene)
        {

            if (cameraNode.MaxNode.GetBoolProperty("babylonjs_noexport"))
            {
                return;
            }
            var gameCamera = cameraNode.IGameObject.AsGameCamera();
            var initialized = gameCamera.InitializeData;
            var babylonCamera = new BabylonCamera();

            RaiseMessage(cameraNode.Name, 1);
            babylonCamera.name = cameraNode.Name;
            babylonCamera.id = cameraNode.MaxNode.GetGuid().ToString();
            if (cameraNode.NodeParent != null)
            {
                babylonCamera.parentId = cameraNode.NodeParent.MaxNode.GetGuid().ToString();
            }

            float fov = 0;
            gameCamera.CameraFOV.GetPropertyValue(ref fov, 0, false);
            babylonCamera.fov = fov;
            float minZ = 0;
            gameCamera.CameraNearClip.GetPropertyValue(ref minZ, 0, false);
            babylonCamera.minZ = minZ;
            float maxZ = 0;
            gameCamera.CameraFarClip.GetPropertyValue(ref maxZ, 0, false);
            babylonCamera.maxZ = maxZ;

            if (babylonCamera.minZ == 0.0f)
            {
                babylonCamera.minZ = 0.1f;
            }

            // Control
            babylonCamera.speed = cameraNode.MaxNode.GetFloatProperty("babylonjs_speed", 1.0f);
            babylonCamera.inertia = cameraNode.MaxNode.GetFloatProperty("babylonjs_inertia", 0.9f);

            // Collisions
            babylonCamera.checkCollisions = cameraNode.MaxNode.GetBoolProperty("babylonjs_checkcollisions");
            babylonCamera.applyGravity = cameraNode.MaxNode.GetBoolProperty("babylonjs_applygravity");
            babylonCamera.ellipsoid = cameraNode.MaxNode.GetVector3Property("babylonjs_ellipsoid");

            // Position
            {
                var wm = cameraNode.GetLocalTM(0);
                var position = wm.Translation;
                babylonCamera.position = new float[] { position.X, position.Y, position.Z };

                // Target
                var target = gameCamera.CameraTarget;
                if (target != null)
                {
                    babylonCamera.lockedTargetId = target.MaxNode.GetGuid().ToString();
                }
                else
                {
                    var dir = wm.GetRow(3);
                    babylonCamera.target = new float[] { position.X - dir.X, position.Y - dir.Y, position.Z - dir.Z };
                }
            }

            // Animations
            var animations = new List<BabylonAnimation>();
            //if (!ExportVector3Controller(cameraNode.TMController.PositionController, "position", animations))
            //{
                ExportVector3Animation("position", animations, key =>
                {
                    var wm = cameraNode.GetLocalTM(key);
                    var position = wm.Translation;
                    return  new float[] { position.X, position.Y, position.Z };
                });
            //}
            if (gameCamera.CameraTarget == null)
            {
                ExportVector3Animation("target", animations, key =>
                {
                    var wm = cameraNode.GetLocalTM(key);
                    var position = wm.Translation;
                    var dir = wm.GetRow(3);
                    return new float[] { position.X - dir.X, position.Y - dir.Y, position.Z - dir.Z };
                });
            }

            ExportFloatAnimation("fov", animations, key => new[] { Tools.ConvertFov((gameCamera.MaxObject as ICameraObject).GetFOV(key, Tools.Forever)) });

            babylonCamera.animations = animations.ToArray();

            if (cameraNode.MaxNode.GetBoolProperty("babylonjs_autoanimate"))
            {
                babylonCamera.autoAnimate = true;
                babylonCamera.autoAnimateFrom = (int)cameraNode.MaxNode.GetFloatProperty("babylonjs_autoanimate_from");
                babylonCamera.autoAnimateTo = (int)cameraNode.MaxNode.GetFloatProperty("babylonjs_autoanimate_to");
                babylonCamera.autoAnimateLoop = cameraNode.MaxNode.GetBoolProperty("babylonjs_autoanimateloop");
            }

            babylonScene.CamerasList.Add(babylonCamera);
        }
    }
}
