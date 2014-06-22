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
        private void ExportMesh(IINode meshNode, BabylonScene babylonScene)
        {
            if (meshNode.GetBoolProperty("babylonjs_noexport"))
            {
                return;
            }

            if (!ExportHiddenObjects && meshNode.IsHidden(NodeHideFlags.None, false))
            {
                return;
            }

            var babylonMesh = new BabylonMesh();
            int vx1, vx2, vx3;

            babylonMesh.name = meshNode.Name;
            babylonMesh.id = meshNode.GetGuid().ToString();
            if (meshNode.HasParent())
            {
                babylonMesh.parentId = meshNode.ParentNode.GetGuid().ToString();
            }

            // Misc.
            babylonMesh.isVisible = meshNode.Renderable == 1;
            babylonMesh.pickable = meshNode.GetBoolProperty("babylonjs_checkpickable");
            babylonMesh.receiveShadows = meshNode.RcvShadows == 1;
            babylonMesh.showBoundingBox = meshNode.GetBoolProperty("babylonjs_showboundingbox");
            babylonMesh.showSubMeshesBoundingBox = meshNode.GetBoolProperty("babylonjs_showsubmeshesboundingbox");

            // Collisions
            babylonMesh.checkCollisions = meshNode.GetBoolProperty("babylonjs_checkcollisions");

            // Skin
            var skin = GetSkinModifier(meshNode);

            if (skin != null)
            {
                babylonMesh.skeletonId = skins.IndexOf(skin);
                bonesCount = skin.NumBones;
            }

            // Position / rotation / scaling
            var wm = meshNode.GetWorldMatrix(0, meshNode.HasParent());
            babylonMesh.position = wm.Trans.ToArraySwitched();

            var parts = Loader.Global.AffineParts.Create();
            Loader.Global.DecompAffine(wm, parts);

            if (exportQuaternionsInsteadOfEulers)
            {
                babylonMesh.rotationQuaternion = parts.Q.ToArray();
            }
            else
            {
                var rotate = new float[3];

                IntPtr xPtr = Marshal.AllocHGlobal(sizeof(float));
                IntPtr yPtr = Marshal.AllocHGlobal(sizeof(float));
                IntPtr zPtr = Marshal.AllocHGlobal(sizeof(float));
                parts.Q.GetEuler(xPtr, yPtr, zPtr);

                Marshal.Copy(xPtr, rotate, 0, 1);
                Marshal.Copy(yPtr, rotate, 1, 1);
                Marshal.Copy(zPtr, rotate, 2, 1);

                var temp = rotate[1];
                rotate[0] = -rotate[0] * parts.F;
                rotate[1] = -rotate[2] * parts.F;
                rotate[2] = -temp * parts.F;

                babylonMesh.rotation = rotate;                
            }

            babylonMesh.scaling = parts.K.ToArraySwitched();

            if (wm.Parity)
            {
                vx1 = 2;
                vx2 = 1;
                vx3 = 0;
            }
            else
            {
                vx1 = 0;
                vx2 = 1;
                vx3 = 2;
            }

            // Pivot
            var pivotMatrix = Tools.Identity;
            pivotMatrix.PreTranslate(meshNode.ObjOffsetPos);
            Loader.Global.PreRotateMatrix(pivotMatrix, meshNode.ObjOffsetRot);
            Loader.Global.ApplyScaling(pivotMatrix, meshNode.ObjOffsetScale);
            babylonMesh.pivotMatrix = pivotMatrix.ToArray();

            // Mesh
            var objectState = meshNode.EvalWorldState(0, false);
            var triObject = objectState.Obj.GetMesh();
            var mesh = triObject != null ? triObject.Mesh : null;

            RaiseMessage(meshNode.Name, 1);

            if (mesh != null)
            {
                mesh.BuildNormals();

                if (mesh.NumFaces < 1)
                {
                    RaiseError(string.Format("Mesh {0} has no face", babylonMesh.name), 2);
                }

                if (mesh.NumVerts < 3)
                {
                    RaiseError(string.Format("Mesh {0} has not enough vertices", babylonMesh.name), 2);
                }

                if (mesh.NumVerts >= 65536)
                {
                    RaiseError(string.Format("Mesh {0} has too many vertices (more than 65535)", babylonMesh.name), 2);
                }

                // Material
                var mtl = meshNode.Mtl;
                var multiMatsCount = 1;

                if (mtl != null)
                {
                    babylonMesh.materialId = mtl.GetGuid().ToString();

                    if (!referencedMaterials.Contains(mtl))
                    {
                        referencedMaterials.Add(mtl);
                    }

                    multiMatsCount = Math.Max(mtl.NumSubMtls, 1);
                }

                babylonMesh.visibility = meshNode.GetVisibility(0, Tools.Forever);

                var vertices = new List<GlobalVertex>();
                var indices = new List<int>();
                var matIDs = new List<int>();

                var hasUV = mesh.NumTVerts > 0;
                var hasUV2 = mesh.GetNumMapVerts(2) > 0;

                var optimizeVertices = meshNode.GetBoolProperty("babylonjs_optimizevertices");

                // Skin
                IISkinContextData skinContext = null;

                if (skin != null)
                {
                    skinContext = skin.GetContextInterface(meshNode);
                }

                // Compute normals
                VNormal[] vnorms = Tools.ComputeNormals(mesh, optimizeVertices);
                List<GlobalVertex>[] verticesAlreadyExported = null;

                if (optimizeVertices)
                {
                    verticesAlreadyExported = new List<GlobalVertex>[mesh.NumVerts];
                }

                for (var face = 0; face < mesh.NumFaces; face++)
                {
                    indices.Add(CreateGlobalVertex(mesh, face, vx1, vertices, hasUV, hasUV2, vnorms, verticesAlreadyExported, skinContext));
                    indices.Add(CreateGlobalVertex(mesh, face, vx2, vertices, hasUV, hasUV2, vnorms, verticesAlreadyExported, skinContext));
                    indices.Add(CreateGlobalVertex(mesh, face, vx3, vertices, hasUV, hasUV2, vnorms, verticesAlreadyExported, skinContext));
                    matIDs.Add(mesh.Faces[face].MatID % multiMatsCount);
                    CheckCancelled();
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
                babylonMesh.positions = vertices.SelectMany(v => v.Position.ToArraySwitched()).ToArray();
                babylonMesh.normals = vertices.SelectMany(v => v.Normal.ToArraySwitched()).ToArray();
                if (hasUV)
                {
                    babylonMesh.uvs = vertices.SelectMany(v => v.UV.ToArray()).ToArray();
                }
                if (hasUV2)
                {
                    babylonMesh.uvs2 = vertices.SelectMany(v => v.UV2.ToArray()).ToArray();
                }

                if (skin != null)
                {
                    babylonMesh.matricesWeights = vertices.SelectMany(v => v.Weights.ToArray()).ToArray();
                    babylonMesh.matricesIndices = vertices.Select(v => v.BonesIndices).ToArray();
                }

                // Submeshes
                var sortedIndices = new List<int>();
                var subMeshes = new List<BabylonSubMesh>();
                var indexStart = 0;
                for (var index = 0; index < multiMatsCount; index++)
                {
                    var subMesh = new BabylonSubMesh();
                    var indexCount = 0;
                    var minVertexIndex = int.MaxValue;
                    var maxVertexIndex = int.MinValue;

                    subMesh.indexStart = indexStart;
                    subMesh.materialIndex = index;

                    for (var face = 0; face < matIDs.Count; face++)
                    {
                        if (matIDs[face] == index)
                        {
                            var a = indices[3 * face];
                            var b = indices[3 * face + 1];
                            var c = indices[3 * face + 2];

                            sortedIndices.Add(a);
                            sortedIndices.Add(b);
                            sortedIndices.Add(c);
                            indexCount += 3;

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
                    CheckCancelled();
                }
                babylonMesh.subMeshes = subMeshes.ToArray();


                // Buffers - Indices
                babylonMesh.indices = sortedIndices.ToArray();

                triObject.Dispose();
            }


            // Animations
            var animations = new List<BabylonAnimation>();

            if (!ExportVector3Controller(meshNode.TMController.PositionController, "position", animations))
            {
                ExportVector3Animation("position", animations, key =>
                {
                    var worldMatrix = meshNode.GetWorldMatrix(key, meshNode.HasParent());
                    return worldMatrix.Trans.ToArraySwitched();
                });
            }

            if (!ExportQuaternionController(meshNode.TMController.RotationController, "rotationQuaternion", animations))
            {
                ExportQuaternionAnimation("rotationQuaternion", animations, key =>
                {
                    var worldMatrix = meshNode.GetWorldMatrix(key, meshNode.HasParent());

                    var affineParts = Loader.Global.AffineParts.Create();
                    Loader.Global.DecompAffine(worldMatrix, affineParts);

                    return affineParts.Q.ToArray();
                });
            }

            if (!ExportVector3Controller(meshNode.TMController.ScaleController, "scaling", animations))
            {
                ExportVector3Animation("scaling", animations, key =>
                {
                    var worldMatrix = meshNode.GetWorldMatrix(key, meshNode.HasParent());

                    var affineParts = Loader.Global.AffineParts.Create();
                    Loader.Global.DecompAffine(worldMatrix, affineParts);

                    return affineParts.K.ToArraySwitched();
                });
            }

            if (!ExportFloatController(meshNode.VisController, "visibility", animations))
            {
                ExportFloatAnimation("visibility", animations, key => new[] { meshNode.GetVisibility(key, Tools.Forever) });
            }

            babylonMesh.animations = animations.ToArray();

            if (meshNode.GetBoolProperty("babylonjs_autoanimate"))
            {
                babylonMesh.autoAnimate = true;
                babylonMesh.autoAnimateFrom = (int)meshNode.GetFloatProperty("babylonjs_autoanimate_from");
                babylonMesh.autoAnimateTo = (int)meshNode.GetFloatProperty("babylonjs_autoanimate_to");
                babylonMesh.autoAnimateLoop = meshNode.GetBoolProperty("babylonjs_autoanimateloop");
            }

            babylonScene.MeshesList.Add(babylonMesh);
        }

        int CreateGlobalVertex(IMesh mesh, int face, int facePart, List<GlobalVertex> vertices, bool hasUV, bool hasUV2, VNormal[] vnorms, List<GlobalVertex>[] verticesAlreadyExported, IISkinContextData skinContextData)
        {
            var faceObject = mesh.Faces[face];
            var vertexIndex = (int)faceObject.V[facePart];

            var vertex = new GlobalVertex
            {
                BaseIndex = vertexIndex,
                Position = mesh.Verts[vertexIndex],
                Normal = vnorms[vertexIndex].GetNormal(verticesAlreadyExported != null ? 1 : faceObject.SmGroup)
            };

            if (hasUV)
            {
                var tvertexIndex = (int)mesh.TvFace[face].T[facePart];
                vertex.UV = Loader.Global.Point2.Create(mesh.TVerts[tvertexIndex].X, mesh.TVerts[tvertexIndex].Y);
            }

            if (hasUV2)
            {
                var tvertexIndex = (int)mesh.MapFaces(2)[face].T[facePart];
                vertex.UV2 = Loader.Global.Point2.Create(mesh.MapVerts(2)[tvertexIndex].X, mesh.MapVerts(2)[tvertexIndex].Y);
            }

            if (skinContextData != null)
            {
                float weight0 = 0;
                float weight1 = 0;
                float weight2 = 0;
                int bone0 = bonesCount;
                int bone1 = bonesCount;
                int bone2 = bonesCount;
                int bone3 = bonesCount;
                int nbBones = skinContextData.GetNumAssignedBones(vertexIndex);

                if (nbBones > 0)
                {
                    bone0 = skinContextData.GetAssignedBone(vertexIndex, 0);
                    weight0 = skinContextData.GetBoneWeight(vertexIndex, 0);
                }

                if (nbBones > 1)
                {
                    bone1 = skinContextData.GetAssignedBone(vertexIndex, 1);
                    weight1 = skinContextData.GetBoneWeight(vertexIndex, 1);
                }

                if (nbBones > 2)
                {
                    bone2 = skinContextData.GetAssignedBone(vertexIndex, 2);
                    weight2 = skinContextData.GetBoneWeight(vertexIndex, 2);
                }

                if (nbBones > 3)
                {
                    bone3 = skinContextData.GetAssignedBone(vertexIndex, 3);
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
