using System;
using System.Collections.Generic;
using Autodesk.Max;
using BabylonExport.Entities;

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

        private void ExportLight(IINode lightNode, BabylonScene babylonScene)
        {
            if (lightNode.GetBoolProperty("babylonjs_noexport"))
            {
                return;
            }

            var maxLight = (lightNode.ObjectRef as ILightObject);
            var babylonLight = new BabylonLight();

            RaiseMessage(lightNode.Name, 1);
            babylonLight.name = lightNode.Name;
            babylonLight.id = lightNode.GetGuid().ToString();

            // Type
            var lightState = Loader.Global.LightState.Create();
            maxLight.EvalLightState(0, Tools.Forever, lightState);
            var directionScale = -1;

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
                    directionScale = 1;
                    break;
            }

            // Shadows
            if (maxLight.ShadowMethod == 1)
            {
                if (lightState.Type == LightType.DirectLgt)
                {
                    ExportShadowGenerator(lightNode, babylonScene);
                }
                else
                {
                    RaiseWarning("Shadows maps are only supported for directional lights", 2);
                }
            }

            // Position
            var wm = lightNode.GetWorldMatrix(0, false);
            var position = wm.Trans;
            babylonLight.position = position.ToArraySwitched();

            // Direction
            var target = lightNode.Target;
            if (target != null)
            {
                var targetWm = target.GetObjTMBeforeWSM(0, Tools.Forever);
                var targetPosition = targetWm.Trans;

                var direction = targetPosition.Subtract(position);
                babylonLight.direction = direction.ToArraySwitched();
            }
            else
            {
                var dir = wm.GetRow(2).MultiplyBy(directionScale);
                babylonLight.direction = dir.ToArraySwitched();
            }

            // Exclusion
            var maxScene = Loader.Core.RootNode;
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
                babylonLight.range = maxLight.GetAtten(0, 1, Tools.Forever);
            }

            // Animations
            var animations = new List<BabylonAnimation>();

            if (!ExportVector3Controller(lightNode.TMController.PositionController, "position", animations))
            {
                ExportVector3Animation("position", animations, key =>
                {
                    var worldMatrix = lightNode.GetWorldMatrix(key, lightNode.HasParent());
                    return worldMatrix.Trans.ToArraySwitched();
                });
            }

            ExportVector3Animation("direction", animations, key =>
            {
                var targetNode = lightNode.Target;
                if (targetNode != null)
                {
                    var targetWm = target.GetObjTMBeforeWSM(0, Tools.Forever);
                    var targetPosition = targetWm.Trans;

                    var direction = targetPosition.Subtract(position);
                    return direction.ToArraySwitched();
                }
                
                var dir = wm.GetRow(2).MultiplyBy(directionScale);
                return dir.ToArraySwitched();
            });

            ExportFloatAnimation("intensity", animations, key => new[] { maxLight.GetIntensity(key, Tools.Forever) });

            babylonLight.animations = animations.ToArray();

            if (lightNode.GetBoolProperty("babylonjs_autoanimate"))
            {
                babylonLight.autoAnimate = true;
                babylonLight.autoAnimateFrom = (int)lightNode.GetFloatProperty("babylonjs_autoanimate_from");
                babylonLight.autoAnimateTo = (int)lightNode.GetFloatProperty("babylonjs_autoanimate_to");
                babylonLight.autoAnimateLoop = lightNode.GetBoolProperty("babylonjs_autoanimateloop");
            }

            babylonScene.LightsList.Add(babylonLight);
        }
    }
}
