using System;
using System.Collections.Generic;
using System.Linq;
using Autodesk.Max;
using BabylonExport.Entities;
using System.Runtime.InteropServices;

namespace Max2Babylon
{
    partial class BabylonExporter
    {
        private int bonesCount;
        private void ExportMesh(IIGameScene scene, IIGameNode meshNode, BabylonScene babylonScene)
        {
            if (meshNode.MaxNode.IsInstance())
            {
                return;
            }

            if (meshNode.MaxNode.GetBoolProperty("babylonjs_noexport"))
            {
                return;
            }

            if (!ExportHiddenObjects && meshNode.MaxNode.IsHidden(NodeHideFlags.None, false))
            {
                return;
            }

            var gameMesh = meshNode.IGameObject.AsGameMesh();
            bool initialized = gameMesh.InitializeData; //needed, the property is in fact a method initializing the exporter that has wrongly been auto 
            // translated into a property because it has no parameters

            var babylonMesh = new BabylonMesh();

            babylonMesh.name = meshNode.Name;
            babylonMesh.id = meshNode.MaxNode.GetGuid().ToString();
            if (meshNode.NodeParent != null)
            {
                babylonMesh.parentId = meshNode.NodeParent.MaxNode.GetGuid().ToString();
            }

            // Misc.
            babylonMesh.isVisible = meshNode.MaxNode.Renderable == 1;
            babylonMesh.pickable = meshNode.MaxNode.GetBoolProperty("babylonjs_checkpickable");
            babylonMesh.receiveShadows = meshNode.MaxNode.RcvShadows == 1;
            babylonMesh.showBoundingBox = meshNode.MaxNode.GetBoolProperty("babylonjs_showboundingbox");
            babylonMesh.showSubMeshesBoundingBox = meshNode.MaxNode.GetBoolProperty("babylonjs_showsubmeshesboundingbox");
            babylonMesh.applyFog = meshNode.MaxNode.ApplyAtmospherics == 1;
            babylonMesh.alphaIndex = (int)meshNode.MaxNode.GetFloatProperty("babylonjs_alphaindex", 1000);

            // Collisions
            babylonMesh.checkCollisions = meshNode.MaxNode.GetBoolProperty("babylonjs_checkcollisions");

            bool isSkinned = gameMesh.IsObjectSkinned;
            var skin = gameMesh.IGameSkin;
            var unskinnedMesh = gameMesh;
            IGMatrix skinInitPoseMatrix = Loader.Global.GMatrix.Create(Loader.Global.Matrix3.Create(true));
            if (isSkinned)
            {
                //unskinnedMesh = skin.InitialPose;
                bonesCount = skin.TotalSkinBoneCount;
                skins.Add(skin);
                skinnedNodes.Add(meshNode);
                babylonMesh.skeletonId = skins.IndexOf(skin);
                skin.GetInitSkinTM(skinInitPoseMatrix);
            }

            // Position / rotation / scaling
            {
                //var localTM = unskinnedMesh.IGameObjectTM;
                //var worldTM = meshNode.GetWorldTM(0);
                var localTM = meshNode.GetObjectTM(0);

                var meshTrans = localTM.Translation;
                var meshRotation = localTM.Rotation;
                var meshScale = localTM.Scaling;
                babylonMesh.position = new float[] { meshTrans.X, meshTrans.Y, meshTrans.Z };
                //float rotx = 0, roty = 0, rotz = 0;
                //unsafe
                //{
                //    meshRotation.GetEuler(new IntPtr(&rotx), new IntPtr(&roty), new IntPtr(&rotz));
                //}
                //babylonMesh.rotation = new float[] { rotx, roty, rotz };
                babylonMesh.rotationQuaternion = new float[] { meshRotation.X, meshRotation.Y, meshRotation.Z, -meshRotation.W };
                babylonMesh.scaling = new float[] { meshScale.X, meshScale.Y, meshScale.Z };
            }
            //// Pivot // something to do with GameMesh ?
            //meshNode.GetObjectTM
            //var pivotMatrix = Tools.Identity;
            //pivotMatrix.PreTranslate(meshNode.ObjOffsetPos);
            //Loader.Global.PreRotateMatrix(pivotMatrix, meshNode.ObjOffsetRot);
            //Loader.Global.ApplyScaling(pivotMatrix, meshNode.ObjOffsetScale);
            //babylonMesh.pivotMatrix = pivotMatrix.ToArray();

            // Mesh

            RaiseMessage(meshNode.Name, 1);

            if (unskinnedMesh != null && unskinnedMesh.IGameType == Autodesk.Max.IGameObject.ObjectTypes.Mesh && unskinnedMesh.MaxMesh != null)
            {


                if (unskinnedMesh.NumberOfFaces < 1)
                {
                    RaiseError(string.Format("Mesh {0} has no face", babylonMesh.name), 2);
                }

                if (unskinnedMesh.NumberOfVerts < 3)
                {
                    RaiseError(string.Format("Mesh {0} has not enough vertices", babylonMesh.name), 2);
                }

                if (unskinnedMesh.NumberOfVerts >= 65536)
                {
                    RaiseWarning(string.Format("Mesh {0} has tmore than 65536 vertices which means that it will require specific WebGL extension to be rendered. This may impact portability of your scene on low end devices.", babylonMesh.name), 2);
                }

                // Material
                var mtl = meshNode.NodeMaterial;
                var multiMatsCount = 1;

                if (mtl != null)
                {
                    babylonMesh.materialId = mtl.MaxMaterial.GetGuid().ToString();

                    if (!referencedMaterials.Contains(mtl))
                    {
                        referencedMaterials.Add(mtl);
                    }

                    multiMatsCount = Math.Max(mtl.SubMaterialCount, 1);
                }

                babylonMesh.visibility = meshNode.MaxNode.GetVisibility(0, Tools.Forever);

                var vertices = new List<GlobalVertex>();
                var indices = new List<int>();
                var mappingChannels = unskinnedMesh.ActiveMapChannelNum;
                bool hasUV = false;
                bool hasUV2 = false;
                for (int i = 0; i < mappingChannels.Count; ++i)
                {
                    IntPtr indexer = new IntPtr(i);
                    var channelNum = mappingChannels[indexer];
                    if (channelNum == 1)
                {
                        hasUV = true;
                }
                    else if (channelNum == 2)
                {
                        hasUV2 = true;
                }
                }
                var hasColor = unskinnedMesh.NumberOfColorVerts > 0;
                var hasAlpha = unskinnedMesh.GetNumberOfMapVerts(-2) > 0;

                var optimizeVertices = meshNode.MaxNode.GetBoolProperty("babylonjs_optimizevertices");



                // Compute normals
                // VNormal[] vnorms = Tools.ComputeNormals(mesh, optimizeVertices);
                List<GlobalVertex>[] verticesAlreadyExported = null;

                if (optimizeVertices)
                {
                    verticesAlreadyExported = new List<GlobalVertex>[unskinnedMesh.NumberOfVerts];
                }

                var subMeshes = new List<BabylonSubMesh>();
                var indexStart = 0;

                
                for (int i = 0; i < multiMatsCount; ++i)
                {
                    int materialId = meshNode.NodeMaterial.GetMaterialID(i);
                    ITab<IFaceEx> materialFaces = null;
                    var indexCount = 0;
                    var minVertexIndex = int.MaxValue;
                    var maxVertexIndex = int.MinValue;
                    var subMesh = new BabylonSubMesh();
                    subMesh.indexStart = indexStart;
                    subMesh.materialIndex = i;

                    if (multiMatsCount == 1)
                    {
                        for(int j = 0; j < unskinnedMesh.NumberOfFaces; ++j)
                        {
                            var face = unskinnedMesh.GetFace(j);
                            ExtractFace(skin, unskinnedMesh, vertices, indices, hasUV, hasUV2, hasColor, hasAlpha, verticesAlreadyExported, ref indexCount, ref minVertexIndex, ref maxVertexIndex, face);
                        }
                    }
                    else
                    {
                        materialFaces = unskinnedMesh.GetFacesFromMatID(materialId);
                        for (int j = 0; j < materialFaces.Count; ++j)
                        {
                            var faceIndexer = new IntPtr(j);
                            var face = materialFaces[faceIndexer];

                            Marshal.FreeHGlobal(faceIndexer);
                            ExtractFace(skin, unskinnedMesh, vertices, indices, hasUV, hasUV2, hasColor, hasAlpha, verticesAlreadyExported, ref indexCount, ref minVertexIndex, ref maxVertexIndex, face);
                        }
                    }
                    



                   
                    if (indexCount != 0)
                    {

                        subMesh.indexCount = indexCount;
                        subMesh.verticesStart = minVertexIndex;
                        subMesh.verticesCount = maxVertexIndex - minVertexIndex + 1;

                        indexStart += indexCount;

                        subMeshes.Add(subMesh);
                    }
                }



                if (vertices.Count >= 65536)
                {
                    RaiseError(string.Format("Mesh {0} has too many vertices: {1} (limit is 65535)", babylonMesh.name, vertices.Count), 2);

                    if (!optimizeVertices)
                    {
                        RaiseError("You can try to optimize your object using [Try to optimize vertices] option", 2);
                    }
                }

                RaiseMessage(string.Format("{0} vertices, {1} faces", vertices.Count, indices.Count / 3), 2);

                // Buffers
                babylonMesh.positions = vertices.SelectMany(v => new float[] { v.Position.X, v.Position.Y, v.Position.Z }).ToArray();
                babylonMesh.normals = vertices.SelectMany(v => new float[] { v.Normal.X, v.Normal.Y, v.Normal.Z }).ToArray();
                if (hasUV)
                {
                    babylonMesh.uvs = vertices.SelectMany(v => new float[] { v.UV.X, 1 - v.UV.Y }).ToArray();
                }
                if (hasUV2)
                {
                    babylonMesh.uvs2 = vertices.SelectMany(v => new float[] { v.UV2.X, 1 - v.UV2.Y }).ToArray();
                }

                if (skin != null)
                {
                    babylonMesh.matricesWeights = vertices.SelectMany(v => v.Weights.ToArray()).ToArray();
                    babylonMesh.matricesIndices = vertices.Select(v => v.BonesIndices).ToArray();
                }

                if (hasColor)
                {
                    babylonMesh.colors = vertices.SelectMany(v => v.Color.ToArray()).ToArray();
                    babylonMesh.hasVertexAlpha = hasAlpha;
                }



                babylonMesh.subMeshes = subMeshes.ToArray();


                // Buffers - Indices
                babylonMesh.indices = indices.ToArray();

            }

            // handle instances and animations


            // Instances
            var tabs = Loader.Global.NodeTab.Create();

            Loader.Global.IInstanceMgr.InstanceMgr.GetInstances(meshNode.MaxNode, tabs);
            var instances = new List<BabylonAbstractMesh>();

            for (var index = 0; index < tabs.Count; index++)
            {
                var indexer = new IntPtr(index);
                var tab = tabs[indexer];

                Marshal.FreeHGlobal(indexer);

                if (meshNode.MaxNode.GetGuid() == tab.GetGuid())
                {
                    continue;
                }
                var instanceGameNode = scene.GetIGameNode(tab);
                if (instanceGameNode == null)
                {
                    continue;
                }
                tab.MarkAsInstance();

                var instance = new BabylonAbstractMesh { name = tab.Name };
                {

                    var localTM = meshNode.GetObjectTM(0);

                    //var worldTM = meshNode.GetWorldTM(0);
                    //var objTM = meshNode.GetObjectTM(0);
                    var meshTrans = localTM.Translation;
                    var meshRotation = localTM.Rotation;
                    var meshScale = localTM.Scaling;
                    instance.position = new float[] { meshTrans.X, meshTrans.Y, meshTrans.Z };
                    float rotx = 0, roty = 0, rotz = 0;
                    unsafe
                    {
                        meshRotation.GetEuler(new IntPtr(&rotx), new IntPtr(&roty), new IntPtr(&rotz));
                    }
                    instance.rotation = new float[] { rotx, roty, rotz };
                    instance.scaling = new float[] { meshScale.X, meshScale.Y, meshScale.Z };
                }
                var instanceAnimations = new List<BabylonAnimation>();
                GenerateCoordinatesAnimations(meshNode, instanceAnimations);
                instance.animations = instanceAnimations.ToArray();

                instances.Add(instance);
            }

            babylonMesh.instances = instances.ToArray();

            // Animations
            var animations = new List<BabylonAnimation>();
            GenerateCoordinatesAnimations(meshNode, animations);
            

            if (!ExportFloatController(meshNode.MaxNode.VisController, "visibility", animations))
            {
                ExportFloatAnimation("visibility", animations, key => new[] { meshNode.MaxNode.GetVisibility(key, Tools.Forever) });
            }

            babylonMesh.animations = animations.ToArray();

            if (meshNode.MaxNode.GetBoolProperty("babylonjs_autoanimate", 1))
            {
                babylonMesh.autoAnimate = true;
                babylonMesh.autoAnimateFrom = (int)meshNode.MaxNode.GetFloatProperty("babylonjs_autoanimate_from");
                babylonMesh.autoAnimateTo = (int)meshNode.MaxNode.GetFloatProperty("babylonjs_autoanimate_to", 100);
                babylonMesh.autoAnimateLoop = meshNode.MaxNode.GetBoolProperty("babylonjs_autoanimateloop", 1);
            }

            babylonScene.MeshesList.Add(babylonMesh);
        }

