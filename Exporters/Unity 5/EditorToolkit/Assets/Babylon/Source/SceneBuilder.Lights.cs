using System;
using System.IO;
using System.Collections.Generic;
using BabylonExport.Entities;
using UnityEditor;
using UnityEngine;
using UnityEngine.Rendering;

namespace Unity3D2Babylon
{
    partial class SceneBuilder
    {
        private void GenerateShadowsGenerator(Light light, float progress)
        {
            var generator = new BabylonShadowGenerator
            {
                lightId = GetID(light.gameObject),
                mapSize = exportationOptions.ShadowMapSize,
                blurScale = exportationOptions.ShadowBlurScale,
                bias = exportationOptions.ShadowMapBias,
                forceBackFacesOnly = false
            };

            BabylonLightingFilter filter = (BabylonLightingFilter)exportationOptions.DefaultLightFilter;
            switch (filter)
            {
                case BabylonLightingFilter.PoissonSampling:
                    generator.usePoissonSampling = true;
                    break;
                case BabylonLightingFilter.VarianceShadowMap:
                    generator.useVarianceShadowMap = true;
                    break;
                case BabylonLightingFilter.BlurVarianceShadowMap:
                    generator.useBlurVarianceShadowMap = true;
                    break;
                case BabylonLightingFilter.SoftPoissonSampling:
                    generator.usePoissonSampling = (light.shadows == LightShadows.Soft);
                    break;
            }

            var renderList = new List<string>();
            foreach (var gameObject in gameObjects)
            {
                var shadowBake = gameObject.GetComponent<BabylonShadowBake>();
                bool realtimeShadows = (shadowBake != null && shadowBake.shadowOption == BabylonShadowOptions.Realtime);
                if (realtimeShadows)
                {
                    var renderer = gameObject.GetComponent<Renderer>();
                    var meshFilter = gameObject.GetComponent<MeshFilter>();
                    if (meshFilter != null && renderer != null && renderer.shadowCastingMode != ShadowCastingMode.Off)
                    {
                        renderList.Add(GetID(gameObject));
                        continue;
                    }
                    var skinnedMesh = gameObject.GetComponent<SkinnedMeshRenderer>();
                    if (skinnedMesh != null && renderer != null && renderer.shadowCastingMode != ShadowCastingMode.Off)
                    {
                        renderList.Add(GetID(gameObject));
                    }
                }
            }

            generator.renderList = renderList.ToArray();

            babylonScene.ShadowGeneratorsList.Add(generator);
        }

        private void ConvertUnityLightToBabylon(Light light, GameObject gameObject, float progress, ref UnityMetaData metaData, ref List<BabylonExport.Entities.BabylonParticleSystem> particleSystems, ref List<UnityFlareSystem> lensFlares, ref string componentTags)
        {
            // No Inactive Or Baking Lights
            if (light.isActiveAndEnabled == false || light.type == LightType.Area || light.lightmappingMode == LightmappingMode.Baked) return;

            ExporterWindow.ReportProgress(progress, "Exporting light: " + light.name);
            BabylonLight babylonLight = new BabylonLight
            {
                name = light.name,
                id = GetID(light.gameObject),
                parentId = GetParentID(light.transform)
            };
            metaData.type = "Light";
            babylonLight.tags = componentTags;

            switch (light.type)
            {
                case LightType.Point:
                    babylonLight.type = 0;
                    babylonLight.range = light.range;
                    break;
                case LightType.Directional:
                    babylonLight.type = 1;
                    break;
                case LightType.Spot:
                    babylonLight.type = 2;
                    break;
            }

            babylonLight.position = light.transform.localPosition.ToFloat();

            var direction = new Vector3(0, 0, 1);
            var transformedDirection = light.transform.TransformDirection(direction);
            transformedDirection[0] += exportationOptions.LightRotationOffset.X;
            transformedDirection[1] += exportationOptions.LightRotationOffset.Y;
            transformedDirection[2] += exportationOptions.LightRotationOffset.Z;
            babylonLight.direction = transformedDirection.ToFloat();
            
            babylonLight.diffuse = light.color.ToFloat();

            babylonLight.intensity = light.intensity * exportationOptions.LightIntensityFactor;

            babylonLight.angle = light.spotAngle * (float)Math.PI / 180;
            babylonLight.exponent = 1.0f;

            babylonLight.metadata = metaData;
            babylonScene.LightsList.Add(babylonLight);

            // Animations
            ExportAnimations(light.transform, babylonLight);

            // Lens Flares
            ParseLensFlares(gameObject, babylonLight.id, ref lensFlares);

            // Particles Systems
            ParseParticleSystems(gameObject, babylonLight.id, ref particleSystems);

            // Shadow Maps
            if (exportationOptions.ExportShadows)
            {
                if ((light.type == LightType.Directional || light.type == LightType.Spot) && light.shadows != LightShadows.None)
                {
                    GenerateShadowsGenerator(light, progress);
                }
            }
        }
    }
}
