using System;
using System.Collections.Generic;
using Autodesk.Max;
using BabylonExport.Entities;
using MaxSharp;

namespace Max2Babylon
{
    partial class BabylonExporter
    {
        private BabylonLight ExportLight(Node lightNode, BabylonScene babylonScene)
        {
            var maxLight = (lightNode.Object as Light);
            var babylonLight = new BabylonLight();

            RaiseMessage(maxLight.Name, true);
            babylonLight.name = lightNode.Name;
            babylonLight.id = lightNode.GetGuid().ToString();

            // Type
            var lightState = Loader.Global.LightState.Create();
            maxLight._Light.EvalLightState(0, Interval.Forever._IInterval, lightState);
            var directionScale = -1;

            switch (lightState.Type)
            {
                case LightType.OmniLgt:
                    babylonLight.type = 0;
                    break;
                case LightType.SpotLgt:
                    babylonLight.type = 2;
                    babylonLight.angle = (float)(maxLight.GetFallOffSize(0, Interval.Forever) * Math.PI / 180.0f);
                    babylonLight.exponent = 1;
                    break;
                case LightType.DirectLgt:
                    babylonLight.type = 1;

                    // Shadows
                    if (maxLight.ShadowMethod == 1)
                    {
                        ExportShadowGenerator(lightNode, babylonScene);
                    }

                    break;
                case LightType.AmbientLgt:
                    babylonLight.type = 3;
                    babylonLight.groundColor = new float[] { 0, 0, 0 };
                    directionScale = 1;
                    break;
            }

            // Position
            var wm = lightNode.GetWorldMatrix(0, false);
            var position = wm.Trans;
            babylonLight.position = position.ToArraySwitched();

            // Direction
            var target = lightNode._Node.Target;
            if (target != null)
            {
                var targetWm = target.GetObjTMBeforeWSM(0, Interval.Forever._IInterval);
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
            var maxScene = Kernel.Scene;
            var inclusion = maxLight._Light.ExclList.TestFlag(1); //NT_INCLUDE 
            var checkExclusionList = maxLight._Light.ExclList.TestFlag(2); //NT_AFFECT_ILLUM

            if (checkExclusionList)
            {
                var list = new List<string>();

                foreach (var meshNode in maxScene.NodesListBySuperClass(SuperClassID.GeometricObject))
                {
                    if (meshNode._Node.CastShadows == 1)
                    {
                        var inList = maxLight._Light.ExclList.FindNode(meshNode._Node) != -1;

                        if ((!inList && inclusion) || (inList && !inclusion))
                        {
                            list.Add(meshNode.GetGuid().ToString());
                        }
                    }
                }

                babylonLight.excludedMeshesIds = list.ToArray();
            }

            // Other fields
            babylonLight.intensity = maxLight.GetIntensity(0, Interval.Forever);

            babylonLight.diffuse = lightState.AffectDiffuse ? maxLight.GetRGBColor(0, Interval.Forever).ToArray() : new float[] { 0, 0, 0 };
            babylonLight.specular = lightState.AffectDiffuse ? maxLight.GetRGBColor(0, Interval.Forever).ToArray() : new float[] { 0, 0, 0 };

            if (maxLight.UseAttenuation)
            {
                babylonLight.range = maxLight.GetAttenuation(0, 1, Interval.Forever);
            }

            // Animations
            var animations = new List<BabylonAnimation>();
            ExportVector3Animation("position", animations, key =>
            {
                var worldMatrix = lightNode.GetWorldMatrix(key, lightNode.HasParent());
                return worldMatrix.Trans.ToArraySwitched();
            });

            ExportVector3Animation("direction", animations, key =>
            {
                var targetNode = lightNode._Node.Target;
                if (targetNode != null)
                {
                    var targetWm = target.GetObjTMBeforeWSM(0, Interval.Forever._IInterval);
                    var targetPosition = targetWm.Trans;

                    var direction = targetPosition.Subtract(position);
                    return direction.ToArraySwitched();
                }
                
                var dir = wm.GetRow(2).MultiplyBy(directionScale);
                return dir.ToArraySwitched();
            });

            ExportFloatAnimation("intensity", animations, key => new[] { maxLight.GetIntensity(key, Interval.Forever) });


            babylonLight.animations = animations.ToArray();

            if (lightNode._Node.GetBoolProperty("babylonjs_autoanimate"))
            {
                babylonLight.autoAnimate = true;
                babylonLight.autoAnimateFrom = (int)lightNode._Node.GetFloatProperty("babylonjs_autoanimate_from");
                babylonLight.autoAnimateTo = (int)lightNode._Node.GetFloatProperty("babylonjs_autoanimate_to");
                babylonLight.autoAnimateLoop = lightNode._Node.GetBoolProperty("babylonjs_autoanimateloop");
            }

            babylonScene.LightsList.Add(babylonLight);
            return babylonLight;
        }
    }
}