        private void ExtractFace(IIGameSkin skin, IIGameMesh unskinnedMesh, List<GlobalVertex> vertices, List<int> indices, bool hasUV, bool hasUV2, bool hasColor, bool hasAlpha, List<GlobalVertex>[] verticesAlreadyExported, ref int indexCount, ref int minVertexIndex, ref int maxVertexIndex, IFaceEx face)
        {
            var a = CreateGlobalVertex(unskinnedMesh, face, 0, vertices, hasUV, hasUV2, hasColor, hasAlpha, verticesAlreadyExported, skin);
            var b = CreateGlobalVertex(unskinnedMesh, face, 2, vertices, hasUV, hasUV2, hasColor, hasAlpha, verticesAlreadyExported, skin);
            var c = CreateGlobalVertex(unskinnedMesh, face, 1, vertices, hasUV, hasUV2, hasColor, hasAlpha, verticesAlreadyExported, skin);
            indices.Add(a);
            indices.Add(b);
            indices.Add(c);

            if (a < minVertexIndex)
            {
                minVertexIndex = a;
            }

            if (b < minVertexIndex)
            {
                minVertexIndex = b;
            }

            if (c < minVertexIndex)
            {
                minVertexIndex = c;
            }

            if (a > maxVertexIndex)
            {
                maxVertexIndex = a;
            }

            if (b > maxVertexIndex)
            {
                maxVertexIndex = b;
            }

            if (c > maxVertexIndex)
            {
                maxVertexIndex = c;
            }


            indexCount += 3;
            CheckCancelled();
        }

