using System;
using BabylonExport.Entities;
using UnityEngine;

namespace Unity3D2Babylon
{
    partial class SceneBuilder
    {
        private void ConvertUnityEmptyObjectToBabylon(GameObject gameObject)
        {
            BabylonMesh babylonMesh = new BabylonMesh { name = gameObject.name, id = GetID(gameObject) };

            var transform = gameObject.transform;

            babylonMesh.parentId = GetParentID(transform);

            babylonMesh.position = transform.localPosition.ToFloat();

            babylonMesh.rotation = new float[3];
            babylonMesh.rotation[0] = transform.localRotation.eulerAngles.x * (float)Math.PI / 180;
            babylonMesh.rotation[1] = transform.localRotation.eulerAngles.y * (float)Math.PI / 180;
            babylonMesh.rotation[2] = transform.localRotation.eulerAngles.z * (float)Math.PI / 180;

            babylonMesh.scaling = transform.localScale.ToFloat();

            babylonScene.MeshesList.Add(babylonMesh);

            // Animations
            ExportAnimations(transform, babylonMesh);

            if (IsRotationQuaternionAnimated(babylonMesh))
            {
                babylonMesh.rotationQuaternion = transform.localRotation.ToFloat();
            }
        }

        private void ConvertUnityMeshToBabylon(Mesh mesh, Transform transform, GameObject gameObject, float progress)
        {
            BabylonMesh babylonMesh = new BabylonMesh();
            var renderer = gameObject.GetComponent<Renderer>();

            ExporterWindow.ReportProgress(progress, "Exporting mesh: " + gameObject.name);

            babylonMesh.name = gameObject.name;
            babylonMesh.id = GetID(transform.gameObject);

            if (renderer != null)
            {
                babylonMesh.receiveShadows = renderer.receiveShadows;
            }

            babylonMesh.parentId = GetParentID(transform);

            babylonMesh.position = transform.localPosition.ToFloat();

            babylonMesh.rotation = new float[3];
            babylonMesh.rotation[0] = transform.localRotation.eulerAngles.x * (float)Math.PI / 180;
            babylonMesh.rotation[1] = transform.localRotation.eulerAngles.y * (float)Math.PI / 180;
            babylonMesh.rotation[2] = transform.localRotation.eulerAngles.z * (float)Math.PI / 180;

            babylonMesh.scaling = transform.localScale.ToFloat();

            if (mesh != null)
            {
                babylonMesh.positions = new float[mesh.vertexCount * 3];

                for (int i = 0; i < mesh.vertices.Length; i++)
                {
                    babylonMesh.positions[i * 3] = mesh.vertices[i].x;
                    babylonMesh.positions[(i * 3) + 1] = mesh.vertices[i].y;
                    babylonMesh.positions[(i * 3) + 2] = mesh.vertices[i].z;

                    // Computing world extends
                    var worldPosition = transform.TransformPoint(mesh.vertices[i]);

                    if (worldPosition.x > babylonScene.MaxVector.X)
                    {
                        babylonScene.MaxVector.X = worldPosition.x;
                    }
                    if (worldPosition.y > babylonScene.MaxVector.Y)
                    {
                        babylonScene.MaxVector.Y = worldPosition.y;
                    }
                    if (worldPosition.z > babylonScene.MaxVector.Z)
                    {
                        babylonScene.MaxVector.Z = worldPosition.z;
                    }

                    if (worldPosition.x < babylonScene.MinVector.X)
                    {
                        babylonScene.MinVector.X = worldPosition.x;
                    }
                    if (worldPosition.y < babylonScene.MinVector.Y)
                    {
                        babylonScene.MinVector.Y = worldPosition.y;
                    }
                    if (worldPosition.z < babylonScene.MinVector.Z)
                    {
                        babylonScene.MinVector.Z = worldPosition.z;
                    }
                }

                babylonMesh.normals = new float[mesh.vertexCount * 3];

                for (int i = 0; i < mesh.normals.Length; i++)
                {
                    babylonMesh.normals[i * 3] = mesh.normals[i].x;
                    babylonMesh.normals[(i * 3) + 1] = mesh.normals[i].y;
                    babylonMesh.normals[(i * 3) + 2] = mesh.normals[i].z;
                }

                babylonMesh.uvs = new float[mesh.vertexCount * 2];

                for (int i = 0; i < mesh.uv.Length; i++)
                {
                    babylonMesh.uvs[i * 2] = mesh.uv[i].x;
                    babylonMesh.uvs[(i * 2) + 1] = mesh.uv[i].y;
                }

                babylonMesh.uvs2 = new float[mesh.vertexCount * 2];

                if (mesh.uv2 != null && mesh.uv2.Length > 0)
                {
                    for (int i = 0; i < mesh.uv2.Length; i++)
                    {
                        babylonMesh.uvs2[i * 2] = mesh.uv2[i].x;
                        babylonMesh.uvs2[(i * 2) + 1] = mesh.uv2[i].y;
                    }
                }
                else
                {
                    for (int i = 0; i < mesh.uv.Length; i++)
                    {
                        babylonMesh.uvs2[i * 2] = mesh.uv[i].x;
                        babylonMesh.uvs2[(i * 2) + 1] = mesh.uv[i].y;
                    }
                }

                babylonMesh.indices = new int[mesh.triangles.Length];

                for (int i = 0; i < mesh.triangles.Length; i += 3)
                {
                    babylonMesh.indices[i] = mesh.triangles[i + 2];
                    babylonMesh.indices[i + 1] = mesh.triangles[i + 1];
                    babylonMesh.indices[i + 2] = mesh.triangles[i];
                }

                if (renderer != null && renderer.sharedMaterial != null)
                {
                    if (mesh.subMeshCount > 1) // Multimaterials
                    {
                        BabylonMultiMaterial bMultiMat;
                        if (!multiMatDictionary.ContainsKey(renderer.sharedMaterial.name))
                        {
                            bMultiMat = new BabylonMultiMaterial
                            {
                                materials = new string[mesh.subMeshCount],
                                id = Guid.NewGuid().ToString(),
                                name = renderer.sharedMaterial.name
                            };

                            for (int i = 0; i < renderer.sharedMaterials.Length; i++)
                            {
                                var sharedMaterial = renderer.sharedMaterials[i];
                                BabylonMaterial babylonMaterial;

                                if (sharedMaterial.HasProperty("_Metallic"))
                                {
                                    babylonMaterial = DumpPBRMaterial(sharedMaterial, renderer);
                                }
                                else
                                {
                                    babylonMaterial = DumpMaterial(sharedMaterial, renderer);
                                }

                                bMultiMat.materials[i] = babylonMaterial.id;
                            }
                            if (mesh.subMeshCount > 1)
                            {
                                multiMatDictionary.Add(bMultiMat.name, bMultiMat);
                            }
                        }
                        else
                        {
                            bMultiMat = multiMatDictionary[renderer.sharedMaterial.name];
                        }

                        babylonMesh.materialId = bMultiMat.id;
                        babylonMesh.subMeshes = new BabylonSubMesh[mesh.subMeshCount];

                        var offset = 0;
                        for (int materialIndex = 0; materialIndex < mesh.subMeshCount; materialIndex++)
                        {
                            var unityTriangles = mesh.GetTriangles(materialIndex);

                            babylonMesh.subMeshes[materialIndex] = new BabylonSubMesh
                            {
                                verticesStart = 0,
                                verticesCount = mesh.vertexCount,
                                materialIndex = materialIndex,
                                indexStart = offset,
                                indexCount = unityTriangles.Length
                            };

                            offset += unityTriangles.Length;
                        }
                    }
                    else
                    {
                        if (renderer.sharedMaterial.HasProperty("_Metallic"))
                        {
                            babylonMesh.materialId = DumpPBRMaterial(renderer.sharedMaterial, renderer).id;
                        }
                        else
                        {
                            babylonMesh.materialId = DumpMaterial(renderer.sharedMaterial, renderer).id;
                        }
                    }
                }

                babylonScene.MeshesList.Add(babylonMesh);

                // Animations
                ExportAnimations(transform, babylonMesh);

                if (IsRotationQuaternionAnimated(babylonMesh))
                {
                    babylonMesh.rotationQuaternion = transform.localRotation.ToFloat();
                }

                // Collisions
                if (exportationOptions.ExportCollisions)
                {
                    var collider = gameObject.GetComponent<Collider>();

                    if (collider != null)
                    {
                        babylonMesh.checkCollisions = true;
                    }
                }
            }
        }
    }
}
