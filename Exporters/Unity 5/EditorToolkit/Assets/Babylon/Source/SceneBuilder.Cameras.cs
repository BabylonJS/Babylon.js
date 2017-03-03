using System;
using System.IO;
using System.Collections.Generic;
using BabylonExport.Entities;
using UnityEngine;
using UnityEditor;

namespace Unity3D2Babylon
{
    partial class SceneBuilder
    {
        private void ConvertUnityCameraToBabylon(Camera camera, GameObject gameObject, float progress, ref UnityMetaData metaData, ref List<BabylonExport.Entities.BabylonParticleSystem> particleSystems, ref List<UnityFlareSystem> lensFlares, ref string componentTags)
        {
            ExporterWindow.ReportProgress(progress, "Exporting camera: " + camera.name);

            BabylonUniversalCamera babylonCamera = new BabylonUniversalCamera
            {
                name = camera.name,
                id = GetID(camera.gameObject),
                fov = camera.fieldOfView * (float)Math.PI / 180,
                minZ = camera.nearClipPlane,
                maxZ = camera.farClipPlane,
                parentId = GetParentID(camera.transform),
                position = camera.transform.localPosition.ToFloat()
            };
            metaData.type = "Camera";
            metaData.properties.Add("hdr", camera.hdr);
            metaData.properties.Add("clearFlags", camera.clearFlags.ToString());
            metaData.properties.Add("cullingMask", camera.cullingMask);
            metaData.properties.Add("stereoEnabled", camera.stereoEnabled);
            metaData.properties.Add("isOrthographic", camera.orthographic);
            metaData.properties.Add("useOcclusionCulling", camera.useOcclusionCulling);
            babylonCamera.tags = componentTags;

            var target = new Vector3(0, 0, 1);
            var transformedTarget = camera.transform.TransformDirection(target);
            babylonCamera.target = (camera.transform.position + transformedTarget).ToFloat();
            babylonCamera.isStereoscopicSideBySide = camera.stereoEnabled;
            if (camera.orthographic)
            {
                float vert = camera.orthographicSize;
                float horz = vert * exportationOptions.DefaultAspectRatio;
                babylonCamera.orthoTop = vert;
                babylonCamera.orthoBottom = -vert;
                babylonCamera.orthoLeft = -horz;
                babylonCamera.orthoRight = horz;
                babylonCamera.mode = 1;
            }
            else
            {
                babylonCamera.mode = 0;
            }

            babylonCamera.metadata = metaData;
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
                if (SceneController != null) {
                    babylonCamera.applyGravity = (SceneController.sceneOptions.defaultGravity.y == 0 && SceneController.sceneOptions.defaultGravity.y == 0 && SceneController.sceneOptions.defaultGravity.z == 0) ? false : true;
                    babylonCamera.ellipsoid = SceneController.sceneOptions.cameraEllipsoid.ToFloat();
                }
            }

            // Lens Flares
            ParseLensFlares(gameObject, babylonCamera.id, ref lensFlares);

            // Particles Systems
            ParseParticleSystems(gameObject, babylonCamera.id, ref particleSystems);
        }

