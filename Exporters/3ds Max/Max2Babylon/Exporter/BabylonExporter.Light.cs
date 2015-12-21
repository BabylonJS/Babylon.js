using System;
using System.Collections.Generic;
using Autodesk.Max;
using BabylonExport.Entities;
using System.Linq;

namespace Max2Babylon
{
    partial class BabylonExporter
    {
        void ExportDefaultLight(BabylonScene babylonScene)
        {
            var babylonLight = new BabylonLight();
            babylonLight.name = "Default light";
            babylonLight.id = Guid.NewGuid().ToString();
            babylonLight.type = 3;
            babylonLight.groundColor = new float[] { 0, 0, 0 };
            babylonLight.direction = new[] { 0, 1.0f, 0 };

            babylonLight.intensity = 1;

            babylonLight.diffuse = new[] { 1.0f, 1.0f, 1.0f };
            babylonLight.specular = new[] { 1.0f, 1.0f, 1.0f };

            babylonScene.LightsList.Add(babylonLight);
        }

        private void ExportLight(IIGameScene scene, IIGameNode lightNode, BabylonScene babylonScene)
        {
            if (lightNode.MaxNode.GetBoolProperty("babylonjs_noexport"))
            {
                return;
            }

            var gameLight = lightNode.IGameObject.AsGameLight();
            var initialized = gameLight.InitializeData;
            var babylonLight = new BabylonLight();

            RaiseMessage(lightNode.Name, 1);
            babylonLight.name = lightNode.Name;
            babylonLight.id = lightNode.MaxNode.GetGuid().ToString();
            if (lightNode.NodeParent != null)
            {
                babylonLight.parentId = GetParentID(lightNode.NodeParent, babylonScene, scene);
            }

            // Type

            var maxLight = (lightNode.MaxNode.ObjectRef as ILightObject);
            var lightState = Loader.Global.LightState.Create();
            maxLight.EvalLightState(0, Tools.Forever, lightState);

            switch (lightState.Type)
            {
                case LightType.OmniLgt:
                    babylonLight.type = 0;
                    break;
                case LightType.SpotLgt:
                    babylonLight.type = 2;
                    babylonLight.angle = (float)(maxLight.GetFallsize(0, Tools.Forever) * Math.PI / 180.0f);
                    babylonLight.exponent = 1;
                    break;
                case LightType.DirectLgt:
                    babylonLight.type = 1;
                    break;
                case LightType.AmbientLgt:
                    babylonLight.type = 3;
                    babylonLight.groundColor = new float[] { 0, 0, 0 };
                    break;
            }


            // Shadows 
            if (maxLight.ShadowMethod == 1)
            {
                if (lightState.Type == LightType.DirectLgt || lightState.Type == LightType.SpotLgt || lightState.Type == LightType.OmniLgt)
                {
                    ExportShadowGenerator(lightNode.MaxNode, babylonScene);
                }
                else
                {
                    RaiseWarning("Shadows maps are only supported for point, directional and spot lights", 2);
                }
            }

            // Position
            var wm = lightNode.GetObjectTM(0);
            if (lightNode.NodeParent != null)
            {
                var parentWorld = lightNode.NodeParent.GetObjectTM(0);
                wm.MultiplyBy(parentWorld.Inverse);
            }
            var position = wm.Translation;
            babylonLight.position = new[] { position.X, position.Y, position.Z };

            // Direction
            var target = gameLight.LightTarget;
            if (target != null)
            {
                var targetWm = target.GetObjectTM(0);
                var targetPosition = targetWm.Translation;

                var direction = targetPosition.Subtract(position).Normalize;
                babylonLight.direction = new[] { direction.X, direction.Y, direction.Z };
            }
            else
            {
                var vDir = Loader.Global.Point3.Create(0, -1, 0);
                vDir = wm.ExtractMatrix3().VectorTransform(vDir).Normalize;
                babylonLight.direction = new[] { vDir.X, vDir.Y, vDir.Z };
            }

            var maxScene = Loader.Core.RootNode;

            // Exclusion
            var inclusion = maxLight.ExclList.TestFlag(1); //NT_INCLUDE 
            var checkExclusionList = maxLight.ExclList.TestFlag(2); //NT_AFFECT_ILLUM

            if (checkExclusionList)
            {
                var excllist = new List<string>();
                var incllist = new List<string>();

                foreach (var meshNode in maxScene.NodesListBySuperClass(SClass_ID.Geomobject))
                {
                    if (meshNode.CastShadows == 1)
                    {
                        var inList = maxLight.ExclList.FindNode(meshNode) != -1;

                        if (inList)
                        {
                            if (inclusion)
                            {
                                incllist.Add(meshNode.GetGuid().ToString());
                            }
                            else
                            {
                                excllist.Add(meshNode.GetGuid().ToString());
                            }
                        }
                    }
                }

                babylonLight.includedOnlyMeshesIds = incllist.ToArray();
                babylonLight.excludedMeshesIds = excllist.ToArray();
            }

            // Other fields 
            babylonLight.intensity = maxLight.GetIntensity(0, Tools.Forever);


            babylonLight.diffuse = lightState.AffectDiffuse ? maxLight.GetRGBColor(0, Tools.Forever).ToArray() : new float[] { 0, 0, 0 };
            babylonLight.specular = lightState.AffectDiffuse ? maxLight.GetRGBColor(0, Tools.Forever).ToArray() : new float[] { 0, 0, 0 };


            if (maxLight.UseAtten)
            {
                babylonLight.range = maxLight.GetAtten(0, 3, Tools.Forever);
            }


            // Animations
            var animations = new List<BabylonAnimation>();

            ExportVector3Animation("position", animations, key =>
            {
                var mat = lightNode.GetObjectTM(key);
                if (lightNode.NodeParent != null)
                {
                    var parentWorld = lightNode.NodeParent.GetObjectTM(key);
                    mat.MultiplyBy(parentWorld.Inverse);
                }
                var pos = mat.Translation;
                return new[] { pos.X, pos.Y, pos.Z };
            });

            ExportVector3Animation("direction", animations, key =>
            {
                var wmLight = lightNode.GetObjectTM(key);
                if (lightNode.NodeParent != null)
                {
                    var parentWorld = lightNode.NodeParent.GetObjectTM(key);
                    wmLight.MultiplyBy(parentWorld.Inverse);
                }
                var positionLight = wmLight.Translation;
                var lightTarget = gameLight.LightTarget;
                if (lightTarget != null)
                {
                    var targetWm = lightTarget.GetObjectTM(key);
                    var targetPosition = targetWm.Translation;

                    var direction = targetPosition.Subtract(positionLight).Normalize;
                    return new[] { direction.X, direction.Y, direction.Z };
                }
                else
                {
                    var vDir = Loader.Global.Point3.Create(0, -1, 0);
                    vDir = wmLight.ExtractMatrix3().VectorTransform(vDir).Normalize;
                    return new[] { vDir.X, vDir.Y, vDir.Z };
                }
            });

            ExportFloatAnimation("intensity", animations, key => new[] { maxLight.GetIntensity(key, Tools.Forever) });

            ExportColor3Animation("diffuse", animations, key =>
            {
                return lightState.AffectDiffuse? maxLight.GetRGBColor(key, Tools.Forever).ToArray() : new float[] { 0, 0, 0 };
            });

            babylonLight.animations = animations.ToArray();

            if (lightNode.MaxNode.GetBoolProperty("babylonjs_autoanimate"))
            {
                babylonLight.autoAnimate = true;
                babylonLight.autoAnimateFrom = (int)lightNode.MaxNode.GetFloatProperty("babylonjs_autoanimate_from");
                babylonLight.autoAnimateTo = (int)lightNode.MaxNode.GetFloatProperty("babylonjs_autoanimate_to");
                babylonLight.autoAnimateLoop = lightNode.MaxNode.GetBoolProperty("babylonjs_autoanimateloop");
            }

            babylonScene.LightsList.Add(babylonLight);
        }
    }
}
