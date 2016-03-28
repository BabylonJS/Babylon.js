using System;
using System.Collections.Generic;
using BabylonExport.Entities;
using UnityEngine;
using UnityEngine.Rendering;

namespace Unity3D2Babylon
{
    partial class SceneBuilder
    {
        private void GenerateShadowsGenerator(Light light)
        {
            var generator = new BabylonShadowGenerator
            {
                lightId = GetID(light.gameObject),
                usePoissonSampling = light.shadows == LightShadows.Soft,
                mapSize = 256 + 256 * QualitySettings.GetQualityLevel(),
                bias = light.shadowBias / 10.0f
            };

            var renderList = new List<string>();
            foreach (var gameObject in gameObjects)
            {
                var meshFilter = gameObject.GetComponent<MeshFilter>();
                var renderer = gameObject.GetComponent<Renderer>();
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

            generator.renderList = renderList.ToArray();

            babylonScene.ShadowGeneratorsList.Add(generator);
        }

        private void ConvertUnityLightToBabylon(Light light, float progress)
        {
            if (!light.isActiveAndEnabled || light.alreadyLightmapped)
            {
                return;
            }

            ExporterWindow.ReportProgress(progress, "Exporting light: " + light.name);

            BabylonLight babylonLight = new BabylonLight
            {
                name = light.name,
                id = GetID(light.gameObject),
                parentId = GetParentID(light.transform)
            };
            
            switch (light.type)
            {
                case LightType.Spot:
                    babylonLight.type = 2;
                    break;
                case LightType.Directional:
                    babylonLight.type = 1;
                    break;
                case LightType.Point:
                    babylonLight.type = 0;
                    babylonLight.range = light.range;
                    break;
                case LightType.Area:
                    // TODO
                    break;
            }

            babylonLight.position = light.transform.localPosition.ToFloat();

            var direction = new Vector3(0, 0, 1);
            var transformedDirection = light.transform.TransformDirection(direction);
            babylonLight.direction = transformedDirection.ToFloat();

            babylonLight.diffuse = light.color.ToFloat();

            babylonLight.intensity = light.intensity;

            babylonLight.angle = light.spotAngle * (float)Math.PI / 180;
            babylonLight.exponent = 1.0f;

            babylonScene.LightsList.Add(babylonLight);

            // Animations
            ExportAnimations(light.transform, babylonLight);

            // Shadows
            if ((light.type == LightType.Directional || light.type == LightType.Spot) && light.shadows != LightShadows.None)
            {
                GenerateShadowsGenerator(light);
            }
        }
    }
}