        private void ConvertUnitySkyboxToBabylon(Camera camera, float progress)
        {
            // Skybox
            bool png = (exportationOptions.DefaultImageFormat == (int)BabylonImageFormat.PNG);
            string fext = (png == true) ? ".png" : ".jpg";

            if ((camera.clearFlags & CameraClearFlags.Skybox) == CameraClearFlags.Skybox)
            {
                if (RenderSettings.skybox != null)
                {
                    BabylonTexture skytex = null;
                    if (RenderSettings.skybox.shader.name == "Skybox/Cubemap")
                    {
                        var cubeMap = RenderSettings.skybox.GetTexture("_Tex") as Cubemap;
                        if (cubeMap != null)
                        {
                            var srcTexturePath = AssetDatabase.GetAssetPath(cubeMap);
                            if (srcTexturePath.EndsWith(".hdr", StringComparison.OrdinalIgnoreCase))
                            {
                                var hdr = new BabylonHDRCubeTexture();
                                hdr.size = cubeMap.width;
                                skytex = hdr;
                                CopyTextureCube(String.Format("{0}Skybox.hdr", SceneName), cubeMap, skytex, true);
                            }
                            else
                            {
                                skytex = new BabylonTexture();
                                CopyTextureCube(String.Format("{0}Skybox.hdr", SceneName), cubeMap, skytex, false);
                                if (png) skytex.extensions = new string[] { "_px.png", "_py.png", "_pz.png", "_nx.png", "_ny.png", "_nz.png" };
                            }
                        }
                    }
                    else if (RenderSettings.skybox.shader.name == "Skybox/6 Sided")
                    {
                        var frontTexture = RenderSettings.skybox.GetTexture("_FrontTex") as Texture2D;
                        var backTexture = RenderSettings.skybox.GetTexture("_BackTex") as Texture2D;
                        var leftTexture = RenderSettings.skybox.GetTexture("_LeftTex") as Texture2D;
                        var rightTexture = RenderSettings.skybox.GetTexture("_RightTex") as Texture2D;
                        var upTexture = RenderSettings.skybox.GetTexture("_UpTex") as Texture2D;
                        var downTexture = RenderSettings.skybox.GetTexture("_DownTex") as Texture2D;
                        if (frontTexture != null && backTexture != null && leftTexture != null && rightTexture != null && upTexture != null && downTexture != null)
                        {
                            skytex = new BabylonTexture();
                            skytex.name = String.Format("{0}Skybox", SceneName);

                            var frontTextureName = String.Format("{0}_pz{1}", skytex.name, fext);
                            var frontTexturePath = Path.Combine(babylonScene.OutputPath, frontTextureName);
                            CopyTextureFace(frontTexturePath, frontTextureName, frontTexture);

                            var backTextureName = String.Format("{0}_nz{1}", skytex.name, fext);
                            var backTexturePath = Path.Combine(babylonScene.OutputPath, backTextureName);
                            CopyTextureFace(backTexturePath, backTextureName, backTexture);

                            var leftTextureName = String.Format("{0}_px{1}", skytex.name, fext);
                            var leftTexturePath = Path.Combine(babylonScene.OutputPath, leftTextureName);
                            CopyTextureFace(leftTexturePath, leftTextureName, leftTexture);

                            var rightTextureName = String.Format("{0}_nx{1}", skytex.name, fext);
                            var rightTexturePath = Path.Combine(babylonScene.OutputPath, rightTextureName);
                            CopyTextureFace(rightTexturePath, rightTextureName, rightTexture);

                            var upTextureName = String.Format("{0}_py{1}", skytex.name, fext);
                            var upTexturePath = Path.Combine(babylonScene.OutputPath, upTextureName);
                            CopyTextureFace(upTexturePath, upTextureName, upTexture);

                            var downTextureName = String.Format("{0}_ny{1}", skytex.name, fext);
                            var downTexturePath = Path.Combine(babylonScene.OutputPath, downTextureName);
                            CopyTextureFace(downTexturePath, downTexturePath, downTexture);
                            if (png) skytex.extensions = new string[] { "_px.png", "_py.png", "_pz.png", "_nx.png", "_ny.png", "_nz.png" };
                        }
                    }
                    if (skytex != null)
                    {
                        skytex.isCube = true;
                        skytex.coordinatesMode = 5;
                        skytex.level = (SceneController != null) ? SceneController.skyboxOptions.lightIntensity : 1.0f;

                        var skybox = new BabylonMesh();
                        skybox.name = "sceneSkyboxMesh";
                        skybox.id = Guid.NewGuid().ToString();
                        skybox.indices = new[] { 0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23 };
                        skybox.positions = new[] { 50.0f, -50.0f, 50.0f, -50.0f, -50.0f, 50.0f, -50.0f, 50.0f, 50.0f, 50.0f, 50.0f, 50.0f, 50.0f, 50.0f, -50.0f, -50.0f, 50.0f, -50.0f, -50.0f, -50.0f, -50.0f, 50.0f, -50.0f, -50.0f, 50.0f, 50.0f, -50.0f, 50.0f, -50.0f, -50.0f, 50.0f, -50.0f, 50.0f, 50.0f, 50.0f, 50.0f, -50.0f, 50.0f, 50.0f, -50.0f, -50.0f, 50.0f, -50.0f, -50.0f, -50.0f, -50.0f, 50.0f, -50.0f, -50.0f, 50.0f, 50.0f, -50.0f, 50.0f, -50.0f, 50.0f, 50.0f, -50.0f, 50.0f, 50.0f, 50.0f, 50.0f, -50.0f, 50.0f, 50.0f, -50.0f, -50.0f, -50.0f, -50.0f, -50.0f, -50.0f, -50.0f, 50.0f };
                        skybox.uvs = new[] { 1.0f, 1.0f, 0.0f, 1.0f, 0.0f, 0.0f, 1.0f, 0.0f, 1.0f, 1.0f, 0.0f, 1.0f, 0.0f, 0.0f, 1.0f, 0.0f, 1.0f, 1.0f, 0.0f, 1.0f, 0.0f, 0.0f, 1.0f, 0.0f, 1.0f, 1.0f, 0.0f, 1.0f, 0.0f, 0.0f, 1.0f, 0.0f, 1.0f, 1.0f, 0.0f, 1.0f, 0.0f, 0.0f, 1.0f, 0.0f, 1.0f, 1.0f, 0.0f, 1.0f, 0.0f, 0.0f, 1.0f, 0.0f };
                        skybox.normals = new[] { 0.0f, 0.0f, 1.0f, 0.0f, 0.0f, 1.0f, 0.0f, 0.0f, 1.0f, 0.0f, 0.0f, 1.0f, 0.0f, 0.0f, -1.0f, 0.0f, 0.0f, -1.0f, 0.0f, 0.0f, -1.0f, 0.0f, 0.0f, -1.0f, 1.0f, 0.0f, 0.0f, 1.0f, 0.0f, 0.0f, 1.0f, 0.0f, 0.0f, 1.0f, 0.0f, 0.0f, -1.0f, 0.0f, 0.0f, -1.0f, 0.0f, 0.0f, -1.0f, 0.0f, 0.0f, -1.0f, 0.0f, 0.0f, 0.0f, 1.0f, 0.0f, 0.0f, 1.0f, 0.0f, 0.0f, 1.0f, 0.0f, 0.0f, 1.0f, 0.0f, 0.0f, -1.0f, 0.0f, 0.0f, -1.0f, 0.0f, 0.0f, -1.0f, 0.0f, 0.0f, -1.0f, 0, 0f };

                        if (SceneController != null)
                        {
                            Color skycolor = SceneController.skyboxOptions.albedoColor;
                            Color skyreflect = SceneController.skyboxOptions.reflectivityColor;
                            var skyboxMaterial = new BabylonPBRMaterial()
                            {
                                name = "sceneSkyboxMaterial",
                                id = Guid.NewGuid().ToString(),
                                albedo = skycolor.ToFloat(),
                                reflectivity = skyreflect.ToFloat(),
                                microSurface = SceneController.skyboxOptions.microSurface,
                                cameraContrast = SceneController.skyboxOptions.cameraContrast,
                                cameraExposure = SceneController.skyboxOptions.cameraExposure,
                                directIntensity = SceneController.skyboxOptions.directIntensity,
                                emissiveIntensity = SceneController.skyboxOptions.emissiveIntensity,
                                specularIntensity = SceneController.skyboxOptions.specularIntensity,
                                environmentIntensity = SceneController.skyboxOptions.environmentIntensity
                            };

                            skyboxMaterial.reflectionTexture = skytex;
                            skyboxMaterial.backFaceCulling = false;
                            skyboxMaterial.disableLighting = true;
                            skybox.materialId = skyboxMaterial.id;
                            skybox.infiniteDistance = true;

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
