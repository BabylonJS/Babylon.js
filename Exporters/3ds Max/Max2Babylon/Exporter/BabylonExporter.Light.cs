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

        private void ExportLight(IIGameNode lightNode, BabylonScene babylonScene)
        {
            if (lightNode.MaxNode.GetBoolProperty("babylonjs_noexport"))
            {
                return;
            }

            var gameLight = lightNode.IGameObject.AsGameLight();
            var babylonLight = new BabylonLight();

            RaiseMessage(lightNode.Name, 1);
            babylonLight.name = lightNode.Name;
            babylonLight.id = lightNode.MaxNode.GetGuid().ToString();

            var initialized = gameLight.InitializeData;
          
            // Type
            var directionScale = -1;

            switch (gameLight.LightType)
            {
                case Autodesk.Max.IGameLight.LightType.Omni:
                    babylonLight.type = 0;
                    break;
                case Autodesk.Max.IGameLight.LightType.Fspot:
                case Autodesk.Max.IGameLight.LightType.Tspot:
                    babylonLight.type = 2;

                    float fallOff = 0;
                    gameLight.LightFallOff.GetPropertyValue(ref fallOff, 0, true);
                    babylonLight.angle = (float)(fallOff* Math.PI / 180.0f);
                    babylonLight.exponent = 1;
                    break;
                case Autodesk.Max.IGameLight.LightType.Dir:
                case Autodesk.Max.IGameLight.LightType.Tdir:
                    babylonLight.type = 1;
                    break;
                case Autodesk.Max.IGameLight.LightType.Unknown:
                    babylonLight.type = 3;
                    babylonLight.groundColor = new float[] { 0, 0, 0 };
                    directionScale = 1;
                    break;
            }

            // Shadows
            if (gameLight.CastShadows)
            {
                if (babylonLight.type == 1)
                {
                    ExportShadowGenerator(lightNode.MaxNode, babylonScene);
                }
                else
                {
                    RaiseWarning("Shadows maps are only supported for directional lights", 2);
                }
            }

            // Position
            var wm = lightNode.GetWorldTM(0);
            var position = wm.Translation;
            babylonLight.position = new float[] { position.X, position.Y, position.Z };

            // Direction
            var target = gameLight.LightTarget;
            if (target != null)
            {
                var targetWm = target.GetWorldTM(0);
                var targetPosition = targetWm.Translation;

                var direction = targetPosition.Subtract(position);
                babylonLight.direction = new float[] { direction.X, direction.Y, direction.Z };
            }
            else
            {
                IMatrix3 rotMatrix = Loader.Global.Matrix3.Create();
                wm.Rotation.MakeMatrix(rotMatrix, true);
                IPoint3 p = Loader.Global.Point3.Create(1, 0, 0);
                var dir = rotMatrix.VectorTransform(p);
                babylonLight.direction = new float[] { dir.X, dir.Y, dir.Z };
            }


            var maxLight = (lightNode.MaxNode.ObjectRef as ILightObject);
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

            IPoint3 lightColor = Loader.Global.Point3.Create(0,0,0);
            gameLight.LightColor.GetPropertyValue(lightColor, 0);
            babylonLight.diffuse =  new float[] { lightColor.X, lightColor.Y, lightColor.Z };
            babylonLight.specular = new float[] { lightColor.X, lightColor.Y, lightColor.Z };

            if (maxLight.UseAtten)
            {
                babylonLight.range = maxLight.GetAtten(0, 1, Tools.Forever);
            }

            //// Animations
            //var animations = new List<BabylonAnimation>();

            //if (!ExportVector3Controller(lightNode.TMController.PositionController, "position", animations))
            //{
            //    ExportVector3Animation("position", animations, key =>
            //    {
            //        var worldMatrix = lightNode.GetWorldMatrix(key, lightNode.HasParent());
            //        return worldMatrix.Trans.ToArraySwitched();
            //    });
            //}

            //ExportVector3Animation("direction", animations, key =>
            //{
            //    var targetNode = lightNode.Target;
            //    if (targetNode != null)
            //    {
            //        var targetWm = target.GetObjTMBeforeWSM(0, Tools.Forever);
            //        var targetPosition = targetWm.Trans;

            //        var direction = targetPosition.Subtract(position);
            //        return direction.ToArraySwitched();
            //    }
                
            //    var dir = wm.GetRow(2).MultiplyBy(directionScale);
            //    return dir.ToArraySwitched();
            //});

            //ExportFloatAnimation("intensity", animations, key => new[] { maxLight.GetIntensity(key, Tools.Forever) });

            //babylonLight.animations = animations.ToArray();

            //if (lightNode.GetBoolProperty("babylonjs_autoanimate"))
            //{
            //    babylonLight.autoAnimate = true;
            //    babylonLight.autoAnimateFrom = (int)lightNode.GetFloatProperty("babylonjs_autoanimate_from");
            //    babylonLight.autoAnimateTo = (int)lightNode.GetFloatProperty("babylonjs_autoanimate_to");
            //    babylonLight.autoAnimateLoop = lightNode.GetBoolProperty("babylonjs_autoanimateloop");
            //}

            babylonScene.LightsList.Add(babylonLight);
        }
    }
}
