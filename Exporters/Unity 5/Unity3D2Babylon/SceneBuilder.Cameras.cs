using System;
using BabylonExport.Entities;
using UnityEngine;

namespace Unity3D2Babylon
{
    partial class SceneBuilder
    {
        private void ConvertUnityCameraToBabylon(Camera camera, float progress)
        {
            ExporterWindow.ReportProgress(progress, "Exporting camera: " + camera.name);

            BabylonCamera babylonCamera = new BabylonCamera
            {
                name = camera.name,
                id = GetID(camera.gameObject),
                fov = camera.fieldOfView*(float) Math.PI/180,
                minZ = camera.nearClipPlane,
                maxZ = camera.farClipPlane,
                parentId = GetParentID(camera.transform),
                position = camera.transform.localPosition.ToFloat()
            };

            var target = new Vector3(0, 0, 1);
            var transformedTarget = camera.transform.TransformDirection(target);
            babylonCamera.target = (camera.transform.position + transformedTarget).ToFloat();

            babylonScene.CamerasList.Add(babylonCamera);

            if (Camera.main == camera)
            {
                babylonScene.activeCameraID = babylonCamera.id;
                babylonScene.clearColor = camera.backgroundColor.ToFloat();
            }

            // Animations
            ExportAnimations(camera.transform, babylonCamera);

            // Collisions
            if (exportationOptions.ExportCollisions)
            {
                babylonCamera.checkCollisions = true;
                babylonCamera.applyGravity = true;
                babylonCamera.ellipsoid = exportationOptions.CameraEllipsoid.ToFloat();
            }
        }
    }
}
