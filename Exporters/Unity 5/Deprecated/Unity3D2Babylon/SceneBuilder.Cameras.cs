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

        private void ConvertUnitySkyboxToBabylon(Camera camera, float progress)
        {
            // Skybox
            if ((camera.clearFlags & CameraClearFlags.Skybox) == CameraClearFlags.Skybox)
            {
                if (RenderSettings.skybox != null)
                {
                    if (RenderSettings.skybox.shader.name == "Skybox/Cubemap")
                    {
                        var cubeMap = RenderSettings.skybox.GetTexture("_Tex") as Cubemap;
                        if (cubeMap != null)
                        {
                            var skytex = new BabylonTexture();
                            CopyTextureCube("sceneSkybox.hdr", cubeMap, skytex);
                            skytex.coordinatesMode = 5;
                            skytex.level = RenderSettings.reflectionIntensity;

                            BabylonMesh skybox = new BabylonMesh();
                            skybox.indices = new[] { 0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23 };
                            skybox.positions = new[] { 50.0f, -50.0f, 50.0f, -50.0f, -50.0f, 50.0f, -50.0f, 50.0f, 50.0f, 50.0f, 50.0f, 50.0f, 50.0f, 50.0f, -50.0f, -50.0f, 50.0f, -50.0f, -50.0f, -50.0f, -50.0f, 50.0f, -50.0f, -50.0f, 50.0f, 50.0f, -50.0f, 50.0f, -50.0f, -50.0f, 50.0f, -50.0f, 50.0f, 50.0f, 50.0f, 50.0f, -50.0f, 50.0f, 50.0f, -50.0f, -50.0f, 50.0f, -50.0f, -50.0f, -50.0f, -50.0f, 50.0f, -50.0f, -50.0f, 50.0f, 50.0f, -50.0f, 50.0f, -50.0f, 50.0f, 50.0f, -50.0f, 50.0f, 50.0f, 50.0f, 50.0f, -50.0f, 50.0f, 50.0f, -50.0f, -50.0f, -50.0f, -50.0f, -50.0f, -50.0f, -50.0f, 50.0f };
                            skybox.uvs = new[] { 1.0f, 1.0f, 0.0f, 1.0f, 0.0f, 0.0f, 1.0f, 0.0f, 1.0f, 1.0f, 0.0f, 1.0f, 0.0f, 0.0f, 1.0f, 0.0f, 1.0f, 1.0f, 0.0f, 1.0f, 0.0f, 0.0f, 1.0f, 0.0f, 1.0f, 1.0f, 0.0f, 1.0f, 0.0f, 0.0f, 1.0f, 0.0f, 1.0f, 1.0f, 0.0f, 1.0f, 0.0f, 0.0f, 1.0f, 0.0f, 1.0f, 1.0f, 0.0f, 1.0f, 0.0f, 0.0f, 1.0f, 0.0f };
                            skybox.normals = new[] { 0.0f, 0.0f, 1.0f, 0.0f, 0.0f, 1.0f, 0.0f, 0.0f, 1.0f, 0.0f, 0.0f, 1.0f, 0.0f, 0.0f, -1.0f, 0.0f, 0.0f, -1.0f, 0.0f, 0.0f, -1.0f, 0.0f, 0.0f, -1.0f, 1.0f, 0.0f, 0.0f, 1.0f, 0.0f, 0.0f, 1.0f, 0.0f, 0.0f, 1.0f, 0.0f, 0.0f, -1.0f, 0.0f, 0.0f, -1.0f, 0.0f, 0.0f, -1.0f, 0.0f, 0.0f, -1.0f, 0.0f, 0.0f, 0.0f, 1.0f, 0.0f, 0.0f, 1.0f, 0.0f, 0.0f, 1.0f, 0.0f, 0.0f, 1.0f, 0.0f, 0.0f, -1.0f, 0.0f, 0.0f, -1.0f, 0.0f, 0.0f, -1.0f, 0.0f, 0.0f, -1.0f, 0,0f };

                            var skyboxMaterial = new BabylonPBRMaterial()
                            {
                                name = "sceneSkyboxMaterial",
                                id = Guid.NewGuid().ToString(),
                                albedo = new[] { 1.0f, 1.0f, 1.0f, 1.0f },
                                reflectivity = new[] { 0.0f, 0.0f, 0.0f },
                                microSurface = 1.0f,
                                directIntensity = 0.0f,
                                specularIntensity = 0.0f,
                                environmentIntensity = 1.0f
                            };
                            skyboxMaterial.backFaceCulling = false;
                            skybox.materialId = skyboxMaterial.id;
                            skybox.infiniteDistance = true;
                            skyboxMaterial.reflectionTexture = skytex;
                            
                            babylonScene.MeshesList.Add(skybox);
                            babylonScene.MaterialsList.Add(skyboxMaterial);
                            babylonScene.AddTextureCube("sceneSkyboxMaterial");
                        }
                    }
                }
            }
        }
    }
}