        public static void GenerateCoordinatesAnimations(IIGameNode meshNode, List<BabylonAnimation> animations)
            {
            //if (!ExportVector3Controller(meshNode.TMController.PositionController, "position", animations))
            //{
                ExportVector3Animation("position", animations, key =>
                {
                var worldMatrix = meshNode.GetObjectTM(key);
                var trans = worldMatrix.Translation;
                return new float[] { trans.X, trans.Y, trans.Z };
                });
            //}


            //if (!ExportQuaternionController(meshNode.TMController.RotationController, "rotationQuaternion", animations))
            //{
                ExportQuaternionAnimation("rotationQuaternion", animations, key =>
                {
                    var worldMatrix = meshNode.GetObjectTM(key);



                    var rot = worldMatrix.Rotation;
                    return new float[] { rot.X, rot.Y, rot.Z, -rot.W };
                });
            //}


            //if (!ExportVector3Controller(meshNode.TMController.ScaleController, "scaling", animations))
            //{
                ExportVector3Animation("scaling", animations, key =>
                {
                    var worldMatrix = meshNode.GetObjectTM(key);
                    var scale = worldMatrix.Scaling;

                    return new float[] { scale.X, scale.Y, scale.Z };
                });
           // }
        }


        int CreateGlobalVertex(IIGameMesh mesh, IFaceEx face, int facePart, List<GlobalVertex> vertices, bool hasUV, bool hasUV2, bool hasColor, bool hasAlpha, List<GlobalVertex>[] verticesAlreadyExported, IIGameSkin skin)
        {
            var vertexIndex = (int)face.Vert[facePart];

            var vertex = new GlobalVertex
            {
                BaseIndex = vertexIndex,
                Position = mesh.GetVertex(vertexIndex, true),
                Normal = mesh.GetNormal((int)face.Norm[facePart], true) //vnorms[vertexIndex].GetNormal(verticesAlreadyExported != null ? 1 : faceObject.SmGroup)
            };

            if (hasUV)
            {
                int[] indices = new int[3];
                unsafe
                {
                    fixed (int* indicesPtr = indices)
                    {
                        mesh.GetMapFaceIndex(1, face.MeshFaceIndex, new IntPtr(indicesPtr));
                    }
                }
                var texCoord = mesh.GetMapVertex(1, indices[facePart]);
                vertex.UV = Loader.Global.Point2.Create(texCoord.X, -texCoord.Y);
            }

            if (hasUV2)
            {
                int[] indices = new int[3];
                unsafe
                {
                    fixed (int* indicesPtr = indices)
                    {
                        mesh.GetMapFaceIndex(2, face.MeshFaceIndex, new IntPtr(indicesPtr));
                    }
                }
                var texCoord = mesh.GetMapVertex(2, indices[facePart]);
                vertex.UV2 = Loader.Global.Point2.Create(texCoord.X, -texCoord.Y);
            }

            if (hasColor)
            {
                var vertexColorIndex = (int)face.Color[facePart];
                var vertexColor = mesh.GetColorVertex(vertexColorIndex);
                float alpha = 1;
                if (hasAlpha)
                {
                    IPoint3 p = Loader.Global.Point3.Create();
                    mesh.GetMapFaceIndex(-2, face.MeshFaceIndex, p.GetNativeHandle());
                    alpha = p.X;
                }

                vertex.Color = new float[] { vertexColor.X, vertexColor.Y, vertexColor.Z, alpha };
            }

            if (skin != null)
            {
                float weight0 = 0;
                float weight1 = 0;
                float weight2 = 0;
                int bone0 = bonesCount;
                int bone1 = bonesCount;
                int bone2 = bonesCount;
                int bone3 = bonesCount;
                int nbBones = skin.GetNumberOfBones(vertexIndex);

                if (nbBones > 0)
                {
                    bone0 = skin.GetBoneIndex(skin.GetBone(vertexIndex, 0), false);
                    weight0 = skin.GetWeight(vertexIndex, 0);
                }

                if (nbBones > 1)
                {
                    bone1 = skin.GetBoneIndex(skin.GetBone(vertexIndex, 1), false);
                    weight1 = skin.GetWeight(vertexIndex, 1);
                }

                if (nbBones > 2)
                {
                    bone2 = skin.GetBoneIndex(skin.GetBone(vertexIndex, 2), false);
                    weight2 = skin.GetWeight(vertexIndex, 2);
                }

                if (nbBones > 3)
                {
                    bone3 = skin.GetBoneIndex(skin.GetBone(vertexIndex, 3), false);
                }

                if (nbBones == 0)
                {
                    weight0 = 1.0f;
                    bone0 = bonesCount;
                }

                if (nbBones > 4)
                {
                    RaiseError("Too many bones influences per vertex: " + nbBones + ". Babylon.js only support 4 bones influences per vertex.", 2);
                }

                vertex.Weights = Loader.Global.Point4.Create(weight0, weight1, weight2, 1.0 - weight0 - weight1 - weight2);
                vertex.BonesIndices = (bone3 << 24) | (bone2 << 16) | (bone1 << 8) | bone0;
            }

            if (verticesAlreadyExported != null)
            {
                if (verticesAlreadyExported[vertexIndex] != null)
                {
                    var index = verticesAlreadyExported[vertexIndex].IndexOf(vertex);

                    if (index > -1)
                    {
                        return verticesAlreadyExported[vertexIndex][index].CurrentIndex;
                    }
                }
                else
                {
                    verticesAlreadyExported[vertexIndex] = new List<GlobalVertex>();
                }

                vertex.CurrentIndex = vertices.Count;
                verticesAlreadyExported[vertexIndex].Add(vertex);
            }

            vertices.Add(vertex);

            return vertices.Count - 1;
        }
    }
}
