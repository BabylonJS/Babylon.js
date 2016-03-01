using System.Collections.Generic;
using Autodesk.Max;
using BabylonExport.Entities;
using System.Linq;

namespace Max2Babylon
{
    partial class BabylonExporter
    {
        private void ExportCamera(IIGameScene scene,  IIGameNode cameraNode, BabylonScene babylonScene)
        {
            if (cameraNode.MaxNode.GetBoolProperty("babylonjs_noexport"))
            {
                return;
            }
            var gameCamera = cameraNode.IGameObject.AsGameCamera();
            var maxCamera = gameCamera.MaxObject as ICameraObject;
            var initialized = gameCamera.InitializeData;
            var babylonCamera = new BabylonCamera();

            RaiseMessage(cameraNode.Name, 1);
            babylonCamera.name = cameraNode.Name;
            babylonCamera.id = cameraNode.MaxNode.GetGuid().ToString();
            if (cameraNode.NodeParent != null)
            {
                babylonCamera.parentId = GetParentID(cameraNode.NodeParent, babylonScene, scene);
            }

            babylonCamera.fov = Tools.ConvertFov(maxCamera.GetFOV(0, Tools.Forever));

            if (maxCamera.ManualClip == 1)
            {
                babylonCamera.minZ = maxCamera.GetClipDist(0, 1, Tools.Forever);
                babylonCamera.maxZ = maxCamera.GetClipDist(0, 2, Tools.Forever);
            }
            else
            {
                babylonCamera.minZ = 0.1f;
                babylonCamera.maxZ = 10000.0f;
            }

            if (babylonCamera.minZ == 0.0f)
            {
                babylonCamera.minZ = 0.1f;
            }

            // Type
            babylonCamera.type = cameraNode.MaxNode.GetStringProperty("babylonjs_type", "FreeCamera");

            // Control
            babylonCamera.speed = cameraNode.MaxNode.GetFloatProperty("babylonjs_speed", 1.0f);
            babylonCamera.inertia = cameraNode.MaxNode.GetFloatProperty("babylonjs_inertia", 0.9f);

            // Collisions
            babylonCamera.checkCollisions = cameraNode.MaxNode.GetBoolProperty("babylonjs_checkcollisions");
            babylonCamera.applyGravity = cameraNode.MaxNode.GetBoolProperty("babylonjs_applygravity");
            babylonCamera.ellipsoid = cameraNode.MaxNode.GetVector3Property("babylonjs_ellipsoid");

            // Position
            var wm = cameraNode.GetLocalTM(0);
            if (cameraNode.NodeParent != null)
            {
                var parentWorld = cameraNode.NodeParent.GetObjectTM(0);
                wm.MultiplyBy(parentWorld.Inverse);
            }
            var position = wm.Translation;
            babylonCamera.position = new [] { position.X, position.Y, position.Z };

            // Target
            var target = gameCamera.CameraTarget;
            if (target != null)
            {
                babylonCamera.lockedTargetId = target.MaxNode.GetGuid().ToString();
            }
            else
            {
                var dir = wm.GetRow(3);
                babylonCamera.target = new [] { position.X - dir.X, position.Y - dir.Y, position.Z - dir.Z };
            }

            // Animations
            var animations = new List<BabylonAnimation>();

            ExportVector3Animation("position", animations, key =>
            {
                var tm = cameraNode.GetLocalTM(key);
                if (cameraNode.NodeParent != null)
                {
                    var parentWorld = cameraNode.NodeParent.GetObjectTM(key);
                    tm.MultiplyBy(parentWorld.Inverse);
                }
                var translation = tm.Translation;
                return new [] { translation.X, translation.Y, translation.Z };
            });

            if (gameCamera.CameraTarget == null)
            {
                ExportVector3Animation("target", animations, key =>
                {
                    var tm = cameraNode.GetLocalTM(key);
                    if (cameraNode.NodeParent != null)
                    {
                        var parentWorld = cameraNode.NodeParent.GetObjectTM(key);
                        tm.MultiplyBy(parentWorld.Inverse);
                    }
                    var translation = tm.Translation;
                    var dir = tm.GetRow(3);
                    return new float[] { translation.X - dir.X, translation.Y - dir.Y, translation.Z - dir.Z };
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
